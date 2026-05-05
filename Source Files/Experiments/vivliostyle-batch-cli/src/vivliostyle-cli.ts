import { Command } from 'commander'
import { build, preview } from '@vivliostyle/cli'
import { resolve, dirname, posix } from 'node:path'
import { readFileSync, existsSync } from 'node:fs'
import { JSDOM } from 'jsdom'

type BuildConfig = Parameters<typeof build>[0]
type PreviewConfig = Parameters<typeof preview>[0]

type OutputFormat = 'pdf' | 'epub' | 'webpub'
type LogLevel = 'silent' | 'info' | 'verbose' | 'debug'
type Mode = 'build' | 'preview'

type AssetBaseMapping = {
  urlBase: string
  localBase: string
}

type CliOptions = {
  input: string
  output: string
  title?: string
  author?: string
  language?: string
  static: string[]
  html?: boolean
  cwd?: string
  format: string
  logLevel: string
  debug?: boolean
  assetBase: string[]
  ignoreAsset: string[]
  mode: string
  preview?: boolean
}

const validFormats: readonly OutputFormat[] = ['pdf', 'epub', 'webpub']
const validLogLevels: readonly LogLevel[] = ['silent', 'info', 'verbose', 'debug']
const validModes: readonly Mode[] = ['build', 'preview']

// ---------------------------------------------------------------------------
// Debug logger
// ---------------------------------------------------------------------------

let debugEnabled = false

function dbg(label: string, value?: unknown): void {
  if (!debugEnabled) return
  if (value === undefined) {
    console.error(`[debug] ${label}`)
  } else {
    console.error(`[debug] ${label}`, JSON.stringify(value, null, 2))
  }
}

// ---------------------------------------------------------------------------
// Arg splitting
// ---------------------------------------------------------------------------

export function splitArgsAtDoubleDash(argv: string[]): {
  cliArgv: string[]
  extraArgs: string[]
} {
  const dd = argv.indexOf('--')
  if (dd === -1) {
    return { cliArgv: argv, extraArgs: [] }
  }
  return {
    cliArgv: argv.slice(0, dd),
    extraArgs: argv.slice(dd + 1),
  }
}

// ---------------------------------------------------------------------------
// HTML asset extraction
// ---------------------------------------------------------------------------

export function extractUrlsFromHtml(htmlPath: string): string[] {
  let content: string
  try {
    content = readFileSync(htmlPath, 'utf-8')
  } catch (err) {
    throw new Error(`Error reading HTML file: ${htmlPath}\n${String(err)}`)
  }

  const dom = new JSDOM(content)
  const document = dom.window.document
  const urls = new Set<string>()

  for (const el of document.querySelectorAll('link[href]')) {
    const href = el.getAttribute('href')?.trim()
    if (href) urls.add(href)
  }

  for (const el of document.querySelectorAll('script[src]')) {
    const src = el.getAttribute('src')?.trim()
    if (src) urls.add(src)
  }

  dbg('extractUrlsFromHtml result', [...urls])
  return [...urls]
}

// ---------------------------------------------------------------------------
// Asset base / ignore helpers
// ---------------------------------------------------------------------------

export function normalizeUrlBase(urlBase: string): string {
  return urlBase.endsWith('/') ? urlBase : `${urlBase}/`
}

export function normalizeIgnoreAssetPath(pathValue: string): string {
  const trimmed = pathValue.trim()
  if (!trimmed) {
    throw new Error('Invalid --ignore-asset value: must not be empty')
  }
  return trimmed.startsWith('/')
    ? posix.normalize(trimmed)
    : posix.resolve('/', trimmed)
}

export function shouldIgnoreVirtualPath(
  virtualPath: string,
  ignoredAssets: Set<string>
): boolean {
  return ignoredAssets.has(posix.normalize(virtualPath))
}

export function parseAssetBaseMapping(value: string): AssetBaseMapping {
  const eqIdx = value.indexOf('=')
  if (eqIdx === -1) {
    throw new Error(
      `Invalid --asset-base value: "${value}"\nExpected format: <urlBase>=<localBase>`
    )
  }

  const urlBase = value.slice(0, eqIdx).trim()
  const localBase = value.slice(eqIdx + 1).trim()

  if (!urlBase || !localBase) {
    throw new Error(
      `Invalid --asset-base value: "${value}"\nBoth urlBase and localBase are required`
    )
  }

  return { urlBase: normalizeUrlBase(urlBase), localBase }
}

export function mapAbsoluteUrlToLocal(
  url: string,
  assetBases: AssetBaseMapping[]
): { virtualPath: string; localPath: string } | null {
  for (const mapping of assetBases) {
    if (!url.startsWith(mapping.urlBase)) continue

    const relativePart = url.slice(mapping.urlBase.length)
    const cleanRelative = relativePart.split('?')[0].split('#')[0]

    if (!cleanRelative) return null

    const virtualPath = posix.resolve('/', cleanRelative)
    const localPath = resolve(mapping.localBase, cleanRelative)

    return { virtualPath, localPath }
  }
  return null
}

export function urlToStaticMapping(
  url: string,
  htmlDir: string,
  assetBases: AssetBaseMapping[],
  ignoredAssets: Set<string>
): string | null {
  const trimmed = url.trim()

  if (!trimmed || trimmed.startsWith('#')) return null

  const absoluteMapped = mapAbsoluteUrlToLocal(trimmed, assetBases)
  if (absoluteMapped) {
    if (shouldIgnoreVirtualPath(absoluteMapped.virtualPath, ignoredAssets)) {
      dbg(`urlToStaticMapping: ignored (asset-base match)`, { url, ...absoluteMapped })
      return null
    }
    return `${absoluteMapped.virtualPath}:${absoluteMapped.localPath}`
  }

  if (/^[a-zA-Z][a-zA-Z0-9+\-.]*:/.test(trimmed) || trimmed.startsWith('//')) {
    return null
  }

  const cleanUrl = trimmed.split('?')[0].split('#')[0]
  if (!cleanUrl) return null

  const virtualPath = cleanUrl.startsWith('/')
    ? posix.normalize(cleanUrl)
    : posix.resolve('/', cleanUrl)

  if (shouldIgnoreVirtualPath(virtualPath, ignoredAssets)) {
    dbg(`urlToStaticMapping: ignored (ignore-asset match)`, { url, virtualPath })
    return null
  }

  const localPath = resolve(htmlDir, cleanUrl)
  return `${virtualPath}:${localPath}`
}

export function parseStaticMapping(mapping: string): { virtual: string; local: string } {
  const colonIdx = mapping.indexOf(':')
  if (colonIdx === -1) {
    throw new Error(
      `Invalid --static mapping: "${mapping}"\nExpected format: /virtual/path:/local/path`
    )
  }

  const virtual = mapping.slice(0, colonIdx)
  const local = mapping.slice(colonIdx + 1)

  if (!virtual.startsWith('/')) {
    throw new Error(`Virtual path must start with /: "${virtual}"`)
  }

  if (!local) {
    throw new Error(`Local path missing in --static mapping: "${mapping}"`)
  }

  return { virtual, local }
}

// ---------------------------------------------------------------------------
// Extra args parser
// ---------------------------------------------------------------------------

export function parseExtraArgs(extraArgs: string[]): Record<string, unknown> {
  const extraConfig: Record<string, unknown> = {}

  for (let i = 0; i < extraArgs.length; i++) {
    const arg = extraArgs[i]
    if (!arg.startsWith('--')) continue

    if (arg.includes('=')) {
      const eqIdx = arg.indexOf('=')
      const key = arg.slice(2, eqIdx)
      const value = arg.slice(eqIdx + 1)
      extraConfig[key] = value
      continue
    }

    const key = arg.slice(2)
    const next = extraArgs[i + 1]

    if (next && !next.startsWith('--')) {
      extraConfig[key] = next
      i++
    } else {
      extraConfig[key] = true
    }
  }

  return extraConfig
}

// ---------------------------------------------------------------------------
// Shared program definition
// Only defines options — no action, no exitOverride
// ---------------------------------------------------------------------------

function buildProgram(): Command {
  return new Command()
    .name('vivliostyle-cli')
    .description(
      [
        'Vivliostyle CLI wrapper with extended static-asset and HTML-parsing support.',
        '',
        'Examples:',
        '  # Build a PDF',
        '  vivliostyle-cli -i index.html -o out.pdf',
        '',
        '  # Preview in browser',
        '  vivliostyle-cli -i index.html --preview',
        '',
        '  # Build with explicit static asset mapping',
        '  vivliostyle-cli -i index.html -o out.pdf \\',
        '    --static /assets:/home/user/project/assets',
        '',
        '  # Auto-derive static mappings from <link>/<script> tags',
        '  vivliostyle-cli -i index.html -o out.pdf --html',
        '',
        '  # Map an absolute CDN URL to a local directory',
        '  vivliostyle-cli -i index.html -o out.pdf --html \\',
        '    --asset-base https://cdn.example.com/=/home/user/cdn-cache',
        '',
        '  # Pass extra Vivliostyle options after --',
        '  vivliostyle-cli -i index.html -o out.pdf -- --timeout 60000',
      ].join('\n')
    )
    .option('-i, --input <input>', 'Input HTML or publication manifest file')
    .option('-o, --output <file>', 'Output file path', 'output.pdf')
    .option('--title <title>', 'Document title (overrides the one in the source)')
    .option('--author <author>', 'Document author')
    .option('--language <lang>', 'Document language tag (e.g. en, de, ja)', 'de')
    .option(
      '--static <mapping>',
      [
        'Map a virtual path to a local directory or file.',
        'Format: /virtual/path:/absolute/local/path',
        'Repeatable: --static /css:/dist/css --static /fonts:/dist/fonts',
      ].join('\n      '),
      (val: string, prev: string[]) => prev.concat(val),
      []
    )
    .option(
      '--html',
      [
        'Treat --input as an HTML file.',
        'Parses every <link href> and <script src>, then auto-adds',
        'them as --static mappings relative to the input file.',
      ].join('\n      ')
    )
    .option(
      '--asset-base <urlBase=localBase>',
      [
        'Map all asset URLs that start with <urlBase> to files under <localBase>.',
        'Format: <urlBase>=<localBase>',
        'Example: https://cdn.example.com/=/home/user/cdn-cache',
        'Repeatable.',
      ].join('\n      '),
      (val: string, prev: string[]) => prev.concat(val),
      []
    )
    .option(
      '--ignore-asset <path>',
      [
        'Skip a specific virtual path when deriving --static mappings.',
        'Example: --ignore-asset /livereload.js',
        'Repeatable.',
      ].join('\n      '),
      (val: string, prev: string[]) => prev.concat(val),
      []
    )
    .option('--cwd <dir>', 'Working directory for Vivliostyle (default: directory of --input)')
    .option('--format <format>', `Output format: ${validFormats.join(' | ')}`, 'pdf')
    .option('--log-level <level>', `Vivliostyle log level: ${validLogLevels.join(' | ')}`, 'info')
    .option('--mode <mode>', `Execution mode: ${validModes.join(' | ')}`, 'build')
    .option('--preview', 'Shorthand for --mode preview — open result in browser')
    .option('-d, --debug', 'Print every resolved config value to stderr before running')
    .addHelpText(
      'after',
      [
        '',
        'Notes:',
        '  • Options after -- are forwarded verbatim to Vivliostyle.',
        '  • --debug sets --log-level to debug automatically.',
        '  • --preview and --mode preview are equivalent.',
        '  • --static mappings are cumulative with those derived from --html.',
      ].join('\n')
    )
}

export function printHelp(): void {
  buildProgram().parse(['node', 'script', '--help'])
}

export function parseArgs(argv: string[]): {
  options: CliOptions
  extraArgs: string[]
} | null {
  const { cliArgv, extraArgs } = splitArgsAtDoubleDash(argv)

  if (cliArgv.slice(2).length === 0) {
    return null
  }

  const program = buildProgram()
  program.parse(cliArgv)

  return {
    options: program.opts<CliOptions>(),
    extraArgs,
  }
}

// ---------------------------------------------------------------------------
// Core execute
// ---------------------------------------------------------------------------

export async function execute(
  options: CliOptions,
  extraArgs: string[] = []
): Promise<void> {
  debugEnabled = !!(options.debug || options.logLevel === 'debug')

  dbg('raw CLI options', options)
  dbg('extra args (after --)', extraArgs)

  const inputAbs = resolve(options.input)
  dbg('resolved input', inputAbs)

  if (!existsSync(inputAbs)) {
    throw new Error(`Input file does not exist: ${inputAbs}`)
  }

  const cwd = options.cwd ? resolve(options.cwd) : dirname(inputAbs)
  dbg('cwd', cwd)

  const outputAbs = resolve(options.output)
  dbg('resolved output', outputAbs)

  if (!validFormats.includes(options.format as OutputFormat)) {
    throw new Error(
      `Invalid format: "${options.format}". Allowed: ${validFormats.join(', ')}`
    )
  }

  let logLevel = options.logLevel as LogLevel
  if (!validLogLevels.includes(logLevel)) {
    throw new Error(
      `Invalid log level: "${options.logLevel}". Allowed: ${validLogLevels.join(', ')}`
    )
  }

  if (options.debug) logLevel = 'debug'
  dbg('logLevel', logLevel)

  const mode = (options.preview ? 'preview' : options.mode) as Mode
  dbg('mode', mode)

  if (!validModes.includes(mode)) {
    throw new Error(`Invalid mode: "${mode}". Allowed: ${validModes.join(', ')}`)
  }

  const format = options.format as OutputFormat
  dbg('format', format)

  const assetBases = options.assetBase.map(parseAssetBaseMapping)
  dbg('parsed assetBases', assetBases)

  const ignoredAssets = new Set(options.ignoreAsset.map(normalizeIgnoreAssetPath))
  dbg('ignoredAssets', [...ignoredAssets])

  const derivedMappings: string[] = []

  if (options.html) {
    const htmlDir = dirname(inputAbs)
    console.log(`[--html] Analysing input as HTML: ${inputAbs}`)

    const urls = extractUrlsFromHtml(inputAbs)

    if (urls.length === 0) {
      console.log('[--html] No URLs found in input HTML')
    } else {
      console.log(`[--html] Found URLs (${urls.length}):`)
    }

    for (const url of urls) {
      const mapping = urlToStaticMapping(url, htmlDir, assetBases, ignoredAssets)
      if (mapping === null) {
        console.log(`  → Skipped: ${url}`)
        continue
      }
      console.log(`  → Mapping: ${mapping}`)
      derivedMappings.push(mapping)
    }

    dbg('derived static mappings from HTML', derivedMappings)
  }

  const allStaticMappings = [...options.static, ...derivedMappings]
  dbg('all raw static mappings', allStaticMappings)

  const staticMap: Record<string, string[]> = {}

  for (const mapping of allStaticMappings) {
    const { virtual, local } = parseStaticMapping(mapping)
    if (!staticMap[virtual]) staticMap[virtual] = []
    if (!staticMap[virtual].includes(local)) staticMap[virtual].push(local)
  }

  dbg('assembled staticMap', staticMap)

  const hasStatic = Object.keys(staticMap).length > 0

  const extraConfig = parseExtraArgs(extraArgs)
  dbg('extraConfig (parsed from -- args)', extraConfig)

  console.log(`Starting Vivliostyle in mode: ${mode}`)

  if (mode === 'build') {
    const config: BuildConfig = {
      cwd,
      input: inputAbs,
      output: [{ path: outputAbs, format }],
      ...(options.title    && { title:    options.title    }),
      ...(options.author   && { author:   options.author   }),
      ...(options.language && { language: options.language }),
      ...(hasStatic        && { static:   staticMap        }),
      logLevel,
      ...(options.debug    && { debug:    true             }),
    }

    Object.assign(config as Record<string, unknown>, extraConfig)

    dbg('final BuildConfig', config)
    console.log(JSON.stringify(config, null, 2))

    await build(config)
    console.log(`✓ Document created: ${outputAbs}`)

  } else {
    // preview() does NOT support: cwd, output, static
    // static assets are served via Vite — put the HTML's directory as input
    // and let Vivliostyle serve the whole directory
    const config: PreviewConfig = {
      input: inputAbs,
      ...(options.title    && { title:    options.title    }),
      ...(options.author   && { author:   options.author   }),
      ...(options.language && { language: options.language }),
      logLevel,
      enableStaticServe: true,
      ...(options.debug    && { debug:    true             }),
    }

    Object.assign(config as Record<string, unknown>, extraConfig)

    // Warn user that --static mappings are ignored in preview mode
    if (hasStatic) {
      console.warn(
        '[preview] Warning: --static mappings are not supported by preview() and will be ignored.\n' +
        '[preview] Vivliostyle will serve files relative to the input HTML directory instead.\n' +
        '[preview] Input directory: ' + dirname(inputAbs)
      )
    }

    dbg('final PreviewConfig', config)
    console.log(JSON.stringify(config, null, 2))

    try {
      await preview(config)
    } catch (err) {
      console.error('[preview] Full error:', err)
      const message = err instanceof Error ? err.message : String(err)
      throw new Error(`preview() failed:\n${message}`)
    }
  }
}

// ---------------------------------------------------------------------------
// Direct execution
// ---------------------------------------------------------------------------

function isDirectExecution(): boolean {
  const entry = process.argv[1]
  if (!entry) return false
  return entry.endsWith('vivliostyle-cli.js') || entry.endsWith('vivliostyle-cli')
}

if (isDirectExecution()) {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    printHelp()
  }

  if (process.argv.length <= 2) {
    printHelp()
  }

  const parsed = parseArgs(process.argv)

  if (!parsed) {
    printHelp()
    // unreachable
  } else {
    execute(parsed.options, parsed.extraArgs).catch((err) => {
      console.error(err instanceof Error ? err.message : err)
      process.exit(1)
    })
  }
}
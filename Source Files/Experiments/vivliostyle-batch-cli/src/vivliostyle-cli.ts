import { Command } from 'commander'
import { build, preview } from '@vivliostyle/cli'
import { resolve, dirname, posix } from 'path'
import { readFileSync, existsSync } from 'fs'
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

export function splitArgsAtDoubleDash(argv: string[]): { cliArgv: string[]; extraArgs: string[] } {
  const dd = argv.indexOf('--')
  if (dd === -1) {
    return { cliArgv: argv, extraArgs: [] }
  }
  return {
    cliArgv: argv.slice(0, dd),
    extraArgs: argv.slice(dd + 1),
  }
}

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

  return [...urls]
}

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

export function shouldIgnoreVirtualPath(virtualPath: string, ignoredAssets: Set<string>): boolean {
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

  return {
    urlBase: normalizeUrlBase(urlBase),
    localBase,
  }
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

  if (!trimmed || trimmed.startsWith('#')) {
    return null
  }

  const absoluteMapped = mapAbsoluteUrlToLocal(trimmed, assetBases)
  if (absoluteMapped) {
    if (shouldIgnoreVirtualPath(absoluteMapped.virtualPath, ignoredAssets)) {
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

export async function execute(
  options: CliOptions,
  extraArgs: string[] = []
): Promise<void> {
  const inputAbs = resolve(options.input)

  if (!existsSync(inputAbs)) {
    throw new Error(`Input file does not exist: ${inputAbs}`)
  }

  const cwd = options.cwd ? resolve(options.cwd) : dirname(inputAbs)
  const outputAbs = resolve(options.output)

  if (!validFormats.includes(options.format as OutputFormat)) {
    throw new Error(`Invalid format: "${options.format}". Allowed: ${validFormats.join(', ')}`)
  }

  let logLevel = options.logLevel as LogLevel
  if (!validLogLevels.includes(logLevel)) {
    throw new Error(`Invalid log level: "${options.logLevel}". Allowed: ${validLogLevels.join(', ')}`)
  }

  if (options.debug) {
    logLevel = 'debug'
  }

  const mode = (options.preview ? 'preview' : options.mode) as Mode
  if (!validModes.includes(mode)) {
    throw new Error(`Invalid mode: "${mode}". Allowed: ${validModes.join(', ')}`)
  }

  const format = options.format as OutputFormat
  const derivedMappings: string[] = []
  const assetBases = options.assetBase.map(parseAssetBaseMapping)
  const ignoredAssets = new Set(options.ignoreAsset.map(normalizeIgnoreAssetPath))

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
  }

  const allStaticMappings = [...options.static, ...derivedMappings]
  const staticMap: Record<string, string[]> = {}

  for (const mapping of allStaticMappings) {
    const { virtual, local } = parseStaticMapping(mapping)

    if (!staticMap[virtual]) {
      staticMap[virtual] = []
    }

    if (!staticMap[virtual].includes(local)) {
      staticMap[virtual].push(local)
    }
  }

  const sharedConfig = {
    cwd,
    input: inputAbs,
    ...(options.title && { title: options.title }),
    ...(options.author && { author: options.author }),
    ...(options.language && { language: options.language }),
    ...(Object.keys(staticMap).length > 0 && { static: staticMap }),
    logLevel,
  }

  const extraConfig = parseExtraArgs(extraArgs)

  console.log(`Starting Vivliostyle in mode: ${mode}`)

  if (mode === 'build') {
    const config: BuildConfig = {
      ...sharedConfig,
      output: [{ path: outputAbs, format }],
    }

    if (options.debug) {
      ;(config as Record<string, unknown>).debug = true
    }

    Object.assign(config as Record<string, unknown>, extraConfig)

    console.log(JSON.stringify(config, null, 2))
    await build(config)
    console.log(`✓ Document created: ${outputAbs}`)
  } else {
    const config: PreviewConfig = {
      ...sharedConfig,
    }

    if (options.debug) {
      ;(config as Record<string, unknown>).debug = true
    }

    Object.assign(config as Record<string, unknown>, extraConfig)

    console.log(JSON.stringify(config, null, 2))
    await preview(config)
  }
}

export function createProgram(extraArgsProvider: () => string[] = () => []): Command {
  const program = new Command()

  program
    .name('vivliostyle-cli')
    .description('Vivliostyle CLI wrapper with extended CLI support')
    .requiredOption('-i, --input <input>', 'Input HTML file')
    .option('-o, --output <file>', 'Output file', 'output.pdf')
    .option('--title <title>', 'Document title')
    .option('--author <author>', 'Author')
    .option('--language <lang>', 'Language', 'de')
    .option(
      '--static <mapping>',
      'Static path mapping: /virtual/path:/local/path (repeatable)',
      (val: string, prev: string[]) => prev.concat(val),
      []
    )
    .option(
      '--html',
      'Treat --input as HTML, parse link[href] and script[src], and add them as static mappings'
    )
    .option(
      '--asset-base <urlBase=localBase>',
      'Map absolute asset URLs under urlBase to files under localBase (repeatable)',
      (val: string, prev: string[]) => prev.concat(val),
      []
    )
    .option(
      '--ignore-asset <path>',
      'Ignore extracted asset by virtual path, e.g. /livereload.js (repeatable)',
      (val: string, prev: string[]) => prev.concat(val),
      []
    )
    .option('--cwd <dir>', 'Working directory (default: directory of the input file)')
    .option('--format <format>', 'Output format: pdf|epub|webpub', 'pdf')
    .option('--log-level <level>', 'Log level: silent|info|verbose|debug', 'info')
    .option('--mode <mode>', 'Mode: build|preview', 'build')
    .option('--preview', 'Shortcut for --mode preview')
    .option('-d, --debug', 'Enable debug mode')
    .action(async (options: CliOptions) => {
      await execute(options, extraArgsProvider())
    })

  return program
}

export async function run(argv = process.argv): Promise<void> {
  const { cliArgv, extraArgs } = splitArgsAtDoubleDash(argv)
  const program = createProgram(() => extraArgs)
  await program.parseAsync(cliArgv)
}

function isDirectExecution(): boolean {
  const entry = process.argv[1]
  if (!entry) return false
  const current = new URL(import.meta.url).pathname
  return current === entry || current.endsWith(entry)
}

if (isDirectExecution()) {
  run().catch((err) => {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  })
}
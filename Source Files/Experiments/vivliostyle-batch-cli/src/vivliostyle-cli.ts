import { Command } from 'commander'
import { build, preview } from '@vivliostyle/cli'
import { resolve, dirname, posix, join } from 'node:path'
import {
  readFileSync,
  existsSync,
  mkdtempSync,
  writeFileSync,
  rmSync,
} from 'node:fs'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'
import { AddressInfo } from 'node:net'
import { lookup as mimeLookup } from 'mime-types'
import express from 'express'
import serveStatic from 'serve-static'
import { JSDOM } from 'jsdom'

type BuildConfig = Parameters<typeof build>[0]
type PreviewConfig = Parameters<typeof preview>[0]
type VivliostyleConfigSchema = NonNullable<PreviewConfig['configData']>
type StaticMap = VivliostyleConfigSchema extends { static?: infer S }
  ? NonNullable<S>
  : Record<string, string>

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
  noScripts: boolean
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

function makeDbg(enabled: boolean): (label: string, value?: unknown) => void {
  return (label: string, value?: unknown): void => {
    if (!enabled) return
    if (value === undefined) {
      console.error(`[debug] ${label}`)
    } else {
      console.error(`[debug] ${label}`, JSON.stringify(value, null, 2))
    }
  }
}

// ---------------------------------------------------------------------------
// Arg splitting
// ---------------------------------------------------------------------------

/**
 * Splits argv at the first `--` separator.
 * Everything before `--` is treated as CLI args; everything after is
 * forwarded verbatim to Vivliostyle.
 */
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
// Static HTTP server
// ---------------------------------------------------------------------------

type StaticServer = {
  baseUrl: string
  close: () => void
}

/**
 * Starts an Express-based static file server.
 *
 * Mount order:
 *  1. Every explicit virtual→local mapping from `staticMap` is mounted at its
 *     virtual path prefix (longest prefix wins due to mount order).
 *  2. Every `assetBases[n].localBase` is mounted at `/` as a fallback so that
 *     secondary assets (fonts, images) referenced from CSS are found even
 *     though they never appeared in the HTML `<link>`/`<script>` tags.
 *
 * Used for both build and preview modes.
 * Passing `port = 0` lets the OS pick a free port.
 */
export function startStaticServer(
  staticMap: Record<string, string>,
  assetBases: AssetBaseMapping[],
  dbg: (label: string, value?: unknown) => void,
  port = 0
): Promise<StaticServer> {
  const app = express()

  // Disable the X-Powered-By header
  app.disable('x-powered-by')

  // Mount explicit virtual→local mappings
  for (const [virtual, localBase] of Object.entries(staticMap)) {
    // Ensure the mount path ends with / so express matches sub-paths correctly
    const mountPath = virtual.endsWith('/') ? virtual : `${virtual}/`
    const absLocal = resolve(localBase)
    app.use(
      mountPath,
      serveStatic(absLocal, {
        fallthrough: true,
        setHeaders: (res, filePath) => {
          const mime = mimeLookup(filePath)
          if (mime) res.setHeader('Content-Type', mime)
        },
      })
    )
    dbg('[static-server] mount', { mountPath, absLocal })
    console.log(`[static-server] Mount: ${mountPath} → ${absLocal}`)
  }

  // Fallback mounts for secondary assets (fonts, images) from each assetBase
  for (const ab of assetBases) {
    const absLocal = resolve(ab.localBase)
    app.use(
      '/',
      serveStatic(absLocal, {
        fallthrough: true,
        setHeaders: (res, filePath) => {
          const mime = mimeLookup(filePath)
          if (mime) res.setHeader('Content-Type', mime)
        },
      })
    )
    dbg('[static-server] assetBase fallback mount', absLocal)
    console.log(`[static-server] Fallback mount: / → ${absLocal}`)
  }

  // Final 404 handler
  app.use((req: express.Request, res: express.Response) => {
    dbg('[static-server] 404', req.url)
    res.status(404).type('text').send(`404 Not Found: ${req.url}`)
  })

  return new Promise((resolvePromise, reject) => {
    const httpServer = app.listen(port, '127.0.0.1', () => {
      const addr = httpServer.address() as AddressInfo
      const baseUrl = `http://127.0.0.1:${addr.port}`
      console.log(`[static-server] Listening on ${baseUrl}`)

      let closed = false
      const close = (): void => {
        if (closed) return
        closed = true
        httpServer.close((err) => {
          if (err) console.warn(`[static-server] close error: ${err.message}`)
          else dbg('[static-server] stopped')
        })
      }

      resolvePromise({ baseUrl, close })
    })

    httpServer.once('error', reject)
  })
}

// ---------------------------------------------------------------------------
// Preview HTML prep (no symlinks — just a rewritten temp HTML file)
// ---------------------------------------------------------------------------

/**
 * Writes a rewritten copy of the input HTML (absolute URLs → virtual paths)
 * to a temp file that Vivliostyle's preview server can load.
 *
 * The express static server (started separately) handles all asset requests
 * via its virtual→local mounts — no symlinks or workdir tree needed.
 *
 * Returns the temp HTML path and a cleanup function.
 */
export function buildPreviewWorkdir(
  inputAbs: string,
  assetBases: AssetBaseMapping[],
  dbg: (label: string, value?: unknown) => void
): { htmlPath: string; cleanup: () => void } {
  const tmpDir = mkdtempSync(join(tmpdir(), 'vivliostyle-preview-'))
  dbg('buildPreviewWorkdir: tmpDir', tmpDir)

  const originalHtml = readFileSync(inputAbs, 'utf-8')
  const rewrittenHtml = rewriteAbsoluteUrls(originalHtml, assetBases)
  const htmlPath = join(tmpDir, 'index.html')
  writeFileSync(htmlPath, rewrittenHtml, 'utf-8')
  dbg('buildPreviewWorkdir: wrote rewritten HTML', htmlPath)

  const cleanup = (): void => {
    try {
      rmSync(tmpDir, { recursive: true, force: true })
      dbg('buildPreviewWorkdir: removed tmpDir', tmpDir)
    } catch (err) {
      console.warn(
        `[preview] Warning: could not remove workdir ${tmpDir}\n${String(err)}`
      )
    }
  }

  return { htmlPath, cleanup }
}

// ---------------------------------------------------------------------------
// HTML asset extraction
// ---------------------------------------------------------------------------

/**
 * Parses an HTML file and returns all `href` / `src` values found in
 * `<link>` and `<script>` elements.
 *
 * @param includeScripts  When false, `<script src>` tags are ignored.
 *                        Pass false for PDF builds to avoid JS identifier
 *                        conflicts inside the Vivliostyle viewer.
 */
export function extractUrlsFromHtml(
  htmlPath: string,
  includeScripts = true
): string[] {
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

  if (includeScripts) {
    for (const el of document.querySelectorAll('script[src]')) {
      const src = el.getAttribute('src')?.trim()
      if (src) urls.add(src)
    }
  }

  return [...urls]
}

// ---------------------------------------------------------------------------
// HTML URL rewriters
// ---------------------------------------------------------------------------

/**
 * Rewrites absolute `<link href>` and `<script src>` URLs that match an
 * AssetBaseMapping to their virtual root-relative paths.
 */
export function rewriteAbsoluteUrls(
  htmlContent: string,
  assetBases: AssetBaseMapping[]
): string {
  if (assetBases.length === 0) return htmlContent

  const dom = new JSDOM(htmlContent)
  const document = dom.window.document
  let changed = false

  for (const el of document.querySelectorAll('link[href]')) {
    const href = el.getAttribute('href') ?? ''
    const mapped = mapAbsoluteUrlToLocal(href, assetBases)
    if (mapped) {
      el.setAttribute('href', mapped.virtualPath)
      changed = true
    }
  }

  for (const el of document.querySelectorAll('script[src]')) {
    const src = el.getAttribute('src') ?? ''
    const mapped = mapAbsoluteUrlToLocal(src, assetBases)
    if (mapped) {
      el.setAttribute('src', mapped.virtualPath)
      changed = true
    }
  }

  return changed ? dom.serialize() : htmlContent
}

/**
 * Rewrites root-relative `href` / `src` attributes matched by staticMap keys
 * to absolute server URLs. Used in build mode so Vivliostyle's headless
 * browser fetches assets from our local server instead of the network.
 */
export function rewriteVirtualPathsToServer(
  htmlContent: string,
  staticMap: Record<string, string>,
  serverBaseUrl: string
): string {
  const dom = new JSDOM(htmlContent)
  const document = dom.window.document
  let changed = false

  const shouldRewrite = (path: string): boolean => {
    if (!path.startsWith('/')) return false
    return Object.keys(staticMap).some(
      (virtual) =>
        path === virtual ||
        path.startsWith(virtual.endsWith('/') ? virtual : `${virtual}/`)
    )
  }

  for (const el of document.querySelectorAll('link[href]')) {
    const href = el.getAttribute('href') ?? ''
    if (shouldRewrite(href)) {
      el.setAttribute('href', `${serverBaseUrl}${href}`)
      changed = true
    }
  }

  for (const el of document.querySelectorAll('script[src]')) {
    const src = el.getAttribute('src') ?? ''
    if (shouldRewrite(src)) {
      el.setAttribute('src', `${serverBaseUrl}${src}`)
      changed = true
    }
  }

  return changed ? dom.serialize() : htmlContent
}

/**
 * Prepares the input HTML for build mode:
 *  1. Rewrites absolute URLs → virtual paths
 *  2. Rewrites virtual paths → absolute server URLs
 * Writes the result to a temp file and returns its path plus a cleanup fn.
 */
export function prepareInputHtmlForBuild(
  inputAbs: string,
  assetBases: AssetBaseMapping[],
  staticMap: Record<string, string>,
  serverBaseUrl: string,
  dbg: (label: string, value?: unknown) => void
): { vivliostyleInput: string; cleanup: () => void } {
  const originalHtml = readFileSync(inputAbs, 'utf-8')

  const afterAbsRewrite = rewriteAbsoluteUrls(originalHtml, assetBases)
  if (afterAbsRewrite !== originalHtml) {
    dbg('prepareInputHtmlForBuild: rewrote absolute URLs to virtual paths')
  }

  const afterServerRewrite = rewriteVirtualPathsToServer(
    afterAbsRewrite,
    staticMap,
    serverBaseUrl
  )
  if (afterServerRewrite !== afterAbsRewrite) {
    dbg('prepareInputHtmlForBuild: rewrote virtual paths to server URLs')
  }

  if (afterServerRewrite === originalHtml) {
    dbg('prepareInputHtmlForBuild: no changes, using original file')
    return { vivliostyleInput: inputAbs, cleanup: () => undefined }
  }

  const tmpDir = mkdtempSync(join(tmpdir(), 'vivliostyle-'))
  const tmpHtml = join(tmpDir, 'index.html')
  writeFileSync(tmpHtml, afterServerRewrite, 'utf-8')

  console.log(`[--html] Prepared input HTML → ${tmpHtml}`)
  dbg('prepareInputHtmlForBuild: written to temp file', tmpHtml)

  const cleanup = (): void => {
    try {
      rmSync(tmpDir, { recursive: true, force: true })
      dbg('prepareInputHtmlForBuild: removed temp dir', tmpDir)
    } catch (err) {
      console.warn(
        `[--html] Warning: could not remove temp dir ${tmpDir}\n${String(err)}`
      )
    }
  }

  return { vivliostyleInput: tmpHtml, cleanup }
}

// ---------------------------------------------------------------------------
// Asset base / ignore helpers
// ---------------------------------------------------------------------------

/** Ensures a URL base ends with exactly one trailing slash. */
export function normalizeUrlBase(urlBase: string): string {
  return urlBase.endsWith('/') ? urlBase : `${urlBase}/`
}

/** Normalises an --ignore-asset value to an absolute POSIX virtual path. */
export function normalizeIgnoreAssetPath(pathValue: string): string {
  const trimmed = pathValue.trim()
  if (!trimmed) {
    throw new Error('Invalid --ignore-asset value: must not be empty')
  }
  return trimmed.startsWith('/')
    ? posix.normalize(trimmed)
    : posix.resolve('/', trimmed)
}

/** Returns true when virtualPath is listed in ignoredAssets. */
export function shouldIgnoreVirtualPath(
  virtualPath: string,
  ignoredAssets: Set<string>
): boolean {
  return ignoredAssets.has(posix.normalize(virtualPath))
}

/**
 * Parses a single `--asset-base` value of the form `<urlBase>=<localBase>`.
 */
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

/**
 * Attempts to match `url` against each AssetBaseMapping.
 * Returns `{ virtualPath, localPath }` for the first match, or `null`.
 */
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

// ---------------------------------------------------------------------------
// MappingResult + urlToStaticMapping
// ---------------------------------------------------------------------------

type MappingResult =
  | { kind: 'mapped'; mapping: string }
  | { kind: 'skipped'; url: string; reason: string }

/**
 * Converts a single URL found in an HTML file into a MappingResult.
 */
export function urlToStaticMapping(
  url: string,
  htmlDir: string,
  assetBases: AssetBaseMapping[],
  ignoredAssets: Set<string>,
  dbg: (label: string, value?: unknown) => void
): MappingResult {
  const trimmed = url.trim()

  if (!trimmed) {
    return { kind: 'skipped', url, reason: 'empty URL' }
  }

  if (trimmed.startsWith('#')) {
    return { kind: 'skipped', url, reason: 'fragment-only URL' }
  }

  const absoluteMapped = mapAbsoluteUrlToLocal(trimmed, assetBases)
  if (absoluteMapped) {
    if (shouldIgnoreVirtualPath(absoluteMapped.virtualPath, ignoredAssets)) {
      dbg('urlToStaticMapping: ignored (asset-base match)', { url, ...absoluteMapped })
      return {
        kind: 'skipped',
        url,
        reason: `matches --ignore-asset "${absoluteMapped.virtualPath}"`,
      }
    }
    if (!existsSync(absoluteMapped.localPath)) {
      console.warn(
        `[--html] Warning: asset-base mapped path does not exist\n` +
        `         url     : ${url}\n` +
        `         virtual : ${absoluteMapped.virtualPath}\n` +
        `         local   : ${absoluteMapped.localPath}`
      )
    }
    return {
      kind: 'mapped',
      mapping: `${absoluteMapped.virtualPath}:${absoluteMapped.localPath}`,
    }
  }

  if (trimmed.startsWith('//')) {
    return { kind: 'skipped', url, reason: 'protocol-relative external URL' }
  }

  if (/^[a-zA-Z][a-zA-Z0-9+\-.]*:/.test(trimmed)) {
    const protocol = trimmed.slice(0, trimmed.indexOf(':'))
    return {
      kind: 'skipped',
      url,
      reason: `external URL (protocol: ${protocol}:) — add --asset-base to map it locally`,
    }
  }

  const cleanUrl = trimmed.split('?')[0].split('#')[0]
  if (!cleanUrl) {
    return { kind: 'skipped', url, reason: 'URL is empty after stripping query/fragment' }
  }

  const localPath = resolve(htmlDir, cleanUrl)

  const virtualPath = cleanUrl.startsWith('/')
    ? posix.normalize(cleanUrl)
    : posix.resolve('/', posix.relative(htmlDir, localPath))

  if (shouldIgnoreVirtualPath(virtualPath, ignoredAssets)) {
    dbg('urlToStaticMapping: ignored (ignore-asset match)', { url, virtualPath })
    return {
      kind: 'skipped',
      url,
      reason: `matches --ignore-asset "${virtualPath}"`,
    }
  }

  if (!existsSync(localPath)) {
    console.warn(
      `[--html] Warning: referenced path does not exist\n` +
      `         url     : ${url}\n` +
      `         virtual : ${virtualPath}\n` +
      `         local   : ${localPath}`
    )
  }

  return { kind: 'mapped', mapping: `${virtualPath}:${localPath}` }
}

/**
 * Parses a `virtual:local` mapping string.
 * Handles Windows drive letters by searching for `:` after the first `/`.
 */
export function parseStaticMapping(mapping: string): { virtual: string; local: string } {
  const firstSlash = mapping.indexOf('/')
  const colonIdx = firstSlash === -1
    ? mapping.indexOf(':')
    : mapping.indexOf(':', firstSlash)

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
// Static map builder
// ---------------------------------------------------------------------------

function buildStaticMap(rawMappings: string[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const mapping of rawMappings) {
    const { virtual, local } = parseStaticMapping(mapping)
    map[virtual] = local
  }
  return map
}

// ---------------------------------------------------------------------------
// Extra args parser
// ---------------------------------------------------------------------------

/**
 * Parses `--key value` and `--key=value` pairs from an array of raw strings
 * (typically everything after `--` in the original argv).
 */
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
    .requiredOption('-i, --input <input>', 'Input HTML or publication manifest file')
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
        'Starts a local Express server to serve all mapped assets.',
      ].join('\n      ')
    )
    .option(
      '--no-scripts',
      [
        'Do not map <script src> tags as static assets.',
        'Recommended for PDF builds to avoid JS identifier conflicts',
        'in the Vivliostyle viewer.',
      ].join('\n      ')
    )
    .option(
      '--asset-base <urlBase=localBase>',
      [
        'Map all asset URLs that start with <urlBase> to files under <localBase>.',
        'Format: <urlBase>=<localBase>',
        'Example: https://cdn.example.com/=/home/user/cdn-cache',
        'The localBase is also used as fallback root for secondary assets.',
        'Repeatable. Requires --html.',
      ].join('\n      '),
      (val: string, prev: string[]) => prev.concat(val),
      []
    )
    .option(
      '--ignore-asset <path>',
      [
        'Skip a specific virtual path when deriving --static mappings.',
        'Example: --ignore-asset /livereload.js',
        'Repeatable. Requires --html.',
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
        '  • All asset serving goes through a local Express server.',
        '  • --asset-base localBase is also a fallback root for CSS-referenced assets.',
      ].join('\n')
    )
}

/** Prints help text and exits. */
export function printHelp(): void {
  buildProgram().help()
}

/**
 * Parses `argv` (typically `process.argv`) into structured options.
 * Returns `null` when no arguments were provided.
 */
export function parseArgs(argv: string[]): {
  options: CliOptions
  extraArgs: string[]
} | null {
  const { cliArgv, extraArgs } = splitArgsAtDoubleDash(argv)

  if (cliArgv.slice(2).length === 0) {
    return null
  }

  const program = buildProgram()
  program.exitOverride()

  try {
    program.parse(cliArgv)
  } catch (err: unknown) {
    const code = (err as { code?: string }).code ?? ''
    if (code === 'commander.helpDisplayed' || code === 'commander.version') {
      return null
    }
    throw err
  }

  return {
    options: program.opts<CliOptions>(),
    extraArgs,
  }
}

// ---------------------------------------------------------------------------
// Core execute
// ---------------------------------------------------------------------------

/**
 * Validates all options, assembles the Vivliostyle config and runs either
 * `build()` or `preview()`.
 */
export async function execute(
  options: CliOptions,
  extraArgs: string[] = []
): Promise<void> {
  const debugEnabled = !!(options.debug || options.logLevel === 'debug')
  const dbg = makeDbg(debugEnabled)

  dbg('raw CLI options', options)
  dbg('extra args (after --)', extraArgs)

  if (!options.input) {
    throw new Error('Missing required option: --input')
  }

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
  const format = options.format as OutputFormat

  if (!validLogLevels.includes(options.logLevel as LogLevel)) {
    throw new Error(
      `Invalid log level: "${options.logLevel}". Allowed: ${validLogLevels.join(', ')}`
    )
  }
  const logLevel: LogLevel = options.debug ? 'debug' : (options.logLevel as LogLevel)
  dbg('logLevel', logLevel)

  const mode = (options.preview ? 'preview' : options.mode) as Mode
  if (!validModes.includes(mode)) {
    throw new Error(`Invalid mode: "${mode}". Allowed: ${validModes.join(', ')}`)
  }
  dbg('mode', mode)

  const assetBases = options.assetBase.map(parseAssetBaseMapping)
  dbg('parsed assetBases', assetBases)

  const ignoredAssets = new Set(options.ignoreAsset.map(normalizeIgnoreAssetPath))
  dbg('ignoredAssets', [...ignoredAssets])

  if (assetBases.length > 0 && !options.html) {
    console.warn(
      `[warn] --asset-base has no effect without --html.\n` +
      `       Add --html to enable HTML parsing and URL mapping.`
    )
  }
  if (ignoredAssets.size > 0 && !options.html) {
    console.warn(
      `[warn] --ignore-asset has no effect without --html.\n` +
      `       Add --html to enable HTML parsing and URL mapping.`
    )
  }

  // ── HTML-derived mappings ──────────────────────────────────────────────────
  const derivedMappings: string[] = []

  if (options.html) {
    const htmlDir = dirname(inputAbs)
    console.log(`[--html] Analysing input as HTML: ${inputAbs}`)

    // Skip scripts in build mode to avoid identifier conflicts in the viewer
    const includeScripts = mode === 'preview' ? true : !options.noScripts
    const urls = extractUrlsFromHtml(inputAbs, includeScripts)

    if (urls.length === 0) {
      console.log('[--html] No URLs found in input HTML')
    } else {
      console.log(`[--html] Found URLs (${urls.length}):`)
    }

    for (const url of urls) {
      const result = urlToStaticMapping(url, htmlDir, assetBases, ignoredAssets, dbg)
      if (result.kind === 'skipped') {
        console.log(`  → Skipped (${result.reason}): ${url}`)
        continue
      }
      console.log(`  → Mapping: ${result.mapping}`)
      derivedMappings.push(result.mapping)
    }

    dbg('derived static mappings from HTML', derivedMappings)
  }

  // ── static map ─────────────────────────────────────────────────────────────
  const allStaticMappings = [...options.static, ...derivedMappings]
  dbg('all raw static mappings', allStaticMappings)

  const staticMap = buildStaticMap(allStaticMappings)
  dbg('assembled staticMap', staticMap)

  const hasStatic = Object.keys(staticMap).length > 0

  for (const [virtualPath, localPath] of Object.entries(staticMap)) {
    if (!existsSync(localPath)) {
      console.warn(
        `[static] Warning: mapped local path does not exist\n` +
        `         virtual : ${virtualPath}\n` +
        `         local   : ${localPath}`
      )
    }
  }

  const extraConfig = parseExtraArgs(extraArgs)
  dbg('extraConfig (parsed from -- args)', extraConfig)

  console.log(`Starting Vivliostyle in mode: ${mode}`)

  // ── BUILD mode ─────────────────────────────────────────────────────────────
  if (mode === 'build') {
    let vivliostyleInput = inputAbs
    let htmlCleanup = (): void => undefined
    let serverClose = (): void => undefined

    if (hasStatic || assetBases.length > 0) {
      const server = await startStaticServer(staticMap, assetBases, dbg)
      serverClose = server.close

      if (options.html) {
        ;({ vivliostyleInput, cleanup: htmlCleanup } = prepareInputHtmlForBuild(
          inputAbs,
          assetBases,
          staticMap,
          server.baseUrl,
          dbg
        ))
      }
    }

    dbg('vivliostyleInput (final)', vivliostyleInput)

    try {
      const config: BuildConfig = {
        cwd,
        input: vivliostyleInput,
        output: [{ path: outputAbs, format }],
        ...(options.title    !== undefined && options.title    !== '' ? { title:    options.title    } : {}),
        ...(options.author   !== undefined && options.author   !== '' ? { author:   options.author   } : {}),
        ...(options.language !== undefined && options.language !== '' ? { language: options.language } : {}),
        logLevel,
        ...(options.debug ? { debug: true } : {}),
        ...extraConfig,
      }

      dbg('final BuildConfig', config)

      await build(config)
      console.log(`✓ Document created: ${outputAbs}`)
    } finally {
      htmlCleanup()
      serverClose()
    }

  // ── PREVIEW mode ───────────────────────────────────────────────────────────
  } else {
    let previewEntry = inputAbs
    let htmlCleanup = (): void => undefined
    let serverClose = (): void => undefined

    if (options.html && (hasStatic || assetBases.length > 0)) {
      // Start the express server so assets are reachable during preview
      const server = await startStaticServer(staticMap, assetBases, dbg)
      serverClose = server.close

      // Write a rewritten HTML file (absolute URLs → server URLs) for preview
      const { htmlPath, cleanup } = buildPreviewWorkdir(inputAbs, assetBases, dbg)

      // Rewrite the virtual paths in the HTML to point at our server
      const html = readFileSync(htmlPath, 'utf-8')
      const rewritten = rewriteVirtualPathsToServer(html, staticMap, server.baseUrl)
      writeFileSync(htmlPath, rewritten, 'utf-8')

      previewEntry = htmlPath
      htmlCleanup = cleanup
      console.log(`[preview] Entry: ${previewEntry}`)
    }

    dbg('preview entry (final)', previewEntry)

    const configData: VivliostyleConfigSchema = [
      {
        entry: previewEntry,
        ...(options.title    !== undefined && options.title    !== '' ? { title:    options.title    } : {}),
        ...(options.author   !== undefined && options.author   !== '' ? { author:   options.author   } : {}),
        ...(options.language !== undefined && options.language !== '' ? { language: options.language } : {}),
      },
    ]

    const config: PreviewConfig = {
      configData,
      logLevel,
      enableStaticServe: true,
      openViewer: true,
      singleDoc: true,
      ...(options.debug ? { debug: true } : {}),
      ...extraConfig,
    }

    dbg('final PreviewConfig', config)

    try {
      await preview(config)
    } catch (err) {
      console.error('[preview] Full error:', err)
      const message = err instanceof Error ? err.message : String(err)
      throw new Error(`preview() failed:\n${message}`)
    } finally {
      // Note: serverClose is intentionally NOT called here in preview mode
      // because preview() is long-running (blocks until Ctrl+C).
      // The OS will reclaim the port when the process exits.
      htmlCleanup()
    }
  }
}

// ---------------------------------------------------------------------------
// Direct execution
// ---------------------------------------------------------------------------

function isDirectExecution(): boolean {
  const entry = process.argv[1]
  if (!entry) return false
  try {
    return resolve(entry) === resolve(fileURLToPath(import.meta.url))
  } catch {
    return false
  }
}

if (isDirectExecution()) {
  if (process.argv.slice(2).length === 0) {
    printHelp()
  }

  const parsed = parseArgs(process.argv)

  if (!parsed) {
    printHelp()
  } else {
    execute(parsed.options, parsed.extraArgs).catch((err) => {
      console.error(err instanceof Error ? err.message : err)
      process.exit(1)
    })
  }
}
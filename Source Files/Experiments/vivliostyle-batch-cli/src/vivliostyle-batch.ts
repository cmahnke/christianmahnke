import { Command } from 'commander'
import { build } from '@vivliostyle/cli'
import { resolve, dirname } from 'path'
import { readFileSync } from 'fs'

type BuildConfig = Parameters<typeof build>[0]

/**
 * Extracts URLs from <link href="..."> and <script src="..."> tags in an HTML file.
 * Returns both absolute URLs and relative paths as-is.
 */
function extractUrlsFromHtml(htmlPath: string): string[] {
  let content: string
  try {
    content = readFileSync(htmlPath, 'utf-8')
  } catch (err) {
    console.error(`Error reading HTML file for --html: ${htmlPath}`, err)
    process.exit(1)
  }

  const urls: string[] = []

  const linkPattern = /<link[^>]+href\s*=\s*(['"]?)([^'">\s]+)\1[^>]*>/gi
  const scriptPattern = /<script[^>]+src\s*=\s*(['"]?)([^'">\s]+)\1[^>]*>/gi

  let match: RegExpExecArray | null

  while ((match = linkPattern.exec(content)) !== null) {
    const url = match[2].trim()
    if (url) urls.push(url)
  }

  while ((match = scriptPattern.exec(content)) !== null) {
    const url = match[2].trim()
    if (url) urls.push(url)
  }

  return urls
}

/**
 * Converts a URL extracted from HTML into a static mapping string.
 *
 * Rules:
 * - Absolute URLs (http://, https://, data:, etc.) are skipped.
 * - Relative paths are resolved relative to the HTML file's directory.
 * - The mapping is produced as /virtual/path:/local/path,
 *   where the virtual path is derived from the URL path (without query/hash).
 *
 * Example:
 *   URL: "../assets/style.css", htmlDir: "/project/src"
 *   → virtual: "/assets/style.css", local: "/project/assets/style.css"
 *   → Mapping: "/assets/style.css:/project/assets/style.css"
 */
function urlToStaticMapping(url: string, htmlDir: string): string | null {
  if (/^[a-zA-Z][a-zA-Z0-9+\-.]*:/.test(url)) {
    return null
  }

  if (!url || url.startsWith('#')) {
    return null
  }

  const cleanUrl = url.split('?')[0].split('#')[0]
  if (!cleanUrl) return null

  let virtualPath: string
  if (cleanUrl.startsWith('/')) {
    virtualPath = cleanUrl
  } else {
    virtualPath = resolve('/', cleanUrl)
  }

  const localPath = resolve(htmlDir, cleanUrl)

  return `${virtualPath}:${localPath}`
}

const program = new Command()

program
  .name('vivliostyle-batch')
  .description('Vivliostyle CLI wrapper with extended CLI support')
  .argument('<input>', 'Input HTML file')
  .option('-o, --output <file>', 'Output PDF', 'output.pdf')
  .option('--title <title>', 'Document title')
  .option('--author <author>', 'Author')
  .option('--language <lang>', 'Language', 'de')
  .option(
    '--static <mapping>',
    'Static path mapping: /virtual/path:/local/path (repeatable)',
    (val: string, prev: string[]) => prev.concat(val),
    [] as string[]
  )
  .option(
    '--html <file>',
    'Parse an HTML file and add all link[href] and script[src] URLs as --static mappings (repeatable)',
    (val: string, prev: string[]) => prev.concat(val),
    [] as string[]
  )
  .option('--cwd <dir>', 'Working directory (default: directory of the input file)')
  .option('--format <format>', 'Output format: pdf|epub|webpub', 'pdf')
  .option('--log-level <level>', 'Log level: silent|info|verbose|debug', 'info')
  .action(async (input: string, options: {
    output: string
    title?: string
    author?: string
    language?: string
    static: string[]
    html: string[]
    cwd?: string
    format: string
    logLevel: string
  }) => {
    const inputAbs = resolve(input)

    const cwd = options.cwd
      ? resolve(options.cwd)
      : dirname(inputAbs)

    const outputAbs = resolve(options.output)

    const htmlDerivedMappings: string[] = []

    for (const htmlFile of options.html) {
      const htmlAbs = resolve(htmlFile)
      const htmlDir = dirname(htmlAbs)

      console.log(`[--html] Analysing: ${htmlAbs}`)

      const urls = extractUrlsFromHtml(htmlAbs)

      if (urls.length === 0) {
        console.log(`[--html] No URLs found in: ${htmlAbs}`)
        continue
      }

      console.log(`[--html] Found URLs (${urls.length}):`)

      for (const url of urls) {
        const mapping = urlToStaticMapping(url, htmlDir)

        if (mapping === null) {
          console.log(`  → Skipped (absolute/external): ${url}`)
          continue
        }

        console.log(`  → Mapping: ${mapping}`)
        htmlDerivedMappings.push(mapping)
      }
    }

    const allStaticMappings = [...options.static, ...htmlDerivedMappings]

    const staticMap: Record<string, string[]> = {}

    for (const mapping of allStaticMappings) {
      const colonIdx = mapping.lastIndexOf(':')
      if (colonIdx === -1) {
        console.error(`Invalid --static mapping: "${mapping}"`)
        console.error('Expected format: /virtual/path:/local/path')
        process.exit(1)
      }

      const virtual = mapping.slice(0, colonIdx)
      const local   = mapping.slice(colonIdx + 1)

      if (!virtual.startsWith('/')) {
        console.error(`Virtual path must start with /: "${virtual}"`)
        process.exit(1)
      }

      if (staticMap[virtual]) {
        if (!staticMap[virtual].includes(local)) {
          staticMap[virtual].push(local)
        }
      } else {
        staticMap[virtual] = [local]
      }
    }

    const validFormats = ['pdf', 'epub', 'webpub'] as const
    type OutputFormat = typeof validFormats[number]

    if (!validFormats.includes(options.format as OutputFormat)) {
      console.error(`Invalid format: "${options.format}". Allowed: ${validFormats.join(', ')}`)
      process.exit(1)
    }

    const format = options.format as OutputFormat

    const config: BuildConfig = {
      cwd,
      input: inputAbs,
      output: [{ path: outputAbs, format }],
      ...(options.title    && { title:    options.title }),
      ...(options.author   && { author:   options.author }),
      ...(options.language && { language: options.language }),
      ...(Object.keys(staticMap).length > 0 && { static: staticMap }),
      logLevel: options.logLevel as 'silent' | 'info' | 'verbose' | 'debug',
    }

    const rawArgs = process.argv.slice(2)
    const doubleDashIndex = rawArgs.indexOf('--')

    if (doubleDashIndex !== -1) {
      const unknownArgs = rawArgs.slice(doubleDashIndex + 1)
      const extraConfig: Record<string, any> = {}

      for (let i = 0; i < unknownArgs.length; i++) {
        const arg = unknownArgs[i]

        if (arg.startsWith('--')) {
          const key = arg.slice(2)
          const next = unknownArgs[i + 1]

          if (next && !next.startsWith('--')) {
            extraConfig[key] = next
            i++
          } else {
            extraConfig[key] = true
          }
        }
      }

      Object.assign(config, extraConfig)
    }

    console.log('Starting build with config:')
    console.log(JSON.stringify(config, null, 2))

    try {
      await build(config)
      console.log(`✓ Document created: ${outputAbs}`)
    } catch (err) {
      console.error('Build failed:', err)
      process.exit(1)
    }
  })

if (process.argv.length <= 2) {
  program.help()
}

program.parse()
import { Command } from 'commander'
import { build } from '@vivliostyle/cli'
import { resolve, dirname } from 'path'

// Typ direkt aus build() ableiten - kein problematischer Import nötig
type BuildConfig = Parameters<typeof build>[0]

const program = new Command()

program
  .name('vivliostyle-batch')
  .description('Vivliostyle CLI Wrapper mit erweiterter CLI-Unterstützung')
  .argument('<input>', 'Input HTML Datei')
  .option('-o, --output <file>', 'Output PDF', 'output.pdf')
  .option('--title <title>', 'Dokumenttitel')
  .option('--author <author>', 'Autor')
  .option('--language <lang>', 'Sprache', 'de')
  .option(
    '--static <mapping>',
    'Static path mapping: /virtual/:lokaler/pfad (wiederholbar)',
    (val: string, prev: string[]) => prev.concat(val),
    [] as string[]
  )
  .option('--cwd <dir>', 'Working directory (Standard: Verzeichnis der Input-Datei)')
  .option('--format <format>', 'Output Format: pdf|epub|webpub', 'pdf')
  .option('--log-level <level>', 'Log level: silent|info|verbose|debug', 'info')
  .action(async (input: string, options: {
    output: string
    title?: string
    author?: string
    language?: string
    static: string[]
    cwd?: string
    format: string
    logLevel: string
  }) => {

    const inputAbs = resolve(input)

    const cwd = options.cwd
      ? resolve(options.cwd)
      : dirname(inputAbs)

    const outputAbs = resolve(options.output)

    // Static Mappings parsen
    const staticMap: Record<string, string[]> = {}
    for (const mapping of options.static) {
      const colonIdx = mapping.lastIndexOf(':')
      if (colonIdx === -1) {
        console.error(`Ungültiges --static mapping: "${mapping}"`)
        console.error('Format: /virtual/pfad:/lokaler/pfad')
        process.exit(1)
      }
      const virtual = mapping.slice(0, colonIdx)
      const local   = mapping.slice(colonIdx + 1)

      if (!virtual.startsWith('/')) {
        console.error(`Virtual path muss mit / beginnen: "${virtual}"`)
        process.exit(1)
      }

      staticMap[virtual] = [local]
    }

    // Format validieren
    const validFormats = ['pdf', 'epub', 'webpub'] as const
    type OutputFormat = typeof validFormats[number]

    if (!validFormats.includes(options.format as OutputFormat)) {
      console.error(`Ungültiges Format: "${options.format}". Erlaubt: ${validFormats.join(', ')}`)
      process.exit(1)
    }

    const format = options.format as OutputFormat

    // Config zusammenstellen
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

    console.log('Starte Build mit Config:')
    console.log(JSON.stringify(config, null, 2))

    try {
      await build(config)
      console.log(`✓ PDF erstellt: ${outputAbs}`)
    } catch (err) {
      console.error('Build fehlgeschlagen:', err)
      process.exit(1)
    }
  })

// Hilfe anzeigen wenn keine Argumente übergeben
if (process.argv.length <= 2) {
  program.help()
}

program.parse()
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const buildMock = vi.fn(async () => {})
const previewMock = vi.fn(async () => {})

vi.mock('@vivliostyle/cli', () => ({
  build: buildMock,
  preview: previewMock,
}))

describe('vivliostyle-cli', () => {
  let tempDir: string
  let logSpy: ReturnType<typeof vi.spyOn>
  let warnSpy: ReturnType<typeof vi.spyOn>
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'vivliostyle-cli-test-'))
    buildMock.mockClear()
    previewMock.mockClear()
    logSpy  = vi.spyOn(console, 'log').mockImplementation(() => {})
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    logSpy.mockRestore()
    warnSpy.mockRestore()
    errorSpy.mockRestore()
    rmSync(tempDir, { recursive: true, force: true })
    vi.resetModules()
  })

  async function runArgs(argv: string[]): Promise<void> {
    const { parseArgs, execute } = await import('../src/vivliostyle-cli')
    const parsed = parseArgs(['node', 'script', ...argv])
    if (!parsed) throw new Error('parseArgs returned null — no arguments given')
    await execute(parsed.options, parsed.extraArgs)
  }

  // ---------------------------------------------------------------------------
  // Help output when no arguments are given
  // ---------------------------------------------------------------------------

  it('prints help and does not execute when called with no arguments', async () => {
    const { parseArgs, printHelp } = await import('../src/vivliostyle-cli')

    const result = parseArgs(['node', 'script'])
    expect(result).toBeNull()

    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as () => never)

    printHelp()

    expect(writeSpy).toHaveBeenCalled()
    const output = writeSpy.mock.calls.map((c) => String(c[0])).join('')
    expect(output).toContain('vivliostyle-cli')
    expect(output).toContain('--input')

    writeSpy.mockRestore()
    exitSpy.mockRestore()

    expect(buildMock).not.toHaveBeenCalled()
    expect(previewMock).not.toHaveBeenCalled()
  })

  // ---------------------------------------------------------------------------
  // Build mode
  // ---------------------------------------------------------------------------

  it('calls build() in default build mode', async () => {
    const inputFile = join(tempDir, 'input.html')
    writeFileSync(inputFile, '<html><head></head><body>Hello</body></html>', 'utf-8')

    await runArgs([
      '--input', inputFile,
      '--output', join(tempDir, 'out.pdf'),
    ])

    expect(buildMock).toHaveBeenCalledTimes(1)
    expect(previewMock).not.toHaveBeenCalled()

    const config = buildMock.mock.calls[0][0]
    expect(config.input).toBe(resolve(inputFile))
    expect(config.output).toEqual([{
      path: resolve(join(tempDir, 'out.pdf')),
      format: 'pdf',
    }])
  })

  // ---------------------------------------------------------------------------
  // Preview mode
  // ---------------------------------------------------------------------------

  it('calls preview() in preview mode', async () => {
    const inputFile = join(tempDir, 'input.html')
    writeFileSync(inputFile, '<html><body>Hello</body></html>', 'utf-8')

    await runArgs([
      '--input', inputFile,
      '--mode', 'preview',
    ])

    expect(previewMock).toHaveBeenCalledTimes(1)
    expect(buildMock).not.toHaveBeenCalled()

    const config = previewMock.mock.calls[0][0]
    // preview uses configData, not top-level input
    expect(config.configData.entry).toBe(resolve(inputFile))
    expect(config.openViewer).toBe(true)
    expect(config.enableStaticServe).toBe(true)
    expect(config.singleDoc).toBe(true)
  })

  it('calls preview() with --preview shortcut', async () => {
    const inputFile = join(tempDir, 'input.html')
    writeFileSync(inputFile, '<html><body>Hello</body></html>', 'utf-8')

    await runArgs([
      '--input', inputFile,
      '--preview',
    ])

    expect(previewMock).toHaveBeenCalledTimes(1)
    expect(buildMock).not.toHaveBeenCalled()

    const config = previewMock.mock.calls[0][0]
    expect(config.configData.entry).toBe(resolve(inputFile))
    expect(config.openViewer).toBe(true)
  })

  // ---------------------------------------------------------------------------
  // HTML asset extraction
  // ---------------------------------------------------------------------------

  it('extracts link and script assets in --html mode and passes static mappings to build()', async () => {
    const inputFile = join(tempDir, 'input.html')

    // Create actual files so existence checks pass without warnings
    mkdirSync(join(tempDir, 'css'))
    mkdirSync(join(tempDir, 'js'))
    writeFileSync(join(tempDir, 'css', 'site.css'), '/* css */', 'utf-8')
    writeFileSync(join(tempDir, 'js',  'app.js'),   '// js',     'utf-8')

    writeFileSync(
      inputFile,
      `
      <html>
        <head>
          <link rel="stylesheet" href="./css/site.css">
          <script src="./js/app.js"></script>
        </head>
        <body>Hello</body>
      </html>
      `,
      'utf-8'
    )

    await runArgs([
      '--input', inputFile,
      '--html',
    ])

    expect(buildMock).toHaveBeenCalledTimes(1)
    const config = buildMock.mock.calls[0][0]

    expect(config.static).toEqual({
      '/css/site.css': [resolve(tempDir, 'css/site.css')],
      '/js/app.js':    [resolve(tempDir, 'js/app.js')],
    })

    // No warnings about missing files
    expect(warnSpy).not.toHaveBeenCalled()
  })

  // ---------------------------------------------------------------------------
  // Asset base mapping
  // ---------------------------------------------------------------------------

  it('maps absolute asset URLs via --asset-base', async () => {
    const inputFile = join(tempDir, 'input.html')

    mkdirSync(join(tempDir, 'css'))
    mkdirSync(join(tempDir, 'js'))
    writeFileSync(join(tempDir, 'css', 'site.css'), '/* css */', 'utf-8')
    writeFileSync(join(tempDir, 'js',  'app.js'),   '// js',     'utf-8')

    writeFileSync(
      inputFile,
      `
      <html>
        <head>
          <link rel="stylesheet" href="http://localhost:1313/css/site.css">
          <script src="http://localhost:1313/js/app.js"></script>
        </head>
        <body>Hello</body>
      </html>
      `,
      'utf-8'
    )

    await runArgs([
      '--input',      inputFile,
      '--html',
      '--asset-base', `http://localhost:1313/=${tempDir}`,
    ])

    expect(buildMock).toHaveBeenCalledTimes(1)
    const config = buildMock.mock.calls[0][0]

    expect(config.static).toEqual({
      '/css/site.css': [resolve(tempDir, 'css/site.css')],
      '/js/app.js':    [resolve(tempDir, 'js/app.js')],
    })

    expect(warnSpy).not.toHaveBeenCalled()
  })

  // ---------------------------------------------------------------------------
  // Ignore assets
  // ---------------------------------------------------------------------------

  it('ignores configured assets like /livereload.js', async () => {
    const inputFile = join(tempDir, 'input.html')

    mkdirSync(join(tempDir, 'js'))
    writeFileSync(join(tempDir, 'js', 'app.js'), '// js', 'utf-8')

    writeFileSync(
      inputFile,
      `
      <html>
        <head>
          <script src="/livereload.js"></script>
          <script src="./js/app.js"></script>
        </head>
        <body>Hello</body>
      </html>
      `,
      'utf-8'
    )

    await runArgs([
      '--input',         inputFile,
      '--html',
      '--ignore-asset',  '/livereload.js',
    ])

    expect(buildMock).toHaveBeenCalledTimes(1)
    const config = buildMock.mock.calls[0][0]

    expect(config.static).toEqual({
      '/js/app.js': [resolve(tempDir, 'js/app.js')],
    })
    expect(config.static['/livereload.js']).toBeUndefined()

    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('ignores mapped absolute assets like /livereload.js via --asset-base', async () => {
    const inputFile = join(tempDir, 'input.html')

    mkdirSync(join(tempDir, 'js'))
    writeFileSync(join(tempDir, 'js', 'app.js'), '// js', 'utf-8')

    writeFileSync(
      inputFile,
      `
      <html>
        <head>
          <script src="http://localhost:1313/livereload.js"></script>
          <script src="http://localhost:1313/js/app.js"></script>
        </head>
        <body>Hello</body>
      </html>
      `,
      'utf-8'
    )

    await runArgs([
      '--input',         inputFile,
      '--html',
      '--asset-base',    `http://localhost:1313/=${tempDir}`,
      '--ignore-asset',  '/livereload.js',
    ])

    expect(buildMock).toHaveBeenCalledTimes(1)
    const config = buildMock.mock.calls[0][0]

    expect(config.static).toEqual({
      '/js/app.js': [resolve(tempDir, 'js/app.js')],
    })

    expect(warnSpy).not.toHaveBeenCalled()
  })

  // ---------------------------------------------------------------------------
  // Debug flag
  // ---------------------------------------------------------------------------

  it('sets logLevel to debug when -d is used', async () => {
    const inputFile = join(tempDir, 'input.html')
    writeFileSync(inputFile, '<html><body>Hello</body></html>', 'utf-8')

    await runArgs([
      '--input', inputFile,
      '-d',
    ])

    expect(buildMock).toHaveBeenCalledTimes(1)
    const config = buildMock.mock.calls[0][0]
    expect(config.logLevel).toBe('debug')
    expect(config.debug).toBe(true)
  })

  // ---------------------------------------------------------------------------
  // Extra args after --
  // ---------------------------------------------------------------------------

  it('passes extra args after -- into config', async () => {
    const inputFile = join(tempDir, 'input.html')
    writeFileSync(inputFile, '<html><body>Hello</body></html>', 'utf-8')

    await runArgs([
      '--input', inputFile,
      '--',
      '--sandbox',
      '--port', '4000',
      '--foo=bar',
    ])

    expect(buildMock).toHaveBeenCalledTimes(1)
    const config = buildMock.mock.calls[0][0]

    expect(config.sandbox).toBe(true)
    expect(config.port).toBe('4000')
    expect(config.foo).toBe('bar')
  })

  // ---------------------------------------------------------------------------
  // Deduplication
  // ---------------------------------------------------------------------------

  it('deduplicates identical static mappings', async () => {
    const inputFile = join(tempDir, 'input.html')

    mkdirSync(join(tempDir, 'js'))
    writeFileSync(join(tempDir, 'js', 'app.js'), '// js', 'utf-8')

    writeFileSync(
      inputFile,
      `
      <html>
        <head>
          <script src="./js/app.js"></script>
          <script src="./js/app.js"></script>
        </head>
        <body>Hello</body>
      </html>
      `,
      'utf-8'
    )

    await runArgs([
      '--input', inputFile,
      '--html',
    ])

    expect(buildMock).toHaveBeenCalledTimes(1)
    const config = buildMock.mock.calls[0][0]

    expect(config.static).toEqual({
      '/js/app.js': [resolve(tempDir, 'js/app.js')],
    })

    expect(warnSpy).not.toHaveBeenCalled()
  })

  // ---------------------------------------------------------------------------
  // Preview with static mappings
  // ---------------------------------------------------------------------------

  it('passes static mappings via configData in preview mode', async () => {
    const inputFile = join(tempDir, 'input.html')

    mkdirSync(join(tempDir, 'css'))
    writeFileSync(join(tempDir, 'css', 'site.css'), '/* css */', 'utf-8')

    writeFileSync(
      inputFile,
      `
      <html>
        <head>
          <link rel="stylesheet" href="./css/site.css">
        </head>
        <body>Hello</body>
      </html>
      `,
      'utf-8'
    )

    await runArgs([
      '--input', inputFile,
      '--html',
      '--preview',
    ])

    expect(previewMock).toHaveBeenCalledTimes(1)
    const config = previewMock.mock.calls[0][0]

    // static must be in configData, not top-level
    expect(config.configData.static).toEqual({
      '/css/site.css': [resolve(tempDir, 'css/site.css')],
    })
    expect(config.static).toBeUndefined()
    expect(config.openViewer).toBe(true)
    expect(config.enableStaticServe).toBe(true)

    expect(warnSpy).not.toHaveBeenCalled()
  })
})
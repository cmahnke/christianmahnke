import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'fs'
import { tmpdir } from 'os'
import { join, resolve } from 'path'

const buildMock = vi.fn(async () => {})
const previewMock = vi.fn(async () => {})

vi.mock('@vivliostyle/cli', () => ({
  build: buildMock,
  preview: previewMock,
}))

describe('vivliostyle-cli', () => {
  let tempDir: string
  let logSpy: ReturnType<typeof vi.spyOn>
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'vivliostyle-cli-test-'))
    buildMock.mockClear()
    previewMock.mockClear()
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    logSpy.mockRestore()
    errorSpy.mockRestore()
    rmSync(tempDir, { recursive: true, force: true })
    vi.resetModules()
  })

  it('calls build() in default build mode', async () => {
    const { run } = await import('../src/vivliostyle-cli')
    const inputFile = join(tempDir, 'input.html')

    writeFileSync(inputFile, '<html><head></head><body>Hello</body></html>', 'utf-8')

    await run([
      'node',
      'script',
      '--input',
      inputFile,
      '--output',
      join(tempDir, 'out.pdf'),
    ])

    expect(buildMock).toHaveBeenCalledTimes(1)
    expect(previewMock).not.toHaveBeenCalled()

    const config = buildMock.mock.calls[0][0]
    expect(config.input).toBe(resolve(inputFile))
    expect(config.output).toEqual([
      {
        path: resolve(join(tempDir, 'out.pdf')),
        format: 'pdf',
      },
    ])
  })

  it('calls preview() in preview mode', async () => {
    const { run } = await import('../src/vivliostyle-cli')
    const inputFile = join(tempDir, 'input.html')

    writeFileSync(inputFile, '<html><body>Hello</body></html>', 'utf-8')

    await run([
      'node',
      'script',
      '--input',
      inputFile,
      '--mode',
      'preview',
    ])

    expect(previewMock).toHaveBeenCalledTimes(1)
    expect(buildMock).not.toHaveBeenCalled()

    const config = previewMock.mock.calls[0][0]
    expect(config.input).toBe(resolve(inputFile))
  })

  it('calls preview() with --preview shortcut', async () => {
    const { run } = await import('../src/vivliostyle-cli')
    const inputFile = join(tempDir, 'input.html')

    writeFileSync(inputFile, '<html><body>Hello</body></html>', 'utf-8')

    await run([
      'node',
      'script',
      '--input',
      inputFile,
      '--preview',
    ])

    expect(previewMock).toHaveBeenCalledTimes(1)
    expect(buildMock).not.toHaveBeenCalled()
  })

  it('extracts link and script assets in --html mode and passes static mappings to build()', async () => {
    const { run } = await import('../src/vivliostyle-cli')
    const inputFile = join(tempDir, 'input.html')

    mkdirSync(join(tempDir, 'css'))
    mkdirSync(join(tempDir, 'js'))

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

    await run([
      'node',
      'script',
      '--input',
      inputFile,
      '--html',
    ])

    expect(buildMock).toHaveBeenCalledTimes(1)
    const config = buildMock.mock.calls[0][0]

    expect(config.static).toEqual({
      '/css/site.css': [resolve(tempDir, 'css/site.css')],
      '/js/app.js': [resolve(tempDir, 'js/app.js')],
    })
  })

  it('maps absolute asset URLs via --asset-base', async () => {
    const { run } = await import('../src/vivliostyle-cli')
    const inputFile = join(tempDir, 'input.html')

    mkdirSync(join(tempDir, 'css'))
    mkdirSync(join(tempDir, 'js'))

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

    await run([
      'node',
      'script',
      '--input',
      inputFile,
      '--html',
      '--asset-base',
      `http://localhost:1313/=${tempDir}`,
    ])

    expect(buildMock).toHaveBeenCalledTimes(1)
    const config = buildMock.mock.calls[0][0]

    expect(config.static).toEqual({
      '/css/site.css': [resolve(tempDir, 'css/site.css')],
      '/js/app.js': [resolve(tempDir, 'js/app.js')],
    })
  })

  it('ignores configured assets like /livereload.js', async () => {
    const { run } = await import('../src/vivliostyle-cli')
    const inputFile = join(tempDir, 'input.html')

    mkdirSync(join(tempDir, 'js'))

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

    await run([
      'node',
      'script',
      '--input',
      inputFile,
      '--html',
      '--ignore-asset',
      '/livereload.js',
    ])

    expect(buildMock).toHaveBeenCalledTimes(1)
    const config = buildMock.mock.calls[0][0]

    expect(config.static).toEqual({
      '/js/app.js': [resolve(tempDir, 'js/app.js')],
    })

    expect(config.static['/livereload.js']).toBeUndefined()
  })

  it('ignores mapped absolute assets like /livereload.js via --asset-base', async () => {
    const { run } = await import('../src/vivliostyle-cli')
    const inputFile = join(tempDir, 'input.html')

    mkdirSync(join(tempDir, 'js'))

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

    await run([
      'node',
      'script',
      '--input',
      inputFile,
      '--html',
      '--asset-base',
      `http://localhost:1313/=${tempDir}`,
      '--ignore-asset',
      '/livereload.js',
    ])

    expect(buildMock).toHaveBeenCalledTimes(1)
    const config = buildMock.mock.calls[0][0]

    expect(config.static).toEqual({
      '/js/app.js': [resolve(tempDir, 'js/app.js')],
    })
  })

  it('sets logLevel to debug when -d is used', async () => {
    const { run } = await import('../src/vivliostyle-cli')
    const inputFile = join(tempDir, 'input.html')

    writeFileSync(inputFile, '<html><body>Hello</body></html>', 'utf-8')

    await run([
      'node',
      'script',
      '--input',
      inputFile,
      '-d',
    ])

    expect(buildMock).toHaveBeenCalledTimes(1)
    const config = buildMock.mock.calls[0][0]
    expect(config.logLevel).toBe('debug')
    expect(config.debug).toBe(true)
  })

  it('passes extra args after -- into config', async () => {
    const { run } = await import('../src/vivliostyle-cli')
    const inputFile = join(tempDir, 'input.html')

    writeFileSync(inputFile, '<html><body>Hello</body></html>', 'utf-8')

    await run([
      'node',
      'script',
      '--input',
      inputFile,
      '--',
      '--sandbox',
      '--port',
      '4000',
      '--foo=bar',
    ])

    expect(buildMock).toHaveBeenCalledTimes(1)
    const config = buildMock.mock.calls[0][0]

    expect(config.sandbox).toBe(true)
    expect(config.port).toBe('4000')
    expect(config.foo).toBe('bar')
  })

  it('throws on invalid mode', async () => {
    const { run } = await import('../src/vivliostyle-cli')
    const inputFile = join(tempDir, 'input.html')

    writeFileSync(inputFile, '<html><body>Hello</body></html>', 'utf-8')

    await expect(
      run([
        'node',
        'script',
        '--input',
        inputFile,
        '--mode',
        'invalid',
      ])
    ).rejects.toThrow(/Invalid mode/)
  })

  it('throws on missing input file', async () => {
    const { run } = await import('../src/vivliostyle-cli')

    await expect(
      run([
        'node',
        'script',
        '--input',
        join(tempDir, 'does-not-exist.html'),
      ])
    ).rejects.toThrow(/Input file does not exist/)
  })

  it('deduplicates identical static mappings', async () => {
    const { run } = await import('../src/vivliostyle-cli')
    const inputFile = join(tempDir, 'input.html')

    mkdirSync(join(tempDir, 'js'))

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

    await run([
      'node',
      'script',
      '--input',
      inputFile,
      '--html',
    ])

    expect(buildMock).toHaveBeenCalledTimes(1)
    const config = buildMock.mock.calls[0][0]

    expect(config.static).toEqual({
      '/js/app.js': [resolve(tempDir, 'js/app.js')],
    })
  })
})
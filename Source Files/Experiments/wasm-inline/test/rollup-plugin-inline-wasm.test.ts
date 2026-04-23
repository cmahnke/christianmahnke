import { describe, it, expect } from 'vitest';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

import { inlineWasm } from '../src/rollup-plugin-inline-wasm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WASM_PATH = resolve(__dirname, '../node_modules/oxigraph/web_bg.wasm');
const IMPORTER_PATH = resolve(__dirname, '../src/rollup-plugin-inline-wasm.ts');

describe('inlineWasm Plugin', () => {
  // ── Metadaten ──────────────────────────────────────────────────────────────

  describe('Plugin-Metadaten', () => {
    it('hat den korrekten Plugin-Namen', async () => {
      const plugin = await inlineWasm();
      expect(plugin.name).toBe('inline-wasm');
    });

    it('gibt ein Objekt mit den erwarteten Hooks zurück', async () => {
      const plugin = await inlineWasm();
      expect(plugin.resolveId).toBeTypeOf('function');
      expect(plugin.load).toBeTypeOf('function');
      expect(plugin.transform).toBeTypeOf('function');
    });
  });

  // ── resolveId ─────────────────────────────────────────────────────────────

  describe('resolveId', () => {
    it('gibt null zurück für Nicht-WASM-Dateien', async () => {
      const plugin = await inlineWasm();
      expect(await (plugin.resolveId as Function)('module.js', undefined)).toBeNull();
      expect(await (plugin.resolveId as Function)('module.ts', undefined)).toBeNull();
      expect(await (plugin.resolveId as Function)('module.css', undefined)).toBeNull();
    });

    it('löst den Pfad relativ zum Importer auf', async () => {
      const plugin = await inlineWasm();
      const result = await (plugin.resolveId as Function)('web_bg.wasm', IMPORTER_PATH);
      expect(result).toBe(resolve(dirname(IMPORTER_PATH), 'web_bg.wasm'));
    });

    it('löst den Pfad absolut auf ohne Importer', async () => {
      const plugin = await inlineWasm();
      const result = await (plugin.resolveId as Function)('web_bg.wasm', undefined);
      expect(result).toBe(resolve('web_bg.wasm'));
    });

    it('behandelt verschachtelte relative Pfade korrekt', async () => {
      const plugin = await inlineWasm();
      const result = await (plugin.resolveId as Function)('../node_modules/oxigraph/web_bg.wasm', IMPORTER_PATH);
      expect(result).toBe(resolve(dirname(IMPORTER_PATH), '../node_modules/oxigraph/web_bg.wasm'));
    });
  });

  // ── load ──────────────────────────────────────────────────────────────────

  describe('load', () => {
    it('gibt null zurück für Nicht-WASM-Dateien', async () => {
      const plugin = await inlineWasm();
      expect(await (plugin.load as Function)('/path/to/file.js')).toBeNull();
      expect(await (plugin.load as Function)('/path/to/file.ts')).toBeNull();
    });

    it('liest und komprimiert die echte WASM-Datei', async () => {
      const plugin = await inlineWasm();
      const result = await (plugin.load as Function)(WASM_PATH);
      expect(result).toBeTypeOf('string');
    });

    it('generierter Code enthält die komprimierten Bytes als Array', async () => {
      const plugin = await inlineWasm();
      const result: string = await (plugin.load as Function)(WASM_PATH);
      expect(result).toMatch(/new Uint8Array$$[\d,]+$$/);
    });

    it('generierter Code enthält alle Exports', async () => {
      const plugin = await inlineWasm();
      const result: string = await (plugin.load as Function)(WASM_PATH);
      expect(result).toContain('export async function loadWasm');
      expect(result).toContain('export function getWasmBytes');
      expect(result).toContain('export default loadWasm');
    });

    it('generierter Code enthält die Quell-ID als Kommentar', async () => {
      const plugin = await inlineWasm();
      const result: string = await (plugin.load as Function)(WASM_PATH);
      expect(result).toContain(`Source: ${WASM_PATH}`);
    });

    it('generierter Code enthält brotli decompress', async () => {
      const plugin = await inlineWasm();
      const result: string = await (plugin.load as Function)(WASM_PATH);
      expect(result).toContain("import * as pkg from 'brotli-unicode'");
      expect(result).toContain('decompress');
    });

    it('dekomprimierte Bytes ergeben das originale WASM zurück', async () => {
      const plugin = await inlineWasm();
      const result: string = await (plugin.load as Function)(WASM_PATH);

      const match = result.match(/new Uint8Array$$([\d,]+)$$/);
      expect(match).not.toBeNull();

      const compressedBytes = new Uint8Array(match![1].split(',').map(Number));

      const { decompress } = (await import('brotli-unicode')) as any;
      const decompressed = decompress(compressedBytes);

      const { readFileSync } = await import('fs');
      const originalBytes = new Uint8Array(readFileSync(WASM_PATH));

      expect(decompressed).toEqual(originalBytes);
    });
  });

  // ── transform ─────────────────────────────────────────────────────────────

  describe('transform', () => {
    it('gibt null zurück für .wasm-Dateien', async () => {
      const plugin = await inlineWasm();
      const result = await (plugin.transform as Function)('', WASM_PATH);
      expect(result).toBeNull();
    });

    it('gibt null zurück wenn kein WASM URL Pattern vorhanden', async () => {
      const plugin = await inlineWasm();
      const code = `const x = new URL('./file.js', import.meta.url);`;
      const result = await (plugin.transform as Function)(code, IMPORTER_PATH);
      expect(result).toBeNull();
    });

    it('transformiert ein einzelnes WASM URL Pattern', async () => {
      const plugin = await inlineWasm();
      const code = `const url = new URL('./web_bg.wasm', import.meta.url);`;

      const result = await (plugin.transform as Function)(code, IMPORTER_PATH);

      expect(result).not.toBeNull();
      expect(result?.code).toContain('URL.createObjectURL');
      expect(result?.code).toContain("new Blob([__wasm_0()], { type: 'application/wasm' })");
    });

    it('fügt den korrekten Import für die WASM-Datei ein', async () => {
      const plugin = await inlineWasm();
      const code = `const url = new URL('./web_bg.wasm', import.meta.url);`;

      const result = await (plugin.transform as Function)(code, IMPORTER_PATH);

      const expectedPath = resolve(dirname(IMPORTER_PATH), './web_bg.wasm');
      expect(result?.code).toContain(
        `import { getWasmBytes as __wasm_0 } from '${expectedPath}'`
      );
    });

    it('transformiert mehrere WASM URL Patterns', async () => {
      const plugin = await inlineWasm();
      const code = [
        `const url1 = new URL('./web_bg.wasm', import.meta.url);`,
        `const url2 = new URL('../node_modules/oxigraph/web_bg.wasm', import.meta.url);`,
      ].join('\n');

      const result = await (plugin.transform as Function)(code, IMPORTER_PATH);

      const path1 = resolve(dirname(IMPORTER_PATH), './web_bg.wasm');
      const path2 = resolve(dirname(IMPORTER_PATH), '../node_modules/oxigraph/web_bg.wasm');

      expect(result?.code).toContain(`from '${path1}'`);
      expect(result?.code).toContain(`from '${path2}'`);
      expect(result?.code).toContain('__wasm_0');
      expect(result?.code).toContain('__wasm_1');
    });

    it('behält den restlichen Code unverändert', async () => {
      const plugin = await inlineWasm();
      const code = [
        `const x = 42;`,
        `const url = new URL('./web_bg.wasm', import.meta.url);`,
        `console.log(x);`,
      ].join('\n');

      const result = await (plugin.transform as Function)(code, IMPORTER_PATH);

      expect(result?.code).toContain('const x = 42;');
      expect(result?.code).toContain('console.log(x);');
    });

    it('gibt eine leere Source-Map zurück', async () => {
      const plugin = await inlineWasm();
      const code = `const url = new URL('./web_bg.wasm', import.meta.url);`;
      const result = await (plugin.transform as Function)(code, IMPORTER_PATH);
      expect(result?.map).toEqual({ mappings: '' });
    });

    it('ist idempotent bei wiederholten Aufrufen (lastIndex-Reset)', async () => {
      const plugin = await inlineWasm();
      const code = `const url = new URL('./web_bg.wasm', import.meta.url);`;

      const result1 = await (plugin.transform as Function)(code, IMPORTER_PATH);
      const result2 = await (plugin.transform as Function)(code, IMPORTER_PATH);

      expect(result1?.code).toBe(result2?.code);
    });
  });
});
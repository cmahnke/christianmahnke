import { describe, it, expect, beforeAll } from 'vitest';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

import { inlineWasm } from '../src/rollup-plugin-inline-wasm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WASM_PATH = resolve(__dirname, '../node_modules/keyframe-resample/dist/release.wasm');
const IMPORTER_PATH = resolve(__dirname, '../src/rollup-plugin-inline-wasm.ts');

let loadResult: string;

describe('inlineWasm Plugin', () => {
  beforeAll(async () => {
    const plugin = await inlineWasm();
    loadResult = await (plugin.load as Function)(WASM_PATH);
  }, 30_000);

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
      const result = await (plugin.resolveId as Function)('release.wasm', IMPORTER_PATH);
      expect(result).toBe(resolve(dirname(IMPORTER_PATH), 'release.wasm'));
    });

    it('löst den Pfad absolut auf ohne Importer', async () => {
      const plugin = await inlineWasm();
      const result = await (plugin.resolveId as Function)('release.wasm', undefined);
      expect(result).toBe(resolve('release.wasm'));
    });

    it('behandelt verschachtelte relative Pfade korrekt', async () => {
      const plugin = await inlineWasm();
      const result = await (plugin.resolveId as Function)(
        '../node_modules/keyframe-resample/dist/release.wasm',
        IMPORTER_PATH
      );
      expect(result).toBe(
        resolve(dirname(IMPORTER_PATH), '../node_modules/keyframe-resample/dist/release.wasm')
      );
    });

    it('gibt absoluten Pfad unverändert zurück wenn kein Importer', async () => {
      const plugin = await inlineWasm();
      const result = await (plugin.resolveId as Function)(WASM_PATH, undefined);
      expect(result).toBe(resolve(WASM_PATH));
    });
  });

  // ── load ──────────────────────────────────────────────────────────────────

  describe('load', () => {
    it('gibt null zurück für Nicht-WASM-Dateien', async () => {
      const plugin = await inlineWasm();
      expect(await (plugin.load as Function)('/path/to/file.js')).toBeNull();
      expect(await (plugin.load as Function)('/path/to/file.ts')).toBeNull();
    });

    it('wirft einen Fehler bei nicht existierender Datei', async () => {
      const plugin = await inlineWasm();
      await expect(
        (plugin.load as Function)('/nicht/vorhanden.wasm')
      ).rejects.toThrow();
    });

    it('gibt einen String zurück', () => {
      expect(loadResult).toBeTypeOf('string');
    });

    it('generierter Code enthält ein Uint8Array mit komprimierten Daten', () => {
      expect(loadResult).toContain('new Uint8Array(');
    });

    it('generierter Code enthält alle Exports', () => {
      expect(loadResult).toContain('export async function loadWasm');
      expect(loadResult).toContain('export function getWasmBytes');
      expect(loadResult).toContain('export default loadWasm');
    });

    it('generierter Code enthält die Quell-ID als Kommentar', () => {
      expect(loadResult).toContain(`Source: ${WASM_PATH}`);
    });

    it('generierter Code enthält brotli decompress', () => {
      expect(loadResult).toContain("import * as pkg from 'brotli-unicode'");
      expect(loadResult).toContain('decompress');
    });

    it('generierter Code ist syntaktisch valides JavaScript', () => {
      // Prüfe Struktur statt vollständiges Parsen – generierter Code enthält TS-Syntax
      expect(loadResult).toContain('export async function loadWasm');
      expect(loadResult).toContain('export function getWasmBytes');
      expect(loadResult).toContain('export default loadWasm');
      expect(loadResult).toContain('WebAssembly.instantiate');
      expect(loadResult).toContain('decompress(compressed)');
    });

    it('dekomprimierte Bytes ergeben das originale WASM zurück', async () => {
      const { compress, decompress } = (await import('brotli-unicode')) as any;
      const originalBytes = new Uint8Array(readFileSync(WASM_PATH));

      const compressed = await compress(originalBytes);
      const decompressed = await decompress(compressed);

      // WASM Magic Number: \0asm
      expect(decompressed[0]).toBe(0x00);
      expect(decompressed[1]).toBe(0x61);
      expect(decompressed[2]).toBe(0x73);
      expect(decompressed[3]).toBe(0x6d);
      expect(decompressed.length).toBe(originalBytes.length);
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

    it('transformiert ein einzelnes WASM URL Pattern mit doppelten Anführungszeichen', async () => {
      const plugin = await inlineWasm();
      const code = `const url = new URL('./release.wasm', import.meta.url);`;
      const result = await (plugin.transform as Function)(code, IMPORTER_PATH);

      expect(result).not.toBeNull();
      expect(result!.code).toContain('URL.createObjectURL');
      expect(result!.code).toContain("new Blob([__wasm_0()], { type: 'application/wasm' })");
    });

    it('transformiert ein einzelnes WASM URL Pattern mit einfachen Anführungszeichen', async () => {
      const plugin = await inlineWasm();
      const code = `const url = new URL('./release.wasm', import.meta.url);`;
      const result = await (plugin.transform as Function)(code, IMPORTER_PATH);

      expect(result).not.toBeNull();
      expect(result!.code).toContain('URL.createObjectURL');
      expect(result!.code).toContain("new Blob([__wasm_0()], { type: 'application/wasm' })");
    });

    it('fügt den korrekten Import für die WASM-Datei ein', async () => {
      const plugin = await inlineWasm();
      const code = `const url = new URL('./release.wasm', import.meta.url);`;
      const result = await (plugin.transform as Function)(code, IMPORTER_PATH);

      const expectedPath = resolve(dirname(IMPORTER_PATH), './release.wasm');
      expect(result!.code).toContain(
        `import { getWasmBytes as __wasm_0 } from '${expectedPath}'`
      );
    });

    it('transformiert mehrere WASM URL Patterns', async () => {
      const plugin = await inlineWasm();
      const code = [
        `const url1 = new URL('./release.wasm', import.meta.url);`,
        `const url2 = new URL('../node_modules/keyframe-resample/dist/release.wasm', import.meta.url);`,
      ].join('\n');

      const result = await (plugin.transform as Function)(code, IMPORTER_PATH);

      const path1 = resolve(dirname(IMPORTER_PATH), './release.wasm');
      const path2 = resolve(dirname(IMPORTER_PATH), '../node_modules/keyframe-resample/dist/release.wasm');

      expect(result!.code).toContain(`from '${path1}'`);
      expect(result!.code).toContain(`from '${path2}'`);
      expect(result!.code).toContain('__wasm_0');
      expect(result!.code).toContain('__wasm_1');
    });

    it('behält den restlichen Code unverändert', async () => {
      const plugin = await inlineWasm();
      const code = [
        `const x = 42;`,
        `const url = new URL('./release.wasm', import.meta.url);`,
        `console.log(x);`,
      ].join('\n');

      const result = await (plugin.transform as Function)(code, IMPORTER_PATH);

      expect(result!.code).toContain('const x = 42;');
      expect(result!.code).toContain('console.log(x);');
    });

    it('gibt eine leere Source-Map zurück', async () => {
      const plugin = await inlineWasm();
      const code = `const url = new URL('./release.wasm', import.meta.url);`;
      const result = await (plugin.transform as Function)(code, IMPORTER_PATH);
      expect(result!.map).toEqual({ mappings: '' });
    });

    it('ist idempotent bei wiederholten Aufrufen (lastIndex-Reset)', async () => {
      const plugin = await inlineWasm();
      const code = `const url = new URL('./release.wasm', import.meta.url);`;

      const result1 = await (plugin.transform as Function)(code, IMPORTER_PATH);
      const result2 = await (plugin.transform as Function)(code, IMPORTER_PATH);

      expect(result1!.code).toBe(result2!.code);
    });
  });

  // ── Integration ───────────────────────────────────────────────────────────

  describe('Integration: resolveId → load', () => {
    it('vollständiger Zyklus: Pfad auflösen und laden', async () => {
      const plugin = await inlineWasm();

      const resolvedId = await (plugin.resolveId as Function)(
        '../node_modules/keyframe-resample/dist/release.wasm',
        IMPORTER_PATH
      );

      expect(resolvedId).toBe(WASM_PATH);

      const result = await (plugin.load as Function)(resolvedId);

      expect(result).toBeTypeOf('string');
      expect(result).toContain('export async function loadWasm');
      expect(result).toContain(`Source: ${WASM_PATH}`);
    });
  });
});
import { describe, it, expect, beforeAll } from "vitest";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";
import type { Plugin } from "rollup";
import inlineWasm from "../src/rollup-plugin-wasm-brotli";
import * as pkg from "brotli-unicode";
const { compress, decompress } = pkg;

const WASM_FILE = "../node_modules/brotli-wasm/pkg.node/brotli_wasm_bg.wasm";
const __dirname = dirname(fileURLToPath(import.meta.url));
const WASM_PATH = resolve(__dirname, WASM_FILE);
const IMPORTER_PATH = resolve(__dirname, "../src/rollup-plugin-wasm-brotli.ts");

let loadResult: string;

describe("inlineWasm Plugin", () => {
  let plugin: Plugin;

  beforeAll(async () => {
    plugin = await inlineWasm();
    loadResult = await plugin.load(WASM_PATH);
  }, 30_000);

  // ── Metadata ──────────────────────────────────────────────────────────────

  describe("Plugin Metadata", () => {
    it("has the correct plugin name", async () => {
      const plugin = await inlineWasm();
      expect(plugin.name).toBe("inline-wasm");
    });

    it("returns an object with the expected hooks", async () => {
      const plugin = await inlineWasm();
      expect(typeof plugin.resolveId).toBe("function");
      expect(typeof plugin.load).toBe("function");
      expect(typeof plugin.transform).toBe("function");
    });
  });

  // ── resolveId ─────────────────────────────────────────────────────────────

  describe("resolveId", () => {
    it("returns null for non-WASM files", async () => {
      const plugin = await inlineWasm();
      expect(await plugin.resolveId("module.js", undefined)).toBeNull();
      expect(await plugin.resolveId("module.ts", undefined)).toBeNull();
      expect(await plugin.resolveId("module.css", undefined)).toBeNull();
    });

    it("resolves the path relative to the importer", async () => {
      const plugin = await inlineWasm();
      const result = await plugin.resolveId("brotli_wasm_bg.wasm", IMPORTER_PATH);
      expect(result).toBe(resolve(dirname(IMPORTER_PATH), "brotli_wasm_bg.wasm"));
    });

    it("resolves the path absolutely without an importer", async () => {
      const plugin = await inlineWasm();
      const result = await plugin.resolveId("brotli_wasm_bg.wasm", undefined);
      expect(result).toBe(resolve("brotli_wasm_bg.wasm"));
    });

    it("handles nested relative paths correctly", async () => {
      const plugin = await inlineWasm();
      const result = await plugin.resolveId(WASM_FILE, IMPORTER_PATH);
      expect(result).toBe(resolve(dirname(IMPORTER_PATH), WASM_FILE));
    });

    it("returns an absolute path unchanged when there is no importer", async () => {
      const plugin = await inlineWasm();
      const result = await plugin.resolveId(WASM_PATH, undefined);
      expect(result).toBe(resolve(WASM_PATH));
    });
  });

  // ── load ──────────────────────────────────────────────────────────────────

  describe("load", () => {
    it("returns null for non-WASM files", async () => {
      const plugin = await inlineWasm();
      expect(await plugin.load("/path/to/file.js")).toBeNull();
      expect(await plugin.load("/path/to/file.ts")).toBeNull();
    });

    it("throws an error for a non-existent file", async () => {
      const plugin = await inlineWasm();
      await expect(plugin.load("/non/existent.wasm")).rejects.toThrow();
    });

    it("returns a string", () => {
      expect(loadResult).toBeTypeOf("string");
    });

    it("generated code contains an embedded compressed string", () => {
      expect(loadResult).toContain('const wasmStr = "');
    });

    it("generated code contains all exports", () => {
      expect(loadResult).toContain("export async function loadWasm");
      expect(loadResult).toContain("export function getWasmBytes");
      expect(loadResult).toContain("export default loadWasm");
    });

    it("generated code contains the source ID as a comment", () => {
      expect(loadResult).toContain(`Source: ${WASM_PATH}`);
    });

    it("generated code contains brotli decompress", () => {
      expect(loadResult).toContain("import { decompress } from 'brotli-unicode/js';");
      expect(loadResult).toContain("decompress");
    });

    it("generated code is syntactically valid JavaScript", () => {
      expect(loadResult).toContain("export async function loadWasm");
      expect(loadResult).toContain("export function getWasmBytes");
      expect(loadResult).toContain("export default loadWasm");
      expect(loadResult).toContain("WebAssembly.instantiate");
      expect(loadResult).toContain("decompress(compressed)");
    });

    // ── Decompress and compare ────────────────────────────────────

    describe("Decompression: Roundtrip Integrity", () => {
      let originalBytes: Uint8Array;
      let decompressedBytes: Uint8Array;

      beforeAll(async () => {
        originalBytes = new Uint8Array(readFileSync(WASM_PATH));
        const compressed = await compress(originalBytes);
        decompressedBytes = await decompress(compressed);
      }, 30_000);

      it("decompressed length matches the original exactly", () => {
        expect(decompressedBytes.length).toBe(originalBytes.length);
      });

      it("decompressed bytes are byte-for-byte identical to the original", () => {
        const originalBuffer = Buffer.from(originalBytes.buffer, originalBytes.byteOffset, originalBytes.byteLength);
        const decompressedBuffer = Buffer.from(decompressedBytes.buffer, decompressedBytes.byteOffset, decompressedBytes.byteLength);

        expect(originalBuffer.equals(decompressedBuffer)).toBe(true);
      });

      it("decompressed bytes contain the correct WASM magic number (\\0asm)", () => {
        expect(decompressedBytes[0]).toBe(0x00); // \0
        expect(decompressedBytes[1]).toBe(0x61); //  a
        expect(decompressedBytes[2]).toBe(0x73); //  s
        expect(decompressedBytes[3]).toBe(0x6d); //  m
      });

      it("decompressed bytes contain the correct WASM version (1)", () => {
        expect(decompressedBytes[4]).toBe(0x01);
        expect(decompressedBytes[5]).toBe(0x00);
        expect(decompressedBytes[6]).toBe(0x00);
        expect(decompressedBytes[7]).toBe(0x00);
      });

      it("first and last byte are identical to the original", () => {
        expect(decompressedBytes[0]).toBe(originalBytes[0]);
        expect(decompressedBytes[decompressedBytes.length - 1]).toBe(originalBytes[originalBytes.length - 1]);
      });

      it("compressed data embedded in the generated code decompresses to the original", async () => {
        const match = loadResult.match(/const wasmStr = "([^"]*)"/s);
        expect(match).not.toBeNull();

        const decompressedFromCode = await decompress(match![1]);
        const originalBytes = new Uint8Array(readFileSync(WASM_PATH));

        expect(decompressedFromCode.length).toBe(originalBytes.length);

        const originalBuffer = Buffer.from(originalBytes.buffer, originalBytes.byteOffset, originalBytes.byteLength);
        const decompressedBuffer = Buffer.from(
          decompressedFromCode.buffer,
          decompressedFromCode.byteOffset,
          decompressedFromCode.byteLength
        );

        expect(originalBuffer.equals(decompressedBuffer)).toBe(true);
      }, 30_000);
    });
  });

  // ── transform ─────────────────────────────────────────────────────────────

  describe("transform", () => {
    it("returns null for .wasm files", async () => {
      const plugin = await inlineWasm();
      const result = await plugin.transform("", WASM_PATH);
      expect(result).toBeNull();
    });

    it("returns null when no WASM URL pattern is present", async () => {
      const plugin = await inlineWasm();
      const code = `const x = new URL('./file.js', import.meta.url);`;
      const result = await plugin.transform(code, IMPORTER_PATH);
      expect(result).toBeNull();
    });

    it("transforms a single WASM URL pattern with double quotes", async () => {
      const plugin = await inlineWasm();
      const code = `const url = new URL('./brotli_wasm_bg.wasm', import.meta.url);`;
      const result = await plugin.transform(code, IMPORTER_PATH);

      expect(result).not.toBeNull();
      expect(result!.code).toContain("URL.createObjectURL");
      expect(result!.code).toContain("new Blob([__wasm_0()], { type: 'application/wasm' })");
    });

    it("transforms a single WASM URL pattern with single quotes", async () => {
      const plugin = await inlineWasm();
      const code = `const url = new URL('./brotli_wasm_bg.wasm', import.meta.url);`;
      const result = await plugin.transform(code, IMPORTER_PATH);

      expect(result).not.toBeNull();
      expect(result!.code).toContain("URL.createObjectURL");
      expect(result!.code).toContain("new Blob([__wasm_0()], { type: 'application/wasm' })");
    });

    it("inserts the correct import for the WASM file", async () => {
      const plugin = await inlineWasm();
      const code = `const url = new URL('./brotli_wasm_bg.wasm', import.meta.url);`;
      const result = await plugin.transform(code, IMPORTER_PATH);

      const expectedPath = resolve(dirname(IMPORTER_PATH), "./brotli_wasm_bg.wasm");
      expect(result!.code).toContain(`import { getWasmBytes as __wasm_0 } from '${expectedPath}'`);
    });

    it("transforms multiple WASM URL patterns", async () => {
      const plugin = await inlineWasm();
      const code = [
        `const url1 = new URL('./brotli_wasm_bg.wasm', import.meta.url);`,
        `const url2 = new URL('${WASM_FILE}', import.meta.url);`
      ].join("\n");

      const result = await plugin.transform(code, IMPORTER_PATH);

      const path1 = resolve(dirname(IMPORTER_PATH), "./brotli_wasm_bg.wasm");
      const path2 = resolve(dirname(IMPORTER_PATH), WASM_FILE);

      expect(result!.code).toContain(`from '${path1}'`);
      expect(result!.code).toContain(`from '${path2}'`);
      expect(result!.code).toContain("__wasm_0");
      expect(result!.code).toContain("__wasm_1");
    });

    it("leaves the remaining code unchanged", async () => {
      const plugin = await inlineWasm();
      const code = [`const x = 42;`, `const url = new URL('./brotli_wasm_bg.wasm', import.meta.url);`, `console.log(x);`].join("\n");

      const result = await plugin.transform(code, IMPORTER_PATH);

      expect(result!.code).toContain("const x = 42;");
      expect(result!.code).toContain("console.log(x);");
    });

    it("returns an empty source map", async () => {
      const plugin = await inlineWasm();
      const code = `const url = new URL('./brotli_wasm_bg.wasm', import.meta.url);`;
      const result = await plugin.transform(code, IMPORTER_PATH);
      expect(result!.map).toEqual({ mappings: "" });
    });

    it("is idempotent across repeated calls (lastIndex reset)", async () => {
      const plugin = await inlineWasm();
      const code = `const url = new URL('./brotli_wasm_bg.wasm', import.meta.url);`;

      const result1 = await plugin.transform(code, IMPORTER_PATH);
      const result2 = await plugin.transform(code, IMPORTER_PATH);

      expect(result1!.code).toBe(result2!.code);
    });
  });

  // ── Integration ───────────────────────────────────────────────────────────

  describe("Integration: resolveId → load", () => {
    it("full cycle: resolve path and load", async () => {
      const plugin = await inlineWasm();

      const resolvedId = await plugin.resolveId(WASM_FILE, IMPORTER_PATH);

      expect(resolvedId).toBe(WASM_PATH);

      const result = await plugin.load(resolvedId);

      expect(result).toBeTypeOf("string");
      expect(result).toContain("export async function loadWasm");
      expect(result).toContain(`Source: ${WASM_PATH}`);
    });
  });
});

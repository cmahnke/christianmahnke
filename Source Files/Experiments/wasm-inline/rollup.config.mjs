import nodeResolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";

const configs = [
  {
    input: "src/rollup-plugin-inline-wasm.ts",
    output: {
      file: "dist/rollup-plugin-inline-wasm.mjs",
      format: "es"
    },

    plugins: [
      nodeResolve(),
      commonjs(),
      typescript({
        tsconfig: "./tsconfig.json",
        compilerOptions: {
          outDir: "dist"
        }
      })
    ]
  },
  {
    input: "src/compress.ts",
    output: {
      file: "dist/compress.mjs",
      format: "es"
    },

    plugins: [
      nodeResolve(),
      commonjs(),
      typescript({
        tsconfig: "./tsconfig.json",
        compilerOptions: {
          outDir: "dist"
        }
      })
    ]
  }
];

export default configs;

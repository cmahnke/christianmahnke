import nodeResolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

const configs = [
  {
    input: "src/rollup-plugin-inline-wasm.ts",
    output: {
      file: "dist/rollup-plugin-inline-wasm.js",
      format: "es",
      name: "version"
    },
  
    plugins: [
      nodeResolve(),
      typescript({
       tsconfig: './tsconfig.json',
        compilerOptions: {
          outDir: 'dist'
        }
      })
    ]
  },
    {
    input: "src/compress.ts",
    output: {
      file: "dist/compress.js",
      format: "es",
      name: "version"
    },
  
    plugins: [
      nodeResolve(),
      typescript({
       tsconfig: './tsconfig.json',
        compilerOptions: {
          outDir: 'dist'
        }
      })
    ]
  }
];

export default configs;
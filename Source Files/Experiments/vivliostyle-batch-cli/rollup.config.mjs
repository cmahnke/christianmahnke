import nodeResolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import { dts } from "rollup-plugin-dts";

const configs = [
  {
    input: "src/vivliostyle-cli.ts",
    output: {
      file: "dist/vivliostyle-cli.js",
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
    input: "src/vivliostyle-cli.ts",
    output: {
      file: "dist/index.d.ts",
      format: "es"
    },
    plugins: [dts()]
  }
];

export default configs;

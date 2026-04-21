import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import wasm from '@rollup/plugin-wasm';
import sassPlugin from 'rollup-plugin-sass';
import * as sass from 'sass';
import commonjs from '@rollup/plugin-commonjs';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const fontURLPath = "/fonts/";

const configs = [ 
  {
    input: 'wikidata-hdt/assets/ts/sparql/client-sparql.ts',
    output: {
      dir: 'wikidata-hdt/dist',
      format: 'esm',
      sourcemap: true,
      chunkFileNames: '[name]-[hash].js'
    },
    plugins: [
      wasm({
        targetEnv: 'browser',
        include: ['**/hdt_bg.wasm', '**/web_bg.wasm'],
        fileName: '[name][extname]',
        publicPath: './',
        maxFileSize: 0
      }),
      nodeResolve({
        browser: true,
        preferBuiltins: false,
        extensions: ['.ts', '.js', '.wasm']
      }),
      sassPlugin({ 
        api: 'modern',
        options: {
          importers: [new sass.NodePackageImporter()],
        },
        output: (styles) => {
          if (!styles) return;
          const replacedStyles = styles.replace(/@fontsource-variable\/.*?\/files\//g, fontURLPath)
          const outputPath = 'wikidata-hdt/dist/client-sparql.scss';
          mkdirSync(dirname(outputPath), { recursive: true });
          writeFileSync(outputPath, replacedStyles);
        }
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        compilerOptions: {
          outDir: 'wikidata-hdt/dist'
        }
      }),
    ]
  },

  {
    input: 'wikidata-hdt/assets/ts/viz/graph-viz.ts',
    output: {
      dir: 'wikidata-hdt/dist',
      format: 'esm',
      sourcemap: true,
      chunkFileNames: '[name]-[hash].js'
    },
    plugins: [
      wasm({
        targetEnv: 'browser',
        include: ['**/hdt_bg.wasm', '**/web_bg.wasm'],
        fileName: '[name][extname]',
        publicPath: './',
        maxFileSize: 0
      }),
      nodeResolve({
        browser: true,
        preferBuiltins: false,
        extensions: ['.ts', '.js', '.wasm']
      }),
      sassPlugin({ 
        api: 'modern',
        options: {
          importers: [new sass.NodePackageImporter()],
        },
        output: (styles) => {
          if (!styles) return;
          const replacedStyles = styles.replace(/@fontsource-variable\/.*?\/files\//g, fontURLPath)
          const outputPath = 'wikidata-hdt/dist/graph-viz.scss';
          mkdirSync(dirname(outputPath), { recursive: true });
          writeFileSync(outputPath, replacedStyles);
        }
      }),

      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        compilerOptions: {
          outDir: 'wikidata-hdt/dist'
        }
      }),
    ]
  }
];

export default configs;
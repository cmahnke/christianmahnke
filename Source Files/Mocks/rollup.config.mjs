import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import wasm from '@rollup/plugin-wasm';

const configs = [ 
  {
    input: 'wikidata-hdt/assets/ts/sparql/oxigraph-sparql.ts',
    external: (id) => id === 'hdt' || id.includes('node_modules/hdt'),
    output: {
      dir: 'wikidata-hdt/dist',
      format: 'esm',
      sourcemap: true,
      chunkFileNames: '[name]-[hash].js'
    },
    plugins: [
      wasm({
        sync: ['**/*.wasm']
      }),
      nodeResolve({
        browser: true,
        preferBuiltins: false,
        extensions: ['.ts', '.js', '.wasm']
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        compilerOptions: {
          outDir: 'wikidata-hdt/dist'
        }
      })
    ]
  },

  {
    input: 'wikidata-hdt/assets/ts/viz/graph-viz.ts',
    external: (id) => id === 'hdt' || id.includes('node_modules/hdt'),
    output: {
      dir: 'wikidata-hdt/dist',
      format: 'esm',
      sourcemap: true,
      chunkFileNames: '[name]-[hash].js'
    },
    plugins: [
      wasm({
        sync: ['**/*.wasm']
      }),
      nodeResolve({
        browser: true,
        preferBuiltins: false,
        extensions: ['.ts', '.js', '.wasm']
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
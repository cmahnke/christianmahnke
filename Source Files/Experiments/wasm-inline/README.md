

```javascript
// rollup.config.ts
import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import nodeResolve from '@rollup/plugin-node-resolve';
import { inlineWasm } from './rollup-plugin-inline-wasm';

export default defineConfig({
  input: 'src/index.ts',
  output: {
    file: 'dist/bundle.js',
    format: 'esm',
  },
  plugins: [
    nodeResolve({
      extensions: ['.js', '.ts', '.wasm'], // ← .wasm explizit erlauben
    }),
    await inlineWasm(),
    typescript(),
  ],
}); 
```
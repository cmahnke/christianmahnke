import { resolve, join } from "path";
import { defineConfig } from "vite";
import eslint from "vite-plugin-eslint";
import { viteSingleFile } from "vite-plugin-singlefile";
import stylelint from "vite-plugin-stylelint";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import {DynamicPublicDirectory} from "vite-multiple-assets";
//import { checker } from "vite-plugin-checker";

const mimeTypes = { ".glb": "model/gltf-binary" };

// https://vitejs.dev/config/
export default defineConfig({
  server: {"host": "127.0.0.1"},
  base: "./",
  plugins: [
    nodePolyfills(),
    {
      apply: "build",
    },
    stylelint({ build: true, dev: false, lintOnStart: true }),
    DynamicPublicDirectory(["webgpu/public", "hdr-canvas/public", "touch/public", "imagecompare/public", "node_modules/openseadragon/build/openseadragon"], {
      ssr: false,
      mimeTypes,
    }),
    //checker({ typescript: false })
  ],
  build: {
    //target: 'esnext',
    target: "es2020",
    commonjsOptions: { transformMixedEsModules: true },
    rollupOptions: {
      input: {
        main: resolve(__dirname, "webgpu/index.html"),
        canvas: resolve(__dirname, "hdr-canvas/index.html"),
        touch: resolve(__dirname, "touch/index.html"),
        imagecompare: resolve(__dirname, "imagecompare/index.html"),
      },
      output: {
        assetFileNames: `assets/[name].[ext]`,
      },
    },
  },
  resolve: {
    preserveSymlinks: true,
    alias: [
      {
        find: /~(.+)/,
        replacement: join(process.cwd(), "node_modules/$1"),
      },
/*
      {
        find:'three/examples/jsm',
        replacement:'three/examples/jsm',
      },
      {
        find:'three/addons',
        replacement: 'three/examples/jsm',
      },
      {
        find:'three/tsl',
        replacement: 'three/webgpu',
      },
      {
        find:'three',
        replacement: 'three/webgpu',
      }
      */
    ],
  },
  optimizeDeps: {
    exclude: ["@monogrid/gainmap-js/libultrahdr", "three"],
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler'
      }
    }
  }
});

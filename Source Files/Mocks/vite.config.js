import { resolve, join } from "path";
import { defineConfig } from "vite";
import eslint from "vite-plugin-eslint";
import { viteSingleFile } from "vite-plugin-singlefile";
import stylelint from "vite-plugin-stylelint";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { DynamicPublicDirectory } from "vite-multiple-assets";
//import { checker } from "vite-plugin-checker";
import { NodePackageImporter } from "sass";
import { gitSymlinkResolverPlugin } from "./plugins/git-symlink-plugin.js";

const mimeTypes = { ".glb": "model/gltf-binary" };

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "127.0.0.1",
    appType: 'custom',
    proxy: {
      "/meta": {
        target: "https://christianmahnke.de",
        changeOrigin: true,
        secure: true,
        ws: false,
        configure: (proxy, _options) => {
          proxy.on("error", (err, _req, _res) => {
            console.log("proxy error", err);
          });
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            console.log("Sending Request to the Target:", req.method, req.url);
          });
          proxy.on("proxyRes", (proxyRes, req, _res) => {
            console.log("Received Response from the Target:", proxyRes.statusCode, req.url);
          });
        }
      }
    }
  },
  base: "./",
  plugins: [
    nodePolyfills(),
    {
      apply: "build"
    },
    stylelint({ build: true, dev: false, lintOnStart: true }),
    DynamicPublicDirectory(
      ["webgpu/public/**", "hdr-canvas/public/**", "game/public/**", "touch/public/**", "imagecompare/public/**", "node_modules/openseadragon/build/openseadragon"],
      {
        ssr: false,
        mimeTypes
      }
    ),
    process.platform === "win32" ? gitSymlinkResolverPlugin() : null
    //checker({ typescript: false })
  ],
  publicDir: false,
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
        //search: resolve(__dirname, "search/index.html"),
        "tag-ring": resolve(__dirname, "tag-ring/index.html"),
        wikidata: resolve(__dirname, "wikidata/index.html"),
        game: resolve(__dirname, "game/index.html")
      },
      output: {
        assetFileNames: `assets/[name].[ext]`
      }
    }
  },
  resolve: {
    preserveSymlinks: true,
    alias: [
      {
        find: /~(.+)/,
        replacement: join(process.cwd(), "node_modules/$1")
      }
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
    ]
  },
  optimizeDeps: {
    exclude: ["@monogrid/gainmap-js/libultrahdr", "three"]
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler",
        importers: [new NodePackageImporter()]
      }
    }
  }
});

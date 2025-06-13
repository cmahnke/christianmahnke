---
date: 2025-06-13T16:02:44+02:00
title: "Vite und Git Symlink-Dateien"
tags:
  - JavaScript
---
Today, Friday the 13th, I was stuck on the train in the middle of nowhere...
<!--more-->

... and since I only had a Windows laptop with me, some prototypes that I work on from time to time in such situations didn't work. The background is that I usually add shared files as symlinks in the same Git repository to the respective source code directories.

This works fine under MacOS or Linux, of course, but if you simply check out a tree under Windows, the symlinks simply become normal files that contain the link target as a relative path. Since the network is poor / slow on the train, I have made a small [Vite](https://vite.dev/)/[Rollup](https://rollupjs.org/) plugin that can analyse these files and load the necessary file.


```javascript
import path from "node:path";
import fs from "node:fs/promises";

/**
 * A Vite plugin that resolves file content based on the first line.
 * This is a common case in repositories created on MacOS or Linux using symlinks.
 * When those get checked out under Windows, these symlinks are checked out as regular
 * files, just containig the target path of the original symlink. This plugin checks each import
 * if it contains a valid path on the first line load that instead transparently.
 * Otherwise, it loads the content of the original file.
 */
export function gitSymlinkResolverPlugin() {
  const supportedExtensions = [".js", ".jsx", ".ts", ".tsx", ".css", ".scss", ".less"];

  return {
    name: "vite-plugin-git-symlink-resolver",
    enforce: "pre",

    async resolveId(source, importer, options) {
      if (!importer || source.startsWith("\0") || source.includes("node_modules")) {
        return null;
      }
      const importedFilePath = path.resolve(path.dirname(importer), source);
      const ext = path.extname(importedFilePath);
      if (!supportedExtensions.includes(ext)) {
        return null;
      }
      return `\0git-symlink-resolver:${importedFilePath}`;
    },

    async load(id) {
      if (id.startsWith("\0git-symlink-resolver:")) {
        const originalFilePath = id.replace("\0git-symlink-resolver:", "");

        try {
          const originalFileContent = await fs.readFile(originalFilePath, "utf-8");
          const firstLine = originalFileContent.split("\n")[0]?.trim();

          if (firstLine) {
            const potentialRedirectPath = path.resolve(path.dirname(originalFilePath), firstLine);

            try {
              const stats = await fs.stat(potentialRedirectPath);
              if (stats.isFile()) {
                console.log(
                  `[GitSymlinkResolver] Redirecting ${path.relative(process.cwd(), originalFilePath)} to ${path.relative(process.cwd(), potentialRedirectPath)}`
                );
                return await fs.readFile(potentialRedirectPath, "utf-8");
              }
            } catch (e) {
              console.log(`[GitSymlinkResolver] File ${originalFilePath} isn't a redirect`, e);
            }
          }
          return originalFileContent;
        } catch (error) {
          console.error(`[GitSymlinkResolver] Error reading original file ${path.relative(process.cwd(), originalFilePath)}:`, error);
          return null;
        }
      }

      return null;
    }
  };
}
```

This can then simply be loaded in [`vite.config.js`](https://vite.dev/config/):

```javascript
import { gitSymlinkResolverPlugin } from "./plugins/git-symlink-plugin.js";
```

and used:

```javascript
plugins: [
  ...
  gitSymlinkResolverPlugin(),
  ...
],
```

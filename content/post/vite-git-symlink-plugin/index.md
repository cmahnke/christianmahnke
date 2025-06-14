---
date: 2025-06-13T16:02:44+02:00
title: "Vite und Git Symlink-Dateien"
tags:
  - JavaScript
wikidata:
  - https://www.wikidata.org/wiki/Q186055
---
Heute, am Freitag dem 13. sass ich länger in der Pampa im Zug fest...
<!--more-->

... und da ich nur ein Windows Laptop dabei hatte, gingen einige Prototypen, an denen ich ab und zu in solchen Situationen arbeite, nicht. Hintergrund, ist, dass ich gemeinsam genutzte Dateien in der Regel als Symlink im selben Git Repository zu den jeweiligen Quellcode-Verzeichnissen hinzufüge.

Das funktioniert unter MacOS oder Linux natürlich problemlos, aber wenn man einen Baum einfach unter Windows auscheckt, werden aus den Symlinks einfach normale Dateien, die das Linkziel als relativen Pfad enthalten. Da im Zug das Netz schlecht / langsam ist, habe ich ein kleines [Vite](https://vite.dev/)/[Rollup](https://rollupjs.org/) Plugin gebastelt, dass diese Dateien auswerten kann und die notwendige Datei lädt.


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

Dies kann dan einfach in [`vite.config.js`](https://vite.dev/config/) geladen:

```
import { gitSymlinkResolverPlugin } from "./plugins/git-symlink-plugin.js";
```

und genutzt werden:

```
plugins: [
  ...
  gitSymlinkResolverPlugin(),
  ...
],
```

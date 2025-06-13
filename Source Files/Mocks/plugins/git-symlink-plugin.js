import path from 'node:path';
import fs from 'node:fs/promises';

/**
 * A Vite plugin that resolves file content based on the first line.
 * This is a common case in repositories created on MacOS or Linux using symlinks.
 * When those get checked out under Windows, these symlinks are checked out as regular
 * files, just containig the target path of the original symlink. This plugin checks each import
 * if it contains a valid path on the first line load that instead transparently.
 * Otherwise, it loads the content of the original file.
 */
export function gitSymlinkResolverPlugin() {
  const supportedExtensions = ['.js', '.jsx', '.ts', '.tsx', '.css', '.scss', '.less'];

  return {
    name: 'vite-plugin-git-symlink-resolver',
    enforce: 'pre',

    async resolveId(source, importer, options) {
      if (!importer || source.startsWith('\0') || source.includes('node_modules')) {
        return null;
      }
      const importedFilePath = path.resolve(path.dirname(importer), source);
      const ext = path.extname(importedFilePath);
      if (!supportedExtensions.includes(ext)) {
        return null;
      }
console.log(`check ${importedFilePath}`)
      // Return a special virtual ID to signal our 'load' hook to process this file.
      // We embed the original file's absolute path within this virtual ID.
      return `\0first-line-resolve:${importedFilePath}`;
    },

    async load(id) {
      // Check if this is our virtual ID
      if (id.startsWith('\0first-line-resolve:')) {
        const originalFilePath = id.replace('\0first-line-resolve:', '');

        try {
          const originalFileContent = await fs.readFile(originalFilePath, 'utf-8');
          const firstLine = originalFileContent.split('\n')[0]?.trim();

          if (firstLine) {
            const potentialRedirectPath = path.resolve(path.dirname(originalFilePath), firstLine);

            try {
              const stats = await fs.stat(potentialRedirectPath);
              if (stats.isFile()) {
                console.log(`[FirstLinePathResolver] Redirecting ${path.relative(process.cwd(), originalFilePath)} to ${path.relative(process.cwd(), potentialRedirectPath)}`);
                return await fs.readFile(potentialRedirectPath, 'utf-8');
              }
            } catch (e) {
                console.log(`File ${originalFilePath} isn't a redirect`, e)
 
            }
          }
          return originalFileContent;

        } catch (error) {
          console.error(`[FirstLinePathResolver] Error reading original file ${path.relative(process.cwd(), originalFilePath)}:`, error);
          return null;
        }
      }

      return null;
    }
  };
}
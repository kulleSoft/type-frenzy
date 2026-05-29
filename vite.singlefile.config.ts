import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type Plugin } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const repoRoot = fileURLToPath(new URL(".", import.meta.url));
const offlineRoot = resolve(repoRoot, "src/offline");

function inlineHtmlAssets(): Plugin {
  return {
    name: "offline-inline-html-assets",
    enforce: "post",
    generateBundle(_, bundle) {
      const htmlAsset = bundle["index.html"];

      if (!htmlAsset || htmlAsset.type !== "asset" || typeof htmlAsset.source !== "string") {
        throw new Error("Expected Vite to emit index.html for the offline single-file build.");
      }

      let html = htmlAsset.source;

      for (const [fileName, asset] of Object.entries(bundle)) {
        if (fileName === "index.html") continue;

        if (asset.type === "chunk") {
          const scriptPattern = new RegExp(
            `<script\\s+type=["']module["']\\s+crossorigin\\s+src=["'](?:\\./|/)?${escapeRegExp(
              fileName,
            )}["']><\\/script>|<script\\s+type=["']module["']\\s+src=["'](?:\\./|/)?${escapeRegExp(
              fileName,
            )}["']><\\/script>`,
            "g",
          );
          html = html.replace(
            scriptPattern,
            () => `<script type="module">\n${escapeInlineScript(asset.code)}\n</script>`,
          );
          delete bundle[fileName];
          continue;
        }

        if (asset.type === "asset" && fileName.endsWith(".css")) {
          const css = typeof asset.source === "string" ? asset.source : asset.source.toString();
          const linkPattern = new RegExp(
            `<link\\s+rel=["']stylesheet["']\\s+crossorigin\\s+href=["'](?:\\./|/)?${escapeRegExp(
              fileName,
            )}["']>|<link\\s+rel=["']stylesheet["']\\s+href=["'](?:\\./|/)?${escapeRegExp(fileName)}["']>`,
            "g",
          );
          html = html.replace(linkPattern, () => `<style>\n${escapeInlineStyle(css)}\n</style>`);
          delete bundle[fileName];
        }
      }

      htmlAsset.source = html;
    },
  };
}

function escapeInlineScript(code: string) {
  return code.replace(/<\/script/gi, "<\\\\/script");
}

function escapeInlineStyle(css: string) {
  return css.replace(/<\/style/gi, "<\\\\/style");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default defineConfig({
  root: offlineRoot,
  base: "./",
  publicDir: false,
  plugins: [react(), tailwindcss(), tsconfigPaths(), inlineHtmlAssets()],
  build: {
    outDir: resolve(repoRoot, "dist-singlefile"),
    emptyOutDir: true,
    target: "esnext",
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
    chunkSizeWarningLimit: 100_000_000,
    rollupOptions: {
      input: resolve(offlineRoot, "index.html"),
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});

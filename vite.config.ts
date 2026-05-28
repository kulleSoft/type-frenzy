import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { viteSingleFile } from "vite-plugin-singlefile";
import { componentTagger } from "@lovable.dev/component-tagger";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    tsconfigPaths(),
    mode === "development" && componentTagger(),
    viteSingleFile(),
  ].filter(Boolean),
  server: {
    host: "::",
    port: 8080,
    strictPort: true,
  },
  build: {
    target: "esnext",
    assetsInlineLimit: 100_000_000,
    chunkSizeWarningLimit: 100_000_000,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
}));

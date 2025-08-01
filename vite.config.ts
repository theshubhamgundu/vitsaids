// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    nodePolyfills({
      globals: {
        Buffer: true,
        process: true,
      },
      protocolImports: true,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      buffer: "buffer",
      process: "process/browser",
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      external: [
        "fs", "path", "os", "child_process", "stream", "http", "https", "zlib", "util",
      ],
    },
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  optimizeDeps: {
    include: ['uuid'],
    exclude: ["@octokit/rest"],
  },
}));

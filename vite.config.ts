import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Polyfills for Node.js globals like `Buffer`
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
        process: true, // Optional but useful
      },
      protocolImports: true,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      buffer: "buffer", // Ensure Buffer works in browser
      process: "process/browser", // Optional: some Octokit internals may use it
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      // Keep existing external modules, but ensure 'uuid' is NOT in this list
      external: [
        "fs",
        "path",
        "os",
        "child_process",
        "stream",
        "http",
        "https",
        "zlib",
        "util",
        // 'uuid', // <-- Ensure 'uuid' is NOT here if it was mistakenly added
      ],
      // NEW: Ensure uuid is explicitly included in the bundle if it's imported as ESM
      // If uuid is causing issues as a CJS module, commonjs plugin is needed,
      // but your existing commonjsOptions should handle it if it's not externalized.
      // The core problem is that Rollup "failed to resolve import 'uuid'".
      // This often means it's trying to treat it as a Node.js built-in or external.
      // By NOT listing it in external, it should be bundled.
      // If it's still an issue, we might need a specific rollup plugin for UUID.
    },
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  optimizeDeps: {
    include: ['uuid'], // NEW: Explicitly include 'uuid' for pre-bundling in dev mode
    exclude: ["@octokit/rest"], // Keep Octokit as ESM
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true,
          process: true,
        }),
      ],
    },
  },
}));

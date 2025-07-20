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
      ],
    },
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  optimizeDeps: {
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

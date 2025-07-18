import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      external: [
        // Avoid bundling native Node.js modules that may break in Vercel (if backend libs are imported)
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
    exclude: ["@octokit/rest"], // Don’t prebundle Octokit — keep as ESM
  },
}));

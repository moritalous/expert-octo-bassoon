import path from "node:path";
import { defineConfig } from "vite";

const repoRoot = path.resolve(__dirname, "..", "..");

export default defineConfig({
  server: {
    host: true,
    port: 5173,
    fs: {
      allow: [repoRoot]
    }
  }
});

import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The Express server mounts Vite in middleware mode: one origin for UI and API.
export default defineConfig({
  plugins: [react(), tailwindcss(), ...(process.env.CMCB_NETLIFY_BUILD === "1" ? [] : [viteSingleFile()])],
  publicDir: process.env.CMCB_NETLIFY_BUILD === "1" ? path.resolve(__dirname, "deploy/netlify/static") : "public",
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
    fs: { deny: ['.env', '.env.*', '**/data/**', '**/backups/**', '**/*.sqlite*', '**/server/**'] },
  },
});

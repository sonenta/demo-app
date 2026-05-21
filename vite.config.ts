import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig(({ command }) => ({
  // Served under https://verbumia.ca/demos/react/ in prod (flat docroot,
  // see scripts/deploy.sh). Dev keeps the root so `vite` still works at /.
  base: command === "build" ? "/demos/react/" : "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
}));

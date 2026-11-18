import { fileURLToPath, URL } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";

function hotFilePlugin(): Plugin {
  let hotFile: string | null = null;
  return {
    name: "laravel-hot-file",
    configureServer() {
      const publicDir = path.resolve(__dirname, "../public");
      hotFile = path.join(publicDir, "hot");
      fs.writeFileSync(hotFile, "http://localhost:5173\n");
      const clean = () => {
        if (hotFile && fs.existsSync(hotFile)) {
          try {
            fs.unlinkSync(hotFile);
          } catch {
            // Ignoré si déjà nettoyé
          }
        }
      };
      process.on("exit", clean);
      process.on("SIGINT", clean);
      process.on("SIGTERM", clean);
    },
  };
}

export default defineConfig(({ command }) => ({
  base: command === "build" ? "/build/" : "/",
  plugins: [react(), hotFilePlugin()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: {
    port: 5173,
    open: false,
    origin: "http://localhost:5173",
    cors: true,
  },
  build: {
    outDir: fileURLToPath(new URL("../public/build", import.meta.url)),
    emptyOutDir: true,
    manifest: "manifest.json",
    rollupOptions: {
      input: fileURLToPath(new URL("./src/app/main.tsx", import.meta.url)),
    },
  },
}));

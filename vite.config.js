import { defineConfig } from "vite";

export default defineConfig({
  base: "/oriel-store/",
  server: {
    host: "127.0.0.1",
    port: 4721,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 4721,
    strictPort: true,
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
  },
});

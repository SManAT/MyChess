import { defineConfig } from "vite";
import eslint from "vite-plugin-eslint";
import path from "path";
import { resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: "./",
  publicDir: resolve(__dirname, "public"),

  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000", // Replace with your backend server URL
        changeOrigin: true,
        secure: false,
      },
    },
  },

  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, "src/index.html"),
      },
    },
  },

  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@js": resolve(__dirname, "src/js"),
      "@scss": resolve(__dirname, "src/scss"),
    },
  },

  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        additionalData: "",
        sourceMap: true,
      },
    },
  },

  plugins: [
    // URL rewrite plugin
    {
      name: "rewrite-urls",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Map clean URLs to actual file paths
          const rewrites = {
            "/": "/src/index.html",
            "/index.html": "/src/index.html",
            "/lobby.html": "/src/lobby.html",
            "/game.html": "/src/game.html",
          };

          const url = req.url?.split("?")[0];

          if (rewrites[url]) {
            req.url = rewrites[url];
          }

          next();
        });
      },
    },

    eslint(),
  ],
});

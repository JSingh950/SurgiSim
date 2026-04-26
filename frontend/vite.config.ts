import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ["buffer", "crypto", "stream", "util"],
      globals: { Buffer: true },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("@react-three/fiber") || id.includes("@react-three/drei") || id.includes("/three/")) {
            return "three-vendor";
          }

          return undefined;
        },
      },
    },
  },
  server: {
    port: 5173,
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://host.docker.internal:8000",
        changeOrigin: true,
      },
    },
    host: "0.0.0.0",
    port: 5173,
  },
});

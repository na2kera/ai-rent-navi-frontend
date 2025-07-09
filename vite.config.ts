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
      "/jpapi": {
        target: "https://api.da.pf.japanpost.jp", // 中継先を日本郵便APIサーバーに設定
        changeOrigin: true, // CORSエラー回避のために必須
        rewrite: (path) => path.replace(/^\/jpapi/, ""), // リクエストパスから '/jpapi' を削除
      },
    },
    host: "0.0.0.0",
    port: 5173,
  },
});

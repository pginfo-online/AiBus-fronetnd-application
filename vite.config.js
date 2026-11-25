import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget = env.VITE_PROXY_TARGET || "http://localhost:3009";

  const proxyConfig = {
    "/api": {
      target: proxyTarget,
      changeOrigin: true,
      secure: false,
      configure: (proxy) => {
        proxy.on("proxyReq", (proxyReq) => {
          // When proxying to the remote production backend, rewrite Origin to http://localhost:5173
          // so remote CORS policy permits requests from all LAN/mobile development devices.
          if (proxyTarget.includes("aibus.shop")) {
            proxyReq.setHeader("Origin", "http://localhost:5173");
            proxyReq.setHeader("Referer", "http://localhost:5173/");
          }
        });
        proxy.on("proxyRes", (proxyRes, req) => {
          // Echo back the local client's origin to satisfy the browser's credentials/CORS check
          if (req.headers.origin) {
            proxyRes.headers["access-control-allow-origin"] = req.headers.origin;
            proxyRes.headers["access-control-allow-credentials"] = "true";
          }
        });
      },
    },
  };

  // https://vite.dev/config/
  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: "0.0.0.0",
      cors: true,
      strictPort: false,
      allowedHosts: true,
      proxy: proxyConfig,
    },
    preview: {
      port: 5173,
      host: "0.0.0.0",
      cors: true,
      proxy: proxyConfig,
    },
  };
});

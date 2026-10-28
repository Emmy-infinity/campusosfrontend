// campusos/frontend/vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// ─── BACKEND URL SWITCHER ────────────────────────────────────────────
const BACKEND_URL = "https://campusos-1-43tc.onrender.com";
// ─────────────────────────────────────────────────────────────────────

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
      // Enable Service Worker in local dev mode
      devOptions: {
        enabled: true,
      },
      manifest: {
        name: "CampusOS",
        short_name: "CampusOS",
        description: "AI-Powered Academic Platform",
        theme_color: "#0d47a1",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        // 👇 FIX: Increase the cache limit to 10MB to allow PlotlyChart (4.78MB)
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        
        // Cache all static assets (JS, CSS, HTML, images)
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        
        // Do not cache API calls to prevent stale auth data
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/campusos-1-43tc\.onrender\.com\/api\/.*/i,
            handler: "NetworkOnly", 
          },
        ],
      },
    }),
  ],

  server: {
    port: 5173,
    host: true,
    strictPort: true,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0",
    },
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      "false-atrium-dallying.ngrok-free.dev",
      ".ngrok-free.dev",
      ".ngrok-free.app",
      ".ngrok.app",
      ".ngrok.io",
      ".trycloudflare.com",
      ".onrender.com",
      ".railway.app",
      ".fly.dev",
    ],
    proxy: {
      "/api": {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: true,
        configure: (proxy) => {
          proxy.on("error", (err, req) => {
            console.error("[vite proxy error]", req.url, err.message);
          });
        },
      },
      "/media": {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: true,
      },
    },
  },

  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 5000, // Increased this to suppress the chunk size warning
  },
});
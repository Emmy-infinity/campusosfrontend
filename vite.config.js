// campusos/frontend/vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import prerenderStatic from "vite-plugin-prerender-static"; // 👈 Added import

// ─── BACKEND URL SWITCHER ────────────────────────────────────────────
const BACKEND_URL = "https://campusos-1-43tc.onrender.com";
// ─────────────────────────────────────────────────────────────────────

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
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
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/campusos-1-43tc\.onrender\.com\/api\/.*/i,
            handler: "NetworkOnly", 
          },
        ],
      },
    }),
    // 👇 Added Prerender Plugin
    prerenderStatic({
      routes: [
        {
          path: "/",
          tags: {
            title: "CampusOS | Sovereign Academic Platform",
            description: "One unified, on-premise architecture for course administration.",
          },
        },
        {
          path: "/login",
          tags: {
            title: "Sign In | CampusOS",
            description: "Access your CampusOS portal to manage courses, exams, and academic analytics.",
          },
        },
        {
          path: "/register",
          tags: {
            title: "Create an Account | CampusOS",
            description: "Join East Africa's sovereign academic platform. Register as a student or lecturer.",
          },
        },
      ],
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
    chunkSizeWarningLimit: 5000,
  },
});

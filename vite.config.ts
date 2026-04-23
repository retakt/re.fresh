import path from "node:path";
import process from "node:process";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { VitePWA } from "vite-plugin-pwa";

const sentryOrg = process.env.SENTRY_ORG;
const sentryProject = process.env.SENTRY_PROJECT;
const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN;
const releaseName = process.env.SENTRY_RELEASE ?? process.env.npm_package_version ?? "dev";

const sentryPlugins =
  sentryOrg && sentryProject && sentryAuthToken
    ? sentryVitePlugin({
        org: sentryOrg,
        project: sentryProject,
        authToken: sentryAuthToken,
        release: {
          name: releaseName,
          inject: true,
          create: true,
          finalize: true,
        },
      })
    : [];

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),

    // PWA — replaces the handwritten public/sw.js
    // Workbox handles caching correctly: network-first for navigation,
    // cache-first for hashed assets, no stale-shell problem on Safari.
    VitePWA({
      registerType: "autoUpdate",
      // Don't inject the SW registration — we do it manually in main.tsx
      injectRegister: null,
      // Only active in production builds — no SW in dev
      devOptions: {
        enabled: false,
      },
      strategies: "generateSW",
      filename: "sw.js",
      manifest: {
        name: "re.Takt",
        short_name: "re.Takt",
        description: "Curated content and creative resources by Takt Akira",
        start_url: "/",
        display: "standalone",
        orientation: "portrait-primary",
        theme_color: "#1a1a2e",
        background_color: "#1a1a2e",
        icons: [
          {
            src: "/favicon/android-chrome-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/favicon/android-chrome-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
        shortcuts: [
          { name: "Blog", url: "/blog", description: "Read the latest posts" },
          { name: "Music", url: "/music", description: "Listen to music" },
          { name: "Tutorials", url: "/tutorials", description: "Browse tutorials" },
        ],
      },
      workbox: {
        // Navigation (HTML) — network-first, fall back to cached shell
        // This is the critical fix: never serve a stale shell on Safari
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api/, /^\/functions/],

        // Hashed JS/CSS assets — cache-first (they never change once deployed)
        runtimeCaching: [
          {
            urlPattern: /\/assets\/.+\.(js|css|woff2?|ttf|otf)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "re-takt-assets-v3",
              expiration: {
                maxEntries: 120,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          {
            // Images from our own origin
            urlPattern: /\/assets\/.+\.(png|jpg|jpeg|webp|svg|gif|ico)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "re-takt-images-v3",
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            // Supabase storage uploads — stale-while-revalidate
            urlPattern: /supabase\.co\/storage/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "re-takt-uploads-v3",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
            },
          },
        ],

        // Clean up old caches from previous SW versions
        cleanupOutdatedCaches: true,

        // Skip waiting so new SW activates immediately on update
        skipWaiting: true,
        clientsClaim: true,

        // Handle SKIP_WAITING message from workbox-window
        additionalManifestEntries: [],
      },
    }),

    ...sentryPlugins,
  ],

  define: {
    __APP_VERSION__: JSON.stringify(releaseName),
  },

  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: true,
    hmr: {
      overlay: false,
    },
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    chunkSizeWarningLimit: 600,
    sourcemap: true,

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) return "react";
          if (id.includes("node_modules/react-router-dom") || id.includes("node_modules/react-router/")) return "router";
          if (id.includes("node_modules/@supabase/")) return "supabase";
          if (id.includes("node_modules/@tiptap/") || id.includes("node_modules/prosemirror")) return "editor";
          if (id.includes("node_modules/@radix-ui/")) return "radix";
          if (id.includes("node_modules/date-fns")) return "date-fns";
          if (id.includes("node_modules/recharts") || id.includes("node_modules/d3-")) return "charts";
          if (
            id.includes("node_modules/react-markdown") ||
            id.includes("node_modules/remark") ||
            id.includes("node_modules/unified") ||
            id.includes("node_modules/micromark")
          ) return "markdown";
          if (id.includes("node_modules/@sentry/")) return "sentry";
          if (id.includes("node_modules/workbox-") || id.includes("node_modules/vite-plugin-pwa")) return "pwa";
          if (id.includes("node_modules/motion") || id.includes("node_modules/framer-motion")) return "motion";
        },
      },
    },
  },
});

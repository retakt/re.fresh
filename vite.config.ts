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
        // Navigation (HTML) — NetworkFirst so we always try to get fresh HTML
        // This prevents the stale shell / mixed chunk version problem
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api/, /^\/functions/],

        runtimeCaching: [
          // Navigation requests — NetworkFirst with short timeout
          // Falls back to cached shell only when truly offline
          {
            urlPattern: ({ request }: { request: Request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "re-takt-navigation-v5",
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 5,
                maxAgeSeconds: 60 * 60 * 24,
              },
            },
          },
          {
            urlPattern: /\/assets\/.+\.(js|css|woff2?|ttf|otf)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "re-takt-assets-v5",
              expiration: {
                maxEntries: 120,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
          {
            urlPattern: /\/assets\/.+\.(png|jpg|jpeg|webp|svg|gif|ico)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "re-takt-images-v5",
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            urlPattern: /supabase\.co\/storage/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "re-takt-uploads-v5",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
            },
          },
        ],

        // Clean up ALL old caches (v3 and earlier) on SW update
        cleanupOutdatedCaches: true,

        // New SW activates immediately — no waiting for old tabs to close
        skipWaiting: true,
        clientsClaim: true,

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
      input: {
        main: path.resolve(__dirname, "index.html"),
        yt: path.resolve(__dirname, "yt/index.html"),
      },
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
          if (id.includes("node_modules/@base-ui/")) return "base-ui";
        },
      },
    },
  },
});

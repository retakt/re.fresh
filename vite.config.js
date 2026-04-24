var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var _a, _b;
import path from "node:path";
import process from "node:process";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { VitePWA } from "vite-plugin-pwa";
var sentryOrg = process.env.SENTRY_ORG;
var sentryProject = process.env.SENTRY_PROJECT;
var sentryAuthToken = process.env.SENTRY_AUTH_TOKEN;
var releaseName = (_b = (_a = process.env.SENTRY_RELEASE) !== null && _a !== void 0 ? _a : process.env.npm_package_version) !== null && _b !== void 0 ? _b : "dev";
var sentryPlugins = sentryOrg && sentryProject && sentryAuthToken
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
    plugins: __spreadArray([
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
                        urlPattern: function (_a) {
                            var request = _a.request;
                            return request.mode === "navigate";
                        },
                        handler: "NetworkFirst",
                        options: {
                            cacheName: "re-takt-navigation-v4",
                            networkTimeoutSeconds: 5,
                            expiration: {
                                maxEntries: 5,
                                maxAgeSeconds: 60 * 60 * 24, // 1 day max
                            },
                        },
                    },
                    {
                        urlPattern: /\/assets\/.+\.(js|css|woff2?|ttf|otf)$/i,
                        handler: "CacheFirst",
                        options: {
                            cacheName: "re-takt-assets-v4",
                            expiration: {
                                maxEntries: 120,
                                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                            },
                        },
                    },
                    {
                        urlPattern: /\/assets\/.+\.(png|jpg|jpeg|webp|svg|gif|ico)$/i,
                        handler: "CacheFirst",
                        options: {
                            cacheName: "re-takt-images-v4",
                            expiration: {
                                maxEntries: 60,
                                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                            },
                        },
                    },
                    {
                        urlPattern: /supabase\.co\/storage/i,
                        handler: "StaleWhileRevalidate",
                        options: {
                            cacheName: "re-takt-uploads-v4",
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
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
        })
    ], sentryPlugins, true),
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
                manualChunks: function (id) {
                    if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/"))
                        return "react";
                    if (id.includes("node_modules/react-router-dom") || id.includes("node_modules/react-router/"))
                        return "router";
                    if (id.includes("node_modules/@supabase/"))
                        return "supabase";
                    if (id.includes("node_modules/@tiptap/") || id.includes("node_modules/prosemirror"))
                        return "editor";
                    if (id.includes("node_modules/@radix-ui/"))
                        return "radix";
                    if (id.includes("node_modules/date-fns"))
                        return "date-fns";
                    if (id.includes("node_modules/recharts") || id.includes("node_modules/d3-"))
                        return "charts";
                    if (id.includes("node_modules/react-markdown") ||
                        id.includes("node_modules/remark") ||
                        id.includes("node_modules/unified") ||
                        id.includes("node_modules/micromark"))
                        return "markdown";
                    if (id.includes("node_modules/@sentry/"))
                        return "sentry";
                    if (id.includes("node_modules/workbox-") || id.includes("node_modules/vite-plugin-pwa"))
                        return "pwa";
                    if (id.includes("node_modules/motion") || id.includes("node_modules/framer-motion"))
                        return "motion";
                },
            },
        },
    },
});

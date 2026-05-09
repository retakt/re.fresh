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
        tailwindcss()
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
        dedupe: ["react", "react-dom"],
    },
    build: {
        chunkSizeWarningLimit: 1000, // Increased for vendor chunk
        // Only generate sourcemaps when SENTRY env vars are present (CI/release builds)
        // Avoids shipping large .map files to production on every local deploy
        sourcemap: !!(sentryOrg && sentryProject && sentryAuthToken),
        rollupOptions: {
            input: {
                main: path.resolve(__dirname, "index.html"),
            },
            output: {
                manualChunks: function (id) {
                    // CRITICAL: React, ReactDOM, and ALL React-dependent libraries MUST stay together
                    // Splitting them causes "Invalid hook call" and "Cannot read properties of null" errors
                    // React Router - can be separate since it's only used in routing
                    if (id.includes("node_modules/react-router-dom") || id.includes("node_modules/react-router/")) {
                        return "router";
                    }
                    // Motion library - used everywhere, keep separate
                    if (id.includes("node_modules/motion") || id.includes("node_modules/framer-motion")) {
                        return "motion";
                    }
                    // Heavy libraries that DON'T depend on React hooks
                    if (id.includes("node_modules/@supabase/"))
                        return "supabase";
                    if (id.includes("node_modules/@tiptap/") || id.includes("node_modules/prosemirror"))
                        return "editor";
                    if (id.includes("node_modules/date-fns"))
                        return "date-fns";
                    // Markdown rendering - only needed on post pages
                    if (id.includes("node_modules/react-markdown") ||
                        id.includes("node_modules/remark") ||
                        id.includes("node_modules/unified") ||
                        id.includes("node_modules/micromark")) {
                        return "markdown";
                    }
                    // Monitoring - load async
                    if (id.includes("node_modules/@sentry/"))
                        return "sentry";
                    // Shiki syntax highlighting - only for code blocks
                    if (id.includes("node_modules/shiki") || id.includes("node_modules/react-shiki")) {
                        return "shiki";
                    }
                    // Everything else from node_modules goes to vendor
                    // This includes React, ReactDOM, @radix-ui, @assistant-ui, @base-ui, ai-sdk, etc.
                    // They MUST all be in the same chunk to share the same React instance
                    if (id.includes("node_modules/")) {
                        return "vendor";
                    }
                },
            },
        },
    },
});

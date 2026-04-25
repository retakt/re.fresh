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
                    if (id.includes("node_modules/motion") || id.includes("node_modules/framer-motion"))
                        return "motion";
                    if (id.includes("node_modules/@base-ui/"))
                        return "base-ui";
                },
            },
        },
    },
});

import path from "node:path";
import process from "node:process";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { sentryVitePlugin } from "@sentry/vite-plugin";

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
        yt: path.resolve(__dirname, "yt/index.html"),
      },
      output: {
        manualChunks(id) {
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
          if (id.includes("node_modules/@supabase/")) return "supabase";
          if (id.includes("node_modules/@tiptap/") || id.includes("node_modules/prosemirror")) return "editor";
          if (id.includes("node_modules/date-fns")) return "date-fns";
          
          // Markdown rendering - only needed on post pages
          if (
            id.includes("node_modules/react-markdown") ||
            id.includes("node_modules/remark") ||
            id.includes("node_modules/unified") ||
            id.includes("node_modules/micromark")
          ) {
            return "markdown";
          }
          
          // Monitoring - load async
          if (id.includes("node_modules/@sentry/")) return "sentry";
          
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

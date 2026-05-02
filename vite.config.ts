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
  },

  build: {
    chunkSizeWarningLimit: 600,
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
          if (id.includes("node_modules/motion") || id.includes("node_modules/framer-motion")) return "motion";
          if (id.includes("node_modules/@base-ui/")) return "base-ui";
        },
      },
    },
  },
});

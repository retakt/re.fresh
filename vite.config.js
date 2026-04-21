import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
    ],
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
        rollupOptions: {
            output: {
                manualChunks: {
                    // Core React
                    react: ["react", "react-dom"],
                    // Routing
                    router: ["react-router-dom"],
                    // Backend / API
                    supabase: ["@supabase/supabase-js"],
                    // Rich text editor
                    editor: ["@tiptap/react", "@tiptap/starter-kit"],
                },
            },
        },
    },
});

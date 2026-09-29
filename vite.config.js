import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// Preload the display and body fonts so they arrive alongside the JS and the
// first layout already uses them. Without this, the body font swaps in after
// the first paint and forces all text to be reshaped and laid out again —
// a few hundred ms of blocked main thread on a slow phone. The mono font
// (15 KB, labels only) is left to swap in: its relayout is small, and
// preloading it too measurably delayed LCP. `font-display: swap` still
// guarantees text is never held back waiting for any of them.
const FONT_FILES = [
  /bricolage-grotesque-display-latin-[\w-]+\.woff2$/,
  /ibm-plex-sans-latin-wght-normal-[\w-]+\.woff2$/,
];

const preloadFonts = () => ({
  name: "preload-fonts",
  apply: "build",
  transformIndexHtml: {
    order: "post",
    handler(_html, ctx) {
      const files = Object.keys(ctx.bundle ?? {});
      return FONT_FILES.map((pattern) => files.find((name) => pattern.test(name)))
        .filter(Boolean)
        .map((file) => ({
          tag: "link",
          attrs: {
            rel: "preload",
            href: `/${file}`,
            as: "font",
            type: "font/woff2",
            crossorigin: "",
          },
          injectTo: "head-prepend",
        }));
    },
  },
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), preloadFonts()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "/src"), // Allows importing from 'src' using '@' prefix
    },
  },
});

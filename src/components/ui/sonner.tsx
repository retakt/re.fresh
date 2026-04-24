import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * Glass toast — centered on screen, translucent, theme-aware.
 *
 * Design:
 * - position: top-center so it's always visible on small phones
 * - backdrop-blur glass effect that adapts to light/dark theme
 * - richColors: success=green tint, error=red tint, info=blue tint
 *   all layered on top of the glass base
 * - Font: Plus Jakarta Sans (inherited from app), responsive size
 * - No changes needed at call sites — toast.success/error/info work as-is
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Sonner
      theme={resolvedTheme as ToasterProps["theme"]}
      position="top-center"
      richColors
      closeButton
      gap={8}
      toastOptions={{
        classNames: {
          toast: "glass-toast",
          title: "glass-toast-title",
          description: "glass-toast-description",
          closeButton: "glass-toast-close",
          actionButton: "glass-toast-action",
        },
      }}
      style={
        {
          // ── Glass base — light mode ──────────────────────────────────────
          // These CSS vars are read by Sonner for the default (non-rich) toast.
          // richColors overrides bg/text for success/error/info/warning.
          "--normal-bg": isDark
            ? "rgba(30, 30, 46, 0.82)"
            : "rgba(255, 253, 250, 0.82)",
          "--normal-text": isDark
            ? "oklch(0.82 0.006 90)"
            : "oklch(0.14 0.012 260)",
          "--normal-border": isDark
            ? "rgba(255, 255, 255, 0.10)"
            : "rgba(0, 0, 0, 0.08)",

          // ── Success (green tint on glass) ────────────────────────────────
          "--success-bg": isDark
            ? "rgba(20, 40, 30, 0.85)"
            : "rgba(240, 253, 244, 0.88)",
          "--success-text": isDark ? "#86efac" : "#15803d",
          "--success-border": isDark
            ? "rgba(134, 239, 172, 0.18)"
            : "rgba(21, 128, 61, 0.15)",

          // ── Error (red tint on glass) ────────────────────────────────────
          "--error-bg": isDark
            ? "rgba(40, 18, 18, 0.88)"
            : "rgba(255, 241, 241, 0.90)",
          "--error-text": isDark ? "#fca5a5" : "#b91c1c",
          "--error-border": isDark
            ? "rgba(252, 165, 165, 0.18)"
            : "rgba(185, 28, 28, 0.15)",

          // ── Info (blue tint on glass) ────────────────────────────────────
          "--info-bg": isDark
            ? "rgba(15, 25, 45, 0.88)"
            : "rgba(239, 246, 255, 0.90)",
          "--info-text": isDark ? "#93c5fd" : "#1d4ed8",
          "--info-border": isDark
            ? "rgba(147, 197, 253, 0.18)"
            : "rgba(29, 78, 216, 0.15)",

          // ── Warning (amber tint on glass) ────────────────────────────────
          "--warning-bg": isDark
            ? "rgba(40, 30, 10, 0.88)"
            : "rgba(255, 251, 235, 0.90)",
          "--warning-text": isDark ? "#fcd34d" : "#92400e",
          "--warning-border": isDark
            ? "rgba(252, 211, 77, 0.18)"
            : "rgba(146, 64, 14, 0.15)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };

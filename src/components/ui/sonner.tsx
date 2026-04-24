import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * Glass toast — top-center, translucent, theme-aware.
 *
 * Key decisions after reading Sonner v2 source CSS:
 * - Color vars (--success-bg etc.) are set via CSS in index.css, not inline
 *   style, so they respond to the theme class on <html> automatically.
 * - `theme` prop is still passed so Sonner sets data-sonner-theme correctly.
 * - `resolvedTheme` used (not `theme`) so "system" resolves to actual mode.
 * - `duration={3500}` — sensible default; short messages like "Copied" feel
 *   snappy, longer ones like invite confirmations still have time to read.
 * - `visibleToasts={3}` — cap stacking so the screen doesn't fill up.
 * - Mobile centering: `offset` controls --mobile-offset-left/right so the
 *   toast stays centered on narrow screens (Sonner cancels translateX on mobile).
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      theme={resolvedTheme as ToasterProps["theme"]}
      position="top-center"
      richColors
      closeButton
      duration={3500}
      visibleToasts={3}
      gap={6}
      offset={16}
      toastOptions={{
        classNames: {
          toast: "glass-toast",
          title: "glass-toast-title",
          description: "glass-toast-description",
          closeButton: "glass-toast-close",
          actionButton: "glass-toast-action",
          icon: "glass-toast-icon",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };

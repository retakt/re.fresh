export default function Footer({
  brand = "re.Takt",
  tagline = "currently trying",
  year = new Date().getFullYear(),
  className = "",
}) {
  return (
    // Single footer — in normal document flow on all screen sizes.
    // Sits at the bottom of the page after all content scrolls past.
    // Desktop keeps the fixed footer (sidebar layout needs it).
    <>
      {/* ── MOBILE: in-flow, scrolls with page ── */}
      <footer
        className={`md:hidden w-full border-t border-border/40 bg-background/95 ${className}`}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex items-center justify-between px-4 py-2 gap-2">
          <p className="text-[9px] font-semibold truncate">
            © {year}
            <span className="ml-2 text-[#11D8C2]">{brand}-{tagline}</span>
          </p>
          <div className="flex gap-2 shrink-0">
            <a
              href="/about"
              className="text-[9px] font-semibold text-muted-foreground/50 transition-all hover:text-[#11D8C2] active:text-[#11D8C2]"
              style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
            >
              About
            </a>
            <a
              href="https://chat.retakt.cc"
              className="text-[9px] font-semibold text-muted-foreground/50 transition-all hover:text-[#11D8C2] active:text-[#11D8C2]"
              style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
            >
              NSFW
            </a>
          </div>
        </div>
      </footer>

      {/* ── DESKTOP: fixed at bottom ── */}
      <footer
        className={`hidden md:block fixed bottom-0 left-0 right-0 z-40 border-t border-border/40 bg-background/95 backdrop-blur-sm ${className}`}
      >
        <div className="mx-auto w-full max-w-6xl px-4 lg:px-6 py-1.5 flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold truncate">
            © {year}
            <span className="ml-2 text-[#11D8C2]">{brand}-{tagline}</span>
          </p>
          <div className="flex gap-3 shrink-0">
            <a href="/about" className="text-[10px] font-semibold text-muted-foreground/50 transition-colors hover:text-[#11D8C2]">
              About
            </a>
            <a href="https://chat.retakt.cc" className="text-[10px] font-semibold text-muted-foreground/50 transition-colors hover:text-[#11D8C2]">
              NSFW
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}

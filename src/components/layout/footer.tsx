export default function Footer({
  brand = "re.Takt",
  tagline = "currently trying....",
  year = new Date().getFullYear(),
  className = "",
}) {
  return (
    <>
      {/* ── MOBILE: thin strip fixed just above the bottom nav ── */}
      <div className={`md:hidden fixed bottom-[56px] left-0 right-0 z-40 border-t border-border/40 bg-background/95 backdrop-blur-sm ${className}`}>
        <div className="flex items-center justify-between px-4 py-1 gap-2">
          <p className="text-[9px] text-muted-foreground/60 font-medium truncate">
            © {year} {brand} — {tagline}
          </p>
          <div className="flex gap-2 shrink-0">
            <a href="/about" className="text-[9px] text-muted-foreground/60 hover:text-foreground transition-colors">About</a>
            <a href="https://chat.retakt.cc" className="text-[9px] text-muted-foreground/60 hover:text-foreground transition-colors">NSFW</a>
          </div>
        </div>
      </div>

      {/* ── DESKTOP: fixed at bottom, always visible, thin strip ── */}
      <footer className={`hidden md:block fixed bottom-0 left-0 right-0 z-40 border-t border-border/40 bg-background/95 backdrop-blur-sm ${className}`}>
        <div className="mx-auto w-full max-w-6xl px-4 lg:px-6 py-1.5 flex items-center justify-between gap-2">
          <p className="text-[10px] text-muted-foreground/50 font-medium truncate">
            © {year} {brand} — {tagline}
          </p>
          <div className="flex gap-3 shrink-0">
            <a href="/about" className="text-[10px] text-muted-foreground/50 hover:text-foreground transition-colors">About</a>
            <a href="https://chat.retakt.cc" className="text-[10px] text-muted-foreground/50 hover:text-foreground transition-colors">NSFW</a>
          </div>
        </div>
      </footer>
    </>
  );
}
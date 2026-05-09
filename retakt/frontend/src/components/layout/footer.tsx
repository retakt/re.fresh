export default function Footer({
  brand = "re.Takt",
  tagline = "currently trying",
  year = new Date().getFullYear(),
  className = "",
}) {
  return (
    <>
      {/* ── MOBILE: in-flow, scrolls with page ── */}
      <footer
        className={`md:hidden w-full border-t border-border/40 bg-background/95 relative z-10 ${className}`}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex items-center justify-between px-4 py-2 gap-2">
          <p className="text-[9px] font-semibold truncate">
            © {year}
            <span className="ml-2" style={{ color: 'var(--neon-lime)' }}>{brand}-{tagline}</span>
          </p>
          <div className="flex gap-2 shrink-0">
            <a
              href="/about"
              className="text-[9px] font-semibold text-muted-foreground/50 transition-all active:text-[var(--neon-lime)]"
              style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent", color: 'inherit' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--neon-lime)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}
            >
              About
            </a>
            <a
              href="https://chat.retakt.cc"
              className="text-[9px] font-semibold text-muted-foreground/50 transition-all active:text-[var(--neon-lime)]"
              style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent", color: 'inherit' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--neon-lime)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}
            >
              NSFW
            </a>
          </div>
        </div>
      </footer>

      {/* ── DESKTOP: in document flow like mobile ── */}
      <footer
        className={`hidden md:block w-full border-t border-border/40 bg-background/95 relative z-10 ${className}`}
      >
        <div className="mx-auto w-full max-w-6xl px-4 lg:px-6 py-1.5 flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold truncate">
            © {year}
            <span className="ml-2" style={{ color: 'var(--neon-lime)' }}>{brand}-{tagline}</span>
          </p>
          <div className="flex gap-3 shrink-0">
            <a 
              href="/about" 
              className="text-[10px] font-semibold text-muted-foreground/50 transition-colors"
              style={{ color: 'inherit' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--neon-lime)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}
            >
              About
            </a>
            <a 
              href="https://chat.retakt.cc" 
              className="text-[10px] font-semibold text-muted-foreground/50 transition-colors"
              style={{ color: 'inherit' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--neon-lime)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}
            >
              NSFW
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}

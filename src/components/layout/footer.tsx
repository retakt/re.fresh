export default function Footer({
  brand = "/re.Takt.",
  tagline = "currently trying....",
  year = new Date().getFullYear(),
  className = "",
}) {
  return (
    <footer className={`border-t bg-card/30 shrink-0 ${className}`}>
      <div className="mx-auto w-full max-w-5xl px-4 py-2.5 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <p className="font-semibold truncate">
          © {year} {brand} — {tagline}
        </p>
        <div className="flex gap-3 shrink-0">
          <a href="/about" className="hover:text-foreground transition-colors">About</a>
          <a href="https://chat.retakt.cc" className="hover:text-foreground transition-colors">NSFW</a>
        </div>
      </div>
      {/* Mobile bottom nav spacer */}
      <div className="h-16 md:hidden" />
    </footer>
  );
}
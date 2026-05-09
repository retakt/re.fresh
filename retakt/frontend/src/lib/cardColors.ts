// Cyberpunk color palettes - Each page has its own 3-color rotation
// Using DISTINCT colors: Lime Green, Vibrant Purple, Cyan Blue, Magenta Pink

// Home page: Lime Green, Vibrant Purple, Magenta
const HOME_PALETTES = [
  // Neon Lime GREEN (#39FF14)
  {
    gradient: "from-[#39FF14]/30 via-[#39FF14]/15 to-transparent",
    iconBg: "bg-[#39FF14]/15 dark:bg-[#39FF14]/20",
    iconColor: "text-[#39FF14]",
    playBg: "bg-[#39FF14]",
    badge: "bg-[#39FF14]/20 dark:bg-[#39FF14]/25 text-[#39FF14]",
    border: "border-[#39FF14]/50",
    shadow: "shadow-[0_0_15px_rgba(57,255,20,0.2)]",
    headerGradient: "from-[#39FF14]/30 via-[#39FF14]/12 to-card",
    hoverShadow: "hover:shadow-[0_0_30px_rgba(57,255,20,0.35)]",
  },
  // Vibrant Purple (#CD00FF)
  {
    gradient: "from-[#CD00FF]/30 via-[#CD00FF]/15 to-transparent",
    iconBg: "bg-[#CD00FF]/15 dark:bg-[#CD00FF]/20",
    iconColor: "text-[#CD00FF]",
    playBg: "bg-[#CD00FF]",
    badge: "bg-[#CD00FF]/20 dark:bg-[#CD00FF]/25 text-[#CD00FF]",
    border: "border-[#CD00FF]/50",
    shadow: "shadow-[0_0_15px_rgba(205,0,255,0.2)]",
    headerGradient: "from-[#CD00FF]/30 via-[#CD00FF]/12 to-card",
    hoverShadow: "hover:shadow-[0_0_30px_rgba(205,0,255,0.35)]",
  },
  // Hot Magenta (#FF2E9B)
  {
    gradient: "from-[#FF2E9B]/30 via-[#FF2E9B]/15 to-transparent",
    iconBg: "bg-[#FF2E9B]/15 dark:bg-[#FF2E9B]/20",
    iconColor: "text-[#FF2E9B]",
    playBg: "bg-[#FF2E9B]",
    badge: "bg-[#FF2E9B]/20 dark:bg-[#FF2E9B]/25 text-[#FF2E9B]",
    border: "border-[#FF2E9B]/50",
    shadow: "shadow-[0_0_15px_rgba(255,46,155,0.2)]",
    headerGradient: "from-[#FF2E9B]/30 via-[#FF2E9B]/12 to-card",
    hoverShadow: "hover:shadow-[0_0_30px_rgba(255,46,155,0.35)]",
  },
] as const;

// Blog page: Vibrant Purple, Lime Green, Magenta (NO CYAN)
const BLOG_PALETTES = [
  // Vibrant Purple (#CD00FF)
  {
    gradient: "from-[#CD00FF]/30 via-[#CD00FF]/15 to-transparent",
    iconBg: "bg-[#CD00FF]/15 dark:bg-[#CD00FF]/20",
    iconColor: "text-[#CD00FF]",
    playBg: "bg-[#CD00FF]",
    badge: "bg-[#CD00FF]/20 dark:bg-[#CD00FF]/25 text-[#CD00FF]",
    border: "border-[#CD00FF]/50",
    shadow: "shadow-[0_0_15px_rgba(205,0,255,0.2)]",
    headerGradient: "from-[#CD00FF]/30 via-[#CD00FF]/12 to-card",
    hoverShadow: "hover:shadow-[0_0_30px_rgba(205,0,255,0.35)]",
  },
  // Neon Lime GREEN (#39FF14)
  {
    gradient: "from-[#39FF14]/30 via-[#39FF14]/15 to-transparent",
    iconBg: "bg-[#39FF14]/15 dark:bg-[#39FF14]/20",
    iconColor: "text-[#39FF14]",
    playBg: "bg-[#39FF14]",
    badge: "bg-[#39FF14]/20 dark:bg-[#39FF14]/25 text-[#39FF14]",
    border: "border-[#39FF14]/50",
    shadow: "shadow-[0_0_15px_rgba(57,255,20,0.2)]",
    headerGradient: "from-[#39FF14]/30 via-[#39FF14]/12 to-card",
    hoverShadow: "hover:shadow-[0_0_30px_rgba(57,255,20,0.35)]",
  },
  // Hot Magenta (#FF2E9B)
  {
    gradient: "from-[#FF2E9B]/30 via-[#FF2E9B]/15 to-transparent",
    iconBg: "bg-[#FF2E9B]/15 dark:bg-[#FF2E9B]/20",
    iconColor: "text-[#FF2E9B]",
    playBg: "bg-[#FF2E9B]",
    badge: "bg-[#FF2E9B]/20 dark:bg-[#FF2E9B]/25 text-[#FF2E9B]",
    border: "border-[#FF2E9B]/50",
    shadow: "shadow-[0_0_15px_rgba(255,46,155,0.2)]",
    headerGradient: "from-[#FF2E9B]/30 via-[#FF2E9B]/12 to-card",
    hoverShadow: "hover:shadow-[0_0_30px_rgba(255,46,155,0.35)]",
  },
] as const;

// Music page: Vibrant Purple, Lime Green, Cyan
const MUSIC_PALETTES = [
  // Vibrant Purple (#CD00FF)
  {
    gradient: "from-[#CD00FF]/30 via-[#CD00FF]/15 to-transparent",
    iconBg: "bg-[#CD00FF]/15 dark:bg-[#CD00FF]/20",
    iconColor: "text-[#CD00FF]",
    playBg: "bg-[#CD00FF]",
    badge: "bg-[#CD00FF]/20 dark:bg-[#CD00FF]/25 text-[#CD00FF]",
    border: "border-[#CD00FF]/50",
    shadow: "shadow-[0_0_15px_rgba(205,0,255,0.2)]",
    headerGradient: "from-[#CD00FF]/30 via-[#CD00FF]/12 to-card",
    hoverShadow: "hover:shadow-[0_0_30px_rgba(205,0,255,0.35)]",
  },
  // Neon Lime GREEN (#39FF14)
  {
    gradient: "from-[#39FF14]/30 via-[#39FF14]/15 to-transparent",
    iconBg: "bg-[#39FF14]/15 dark:bg-[#39FF14]/20",
    iconColor: "text-[#39FF14]",
    playBg: "bg-[#39FF14]",
    badge: "bg-[#39FF14]/20 dark:bg-[#39FF14]/25 text-[#39FF14]",
    border: "border-[#39FF14]/50",
    shadow: "shadow-[0_0_15px_rgba(57,255,20,0.2)]",
    headerGradient: "from-[#39FF14]/30 via-[#39FF14]/12 to-card",
    hoverShadow: "hover:shadow-[0_0_30px_rgba(57,255,20,0.35)]",
  },
  // Electric Cyan BLUE (#00FFFF)
  {
    gradient: "from-[#00FFFF]/30 via-[#00FFFF]/15 to-transparent",
    iconBg: "bg-[#00FFFF]/15 dark:bg-[#00FFFF]/20",
    iconColor: "text-[#00FFFF]",
    playBg: "bg-[#00FFFF]",
    badge: "bg-[#00FFFF]/20 dark:bg-[#00FFFF]/25 text-[#00FFFF]",
    border: "border-[#00FFFF]/50",
    shadow: "shadow-[0_0_15px_rgba(0,255,255,0.2)]",
    headerGradient: "from-[#00FFFF]/30 via-[#00FFFF]/12 to-card",
    hoverShadow: "hover:shadow-[0_0_30px_rgba(0,255,255,0.35)]",
  },
] as const;

// Tutorials page: Magenta, Cyan Blue, Lime Green
const TUTORIALS_PALETTES = [
  // Hot Magenta (#FF2E9B)
  {
    gradient: "from-[#FF2E9B]/30 via-[#FF2E9B]/15 to-transparent",
    iconBg: "bg-[#FF2E9B]/15 dark:bg-[#FF2E9B]/20",
    iconColor: "text-[#FF2E9B]",
    playBg: "bg-[#FF2E9B]",
    badge: "bg-[#FF2E9B]/20 dark:bg-[#FF2E9B]/25 text-[#FF2E9B]",
    border: "border-[#FF2E9B]/50",
    shadow: "shadow-[0_0_15px_rgba(255,46,155,0.2)]",
    headerGradient: "from-[#FF2E9B]/30 via-[#FF2E9B]/12 to-card",
    hoverShadow: "hover:shadow-[0_0_30px_rgba(255,46,155,0.35)]",
  },
  // Electric Cyan BLUE (#00FFFF)
  {
    gradient: "from-[#00FFFF]/30 via-[#00FFFF]/15 to-transparent",
    iconBg: "bg-[#00FFFF]/15 dark:bg-[#00FFFF]/20",
    iconColor: "text-[#00FFFF]",
    playBg: "bg-[#00FFFF]",
    badge: "bg-[#00FFFF]/20 dark:bg-[#00FFFF]/25 text-[#00FFFF]",
    border: "border-[#00FFFF]/50",
    shadow: "shadow-[0_0_15px_rgba(0,255,255,0.2)]",
    headerGradient: "from-[#00FFFF]/30 via-[#00FFFF]/12 to-card",
    hoverShadow: "hover:shadow-[0_0_30px_rgba(0,255,255,0.35)]",
  },
  // Neon Lime GREEN (#39FF14)
  {
    gradient: "from-[#39FF14]/30 via-[#39FF14]/15 to-transparent",
    iconBg: "bg-[#39FF14]/15 dark:bg-[#39FF14]/20",
    iconColor: "text-[#39FF14]",
    playBg: "bg-[#39FF14]",
    badge: "bg-[#39FF14]/20 dark:bg-[#39FF14]/25 text-[#39FF14]",
    border: "border-[#39FF14]/50",
    shadow: "shadow-[0_0_15px_rgba(57,255,20,0.2)]",
    headerGradient: "from-[#39FF14]/30 via-[#39FF14]/12 to-card",
    hoverShadow: "hover:shadow-[0_0_30px_rgba(57,255,20,0.35)]",
  },
] as const;

type PageType = 'home' | 'blog' | 'music' | 'tutorials';

export function getCardPalette(seed: string, page: PageType = 'home') {
  // Simple deterministic hash from string - rotates through 3 cyberpunk colors
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) & 0xffffffff;
  }
  
  // Select palette based on page
  const palettes = {
    home: HOME_PALETTES,
    blog: BLOG_PALETTES,
    music: MUSIC_PALETTES,
    tutorials: TUTORIALS_PALETTES,
  }[page];
  
  return palettes[Math.abs(hash) % palettes.length];
}

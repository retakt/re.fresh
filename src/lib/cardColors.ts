export const CARD_PALETTES = [
  {
    gradient: "from-pink-500/15 via-pink-500/5 to-transparent",
    iconBg: "bg-pink-50 dark:bg-pink-950/40",
    iconColor: "text-pink-500",
    playBg: "bg-pink-500",
    badge: "bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400",
    border: "border-pink-100/60 dark:border-pink-900/20",
    headerGradient: "from-pink-500/20 via-pink-500/5 to-transparent",
    hoverShadow: "hover:shadow-pink-500/10 dark:hover:shadow-pink-500/15",
  },
  {
    gradient: "from-cyan-500/15 via-cyan-500/5 to-transparent",
    iconBg: "bg-cyan-50 dark:bg-cyan-950/40",
    iconColor: "text-cyan-500",
    playBg: "bg-cyan-500",
    badge: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400",
    border: "border-cyan-100/60 dark:border-cyan-900/20",
    headerGradient: "from-cyan-500/20 via-cyan-500/5 to-transparent",
    hoverShadow: "hover:shadow-cyan-500/10 dark:hover:shadow-cyan-500/15",
  },
  {
    gradient: "from-violet-500/15 via-violet-500/5 to-transparent",
    iconBg: "bg-violet-50 dark:bg-violet-950/40",
    iconColor: "text-violet-500",
    playBg: "bg-violet-500",
    badge: "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400",
    border: "border-violet-100/60 dark:border-violet-900/20",
    headerGradient: "from-violet-500/20 via-violet-500/5 to-transparent",
    hoverShadow: "hover:shadow-violet-500/10 dark:hover:shadow-violet-500/15",
  },
  {
    gradient: "from-amber-500/15 via-amber-500/5 to-transparent",
    iconBg: "bg-amber-50 dark:bg-amber-950/40",
    iconColor: "text-amber-500",
    playBg: "bg-amber-500",
    badge: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    border: "border-amber-100/60 dark:border-amber-900/20",
    headerGradient: "from-amber-500/20 via-amber-500/5 to-transparent",
    hoverShadow: "hover:shadow-amber-500/10 dark:hover:shadow-amber-500/15",
  },
  {
    gradient: "from-emerald-500/15 via-emerald-500/5 to-transparent",
    iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
    iconColor: "text-emerald-500",
    playBg: "bg-emerald-500",
    badge: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-100/60 dark:border-emerald-900/20",
    headerGradient: "from-emerald-500/20 via-emerald-500/5 to-transparent",
    hoverShadow: "hover:shadow-emerald-500/10 dark:hover:shadow-emerald-500/15",
  },
  {
    gradient: "from-rose-500/15 via-rose-500/5 to-transparent",
    iconBg: "bg-rose-50 dark:bg-rose-950/40",
    iconColor: "text-rose-500",
    playBg: "bg-rose-500",
    badge: "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400",
    border: "border-rose-100/60 dark:border-rose-900/20",
    headerGradient: "from-rose-500/20 via-rose-500/5 to-transparent",
    hoverShadow: "hover:shadow-rose-500/10 dark:hover:shadow-rose-500/15",
  },
  {
    gradient: "from-indigo-500/15 via-indigo-500/5 to-transparent",
    iconBg: "bg-indigo-50 dark:bg-indigo-950/40",
    iconColor: "text-indigo-500",
    playBg: "bg-indigo-500",
    badge: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400",
    border: "border-indigo-100/60 dark:border-indigo-900/20",
    headerGradient: "from-indigo-500/20 via-indigo-500/5 to-transparent",
    hoverShadow: "hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/15",
  },
  {
    gradient: "from-teal-500/15 via-teal-500/5 to-transparent",
    iconBg: "bg-teal-50 dark:bg-teal-950/40",
    iconColor: "text-teal-500",
    playBg: "bg-teal-500",
    badge: "bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400",
    border: "border-teal-100/60 dark:border-teal-900/20",
    headerGradient: "from-teal-500/20 via-teal-500/5 to-transparent",
    hoverShadow: "hover:shadow-teal-500/10 dark:hover:shadow-teal-500/15",
  },
] as const;

export function getCardPalette(seed: string) {
  // Simple deterministic hash from string
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) & 0xffffffff;
  }
  return CARD_PALETTES[Math.abs(hash) % CARD_PALETTES.length];
}
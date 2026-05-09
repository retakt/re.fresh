import { Globe } from "lucide-react";
import { motion } from "motion/react";
import { PullToRefreshIndicator } from "@/components/ui/pull-to-refresh.tsx";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { FaGithub, FaSpotify, FaTelegram } from "react-icons/fa";
import { SiGmail } from "react-icons/si";
import { ContributionGraph, type ContributionData } from "@/components/ui/smoothui/contribution-graph";

/* ---------------- SOCIAL LINKS ---------------- */

const SOCIAL_LINKS = [
  {
    icon: () => <FaGithub className="w-4 h-4" />,
    href: "https://github.com/retakt",
    activeColor: "hover:text-white active:text-white hover:bg-zinc-800 active:bg-zinc-800",
    glowColor: "active:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]",
  },
  {
    icon: () => <SiGmail className="w-4 h-4" />,
    href: "mailto:hello@retakt.com",
    activeColor: "hover:text-red-400 active:text-red-400 hover:bg-red-500/10 active:bg-red-500/10",
    glowColor: "active:drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]",
  },
  {
    icon: () => <FaSpotify className="w-4 h-4" />,
    href: "...",
    activeColor: "hover:text-[#1DB954] active:text-[#1DB954] hover:bg-[#1DB954]/10 active:bg-[#1DB954]/10",
    glowColor: "active:drop-shadow-[0_0_8px_rgba(29,185,84,0.4)]",
  },
  {
    icon: () => <Globe className="w-3.5 h-3.5" />,
    href: "...",
    activeColor: "hover:text-blue-400 active:text-blue-400 hover:bg-blue-400/10 active:bg-blue-400/10",
    glowColor: "active:drop-shadow-[0_0_8px_rgba(96,165,250,0.4)]",
  },
  {
    icon: () => <FaTelegram className="w-4 h-4" />,
    href: "https://t.me/akiratakt7",
    activeColor: "hover:text-[#26A5E4] active:text-[#26A5E4] hover:bg-[#26A5E4]/10 active:bg-[#26A5E4]/10",
    glowColor: "active:drop-shadow-[0_0_8px_rgba(38,165,228,0.4)]",
  },
];

/* ---------------- FACTS ---------------- */

const FACTS = [
  "Music production & sound design",
  "Lazy~Life Enjoyer",
  "Open source is a right!",
];

/* ---------------- SAMPLE CONTRIBUTION DATA ---------------- */

// Generate contribution data for 2026 with specific pattern
const generateSampleData = (): ContributionData[] => {
  const data: ContributionData[] = [];
  const year = 2026;
  
  // March 1st to May 7th, 2026 - random data
  const startDate = new Date(year, 2, 1); // March 1st (month is 0-indexed)
  const endDate = new Date(year, 4, 7);   // May 7th
  
  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().split('T')[0];
    
    // Generate random contribution data with more variation
    const random = Math.random();
    
    if (random > 0.3) { // 70% chance of having some activity in active period
      const count = Math.floor(Math.random() * 25) + 1;
      let level = 0;
      
      if (count >= 20) level = 4;
      else if (count >= 15) level = 3;
      else if (count >= 8) level = 2;
      else if (count >= 3) level = 1;
      else level = 0;
      
      // Only add to data if level > 0 (this creates the empty squares)
      if (level > 0) {
        data.push({
          date: dateStr,
          count,
          level
        });
      }
    }
  }
  
  return data;
};

/* ---------------- PAGE ---------------- */

export default function AboutPage() {
  const { pullDistance, refreshing, isTriggered } = usePullToRefresh({
    onRefresh: async () => { /* static page — just a visual refresh */ },
  });

  return (
    <div className="max-w-xl space-y-10">
      <PullToRefreshIndicator pullDistance={pullDistance} refreshing={refreshing} isTriggered={isTriggered} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="space-y-2"
      >
        <h1 className="font-bold tracking-tight" style={{ fontSize: "clamp(18px, 5vw, 24px)" }}>About</h1>
        <p className="text-muted-foreground leading-relaxed" style={{ fontSize: "clamp(12px, 3vw, 14px)" }}>
          Coming soon...
        </p>
      </motion.div>

      {/* Facts */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" }}
        className="space-y-2"
      >
        <h2
          className="font-bold uppercase tracking-widest text-muted-foreground"
          style={{ fontSize: "clamp(9px, 2.5vw, 11px)" }}
        >
          Facts
        </h2>

        <ul className="space-y-1.5">
          {FACTS.map((fact) => (
            <li
              key={fact}
              className="flex items-center gap-2.5 text-foreground"
              style={{ fontSize: "clamp(12px, 3vw, 14px)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              {fact}
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Social Links */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.18, ease: "easeOut" }}
        className="space-y-2"
      >
        <h2
          className="font-bold uppercase tracking-widest text-muted-foreground"
          style={{ fontSize: "clamp(9px, 2.5vw, 11px)" }}
        >
          Find me
        </h2>

        <div className="flex flex-wrap gap-2">
          {SOCIAL_LINKS.map(({ icon: IconComp, href, activeColor, glowColor }, i) => (
            <a
              key={i}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
              className={`group flex items-center justify-center p-2.5 rounded-xl border bg-card text-muted-foreground transition-all duration-150 ${activeColor} ${glowColor}`}
            >
              <IconComp />
            </a>
          ))}
        </div>
      </motion.div>

      {/* Activity Graph */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.26, ease: "easeOut" }}
        className="space-y-3"
      >
        <h2
          className="font-bold uppercase tracking-widest text-muted-foreground"
          style={{ fontSize: "clamp(9px, 2.5vw, 11px)" }}
        >
          Activity
        </h2>
        
        <div className="w-full p-4 rounded-xl border bg-card">
          <ContributionGraph 
            data={generateSampleData()} 
            year={2026}
            showLegend={true}
            showTooltips={true}
            className="w-full"
          />
        </div>
      </motion.div>
    </div>
  );
}
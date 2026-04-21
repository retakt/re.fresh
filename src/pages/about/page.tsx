import { Globe } from "lucide-react";
import { motion } from "motion/react";

import { siSpotify, siGithub, siTelegram, siGmail } from "simple-icons";

/* ---------------- ICON WRAPPER ---------------- */

function Icon({ icon }: { icon: { path: string } }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-4 h-4 fill-current transition-colors"
    >
      <path d={icon.path} />
    </svg>
  );
}

/* ---------------- SOCIAL LINKS ---------------- */

const SOCIAL_LINKS = [
  {
    icon: () => <Icon icon={siGithub} />,
    href: "https://github.com/retakt",
    color: "hover:text-white"
  },
  {
    icon: () => <Icon icon={siGmail} />,
    href: "mailto:hello@retakt.com",
    color: "hover:text-red-400"
  },
  {
    icon: () => <Icon icon={siSpotify} />,
    href: "...",
    color: "hover:text-[#1DB954]"
  },
  {
    icon: () => <Globe className="w-3.5 h-3.5" />,
    href: "...",
    color: "hover:text-blue-400"
  },
  {
    icon: () => <Icon icon={siTelegram} />,
    href: "https://t.me/akiratakt7",
    color: "hover:text-[#26A5E4]"
  }
];

/* ---------------- FACTS ---------------- */

const FACTS = [
  "Music production & sound design",
  "Lazy~Life Enjoyer",
  "Open source is a right!",
  "Stuck in Matrix... or am I?"
];

/* ---------------- PAGE ---------------- */

export default function AboutPage() {
  return (
    <div className="max-w-xl space-y-10">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="space-y-3"
      >
        <h1 className="text-2xl font-bold tracking-tight">About</h1>
        <p className="text-muted-foreground leading-relaxed">
          Coming soon...
        </p>
      </motion.div>

      {/* Facts */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" }}
        className="space-y-3"
      >
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Facts
        </h2>

        <ul className="space-y-2">
          {FACTS.map((fact) => (
            <li
              key={fact}
              className="flex items-center gap-2.5 text-sm text-foreground"
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
        className="space-y-3"
      >
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Find me
        </h2>

        <div className="flex flex-wrap gap-2">
          {SOCIAL_LINKS.map(({ icon: IconComp, href, color }, i) => (
            <a
              key={i}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`group flex items-center justify-center p-2 rounded-lg border bg-card text-muted-foreground transition-colors ${color}`}
            >
              <IconComp />
            </a>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
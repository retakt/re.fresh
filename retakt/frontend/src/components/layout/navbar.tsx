import { Link } from "react-router-dom";
import { motion } from "motion/react";
import UserMenu from "@/components/account/user-menu.tsx";
import AnimatedMenuIcon from "@/components/ui/animated-menu-icon.tsx";
import { CommandPalette } from "@/components/ui/command-palette.tsx";

interface NavbarProps {
  onMenuToggle: () => void;
  isNavOpen: boolean;
}

export default function Navbar({ onMenuToggle, isNavOpen }: NavbarProps) {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-2 focus-visible:left-2 focus-visible:z-[100] bg-primary text-primary-foreground px-3 py-2 rounded text-sm font-medium"
      >
        Skip to main content
      </a>

      <header className="w-full z-50 relative bg-background border-b border-border/20">
        {/* Top neon accent line */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

        <div className="flex h-14 w-full items-center gap-3 px-4 lg:px-8">

          {/* LEFT: Animated hamburger — larger hit area */}
          <AnimatedMenuIcon
            isOpen={isNavOpen}
            onClick={onMenuToggle}
            size={28}
          />

          {/* TITLE — left aligned, next to hamburger */}
          <Link
            to="/"
            className="flex items-baseline gap-1.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary select-none"
            aria-label="re.Takt — homepage"
          >
            <motion.span
              className={[
                /* mobile: heavier weight, same size */
                "font-black tracking-tight",
                /* desktop: bigger size + weight */
                "text-lg md:text-xl md:font-black",
              ].join(" ")}
              whileHover={{ scale: 1.05, rotate: [0, -3, 3, -2, 2, 0] }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.4 }}
            >
              <span style={{ color: 'var(--neon-lime)' }}>re</span>
              <span style={{ color: 'var(--neon-pink)' }}>.</span>Takt
            </motion.span>
            {/* JP label — desktop only, bigger */}
            <span className="hidden md:block text-[11px] font-mono tracking-[0.35em]" style={{ color: 'var(--neon-yellow)' }}>
              再生
            </span>
          </Link>

          {/* SPACER */}
          <div className="flex-1" />

          {/* RIGHT: Actions */}
          <div className="flex items-center gap-0.5">
            <CommandPalette />
            <UserMenu />
          </div>

        </div>

        {/* Bottom border */}
        <div className="h-px w-full bg-border/15" />
      </header>
    </>
  );
}

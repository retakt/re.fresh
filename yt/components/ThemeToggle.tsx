import { Sun, Moon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

export function ThemeToggle({
  theme,
  onChange,
}: {
  theme: "light" | "dark";
  onChange: (theme: "light" | "dark") => void;
}) {
  const isDark = theme === "dark";
  const shouldReduceMotion = useReducedMotion();

  const handleClick = () => {
    console.log("ThemeToggle clicked - but disabled!");
    // onChange is intentionally not called - locked to dark mode
  };

  return (
    <button
      onClick={handleClick}
      role="switch"
      aria-checked={isDark}
      aria-label="Theme toggle disabled"
      disabled
      className={cn(
        "relative flex items-center rounded-full p-1 transition-colors cursor-not-allowed opacity-50",
        "w-14 h-7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "bg-[#191919] focus-visible:ring-[#ed2236]"
      )}
    >
      {/* Sliding circle with icon - locked to dark/moon */}
      <motion.div
        className="absolute w-5 h-5 rounded-full flex items-center justify-center shadow-sm bg-[#e1e1e1]"
        animate={{ x: 28 }}
        transition={{ duration: 0 }}
      >
        <Moon size={12} className="text-black" />
      </motion.div>
    </button>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

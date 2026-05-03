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

  return (
    <button
      onClick={() => onChange(isDark ? "light" : "dark")}
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      className={cn(
        "relative flex items-center rounded-full p-1 transition-colors",
        "w-14 h-7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        isDark 
          ? "bg-[#191919] focus-visible:ring-[#ed2236]" 
          : "bg-[#e8e4d9] focus-visible:ring-[#ff0000]"
      )}
    >
      {/* Sliding circle with icon */}
      <motion.div
        className={cn(
          "absolute w-5 h-5 rounded-full flex items-center justify-center shadow-sm",
          isDark ? "bg-[#e1e1e1]" : "bg-[#2a2a2a]"
        )}
        animate={{
          x: isDark ? 28 : 2,
        }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : {
                type: "spring",
                stiffness: 500,
                damping: 30,
              }
        }
      >
        <motion.div
          key={isDark ? "moon" : "sun"}
          initial={shouldReduceMotion ? false : { scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={shouldReduceMotion ? undefined : { scale: 0, opacity: 0 }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : {
                  type: "spring",
                  stiffness: 400,
                  damping: 25,
                }
          }
        >
          {isDark ? (
            <Moon size={12} className="text-black" />
          ) : (
            <Sun size={12} className="text-white" />
          )}
        </motion.div>
      </motion.div>
    </button>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

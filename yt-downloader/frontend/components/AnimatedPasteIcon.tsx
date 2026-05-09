import { motion } from "motion/react";
import { Clipboard } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnimatedPasteIconProps {
  isAnimating: boolean;
  className?: string;
  size?: number;
}

export function AnimatedPasteIcon({ 
  isAnimating, 
  className,
  size = 16 
}: AnimatedPasteIconProps) {
  return (
    <motion.div
      className={cn("relative inline-flex items-center justify-center", className)}
      animate={isAnimating ? {
        scale: [1, 1.2, 1],
        rotate: [0, -5, 5, 0],
      } : {}}
      transition={{
        duration: 0.5,
        ease: "easeInOut",
      }}
    >
      <Clipboard size={size} />
    </motion.div>
  );
}

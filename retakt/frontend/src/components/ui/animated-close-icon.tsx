"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface AnimatedCloseIconProps {
  onClick?: () => void;
  className?: string;
  size?: number;
}

export default function AnimatedCloseIcon({ 
  onClick,
  className = "", 
  size = 50 
}: AnimatedCloseIconProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "bg-transparent border-none cursor-pointer flex items-center justify-center text-muted-foreground/60 hover:text-muted-foreground transition-colors shrink-0 relative outline-none focus:outline-none focus-visible:outline-none",
        className
      )}
      style={{ width: size, height: size }}
    >
      {/* Top-left line - starts from edge, shrinks toward center */}
      <motion.span
        className="absolute bg-current origin-left"
        style={{
          height: "2px",
          left: `${size * 0.14}px`,
          top: `${size * 0.14}px`,
          transform: "rotate(45deg)",
        }}
        animate={{ width: isHovered ? `${size * 0.2}px` : `${size * 0.42}px` }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      />
      
      {/* Top-right line - starts from edge, shrinks toward center */}
      <motion.span
        className="absolute bg-current origin-right"
        style={{
          height: "2px",
          right: `${size * 0.14}px`,
          top: `${size * 0.14}px`,
          transform: "rotate(-45deg)",
        }}
        animate={{ width: isHovered ? `${size * 0.2}px` : `${size * 0.42}px` }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      />
      
      {/* Bottom-left line - starts from edge, shrinks toward center */}
      <motion.span
        className="absolute bg-current origin-left"
        style={{
          height: "2px",
          left: `${size * 0.16}px`,
          bottom: `${size * 0.12}px`,
          transform: "rotate(-45deg)",
        }}
        animate={{ width: isHovered ? `${size * 0.2}px` : `${size * 0.42}px` }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      />
      
      {/* Bottom-right line - starts from edge, shrinks toward center */}
      <motion.span
        className="absolute bg-current origin-right"
        style={{
          height: "2px",
          right: `${size * 0.16}px`,
          bottom: `${size * 0.12}px`,
          transform: "rotate(45deg)",
        }}
        animate={{ width: isHovered ? `${size * 0.2}px` : `${size * 0.42}px` }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      />

      {/* "close" label */}
      <motion.span
        className="font-medium relative z-10"
        style={{ fontSize: `${size * 0.32}px` }}
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        close
      </motion.span>
    </button>
  );
}

"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface AnimatedMenuIconProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
  size?: number;
}

export default function AnimatedMenuIcon({ 
  isOpen, 
  onClick,
  className = "", 
  size = 24 
}: AnimatedMenuIconProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Toggle navigation menu"
      aria-expanded={isOpen}
      className={cn(
        "bg-transparent border-none cursor-pointer flex p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0",
        className
      )}
    >
      <svg width={size} height={size} viewBox="0 0 100 100">
        <path
          className="line line1"
          d="M 20,29.000046 H 80.000231 C 80.000231,29.000046 94.498839,28.817352 94.532987,66.711331 94.543142,77.980673 90.966081,81.670246 85.259173,81.668997 79.552261,81.667751 75.000211,74.999942 75.000211,74.999942 L 25.000021,25.000058"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: isOpen ? "90 207" : "60 207",
            strokeDashoffset: isOpen ? "-134" : "0",
            transition: "stroke-dasharray 600ms cubic-bezier(0.4, 0, 0.2, 1), stroke-dashoffset 600ms cubic-bezier(0.4, 0, 0.2, 1)"
          }}
        />
        <path
          className="line line2"
          d="M 20,50 H 80"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          style={{
            strokeDasharray: isOpen ? "1 60" : "60 60",
            strokeDashoffset: isOpen ? "-30" : "0",
            transition: "stroke-dasharray 600ms cubic-bezier(0.4, 0, 0.2, 1), stroke-dashoffset 600ms cubic-bezier(0.4, 0, 0.2, 1)"
          }}
        />
        <path
          className="line line3"
          d="M 20,70.999954 H 80.000231 C 80.000231,70.999954 94.498839,71.182648 94.532987,33.288669 94.543142,22.019327 90.966081,18.329754 85.259173,18.331003 79.552261,18.332249 75.000211,25.000058 75.000211,25.000058 L 25.000021,74.999942"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: isOpen ? "90 207" : "60 207",
            strokeDashoffset: isOpen ? "-134" : "0",
            transition: "stroke-dasharray 600ms cubic-bezier(0.4, 0, 0.2, 1), stroke-dashoffset 600ms cubic-bezier(0.4, 0, 0.2, 1)"
          }}
        />
      </svg>
    </button>
  );
}
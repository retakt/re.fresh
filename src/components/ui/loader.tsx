/**
 * Pulse loader — hollow circle (ring) that pulses in/out.
 * Used to indicate AI is generating before first token arrives.
 */

import { cn } from "@/lib/utils";
import type { FC } from "react";

interface LoaderProps {
  className?: string;
}

export const PulseLoader: FC<LoaderProps> = ({ className }) => (
  <span
    aria-label="Generating…"
    className={cn("inline-flex items-center", className)}
  >
    <span
      className="block size-7 rounded-full border-2 border-primary bg-transparent"
      style={{ animation: "pulse-ring 1.4s ease-in-out infinite" }}
    />
    <style>{`
      @keyframes pulse-ring {
        0%, 100% { transform: scale(0.6); opacity: 0.3; }
        50%       { transform: scale(1);   opacity: 1;   }
      }
    `}</style>
  </span>
);

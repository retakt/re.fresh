"use client";

import {
  useState,
  useRef,
  useEffect,
  useId,
  useMemo,
  useCallback,
} from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { MicIcon } from "lucide-react";

function GooeyFilter({
  filterId,
  blur,
}: {
  filterId: string;
  blur: number;
}) {
  return (
    <svg className="absolute hidden h-0 w-0" aria-hidden>
      <defs>
        <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
    </svg>
  );
}

function VoiceIcon({ layoutId }: { layoutId: string }) {
  return (
    <motion.svg
      layoutId={layoutId}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      className="size-4 shrink-0"
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </motion.svg>
  );
}

const transition = {
  duration: 0.4,
  type: "spring" as const,
  bounce: 0.25,
};

const iconBubbleVariants = {
  collapsed: { scale: 0, opacity: 0 },
  expanded: { scale: 1, opacity: 1 },
};

export interface GooeyVoiceButtonProps {
  className?: string;
  collapsedWidth?: number;
  expandedWidth?: number;
  expandedOffset?: number;
  gooeyBlur?: number;
  disabled?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function GooeyVoiceButton({
  className,
  collapsedWidth = 40,
  expandedWidth = 100,
  expandedOffset = 50,
  gooeyBlur = 5,
  disabled = true,
  onOpenChange,
}: GooeyVoiceButtonProps) {
  const reactId = useId();
  const safeId = reactId.replace(/:/g, "");
  const filterId = `gooey-voice-filter-${safeId}`;
  const iconLayoutId = `gooey-voice-icon-${safeId}`;

  const prevExpandedRef = useRef(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const setExpanded = useCallback(
    (next: boolean) => {
      setIsExpanded(next);
      onOpenChange?.(next);
    },
    [onOpenChange],
  );

  useEffect(() => {
    prevExpandedRef.current = isExpanded;
  }, [isExpanded]);

  const buttonVariants = useMemo(
    () => ({
      collapsed: { width: collapsedWidth, marginLeft: 0 },
      expanded: { width: expandedWidth, marginLeft: expandedOffset },
    }),
    [collapsedWidth, expandedWidth, expandedOffset],
  );

  const handleExpand = useCallback(() => {
    if (!disabled) setExpanded(true);
  }, [disabled, setExpanded]);

  const surfaceClass = disabled
    ? "bg-primary/40 text-primary border-2 border-primary/60 cursor-not-allowed shadow-sm"
    : "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-sm";

  return (
    <div
      className={cn(
        "relative flex items-center justify-center",
        className,
      )}
    >
      <GooeyFilter filterId={filterId} blur={gooeyBlur} />

      <div
        className="relative flex h-8 items-center justify-center"
        style={{ filter: `url(#${filterId})` }}
      >
        <motion.div
          className="flex h-8 items-center justify-center"
          variants={buttonVariants}
          initial="collapsed"
          animate={isExpanded ? "expanded" : "collapsed"}
          transition={transition}
        >
          <button
            type="button"
            disabled={disabled}
            onClick={handleExpand}
            className={cn(
              "flex h-8 w-full cursor-pointer items-center justify-center gap-2 rounded-full px-3 text-sm font-medium outline-none transition-[color,box-shadow] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none",
              surfaceClass,
            )}
          >
            {!isExpanded ? (
              <VoiceIcon layoutId={iconLayoutId} />
            ) : null}
            <motion.span
              className={cn(
                "text-xs font-semibold",
                isExpanded ? "" : "pointer-events-none",
              )}
            >
              {isExpanded ? "Voice" : ""}
            </motion.span>
          </button>
        </motion.div>

        <motion.div
          className="absolute top-1/2 left-0 flex size-8 -translate-y-1/2 items-center justify-center"
          variants={iconBubbleVariants}
          initial="collapsed"
          animate={isExpanded ? "expanded" : "collapsed"}
          transition={transition}
        >
          <div
            className={cn(
              "flex size-8 items-center justify-center rounded-full",
              surfaceClass,
            )}
          >
            <VoiceIcon layoutId={iconLayoutId} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

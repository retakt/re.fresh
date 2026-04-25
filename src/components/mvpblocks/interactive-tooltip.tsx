'use client';

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'motion/react';
import { useState, useEffect } from 'react';

/**
 * AvatarTooltip — spring-animated tooltip below the avatar.
 * Desktop only — hover doesn't exist on touch devices so we
 * skip rendering entirely when the primary pointer is coarse (touch).
 */
export function AvatarTooltip({
  label,
  children,
}: {
  label: string | null | undefined;
  children: React.ReactNode;
}) {
  // Detect touch/coarse pointer — skip tooltip entirely on mobile
  const [isFinePointer, setIsFinePointer] = useState(false);

  useEffect(() => {
    setIsFinePointer(window.matchMedia("(pointer: fine)").matches);
  }, []);

  const [hovered, setHovered] = useState(false);
  const springConfig = { stiffness: 120, damping: 5 };

  const x = useMotionValue(0);
  const rotate = useSpring(
    useTransform(x, [-100, 100], [-45, 45]),
    springConfig,
  );
  const translateX = useSpring(
    useTransform(x, [-100, 100], [-52, 52]),
    springConfig,
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
  };

  // No label or touch device — just render children as-is
  if (!label || !isFinePointer) return <>{children}</>;

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); x.set(0); }}
      onMouseMove={handleMouseMove}
    >
      {children}

      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.85 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: { type: 'spring', stiffness: 260, damping: 12 },
            }}
            exit={{ opacity: 0, y: -8, scale: 0.85 }}
            style={{
              translateX,
              rotate,
              whiteSpace: 'nowrap',
              top: 'calc(100% + 8px)',
              left: '50%',
              x: '-50%',
            }}
            className="absolute z-[80] pointer-events-none"
          >
            <div className="relative flex flex-col items-center justify-center rounded-lg border border-border/60 bg-background/95 px-3 py-1.5 text-xs shadow-xl backdrop-blur-sm">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-primary/5 via-transparent to-primary/5" />
              <div className="absolute inset-x-0 -top-px h-px w-[40%] mx-auto bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
              <span className="relative z-10 font-semibold text-foreground">
                @{label}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface SwipeBackOptions {
  threshold?: number;   // px horizontal swipe needed (default 80)
  edgeZone?: number;    // px from left edge to start tracking (default 30)
  disabled?: boolean;
}

/**
 * Swipe-back gesture for mobile — swipe right from the left edge to go back.
 * Only activates when starting from within `edgeZone` px of the left edge.
 */
export function useSwipeBack({
  threshold = 80,
  edgeZone = 30,
  disabled = false,
}: SwipeBackOptions = {}) {
  const navigate = useNavigate();
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const tracking = useRef(false);

  useEffect(() => {
    if (disabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch.clientX <= edgeZone) {
        startX.current = touch.clientX;
        startY.current = touch.clientY;
        tracking.current = true;
      } else {
        tracking.current = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!tracking.current || startX.current === null || startY.current === null) return;
      const touch = e.touches[0];
      const dx = touch.clientX - startX.current;
      const dy = Math.abs(touch.clientY - startY.current);

      // If more vertical than horizontal, cancel
      if (dy > dx) {
        tracking.current = false;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!tracking.current || startX.current === null) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - startX.current;

      if (dx >= threshold) {
        navigate(-1);
      }

      startX.current = null;
      startY.current = null;
      tracking.current = false;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [disabled, edgeZone, navigate, threshold]);
}

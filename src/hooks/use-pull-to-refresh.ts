import { useCallback, useEffect, useRef, useState } from 'react';

interface PullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;       // px to pull before triggering (default 72)
  maxPull?: number;         // max px to pull (default 120)
  disabled?: boolean;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 72,
  maxPull = 120,
  disabled = false,
}: PullToRefreshOptions) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const pulling = useRef(false);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (disabled || refreshing) return;
      // Only trigger when at the very top of the page
      if (window.scrollY > 0) return;
      startY.current = e.touches[0].clientY;
      pulling.current = false;
    },
    [disabled, refreshing]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (disabled || refreshing || startY.current === null) return;
      const currentY = e.touches[0].clientY;
      const delta = currentY - startY.current;

      if (delta <= 0) {
        setPullDistance(0);
        pulling.current = false;
        return;
      }

      pulling.current = true;
      // Apply rubber-band resistance
      const resistance = 0.4;
      const distance = Math.min(delta * resistance, maxPull);
      setPullDistance(distance);

      // Prevent default scroll when pulling
      if (distance > 4) {
        e.preventDefault();
      }
    },
    [disabled, refreshing, maxPull]
  );

  const handleTouchEnd = useCallback(async () => {
    if (disabled || !pulling.current) {
      startY.current = null;
      setPullDistance(0);
      return;
    }

    startY.current = null;
    pulling.current = false;

    if (pullDistance >= threshold) {
      setRefreshing(true);
      setPullDistance(0);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    } else {
      setPullDistance(0);
    }
  }, [disabled, pullDistance, threshold, onRefresh]);

  useEffect(() => {
    const el = document.documentElement;
    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { pullDistance, refreshing, isTriggered: pullDistance >= threshold };
}

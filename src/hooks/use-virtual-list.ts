import { useCallback, useEffect, useRef, useState } from 'react';

interface VirtualListOptions {
  itemCount: number;
  itemHeight: number;       // estimated item height in px
  overscan?: number;        // extra items to render above/below viewport
  containerRef: React.RefObject<HTMLElement | null>;
}

interface VirtualListResult {
  virtualItems: Array<{ index: number; offsetTop: number }>;
  totalHeight: number;
  scrollToIndex: (index: number) => void;
}

/**
 * Lightweight virtual list hook — no extra dependencies.
 * Only renders items visible in the viewport + overscan buffer.
 * Use when list has 50+ items.
 */
export function useVirtualList({
  itemCount,
  itemHeight,
  overscan = 5,
  containerRef,
}: VirtualListOptions): VirtualListResult {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    ro.observe(container);

    const handleScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setScrollTop(window.scrollY);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [containerRef]);

  const totalHeight = itemCount * itemHeight;

  // Calculate which items are visible
  const containerTop = containerRef.current?.getBoundingClientRect().top ?? 0;
  const adjustedScrollTop = Math.max(0, scrollTop - containerTop);

  const startIndex = Math.max(0, Math.floor(adjustedScrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    itemCount - 1,
    Math.ceil((adjustedScrollTop + containerHeight) / itemHeight) + overscan
  );

  const virtualItems = [];
  for (let i = startIndex; i <= endIndex; i++) {
    virtualItems.push({ index: i, offsetTop: i * itemHeight });
  }

  const scrollToIndex = useCallback(
    (index: number) => {
      const container = containerRef.current;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const targetTop = containerRect.top + window.scrollY + index * itemHeight;
      window.scrollTo({ top: targetTop, behavior: 'smooth' });
    },
    [containerRef, itemHeight]
  );

  return { virtualItems, totalHeight, scrollToIndex };
}

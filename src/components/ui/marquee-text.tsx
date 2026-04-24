import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * MarqueeText — scrolls right-to-left only when text overflows its container.
 * Static when text fits. Two-copy seamless loop when overflowing.
 *
 * Key fix: the invisible spacer must have real height (not h-0) so the
 * container has a measured height for the absolutely-positioned copies.
 * We use `aria-hidden` + `select-none` + `pointer-events-none` to hide it
 * from users while keeping it in layout flow.
 */
export function MarqueeText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [overflows, setOverflows] = useState(false);

  // Duration scales with text length — longer text scrolls at same visual speed
  const duration = `${Math.max(4, text.length * 0.22)}s`;

  useEffect(() => {
    const check = () => {
      if (!containerRef.current || !measureRef.current) return;
      setOverflows(measureRef.current.scrollWidth > containerRef.current.clientWidth + 1);
    };

    check();

    const ro = new ResizeObserver(check);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [text]);

  if (!overflows) {
    // Static — just render normally, no animation overhead
    return (
      <div ref={containerRef} className={cn("overflow-hidden", className)}>
        <span ref={measureRef} className="whitespace-nowrap font-[inherit] text-[inherit]">
          {text}
        </span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("overflow-hidden relative", className)}
      style={{
        // Fade edges so the scroll looks clean
        maskImage: "linear-gradient(to right, transparent 0%, black 5%, black 90%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 5%, black 90%, transparent 100%)",
      }}
    >
      {/*
       * Invisible spacer — MUST stay in normal flow with real height.
       * This is what gives the container its height so the absolute
       * copies have something to anchor their inset-y-0 to.
       * opacity-0 hides it visually while keeping layout dimensions.
       */}
      <span
        ref={measureRef}
        className="whitespace-nowrap font-[inherit] text-[inherit] opacity-0 pointer-events-none select-none block"
        aria-hidden
      >
        {text}
      </span>

      {/* Copy A: starts at 0, scrolls to -100% */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 flex items-center whitespace-nowrap pointer-events-none select-none"
        style={{
          animation: `marquee-a ${duration} linear infinite`,
          willChange: "transform",
          WebkitBackfaceVisibility: "hidden",
          backfaceVisibility: "hidden",
        }}
      >
        {text}
        {/* Gap so copies don't visually merge */}
        <span className="inline-block w-10" aria-hidden />
      </span>

      {/* Copy B: starts at +100%, arrives at 0 as A exits */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 flex items-center whitespace-nowrap pointer-events-none select-none"
        style={{
          animation: `marquee-b ${duration} linear infinite`,
          willChange: "transform",
          WebkitBackfaceVisibility: "hidden",
          backfaceVisibility: "hidden",
        }}
      >
        {text}
        <span className="inline-block w-10" aria-hidden />
      </span>
    </div>
  );
}

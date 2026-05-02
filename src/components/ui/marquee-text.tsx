import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * MarqueeText — scrolls right-to-left only when text overflows its container.
 * Static when text fits. Bidirectional seamless loop when overflowing.
 *
 * How the math works:
 *   - The container is `overflow-hidden` with a known pixel width (W).
 *   - Copy A starts at translateX(0) and scrolls to translateX(-W - gap).
 *   - Copy B starts at translateX(W + gap) and scrolls to translateX(0).
 *   - Both use the same duration so they move in perfect lockstep.
 *   - We measure the text width (T) and gap (G = 40px) so the total travel
 *     distance is T + G pixels, giving a constant visual speed regardless of
 *     text length.
 */
export function MarqueeText({
  text,
  className,
  style,
}: {
  text: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [overflows, setOverflows] = useState(false);
  const [travel, setTravel] = useState(0); // pixels to travel per cycle

  const GAP = 40; // px gap between the two copies
  // ~60px/s visual speed
  const duration = travel > 0 ? `${Math.max(3, travel / 60)}s` : "4s";

  useEffect(() => {
    const measure = () => {
      const container = containerRef.current;
      const textEl = textRef.current;
      if (!container || !textEl) return;

      const containerW = container.clientWidth;
      const textW = textEl.scrollWidth;
      const does = textW > containerW + 1;
      setOverflows(does);
      if (does) setTravel(textW + GAP);
    };

    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [text]);

  if (!overflows) {
    return (
      <div ref={containerRef} className={cn("overflow-hidden", className)} style={style}>
        <span
          ref={textRef}
          className="whitespace-nowrap font-[inherit] text-[inherit]"
        >
          {text}
        </span>
      </div>
    );
  }

  const travelPx = `${travel}px`;

  return (
    <div
      ref={containerRef}
      className={cn("overflow-hidden relative", className)}
      style={{
        ...style,
        maskImage:
          "linear-gradient(to right, transparent 0%, black 6%, black 88%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0%, black 6%, black 88%, transparent 100%)",
      }}
    >
      {/*
       * Invisible spacer — stays in normal flow to give the container its height.
       * opacity-0 hides it visually while keeping layout dimensions intact.
       */}
      <span
        ref={textRef}
        className="whitespace-nowrap font-[inherit] text-[inherit] opacity-0 pointer-events-none select-none block"
        aria-hidden
      >
        {text}
      </span>

      {/* Copy A: starts at 0, scrolls left by (textWidth + gap) px */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 flex items-center whitespace-nowrap pointer-events-none select-none"
        style={{
          animation: `marquee-px-a ${duration} linear infinite`,
          "--marquee-travel": travelPx,
          willChange: "transform",
        } as React.CSSProperties}
      >
        {text}
        <span className="inline-block" style={{ width: GAP }} aria-hidden />
      </span>

      {/* Copy B: starts offset by (textWidth + gap) px to the right, arrives at 0 as A exits */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 flex items-center whitespace-nowrap pointer-events-none select-none"
        style={{
          animation: `marquee-px-b ${duration} linear infinite`,
          "--marquee-travel": travelPx,
          willChange: "transform",
        } as React.CSSProperties}
      >
        {text}
        <span className="inline-block" style={{ width: GAP }} aria-hidden />
      </span>
    </div>
  );
}

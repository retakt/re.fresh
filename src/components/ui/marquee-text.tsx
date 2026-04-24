import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * MarqueeText — scrolls right-to-left only when text overflows its container.
 * Uses two absolutely-positioned copies for a seamless, jitter-free loop.
 * Static (no animation) when text fits.
 *
 * iOS Safari notes:
 * - Uses `animation` shorthand (not separate properties) for compat
 * - `will-change: transform` prevents layer promotion issues on iOS
 * - Gap between copies is handled via a spacer span, not paddingRight
 *   (paddingRight on absolutely-positioned elements is unreliable on WebKit)
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

  // Duration scales with text length so speed feels consistent
  const duration = `${Math.max(5, text.length * 0.25)}s`;

  useEffect(() => {
    const check = () => {
      if (!containerRef.current || !measureRef.current) return;
      setOverflows(measureRef.current.scrollWidth > containerRef.current.clientWidth + 1);
    };

    check();

    // ResizeObserver for container width changes
    const ro = new ResizeObserver(check);
    if (containerRef.current) ro.observe(containerRef.current);

    return () => ro.disconnect();
  }, [text]);

  if (!overflows) {
    return (
      <div ref={containerRef} className={cn("overflow-hidden", className)}>
        <span ref={measureRef} className="whitespace-nowrap font-[inherit] text-[inherit]">
          {text}
        </span>
      </div>
    );
  }

  // Overflowing — two copies scroll in tandem
  // Copy A: translateX(0%) → translateX(-100%)  [scrolls out left]
  // Copy B: translateX(100%) → translateX(0%)   [arrives from right]
  // A gap spacer (3rem) is included inside each copy so the two copies
  // don't visually merge when B arrives.
  const copyStyle: React.CSSProperties = {
    animation: `marquee-a ${duration} linear infinite`,
    willChange: "transform",
    WebkitBackfaceVisibility: "hidden",
    backfaceVisibility: "hidden",
  };

  const copyBStyle: React.CSSProperties = {
    animation: `marquee-b ${duration} linear infinite`,
    willChange: "transform",
    WebkitBackfaceVisibility: "hidden",
    backfaceVisibility: "hidden",
  };

  return (
    <div
      ref={containerRef}
      className={cn("overflow-hidden relative", className)}
      style={{
        maskImage:
          "linear-gradient(to right, transparent 0%, black 6%, black 88%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0%, black 6%, black 88%, transparent 100%)",
      }}
    >
      {/* Invisible spacer — keeps container height correct */}
      <span
        ref={measureRef}
        className="invisible whitespace-nowrap block h-0 overflow-hidden pointer-events-none"
        aria-hidden
      >
        {text}
      </span>

      {/* Copy A */}
      <span
        aria-hidden
        className="absolute inset-y-0 flex items-center whitespace-nowrap"
        style={copyStyle}
      >
        {text}
        {/* Gap spacer between end of A and start of B */}
        <span className="inline-block w-12" aria-hidden />
      </span>

      {/* Copy B */}
      <span
        className="absolute inset-y-0 flex items-center whitespace-nowrap"
        style={copyBStyle}
      >
        {text}
        <span className="inline-block w-12" aria-hidden />
      </span>
    </div>
  );
}

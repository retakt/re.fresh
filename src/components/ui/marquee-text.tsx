import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * MarqueeText — scrolls right-to-left only when text overflows its container.
 * Uses two absolutely-positioned copies for a seamless, jitter-free loop.
 * Static (no animation) when text fits.
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
    const ro = new ResizeObserver(check);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [text]);

  if (!overflows) {
    return (
      <div ref={containerRef} className={cn("overflow-hidden", className)}>
        {/* Hidden measure span — same ref used for overflow detection */}
        <span ref={measureRef} className="whitespace-nowrap font-[inherit] text-[inherit]">
          {text}
        </span>
      </div>
    );
  }

  // Overflowing — render two copies that scroll in tandem
  // Copy A: starts at 0, moves to -100%
  // Copy B: starts at 100%, moves to 0  (seamless handoff)
  return (
    <div
      ref={containerRef}
      className={cn("overflow-hidden relative", className)}
      style={{
        maskImage: "linear-gradient(to right, transparent 0%, black 8%, black 85%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 8%, black 85%, transparent 100%)",
      }}
    >
      {/* Invisible measure span — keeps the container height correct */}
      <span ref={measureRef} className="invisible whitespace-nowrap block h-0 overflow-hidden" aria-hidden>
        {text}
      </span>

      {/* Copy A */}
      <span
        aria-hidden
        className="absolute inset-y-0 flex items-center whitespace-nowrap"
        style={{
          animation: `marquee-a ${duration} linear infinite`,
          paddingRight: "3rem",
        }}
      >
        {text}
      </span>

      {/* Copy B — offset by exactly one full width (100%) */}
      <span
        className="absolute inset-y-0 flex items-center whitespace-nowrap"
        style={{
          animation: `marquee-b ${duration} linear infinite`,
          paddingRight: "3rem",
        }}
      >
        {text}
      </span>
    </div>
  );
}

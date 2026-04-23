import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * MarqueeText — scrolls text right-to-left only when it overflows its container.
 * Non-overflowing text stays static. No layout shift.
 */
export function MarqueeText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const check = () => {
      if (!containerRef.current || !textRef.current) return;
      setOverflows(textRef.current.scrollWidth > containerRef.current.clientWidth);
    };

    check();
    const ro = new ResizeObserver(check);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [text]);

  return (
    <div
      ref={containerRef}
      className={cn("overflow-hidden relative", className)}
      style={{ maskImage: overflows ? "linear-gradient(to right, transparent 0%, black 6%, black 88%, transparent 100%)" : undefined }}
    >
      <span
        ref={textRef}
        className={cn(
          "inline-block whitespace-nowrap",
          overflows && "animate-[marquee_var(--marquee-duration,8s)_linear_infinite]"
        )}
        style={overflows ? { "--marquee-duration": `${Math.max(4, text.length * 0.22)}s` } as React.CSSProperties : undefined}
      >
        {text}
        {/* Spacer between loops */}
        {overflows && <span className="inline-block w-16" aria-hidden />}
        {overflows && text}
      </span>
    </div>
  );
}

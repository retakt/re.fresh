import { cn } from "@/lib/utils";
import React, { useEffect, useRef, useState, useCallback } from "react";

interface CanvasSVGProps {
  svgContent: string;
  className?: string;
  colors?: string[];
  animationDuration?: number;
  lineWidth?: number;
  lineGap?: number;
  curveIntensity?: number;
  opacity?: number;
}

function resolveColor(color: string): string {
  if (color.startsWith("var(")) {
    const varName = color.slice(4, -1).trim();
    const resolved = getComputedStyle(document.documentElement)
      .getPropertyValue(varName)
      .trim();
    return resolved || color;
  }
  return color;
}

export function CanvasSVG({
  svgContent,
  className = "",
  colors = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#ffeaa7", "#dfe6e9"],
  animationDuration = 5,
  lineWidth = 1.5,
  lineGap = 10,
  curveIntensity = 60,
  opacity = 0.15,
}: CanvasSVGProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const [resolvedColors, setResolvedColors] = useState<string[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const updateColors = useCallback(() => {
    const resolved = colors.map(resolveColor);
    setResolvedColors(prev => {
      if (prev.length === resolved.length && prev.every((c, i) => c === resolved[i])) {
        return prev;
      }
      return resolved;
    });
  }, [colors]);

  useEffect(() => {
    updateColors();

    const observer = new MutationObserver(updateColors);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [updateColors]);

  useEffect(() => {
    const containerEl = containerRef.current;
    if (!containerEl) return;

    const updateDimensions = () => {
      const rect = containerEl.getBoundingClientRect();
      setDimensions({
        width: Math.ceil(rect.width) || 64,
        height: Math.ceil(rect.height) || 64,
      });
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerEl);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (
      !canvas ||
      resolvedColors.length === 0 ||
      dimensions.width === 0
    )
      return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const { width, height } = dimensions;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const numLines = Math.floor(height / lineGap) + 10;
    startTimeRef.current = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = (currentTime - startTimeRef.current) / 1000;
      const phase = (elapsed / animationDuration) * Math.PI * 2;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // Draw animated lines with opacity
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = opacity;
      
      for (let i = 0; i < numLines; i++) {
        const y = i * lineGap;

        const curve1 = Math.sin(phase) * curveIntensity;
        const curve2 = Math.sin(phase + 0.5) * curveIntensity * 0.6;

        const colorIndex = i % resolvedColors.length;
        ctx.strokeStyle = resolvedColors[colorIndex];
        ctx.lineWidth = lineWidth;

        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(
          width * 0.33,
          y + curve1,
          width * 0.66,
          y + curve2,
          width,
          y,
        );
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [
    resolvedColors,
    animationDuration,
    lineWidth,
    lineGap,
    curveIntensity,
    dimensions,
    opacity,
  ]);

  return (
    <div ref={containerRef} className={cn("relative w-full h-full", className)}>
      {/* SVG centered */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div dangerouslySetInnerHTML={{ __html: svgContent }} />
      </div>
      {/* Canvas covering entire card */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute top-0 left-0 w-full h-full z-20"
        style={{
          width: dimensions.width || "100%",
          height: dimensions.height || "100%",
        }}
      />
    </div>
  );
}

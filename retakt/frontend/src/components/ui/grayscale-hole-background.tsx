'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type GrayscaleHoleBackgroundProps = React.ComponentProps<'div'> & {
  strokeColor?: string;
  numberOfLines?: number;
  numberOfDiscs?: number;
  particleColor?: string;
};

export function GrayscaleHoleBackground({
  strokeColor = '#525252', // neutral-600
  numberOfLines = 50,
  numberOfDiscs = 50,
  particleColor = '#737373', // neutral-500
  className,
  children,
  ...props
}: GrayscaleHoleBackgroundProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = React.useRef<number>(0);
  const stateRef = React.useRef<any>({
    discs: [] as any[],
    lines: [] as any[],
    particles: [] as any[],
    clip: {},
    startDisc: {},
    endDisc: {},
    rect: { width: 0, height: 0 },
    render: { width: 0, height: 0, dpi: 1 },
    particleArea: {},
    linesCanvas: null,
  });

  const linear = (p: number) => p;
  const easeInExpo = (p: number) => (p === 0 ? 0 : Math.pow(2, 10 * (p - 1)));

  const tweenValue = React.useCallback(
    (start: number, end: number, p: number, ease: 'inExpo' | null = null) => {
      const delta = end - start;
      const easeFn = ease === 'inExpo' ? easeInExpo : linear;
      return start + delta * easeFn(p);
    },
    [],
  );

  const tweenDisc = React.useCallback(
    (disc: any) => {
      const { startDisc, endDisc } = stateRef.current;
      disc.x = tweenValue(startDisc.x, endDisc.x, disc.p);
      disc.y = tweenValue(startDisc.y, endDisc.y, disc.p, 'inExpo');
      disc.w = tweenValue(startDisc.w, endDisc.w, disc.p);
      disc.h = tweenValue(startDisc.h, endDisc.h, disc.p);
    },
    [tweenValue],
  );

  const setSize = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    stateRef.current.rect = { width: rect.width, height: rect.height };
    stateRef.current.render = {
      width: rect.width,
      height: rect.height,
      dpi: window.devicePixelRatio || 1,
    };
    canvas.width = stateRef.current.render.width * stateRef.current.render.dpi;
    canvas.height = stateRef.current.render.height * stateRef.current.render.dpi;
  }, []);

  const setDiscs = React.useCallback(() => {
    const { width, height } = stateRef.current.rect;
    const isMobile = width < 768;
    
    stateRef.current.discs = [];
    stateRef.current.startDisc = {
      x: width * 0.5,
      y: isMobile ? height * 0.4 : height * 0.45,
      w: isMobile ? width * 0.4 : width * 0.75,
      h: isMobile ? height * 0.4 : height * 0.7,
    };
    stateRef.current.endDisc = {
      x: width * 0.5,
      y: isMobile ? height * 0.8 : height * 0.95,
      w: 0,
      h: 0,
    };
    let prevBottom = height;
    stateRef.current.clip = {};
    for (let i = 0; i < numberOfDiscs; i++) {
      const p = i / numberOfDiscs;
      const disc = { p, x: 0, y: 0, w: 0, h: 0 };
      tweenDisc(disc);
      const bottom = disc.y + disc.h;
      if (bottom <= prevBottom) {
        stateRef.current.clip = { disc: { ...disc }, i };
      }
      prevBottom = bottom;
      stateRef.current.discs.push(disc);
    }
    const clipPath = new Path2D();
    const disc = stateRef.current.clip.disc;
    clipPath.ellipse(disc.x, disc.y, disc.w, disc.h, 0, 0, Math.PI * 2);
    clipPath.rect(disc.x - disc.w, 0, disc.w * 2, disc.y);
    stateRef.current.clip.path = clipPath;
  }, [numberOfDiscs, tweenDisc]);

  const setLines = React.useCallback(() => {
    const { width, height } = stateRef.current.rect;
    stateRef.current.lines = [];
    const linesAngle = (Math.PI * 2) / numberOfLines;
    for (let i = 0; i < numberOfLines; i++) {
      stateRef.current.lines.push([]);
    }
    stateRef.current.discs.forEach((disc: any) => {
      for (let i = 0; i < numberOfLines; i++) {
        const angle = i * linesAngle;
        const p = {
          x: disc.x + Math.cos(angle) * disc.w,
          y: disc.y + Math.sin(angle) * disc.h,
        };
        stateRef.current.lines[i].push(p);
      }
    });
    const offCanvas = document.createElement('canvas');
    offCanvas.width = width;
    offCanvas.height = height;
    const ctx = offCanvas.getContext('2d');
    if (!ctx) return;
    stateRef.current.lines.forEach((line: any) => {
      ctx.save();
      let lineIsIn = false;
      line.forEach((p1: any, j: number) => {
        if (j === 0) return;
        const p0 = line[j - 1];
        if (
          !lineIsIn &&
          (ctx.isPointInPath(stateRef.current.clip.path, p1.x, p1.y) ||
            ctx.isPointInStroke(stateRef.current.clip.path, p1.x, p1.y))
        ) {
          lineIsIn = true;
        } else if (lineIsIn) {
          ctx.clip(stateRef.current.clip.path);
        }
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
      });
      ctx.restore();
    });
    stateRef.current.linesCanvas = offCanvas;
  }, [numberOfLines, strokeColor]);

  const initParticle = React.useCallback(
    (start: boolean = false) => {
      const sx =
        stateRef.current.particleArea.sx +
        stateRef.current.particleArea.sw * Math.random();
      const ex =
        stateRef.current.particleArea.ex +
        stateRef.current.particleArea.ew * Math.random();
      const dx = ex - sx;
      const y = start
        ? stateRef.current.particleArea.h * Math.random()
        : stateRef.current.particleArea.h;
      const r = 0.5 + Math.random() * 4;
      const vy = 0.5 + Math.random();
      return {
        x: sx,
        sx,
        dx,
        y,
        vy,
        p: 0,
        r,
        c: particleColor,
      };
    },
    [particleColor],
  );

  const setParticles = React.useCallback(() => {
    const { width, height } = stateRef.current.rect;
    stateRef.current.particles = [];
    const disc = stateRef.current.clip.disc;
    stateRef.current.particleArea = {
      sw: disc.w * 0.5,
      ew: disc.w * 2,
      h: height * 0.85,
    };
    stateRef.current.particleArea.sx =
      (width - stateRef.current.particleArea.sw) / 2;
    stateRef.current.particleArea.ex =
      (width - stateRef.current.particleArea.ew) / 2;
    const totalParticles = 100;
    for (let i = 0; i < totalParticles; i++) {
      stateRef.current.particles.push(initParticle(true));
    }
  }, [initParticle]);

  const drawDiscs = React.useCallback(
    (ctx: CanvasRenderingContext2D) => {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      const outerDisc = stateRef.current.startDisc;
      ctx.beginPath();
      ctx.ellipse(
        outerDisc.x,
        outerDisc.y,
        outerDisc.w,
        outerDisc.h,
        0,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
      ctx.closePath();
      stateRef.current.discs.forEach((disc: any, i: number) => {
        if (i % 5 !== 0) return;
        if (disc.w < stateRef.current.clip.disc.w - 5) {
          ctx.save();
          ctx.clip(stateRef.current.clip.path);
        }
        ctx.beginPath();
        ctx.ellipse(disc.x, disc.y, disc.w, disc.h, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.closePath();
        if (disc.w < stateRef.current.clip.disc.w - 5) {
          ctx.restore();
        }
      });
    },
    [strokeColor],
  );

  const drawLines = React.useCallback((ctx: CanvasRenderingContext2D) => {
    if (stateRef.current.linesCanvas) {
      ctx.drawImage(stateRef.current.linesCanvas, 0, 0);
    }
  }, []);

  const drawParticles = React.useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.clip(stateRef.current.clip.path);
    stateRef.current.particles.forEach((particle: any) => {
      ctx.fillStyle = particle.c;
      ctx.beginPath();
      ctx.rect(particle.x, particle.y, particle.r, particle.r);
      ctx.closePath();
      ctx.fill();
    });
    ctx.restore();
  }, []);

  const moveDiscs = React.useCallback(() => {
    stateRef.current.discs.forEach((disc: any) => {
      disc.p = (disc.p + 0.0008) % 1;
      tweenDisc(disc);
    });
  }, [tweenDisc]);

  const moveParticles = React.useCallback(() => {
    stateRef.current.particles.forEach((particle: any, idx: number) => {
      particle.p = 1 - particle.y / stateRef.current.particleArea.h;
      particle.x = particle.sx + particle.dx * particle.p;
      particle.y -= particle.vy;
      if (particle.y < 0) {
        stateRef.current.particles[idx] = initParticle();
      }
    });
  }, [initParticle]);

  const tick = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(stateRef.current.render.dpi, stateRef.current.render.dpi);
    moveDiscs();
    moveParticles();
    drawDiscs(ctx);
    drawLines(ctx);
    drawParticles(ctx);
    ctx.restore();
    animationFrameIdRef.current = requestAnimationFrame(tick);
  }, [moveDiscs, moveParticles, drawDiscs, drawLines, drawParticles]);

  const init = React.useCallback(() => {
    setSize();
    setDiscs();
    setLines();
    setParticles();
  }, [setSize, setDiscs, setLines, setParticles]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    init();
    tick();
    
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      // Debounce resize to avoid constant reinitialization
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        // Don't cancel animation, just update dimensions
        const oldRect = { ...stateRef.current.rect };
        setSize();
        
        // Only reinitialize if size actually changed significantly
        const newRect = stateRef.current.rect;
        if (Math.abs(oldRect.width - newRect.width) > 50 || 
            Math.abs(oldRect.height - newRect.height) > 50) {
          setDiscs();
          setLines();
          setParticles();
        }
      }, 150);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
      cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, [init, tick, setSize, setDiscs, setLines, setParticles]);

  return (
    <div
      data-slot="grayscale-hole-background"
      className={cn(
        'relative size-full overflow-hidden',
        // Grayscale radial gradient vignette - much lighter on mobile (more transparent area)
        'before:content-[""] before:absolute before:top-1/2 before:left-1/2 before:block before:size-[140%] before:[background:radial-gradient(ellipse_at_50%_50%,transparent_40%,rgb(0_0_0_/_0.3)_80%)] md:before:[background:radial-gradient(ellipse_at_50%_55%,transparent_10%,rgb(0_0_0_/_0.8)_50%)] before:[transform:translate3d(-50%,-50%,0)]',
        className,
      )}
      {...props}
    >
      {children}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block size-full opacity-8 md:opacity-15"
      />
      {/* Scanline effect */}
      <div className="absolute top-0 left-0 z-[7] size-full [background:repeating-linear-gradient(transparent,transparent_1px,rgb(255_255_255_/_0.03)_1px,rgb(255_255_255_/_0.03)_2px)] mix-blend-overlay opacity-30" />
    </div>
  );
}

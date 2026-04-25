'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, useAnimation } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';

interface AttractButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly particleCount?: number;
  readonly attractRadius?: number;
  /** Tailwind class for particle color — defaults to bg-primary */
  readonly particleClassName?: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
}

export default function AttractButton({
  className,
  particleCount = 12,
  attractRadius = 50,
  particleClassName,
  children,
  ...props
}: AttractButtonProps) {
  const [isAttracting, setIsAttracting] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const particlesControl = useAnimation();

  useEffect(() => {
    const newParticles = Array.from({ length: particleCount }, (_, i) => {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = attractRadius * (0.7 + Math.random() * 0.3);
      return {
        id: i,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      };
    });
    setParticles(newParticles);
  }, [particleCount, attractRadius]);

  const handleInteractionStart = useCallback(async () => {
    setIsAttracting(true);
    await particlesControl.start({
      x: 0,
      y: 0,
      transition: { type: 'spring', stiffness: 50, damping: 10 },
    });
  }, [particlesControl]);

  const handleInteractionEnd = useCallback(async () => {
    setIsAttracting(false);
    await particlesControl.start((i) => ({
      x: particles[i].x,
      y: particles[i].y,
      transition: { type: 'spring', stiffness: 100, damping: 15 },
    }));
  }, [particlesControl, particles]);

  return (
    <Button
      className={cn(
        'relative touch-none overflow-visible',
        className,
      )}
      onMouseEnter={handleInteractionStart}
      onMouseLeave={handleInteractionEnd}
      onTouchStart={handleInteractionStart}
      onTouchEnd={handleInteractionEnd}
      {...props}
    >
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          custom={particle.id}
          initial={{ x: particle.x, y: particle.y }}
          animate={particlesControl}
          style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
          className={cn(
            'absolute h-1.5 w-1.5 rounded-full pointer-events-none',
            'transition-opacity duration-300',
            isAttracting ? 'opacity-100' : 'opacity-40',
            particleClassName ?? 'bg-primary',
          )}
        />
      ))}
      <span className="relative flex w-full items-center justify-center gap-2">
        {children}
      </span>
    </Button>
  );
}

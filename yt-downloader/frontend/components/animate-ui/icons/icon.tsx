import * as React from 'react';
import { useAnimation, type AnimationControls } from 'motion/react';
import type { Variants } from 'motion/react';

// ── Context ──────────────────────────────────────────────────────────────────

interface AnimateIconContextValue {
  controls: AnimationControls;
}

const AnimateIconContext = React.createContext<AnimateIconContextValue | null>(null);

export function useAnimateIconContext(): AnimateIconContextValue {
  const ctx = React.useContext(AnimateIconContext);
  if (!ctx) throw new Error('useAnimateIconContext must be used within IconWrapper');
  return ctx;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type IconProps<TAnimation extends string = string> = React.SVGProps<SVGSVGElement> & {
  size?: number;
  animation?: TAnimation;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getVariants(
  animations: Record<string, Record<string, Variants>>,
  animation = 'default',
): Record<string, Variants> {
  return animations[animation] ?? animations['default'] ?? {};
}

// ── Wrapper ───────────────────────────────────────────────────────────────────

interface IconWrapperProps<TProps extends IconProps> {
  icon: React.ComponentType<TProps>;
  onMouseEnter?: React.MouseEventHandler<HTMLSpanElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLSpanElement>;
}

export function IconWrapper<TProps extends IconProps>({
  icon: Icon,
  onMouseEnter,
  onMouseLeave,
  ...props
}: IconWrapperProps<TProps> & TProps) {
  const controls = useAnimation();

  const handleMouseEnter: React.MouseEventHandler<HTMLSpanElement> = (e) => {
    controls.start('animate');
    onMouseEnter?.(e);
  };

  const handleMouseLeave: React.MouseEventHandler<HTMLSpanElement> = (e) => {
    controls.start('initial');
    onMouseLeave?.(e);
  };

  return (
    <AnimateIconContext.Provider value={{ controls }}>
      <span
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Icon {...(props as TProps)} />
      </span>
    </AnimateIconContext.Provider>
  );
}

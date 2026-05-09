'use client';
import * as React from 'react';
import { Share2, Link } from 'lucide-react';
import { FaTelegram, FaFacebook } from 'react-icons/fa';
import { cva, type VariantProps } from 'class-variance-authority';
import { type HTMLMotionProps, motion, AnimatePresence } from 'motion/react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "relative overflow-hidden cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      size: {
        default: 'min-w-28 h-10 px-4 py-2',
        sm: 'min-w-24 h-9 rounded-md gap-1.5 px-3',
        md: 'min-w-28 h-10 px-4 py-2',
        lg: 'min-w-32 h-11 px-8',
      },
      icon: {
        suffix: 'pl-4',
        prefix: 'pr-4',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
);

const iconSizeMap = {
  sm: 16,
  md: 20,
  lg: 28,
  default: 16,
};

type ShareButtonProps = HTMLMotionProps<'button'> & {
  children: React.ReactNode;
  className?: string;
  onIconClick?: (platform: 'telegram' | 'facebook' | 'copy') => void;
} & VariantProps<typeof buttonVariants>;

function ShareButton({
  children,
  className,
  size,
  icon,
  onIconClick,
  ...props
}: ShareButtonProps) {
  const [showIcons, setShowIcons] = React.useState(false);
  const [longPressTimer, setLongPressTimer] = React.useState<NodeJS.Timeout | null>(null);
  const [isLongPressing, setIsLongPressing] = React.useState(false);
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isMobile) {
      setIsLongPressing(false);
      const timer = setTimeout(() => {
        setIsLongPressing(true);
        setShowIcons(true);
        // Prevent context menu by stopping event propagation
        e.preventDefault();
      }, 500); // 500ms long press
      setLongPressTimer(timer);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    // If it was a long press, prevent the click event
    if (isLongPressing) {
      e.preventDefault();
      e.stopPropagation();
      setIsLongPressing(false);
      return;
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    // Always prevent context menu on the share button when on mobile
    if (isMobile) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  };

  const handleTouchCancel = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    setIsLongPressing(false);
    if (isMobile) {
      setShowIcons(false);
    }
  };

  const handleMouseEnter = () => {
    if (!isMobile) {
      setShowIcons(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setShowIcons(false);
    }
  };

  const handleClickOutside = () => {
    if (isMobile && showIcons) {
      setShowIcons(false);
    }
  };

  // Add click outside listener when icons are shown on mobile
  React.useEffect(() => {
    if (isMobile && showIcons) {
      const handleClick = (e: MouseEvent) => {
        const target = e.target as Element;
        if (!target.closest('[data-share-button]')) {
          setShowIcons(false);
        }
      };
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [isMobile, showIcons]);

  return (
    <motion.button
      data-share-button
      className={cn(
        'bg-primary text-primary-foreground hover:bg-primary/90',
        buttonVariants({ size, className, icon }),
        isMobile && 'select-none touch-manipulation'
      )}
      style={isMobile ? { 
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none'
      } : undefined}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      onContextMenu={handleContextMenu}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      <AnimatePresence initial={false} mode="wait">
        {!showIcons ? (
          <motion.div
            key="content"
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.3 }}
            className=" absolute left-0 right-0 top-0 bottom-0 flex items-center justify-center gap-2"
          >
            {icon === 'prefix' && (
              <Share2
                className="size-4"
                size={iconSizeMap[size as keyof typeof iconSizeMap]}
              />
            )}
            {children}
            {icon === 'suffix' && (
              <Share2
                className="size-4"
                size={iconSizeMap[size as keyof typeof iconSizeMap]}
              />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="icons"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.3 }}
            className=" absolute left-0 right-0 top-0 bottom-0 flex items-center justify-center gap-2"
          >
            <ShareIconGroup size={size} onIconClick={onIconClick} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

const shareIconGroupVariants = cva('flex items-center justify-center gap-3', {
  variants: {
    size: {
      default: 'text-[16px]',
      sm: 'text-[16px]',
      md: 'text-[20px]',
      lg: 'text-[28px]',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

type ShareIconGroupProps = HTMLMotionProps<'div'> & {
  className?: string;
  onIconClick?: (
    platform: 'telegram' | 'facebook' | 'copy',
    event: React.MouseEvent<HTMLDivElement>,
  ) => void;
} & VariantProps<typeof shareIconGroupVariants>;

function ShareIconGroup({
  size = 'default',
  className,
  onIconClick,
}: ShareIconGroupProps) {
  const iconSize = iconSizeMap[size as keyof typeof iconSizeMap];

  const handleIconClick = React.useCallback(
    (
      platform: 'telegram' | 'facebook' | 'copy',
      event: React.MouseEvent<HTMLDivElement>,
    ) => {
      onIconClick?.(platform, event);
    },
    [onIconClick],
  );

  return (
    <motion.div
      className={cn(shareIconGroupVariants({ size }), 'group', className)}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0, duration: 0.5, type: 'spring', bounce: 0.4 }}
        whileHover={{
          y: -8,
          transition: { duration: 0.2, ease: 'easeOut' },
        }}
        className="group-hover:opacity-100 cursor-pointer py-3 rounded-lg box-border"
        onClick={(event) => handleIconClick('telegram', event)}
      >
        <FaTelegram size={iconSize} />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, type: 'spring', bounce: 0.4 }}
        whileHover={{
          y: -8,
          transition: { duration: 0.2, ease: 'easeOut' },
        }}
        className="group-hover:opacity-100 cursor-pointer py-3 rounded-lg box-border"
        onClick={(event) => handleIconClick('facebook', event)}
      >
        <FaFacebook size={iconSize} />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5, type: 'spring', bounce: 0.4 }}
        whileHover={{
          y: -8,
          transition: { duration: 0.2, ease: 'easeOut' },
        }}
        className="group-hover:opacity-100 cursor-pointer py-3 rounded-lg box-border"
        onClick={(event) => handleIconClick('copy', event)}
      >
        <Link size={iconSize} />
      </motion.div>
    </motion.div>
  );
}

export { ShareButton, type ShareButtonProps };

import { useState, useRef, useId, useEffect } from "react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

type Placement = "top" | "bottom" | "left" | "right";

interface AnimatedTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  placement?: Placement;
  delay?: number;
}

export function AnimatedTooltip({
  content,
  children,
  placement = "top",
  delay = 200,
}: AnimatedTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const timeoutRef = useRef<NodeJS.Timeout>();
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipId = useId();
  const shouldReduceMotion = useReducedMotion();

  const clamp = (value: number, min: number, max: number) => {
    return Math.min(Math.max(value, min), max);
  };

  const updatePosition = () => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current?.getBoundingClientRect();
    const tooltipWidth = tooltipRect?.width ?? 180;
    const tooltipHeight = tooltipRect?.height ?? 32;
    const margin = 8;

    let top = 0;
    let left = 0;

    switch (placement) {
      case "top":
        top = rect.top - tooltipHeight - margin;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case "bottom":
        top = rect.bottom + margin;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case "left":
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - margin;
        break;
      case "right":
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + margin;
        break;
    }

    left = clamp(left, margin, window.innerWidth - tooltipWidth - margin);
    top = clamp(top, margin, window.innerHeight - tooltipHeight - margin);

    setPosition({ top, left });
  };

  const handleMouseEnter = () => {
    updatePosition();
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const handleToggle = () => {
    if (isVisible) {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);
  };

  useEffect(() => {
    if (!isVisible) return;
    updatePosition();
    const handleResize = () => updatePosition();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isVisible, placement]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsVisible(false);
    }

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleToggle();
    }
  };

  const getPlacementStyles = () => {
    switch (placement) {
      case "top":
        return {
          bottom: "calc(100% + 8px)",
          left: "50%",
          translateX: "-50%",
        };
      case "bottom":
        return {
          top: "calc(100% + 8px)",
          left: "50%",
          translateX: "-50%",
        };
      case "left":
        return {
          right: "calc(100% + 8px)",
          top: "50%",
          translateY: "-50%",
        };
      case "right":
        return {
          left: "calc(100% + 8px)",
          top: "50%",
          translateY: "-50%",
        };
    }
  };

  const getAnimationProps = () => {
    if (shouldReduceMotion) {
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0 },
      };
    }

    const baseProps = {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 },
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
      },
    };

    switch (placement) {
      case "top":
        return { ...baseProps, initial: { ...baseProps.initial, y: 4 } };
      case "bottom":
        return { ...baseProps, initial: { ...baseProps.initial, y: -4 } };
      case "left":
        return { ...baseProps, initial: { ...baseProps.initial, x: 4 } };
      case "right":
        return { ...baseProps, initial: { ...baseProps.initial, x: -4 } };
      default:
        return baseProps;
    }
  };

  const getTransformOrigin = () => {
    switch (placement) {
      case "top":
        return "bottom center";
      case "bottom":
        return "top center";
      case "left":
        return "right center";
      case "right":
        return "left center";
      default:
        return "center";
    }
  };

  return (
    <div
      ref={triggerRef}
      className="relative inline-flex items-center justify-center p-1"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-describedby={isVisible ? tooltipId : undefined}
    >
      <div className="pointer-events-none">{children}</div>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            id={tooltipId}
            role="tooltip"
            className={cn(
              "fixed z-[100] px-2.5 py-1.5 text-[11px] font-medium rounded-md pointer-events-none",
              "dark:bg-[#e1e1e1] dark:text-black bg-[#2a2a2a] text-white",
              "shadow-lg whitespace-nowrap"
            )}
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              transformOrigin: getTransformOrigin(),
            }}
            {...getAnimationProps()}
          >
            {content}
            
            {/* Arrow */}
            <div
              aria-hidden="true"
              className={cn(
                "absolute w-2 h-2 rotate-45",
                "dark:bg-[#e1e1e1] bg-[#2a2a2a]",
                placement === "top" && "bottom-[-4px] left-1/2 -translate-x-1/2",
                placement === "bottom" && "top-[-4px] left-1/2 -translate-x-1/2",
                placement === "left" && "right-[-4px] top-1/2 -translate-y-1/2",
                placement === "right" && "left-[-4px] top-1/2 -translate-y-1/2"
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

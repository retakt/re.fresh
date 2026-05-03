import { useState, useRef, useId } from "react";
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
  const timeoutRef = useRef<NodeJS.Timeout>();
  const tooltipId = useId();
  const shouldReduceMotion = useReducedMotion();

  const handleMouseEnter = () => {
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsVisible(false);
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

  const placementStyles = getPlacementStyles();

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
      onKeyDown={handleKeyDown}
    >
      <div aria-describedby={isVisible ? tooltipId : undefined}>
        {children}
      </div>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            id={tooltipId}
            role="tooltip"
            className={cn(
              "absolute z-50 px-2.5 py-1.5 text-[11px] font-medium rounded-md pointer-events-none",
              "dark:bg-[#e1e1e1] dark:text-black bg-[#2a2a2a] text-white",
              "shadow-lg whitespace-nowrap"
            )}
            style={{
              bottom: placementStyles.bottom,
              top: placementStyles.top,
              left: placementStyles.left,
              right: placementStyles.right,
              transform: `translate(${placementStyles.translateX || "0"}, ${placementStyles.translateY || "0"})`,
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

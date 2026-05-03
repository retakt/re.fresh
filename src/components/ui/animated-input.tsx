import { motion, useReducedMotion } from "motion/react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

const EASE_IN_OUT_CUBIC_X1 = 0.4;
const EASE_IN_OUT_CUBIC_Y1 = 0;
const EASE_IN_OUT_CUBIC_X2 = 0.2;
const EASE_IN_OUT_CUBIC_Y2 = 1;
const RADIX_BASE_36 = 36;
const RANDOM_ID_START_INDEX = 2;
const RANDOM_ID_LENGTH = 9;

const LABEL_TRANSITION = {
  duration: 0.28,
  ease: [
    EASE_IN_OUT_CUBIC_X1,
    EASE_IN_OUT_CUBIC_Y1,
    EASE_IN_OUT_CUBIC_X2,
    EASE_IN_OUT_CUBIC_Y2,
  ] as [number, number, number, number],
};

export interface AnimatedInputProps {
  className?: string;
  defaultValue?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  inputClassName?: string;
  label: string;
  labelClassName?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  value?: string;
  type?: "text" | "email" | "password";
  required?: boolean;
  id?: string;
}

export default function AnimatedInput({
  value,
  defaultValue = "",
  onChange,
  label,
  placeholder = "",
  disabled = false,
  className = "",
  inputClassName = "",
  labelClassName = "",
  icon,
  type = "text",
  required = false,
  id,
}: AnimatedInputProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = value !== undefined;
  const val = isControlled ? value : internalValue;
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const isFloating = !!val || isFocused;
  const shouldReduceMotion = useReducedMotion();

  const inputId = id || `animated-input-${Math.random().toString(RADIX_BASE_36).substring(RANDOM_ID_START_INDEX, RANDOM_ID_LENGTH)}`;

  const getLabelAnimation = () => {
    if (shouldReduceMotion) {
      return {};
    }
    if (isFloating) {
      return {
        y: -24,
        scale: 0.85,
        color: "var(--color-primary)",
        borderColor: "var(--color-primary)",
      };
    }
    return { y: 0, scale: 1, color: "var(--color-muted-foreground)" };
  };

  const getLabelStyle = () => {
    if (!shouldReduceMotion) {
      return {};
    }
    if (isFloating) {
      return {
        transform: "translateY(-24px) scale(0.85)",
        color: "var(--color-primary)",
        borderColor: "var(--color-primary)",
      };
    }
    return {
      transform: "translateY(0) scale(1)",
      color: "var(--color-muted-foreground)",
    };
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      {icon && (
        <span
          aria-hidden="true"
          className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground z-10"
        >
          {icon}
        </span>
      )}
      <input
        aria-label={label}
        className={cn(
          "peer w-full rounded-md border bg-background px-3 py-3 text-base outline-none transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          icon ? "pl-10" : "",
          inputClassName
        )}
        disabled={disabled}
        id={inputId}
        onBlur={() => setIsFocused(false)}
        onChange={(e) => {
          if (!isControlled) {
            setInternalValue(e.target.value);
          }
          onChange?.(e.target.value);
        }}
        onFocus={() => setIsFocused(true)}
        placeholder={isFloating ? placeholder : ""}
        ref={inputRef}
        type={type}
        value={val}
        required={required}
      />
      <motion.label
        animate={getLabelAnimation()}
        className={cn(
          "pointer-events-none absolute top-1/2 left-3 origin-left -translate-y-1/2 rounded-sm border border-transparent bg-background px-2 text-base font-medium text-foreground transition-all",
          icon ? "left-10" : "",
          labelClassName
        )}
        htmlFor={inputId}
        style={{
          zIndex: 2,
          ...getLabelStyle(),
        }}
        transition={shouldReduceMotion ? { duration: 0 } : LABEL_TRANSITION}
      >
        {label}
      </motion.label>
    </div>
  );
}
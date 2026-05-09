import { useEffect, useRef } from "react";

type UseLongPressOptions = {
  delay?: number;
  onLongPress: () => void;
  onClick?: () => void;
};

export function useLongPress({
  delay = 450,
  onLongPress,
  onClick,
}: UseLongPressOptions) {
  const timeoutRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);

  const clearTimer = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const startPress = () => {
    clearTimer();
    longPressTriggeredRef.current = false;
    timeoutRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      onLongPress();
    }, delay);
  };

  const endPress = () => {
    clearTimer();
  };

  useEffect(() => clearTimer, []);

  return {
    onMouseDown: startPress,
    onMouseUp: endPress,
    onMouseLeave: endPress,
    onTouchStart: startPress,
    onTouchEnd: endPress,
    onTouchCancel: endPress,
    onClick: () => {
      if (!longPressTriggeredRef.current) {
        onClick?.();
      }
      longPressTriggeredRef.current = false;
    },
    onKeyDown: (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onClick?.();
      }
    },
  };
}

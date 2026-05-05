import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface RetryButtonProps {
  onRetry: () => void;
  disabled?: boolean;
  className?: string;
}

export function RetryButton({ onRetry, disabled, className }: RetryButtonProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      // Reset after a short delay to show the animation
      setTimeout(() => setIsRetrying(false), 1000);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRetry}
      disabled={disabled || isRetrying}
      className={className}
    >
      <RotateCcw className={`w-4 h-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
      {isRetrying ? 'Retrying...' : 'Retry'}
    </Button>
  );
}
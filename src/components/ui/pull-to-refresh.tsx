import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  refreshing: boolean;
  isTriggered: boolean;
  threshold?: number;
}

export function PullToRefreshIndicator({
  pullDistance,
  refreshing,
  isTriggered,
  threshold = 72,
}: PullToRefreshIndicatorProps) {
  const visible = pullDistance > 8 || refreshing;
  const progress = Math.min(pullDistance / threshold, 1);
  const rotation = progress * 180;

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
      style={{ transform: `translateY(${refreshing ? 48 : Math.min(pullDistance, 56)}px)` }}
    >
      <div
        className={cn(
          'flex items-center justify-center w-9 h-9 rounded-full border bg-background shadow-md transition-colors',
          isTriggered || refreshing ? 'border-primary/40 bg-primary/5' : 'border-border'
        )}
      >
        <RefreshCw
          size={15}
          className={cn(
            'transition-colors',
            isTriggered || refreshing ? 'text-primary' : 'text-muted-foreground'
          )}
          style={{
            transform: `rotate(${refreshing ? 0 : rotation}deg)`,
            animation: refreshing ? 'spin 0.8s linear infinite' : 'none',
          }}
        />
      </div>
    </div>
  );
}

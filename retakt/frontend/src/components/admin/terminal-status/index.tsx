import { cn } from '@/lib/utils';
import { useStatusMonitor } from './status-monitor';
import { TerminalDisplay } from './terminal-display';
import type { TerminalStatusProps } from './status-types';

export function TerminalStatus({
  className,
  autoScroll = true,
  maxLines = 20,
  refreshInterval = 10000,
}: TerminalStatusProps) {
  const { entries, health } = useStatusMonitor(refreshInterval);

  return (
    <div className={cn("w-full", className)}>
      <TerminalDisplay
        entries={entries}
        health={health}
        autoScroll={autoScroll}
        maxLines={maxLines}
      />
    </div>
  );
}

// Export types for external use
export type { StatusEntry, ServiceConfig, ServiceHealth, TerminalStatusProps } from './status-types';
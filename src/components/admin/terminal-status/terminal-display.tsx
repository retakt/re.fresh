import { useEffect, useRef } from 'react';
import type { StatusEntry, ServiceHealth } from './status-types';
import './terminal.css';

interface TerminalDisplayProps {
  entries: StatusEntry[];
  health: ServiceHealth;
  autoScroll?: boolean;
  maxLines?: number;
}

const STATUS_ICONS = {
  ready: '✓',
  slow: '⚠',
  timeout: '⚡',
  offline: '✗',
  checking: '🔄',
} as const;

const STATUS_LABELS = {
  ready: '[READY]',
  slow: '[SLOW]',
  timeout: '[TIMEOUT]',
  offline: '[OFFLINE]',
  checking: '[CHECKING]',
} as const;

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function formatResponseTime(ms?: number): string {
  if (ms === undefined) return '';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function TerminalDisplay({ 
  entries, 
  health, 
  autoScroll = true, 
  maxLines = 20 
}: TerminalDisplayProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new entries are added
  useEffect(() => {
    if (autoScroll && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [entries, autoScroll]);

  // Limit displayed entries for performance
  const displayedEntries = entries.slice(-maxLines);

  return (
    <div className="terminal-status">
      <div className="terminal-header">
        ┌─ SYSTEM STATUS ─────────────────────────────────────┐
      </div>
      
      <div className="terminal-content" ref={contentRef}>
        {displayedEntries.map((entry) => (
          <div key={entry.id} className="terminal-line">
            <span className="terminal-timestamp">
              [{formatTime(entry.timestamp)}]
            </span>
            <span className="terminal-status-icon">
              {STATUS_ICONS[entry.status]}
            </span>
            <span className="terminal-service">
              {entry.service}
            </span>
            <span className={`terminal-status status-${entry.status}`}>
              {STATUS_LABELS[entry.status]}
            </span>
            <span className="terminal-response-time">
              {formatResponseTime(entry.responseTime)}
            </span>
          </div>
        ))}
        
        {entries.length === 0 && (
          <div className="terminal-line">
            <span className="terminal-timestamp">
              [{formatTime(new Date())}]
            </span>
            <span className="terminal-status-icon">🔄</span>
            <span className="terminal-service">System</span>
            <span className="terminal-status status-checking">
              [INITIALIZING]
            </span>
            <span className="terminal-cursor">_</span>
          </div>
        )}
      </div>

      <div className="terminal-footer">
        <div>
          System Health: {health.operational}/{health.total} services operational
        </div>
        <div>
          Avg Response: {formatResponseTime(health.averageResponseTime)}
        </div>
        <div>
          Updated: {Math.floor((Date.now() - health.lastUpdated.getTime()) / 1000)}s ago
        </div>
      </div>
    </div>
  );
}
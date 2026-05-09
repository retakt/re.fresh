export interface StatusEntry {
  id: string;
  timestamp: Date;
  service: string;
  status: 'ready' | 'slow' | 'timeout' | 'offline' | 'checking';
  responseTime?: number;
  message: string;
  endpoint?: string;
}

export interface ServiceConfig {
  name: string;
  url: string;
  endpoint: string;
  timeout: number;
  slowThreshold: number;
}

export interface TerminalStatusProps {
  className?: string;
  autoScroll?: boolean;
  maxLines?: number;
  refreshInterval?: number;
}

export interface ServiceHealth {
  total: number;
  operational: number;
  averageResponseTime: number;
  lastUpdated: Date;
}
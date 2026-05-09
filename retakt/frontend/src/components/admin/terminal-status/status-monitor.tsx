import { useState, useEffect, useCallback, useRef } from 'react';
import type { StatusEntry, ServiceConfig, ServiceHealth } from './status-types';

const MONITORED_SERVICES: ServiceConfig[] = [
  {
    name: 'AI Model (Ollama)',
    url: import.meta.env.VITE_OLLAMA_URL ?? 'http://localhost:11434',
    endpoint: '/api/tags',
    timeout: 3000,
    slowThreshold: 1000,
  },
  {
    name: 'Web Search (SearXNG)',
    url: import.meta.env.VITE_SEARXNG_URL ?? 'http://localhost:8080',
    endpoint: '/search?q=test&format=json&pageno=1',
    timeout: 3000,
    slowThreshold: 2000,
  },
  {
    name: 'Weather API',
    url: 'https://wttr.in',
    endpoint: '/test?format=j1',
    timeout: 5000,
    slowThreshold: 2000,
  },
  {
    name: 'Exchange Rate API',
    url: 'https://open.er-api.com',
    endpoint: '/v6/latest/USD',
    timeout: 5000,
    slowThreshold: 2000,
  },
];

export function useStatusMonitor(refreshInterval: number = 10000) {
  const [entries, setEntries] = useState<StatusEntry[]>([]);
  const [health, setHealth] = useState<ServiceHealth>({
    total: MONITORED_SERVICES.length,
    operational: 0,
    averageResponseTime: 0,
    lastUpdated: new Date(),
  });

  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const entryIdCounter = useRef(0);

  const addEntry = useCallback((entry: Omit<StatusEntry, 'id' | 'timestamp'>) => {
    const newEntry: StatusEntry = {
      ...entry,
      id: `entry-${entryIdCounter.current++}`,
      timestamp: new Date(),
    };

    setEntries(prev => {
      const updated = [...prev, newEntry];
      // Keep only last 50 entries for performance
      return updated.slice(-50);
    });

    return newEntry;
  }, []);

  const checkService = useCallback(async (service: ServiceConfig): Promise<StatusEntry> => {
    const startTime = Date.now();
    
    // Add checking entry
    addEntry({
      service: service.name,
      status: 'checking',
      message: `Checking ${service.name}...`,
      endpoint: service.endpoint,
    });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), service.timeout);

      const response = await fetch(`${service.url}${service.endpoint}`, {
        signal: controller.signal,
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const status = responseTime > service.slowThreshold ? 'slow' : 'ready';
        return addEntry({
          service: service.name,
          status,
          responseTime,
          message: `${service.name} ${status === 'ready' ? 'operational' : 'responding slowly'}`,
          endpoint: service.endpoint,
        });
      } else {
        return addEntry({
          service: service.name,
          status: 'offline',
          responseTime,
          message: `${service.name} returned ${response.status}`,
          endpoint: service.endpoint,
        });
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error instanceof Error && error.name === 'AbortError') {
        return addEntry({
          service: service.name,
          status: 'timeout',
          responseTime,
          message: `${service.name} timed out after ${service.timeout}ms`,
          endpoint: service.endpoint,
        });
      }

      return addEntry({
        service: service.name,
        status: 'offline',
        responseTime,
        message: `${service.name} connection failed`,
        endpoint: service.endpoint,
      });
    }
  }, [addEntry]);

  const checkAllServices = useCallback(async () => {
    addEntry({
      service: 'System',
      status: 'checking',
      message: 'Starting health check cycle...',
    });

    const results = await Promise.all(
      MONITORED_SERVICES.map(service => checkService(service))
    );

    // Calculate health metrics
    const operational = results.filter(r => r.status === 'ready' || r.status === 'slow').length;
    const responseTimes = results
      .filter(r => r.responseTime !== undefined)
      .map(r => r.responseTime!);
    
    const averageResponseTime = responseTimes.length > 0 
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;

    setHealth({
      total: MONITORED_SERVICES.length,
      operational,
      averageResponseTime,
      lastUpdated: new Date(),
    });

    addEntry({
      service: 'System',
      status: operational === MONITORED_SERVICES.length ? 'ready' : 'slow',
      message: `Health check complete: ${operational}/${MONITORED_SERVICES.length} services operational`,
    });
  }, [checkService, addEntry]);

  const startMonitoring = useCallback(() => {
    // Initial check
    checkAllServices();

    // Set up interval
    intervalRef.current = setInterval(checkAllServices, refreshInterval);
  }, [checkAllServices, refreshInterval]);

  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  }, []);

  useEffect(() => {
    startMonitoring();
    return stopMonitoring;
  }, [startMonitoring, stopMonitoring]);

  return {
    entries,
    health,
    checkAllServices,
    startMonitoring,
    stopMonitoring,
  };
}
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ConnectionStatusProps {
  className?: string;
}

export function ConnectionStatus({ className }: ConnectionStatusProps) {
  const [status, setStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connected');
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  useEffect(() => {
    const checkConnection = async () => {
      try {
        setStatus('connecting');
        const ollamaUrl = import.meta.env.VITE_OLLAMA_URL ?? "http://localhost:11434";
        
        // Quick health check with short timeout
        const response = await fetch(`${ollamaUrl}/api/tags`, {
          signal: AbortSignal.timeout(2000),
        });
        
        if (response.ok) {
          setStatus('connected');
        } else {
          setStatus('disconnected');
        }
      } catch {
        setStatus('disconnected');
      } finally {
        setLastCheck(new Date());
      }
    };

    // Check immediately
    checkConnection();

    // Check every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500 animate-pulse';
      case 'disconnected': return 'bg-red-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected': return 'AI Connected';
      case 'connecting': return 'Checking...';
      case 'disconnected': return 'AI Disconnected';
    }
  };

  return (
    <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
      <div className={cn("w-2 h-2 rounded-full", getStatusColor())} />
      <span>{getStatusText()}</span>
      {status === 'disconnected' && (
        <span className="text-red-500">
          • Check your connection or try refreshing
        </span>
      )}
    </div>
  );
}
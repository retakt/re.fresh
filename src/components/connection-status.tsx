import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { forceConnectionCheck } from "@/lib/connection-monitor";

interface ConnectionStatusProps {
  className?: string;
  checkAI?: boolean; // Check AI services
  checkDB?: boolean; // Check database connection
}

export function ConnectionStatus({ 
  className, 
  checkAI = true,
  checkDB = true 
}: ConnectionStatusProps) {
  const [aiStatus, setAIStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connected');
  const [dbStatus, setDBStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connected');
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  useEffect(() => {
    const checkConnections = async () => {
      // Check AI connection
      if (checkAI) {
        try {
          setAIStatus('connecting');
          const ollamaUrl = import.meta.env.VITE_OLLAMA_URL ?? "http://localhost:11434";
          
          const response = await fetch(`${ollamaUrl}/api/tags`, {
            signal: AbortSignal.timeout(2000),
          });
          
          setAIStatus(response.ok ? 'connected' : 'disconnected');
        } catch {
          setAIStatus('disconnected');
        }
      }

      // Check database connection
      if (checkDB) {
        try {
          setDBStatus('connecting');
          
          // Simple health check - try to get session
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('[connection-status] DB check failed:', error);
            setDBStatus('disconnected');
            // Try to recover
            await forceConnectionCheck();
          } else {
            setDBStatus('connected');
          }
        } catch (error) {
          console.error('[connection-status] DB check error:', error);
          setDBStatus('disconnected');
        }
      }

      setLastCheck(new Date());
    };

    // Check immediately
    checkConnections();

    // Check every 30 seconds
    const interval = setInterval(checkConnections, 30000);

    // Check when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkConnections();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Check when network reconnects
    const handleOnline = () => {
      checkConnections();
    };
    window.addEventListener('online', handleOnline);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [checkAI, checkDB]);

  // Determine overall status
  const overallStatus = 
    (checkDB && dbStatus === 'disconnected') || (checkAI && aiStatus === 'disconnected')
      ? 'disconnected'
      : (checkDB && dbStatus === 'connecting') || (checkAI && aiStatus === 'connecting')
      ? 'connecting'
      : 'connected';

  const getStatusColor = () => {
    switch (overallStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500 animate-pulse';
      case 'disconnected': return 'bg-red-500';
    }
  };

  const getStatusText = () => {
    if (checkDB && checkAI) {
      if (dbStatus === 'disconnected' && aiStatus === 'disconnected') {
        return 'All Services Disconnected';
      }
      if (dbStatus === 'disconnected') {
        return 'Database Disconnected';
      }
      if (aiStatus === 'disconnected') {
        return 'AI Disconnected';
      }
      if (overallStatus === 'connecting') {
        return 'Checking...';
      }
      return 'All Connected';
    }
    
    if (checkDB) {
      switch (dbStatus) {
        case 'connected': return 'Database Connected';
        case 'connecting': return 'Checking Database...';
        case 'disconnected': return 'Database Disconnected';
      }
    }
    
    if (checkAI) {
      switch (aiStatus) {
        case 'connected': return 'AI Connected';
        case 'connecting': return 'Checking AI...';
        case 'disconnected': return 'AI Disconnected';
      }
    }

    return 'Connected';
  };

  const handleRetry = async () => {
    if (checkDB && dbStatus === 'disconnected') {
      await forceConnectionCheck();
    }
    // Trigger immediate recheck
    setLastCheck(new Date());
  };

  return (
    <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
      <div className={cn("w-2 h-2 rounded-full", getStatusColor())} />
      <span>{getStatusText()}</span>
      {overallStatus === 'disconnected' && (
        <>
          <span className="text-red-500">
            • Connection lost
          </span>
          <button
            onClick={handleRetry}
            className="text-primary hover:underline"
          >
            Retry
          </button>
        </>
      )}
    </div>
  );
}
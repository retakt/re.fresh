import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from "react";
import type { Terminal } from "@xterm/xterm";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TerminalContextValue {
  // Connection state
  status: "connected" | "reconnecting" | "disconnected";
  viewerCount: number;
  isAuthenticated: boolean;
  
  // Terminal management
  registerTerminal: (terminal: Terminal) => void;
  unregisterTerminal: () => void;
  
  // History management
  getTerminalHistory: () => string;
  
  // Actions
  sendInput: (data: string) => void;
  sendClear: () => void;
  sendReset: () => void;
  sendResize: (cols: number, rows: number) => void;
  connectWithPassword: (password: string) => void;
  logout: () => void;
  reconnect: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const TerminalContext = createContext<TerminalContextValue | null>(null);

export function useTerminalContext(): TerminalContextValue {
  const context = useContext(TerminalContext);
  if (!context) {
    throw new Error("useTerminalContext must be used within a TerminalProvider");
  }
  return context;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const WS_BASE_URL = (() => {
  if (import.meta.env.VITE_TERMINAL_WS_URL) {
    return import.meta.env.VITE_TERMINAL_WS_URL as string;
  }
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") {
    return `${proto}//${host}:3003`;
  }
  return `wss://shell.retakt.cc`;
})();

const MAX_RETRY_COUNT = 10;
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 1 hour

// ─── Session Storage ──────────────────────────────────────────────────────────

interface TerminalSession {
  password: string;
  timestamp: number;
}

function getStoredSession(): TerminalSession | null {
  try {
    const stored = sessionStorage.getItem('terminal_session');
    if (!stored) return null;
    
    const session: TerminalSession = JSON.parse(stored);
    const now = Date.now();
    
    if (now - session.timestamp > SESSION_TIMEOUT) {
      sessionStorage.removeItem('terminal_session');
      return null;
    }
    
    return session;
  } catch {
    return null;
  }
}

function storeSession(password: string): void {
  try {
    const session: TerminalSession = {
      password,
      timestamp: Date.now()
    };
    sessionStorage.setItem('terminal_session', JSON.stringify(session));
  } catch {
    // Ignore storage errors
  }
}

function clearStoredSession(): void {
  try {
    sessionStorage.removeItem('terminal_session');
  } catch {
    // Ignore storage errors
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

interface TerminalProviderProps {
  children: React.ReactNode;
}

export function TerminalProvider({ children }: TerminalProviderProps) {
  // Connection state
  const [status, setStatus] = useState<"connected" | "reconnecting" | "disconnected">("disconnected");
  const [viewerCount, setViewerCount] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Refs for persistent state
  const socketRef = useRef<WebSocket | null>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef(Date.now());
  const isMountedRef = useRef(true);
  
  // Terminal history buffer - persists across component unmounts
  const terminalHistoryRef = useRef<string>("");
  const isRestoringHistoryRef = useRef(false);

  // ── Connection Management ──────────────────────────────────────────────────

  const connect = useCallback(async (password?: string) => {
    if (retryTimeoutRef.current !== null) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    if (!isMountedRef.current || !password) {
      setStatus("disconnected");
      return;
    }

    const url = `${WS_BASE_URL}?password=${encodeURIComponent(password)}`;
    console.log("[TerminalProvider] Connecting to:", WS_BASE_URL);
    
    const ws = new WebSocket(url);
    socketRef.current = ws;
    let hasHandledDisconnect = false;

    ws.onopen = () => {
      if (!isMountedRef.current) return;
      console.log("[TerminalProvider] Connected!");
      setStatus("connected");
      setIsAuthenticated(true);
      retryCountRef.current = 0;
      if (password) {
        storeSession(password);
      }
      
      // Send terminal dimensions if terminal is registered
      if (terminalRef.current) {
        const { cols, rows } = terminalRef.current;
        ws.send(JSON.stringify({ type: "resize", data: { cols, rows } }));
      }
    };

    ws.onmessage = (event: MessageEvent) => {
      if (!isMountedRef.current) return;
      try {
        const msg = JSON.parse(event.data as string);
        switch (msg.type) {
          case "output":
            // Store output in history buffer
            terminalHistoryRef.current += msg.data as string;
            // Also write to terminal if it's registered
            terminalRef.current?.write(msg.data as string);
            break;
          case "history":
            // Replace history buffer with server history
            terminalHistoryRef.current = msg.data as string;
            if (terminalRef.current) {
              terminalRef.current.write("\x1b[H");
              terminalRef.current.write(msg.data as string);
            }
            break;
          case "viewer-count":
            setViewerCount(msg.count as number);
            break;
          case "status":
            setStatus(msg.state as "connected" | "reconnecting" | "disconnected");
            break;
          case "clear":
            // Clear history buffer
            terminalHistoryRef.current = "";
            terminalRef.current?.clear();
            break;
          default:
            break;
        }
      } catch (err) {
        console.error("[TerminalProvider] Failed to parse message:", err);
      }
    };

    const handleDisconnect = (event?: Event) => {
      if (!isMountedRef.current || hasHandledDisconnect) return;
      hasHandledDisconnect = true;

      console.log("[TerminalProvider] Disconnected:", event);
      setIsAuthenticated(false);

      const closeEvent = event instanceof CloseEvent ? event : undefined;
      const authFailed = closeEvent?.code === 4001 || closeEvent?.reason === "Authentication failed";
      if (authFailed) {
        clearStoredSession();
        setStatus("disconnected");
        return;
      }

      retryCountRef.current += 1;
      if (retryCountRef.current >= MAX_RETRY_COUNT) {
        console.log("[TerminalProvider] Max retries reached");
        setStatus("disconnected");
        return;
      }

      setStatus("reconnecting");

      const delaySecs = Math.min(Math.pow(2, retryCountRef.current), 30);
      const delayMs = delaySecs * 1000;

      console.log(`[TerminalProvider] Retrying in ${delaySecs}s...`);
      retryTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          const session = getStoredSession();
          if (session) {
            connect(session.password);
          } else {
            setStatus("disconnected");
          }
        }
      }, delayMs);
    };

    ws.onclose = handleDisconnect;
    ws.onerror = (event) => {
      console.error("[TerminalProvider] WebSocket error:", event);
    };
  }, []);

  // ── Terminal Registration ──────────────────────────────────────────────────

  const registerTerminal = useCallback((terminal: Terminal) => {
    console.log("[TerminalProvider] Terminal registered");
    terminalRef.current = terminal;
    
    // Restore history to the new terminal instance
    if (terminalHistoryRef.current && !isRestoringHistoryRef.current) {
      console.log("[TerminalProvider] Restoring terminal history");
      isRestoringHistoryRef.current = true;
      
      // Clear terminal first
      terminal.clear();
      
      // Write the stored history
      terminal.write(terminalHistoryRef.current);
      
      isRestoringHistoryRef.current = false;
    }
    
    // If we're already connected, send dimensions
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      const { cols, rows } = terminal;
      socketRef.current.send(JSON.stringify({ type: "resize", data: { cols, rows } }));
    }
  }, []);

  const unregisterTerminal = useCallback(() => {
    console.log("[TerminalProvider] Terminal unregistered");
    terminalRef.current = null;
  }, []);

  const getTerminalHistory = useCallback(() => {
    return terminalHistoryRef.current;
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────

  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    const session = getStoredSession();
    if (session) {
      storeSession(session.password);
    }
  }, []);

  const sendInput = useCallback((data: string) => {
    updateActivity();
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "input", data }));
    }
  }, [updateActivity]);

  const sendClear = useCallback(() => {
    // Clear history buffer
    terminalHistoryRef.current = "";
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "clear" }));
    }
  }, []);

  const sendReset = useCallback(() => {
    // Clear history buffer on reset
    terminalHistoryRef.current = "";
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "reset" }));
    }
  }, []);

  const sendResize = useCallback((cols: number, rows: number) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "resize", data: { cols, rows } }));
    }
  }, []);

  const connectWithPassword = useCallback((password: string) => {
    connect(password);
  }, [connect]);

  const logout = useCallback(() => {
    clearStoredSession();
    setIsAuthenticated(false);
    
    // Clear history buffer on logout
    terminalHistoryRef.current = "";
    
    if (socketRef.current) {
      socketRef.current.onclose = null;
      socketRef.current.onerror = null;
      socketRef.current.onmessage = null;
      socketRef.current.onopen = null;
      socketRef.current.close();
      socketRef.current = null;
    }

    setStatus("disconnected");
    retryCountRef.current = 0;

    if (retryTimeoutRef.current !== null) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  const reconnect = useCallback(() => {
    retryCountRef.current = 0;

    if (retryTimeoutRef.current !== null) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.onclose = null;
      socketRef.current.onerror = null;
      socketRef.current.onmessage = null;
      socketRef.current.onopen = null;
      socketRef.current.close();
      socketRef.current = null;
    }

    setStatus("disconnected");
  }, []);

  // ── Effects ────────────────────────────────────────────────────────────────

  // Initialize connection on mount
  useEffect(() => {
    isMountedRef.current = true;
    
    // Try to restore session
    const session = getStoredSession();
    if (session) {
      console.log("[TerminalProvider] Restoring session");
      setStatus("reconnecting");
      connect(session.password);
    }

    return () => {
      isMountedRef.current = false;

      if (retryTimeoutRef.current !== null) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      if (socketRef.current) {
        socketRef.current.onclose = null;
        socketRef.current.onerror = null;
        socketRef.current.onmessage = null;
        socketRef.current.onopen = null;
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [connect]);

  // Inactivity check
  useEffect(() => {
    const checkInactivity = () => {
      const now = Date.now();
      const inactiveTime = now - lastActivityRef.current;
      
      if (inactiveTime > INACTIVITY_TIMEOUT && isAuthenticated) {
        console.log("[TerminalProvider] Auto-logout due to inactivity");
        logout();
      }
    };

    const interval = setInterval(checkInactivity, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated, logout]);

  // ── Context Value ──────────────────────────────────────────────────────────

  const contextValue: TerminalContextValue = {
    status,
    viewerCount,
    isAuthenticated,
    registerTerminal,
    unregisterTerminal,
    getTerminalHistory,
    sendInput,
    sendClear,
    sendReset,
    sendResize,
    connectWithPassword,
    logout,
    reconnect,
  };

  return (
    <TerminalContext.Provider value={contextValue}>
      {children}
    </TerminalContext.Provider>
  );
}
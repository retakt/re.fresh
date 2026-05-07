import { useCallback, useEffect, useRef, useState } from "react";
import type { Terminal } from "@xterm/xterm";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseTerminalWsOptions {
  terminalRef: React.RefObject<Terminal | null>;
}

export interface UseTerminalWsReturn {
  status: "connected" | "reconnecting" | "disconnected";
  viewerCount: number;
  sendInput: (data: string) => void;
  sendClear: () => void;
  sendReset: () => void;
  sendResize: (cols: number, rows: number) => void;
  reconnect: () => void;
  connectWithPassword: (password: string) => void;
  logout: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

// In production the frontend is served over HTTPS so we must use WSS.
// VITE_TERMINAL_WS_URL overrides everything — set it in .env.local.
// Fallback: derive from current page protocol + hostname so it works
// on both localhost (ws://) and the VPS (wss://).
const WS_BASE_URL = (() => {
  if (import.meta.env.VITE_TERMINAL_WS_URL) {
    return import.meta.env.VITE_TERMINAL_WS_URL as string;
  }
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.hostname;
  // On localhost: connect directly to port 3003
  // On VPS: shell.retakt.cc proxies WebSocket connections
  if (host === "localhost" || host === "127.0.0.1") {
    return `${proto}//${host}:3003`;
  }
  return `wss://shell.retakt.cc`;
})();

const MAX_RETRY_COUNT = 10;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTerminalWs({
  terminalRef,
}: UseTerminalWsOptions): UseTerminalWsReturn {
  const [status, setStatus] = useState<
    "connected" | "reconnecting" | "disconnected"
  >("reconnecting");
  const [viewerCount, setViewerCount] = useState(0);

  // Use refs for mutable values accessed inside the connect callback
  // to avoid stale closures and unnecessary re-renders.
  const socketRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  const connect = useCallback(async (password?: string) => {
    // Clear any pending retry timeout
    if (retryTimeoutRef.current !== null) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    if (!isMountedRef.current) return;

    // If no password provided, we'll wait for user input
    if (!password) {
      setStatus("disconnected");
      return;
    }

    const url = `${WS_BASE_URL}?password=${encodeURIComponent(password)}`;
    console.log("[useTerminalWs] Connecting to:", WS_BASE_URL);
    const ws = new WebSocket(url);
    socketRef.current = ws;

    ws.onopen = () => {
      if (!isMountedRef.current) return;
      console.log("[useTerminalWs] Connected!");
      setStatus("connected");
      retryCountRef.current = 0;
      // Immediately send terminal dimensions so PTY resizes before history replay
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
            terminalRef.current?.write(msg.data as string);
            break;
          case "history":
            // Reset cursor to top-left before replaying history
            // to avoid stale cursor positioning from old PTY output
            terminalRef.current?.write("\x1b[H");
            terminalRef.current?.write(msg.data as string);
            break;
          case "viewer-count":
            setViewerCount(msg.count as number);
            break;
          case "status":
            setStatus(
              msg.state as "connected" | "reconnecting" | "disconnected",
            );
            break;
          case "clear":
            terminalRef.current?.clear();
            break;
          default:
            break;
        }
      } catch (err) {
        console.error("[useTerminalWs] Failed to parse message:", err);
      }
    };

    const handleDisconnect = (event?: Event) => {
      if (!isMountedRef.current) return;

      console.log("[useTerminalWs] Disconnected:", event);
      retryCountRef.current += 1;

      if (retryCountRef.current >= MAX_RETRY_COUNT) {
        console.log("[useTerminalWs] Max retries reached");
        setStatus("disconnected");
        return;
      }

      setStatus("reconnecting");

      // Exponential backoff: delay = min(2^retryCount, 30) * 1000 ms
      const delaySecs = Math.min(
        Math.pow(2, retryCountRef.current),
        30,
      );
      const delayMs = delaySecs * 1000;

      console.log(`[useTerminalWs] Retrying in ${delaySecs}s...`);
      retryTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          connect();
        }
      }, delayMs);
    };

    ws.onclose = (event) => handleDisconnect(event);
    ws.onerror = (event) => {
      console.error("[useTerminalWs] WebSocket error:", event);
      handleDisconnect(event);
    };
  }, [terminalRef]);

  // Mount: open the WebSocket connection
  useEffect(() => {
    isMountedRef.current = true;
    // Don't auto-connect - wait for password input

    return () => {
      // Cleanup on unmount
      isMountedRef.current = false;

      if (retryTimeoutRef.current !== null) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      if (socketRef.current) {
        // Remove handlers before closing to prevent the close handler
        // from scheduling a reconnect after unmount.
        socketRef.current.onclose = null;
        socketRef.current.onerror = null;
        socketRef.current.onmessage = null;
        socketRef.current.onopen = null;
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, []);

  // ─── Send helpers ──────────────────────────────────────────────────────────

  const sendInput = useCallback((data: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "input", data }));
    }
  }, []);

  const sendClear = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "clear" }));
    }
  }, []);

  const sendReset = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "reset" }));
    }
  }, []);

  const sendResize = useCallback((cols: number, rows: number) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "resize", data: { cols, rows } }));
    }
  }, []);

  const reconnect = useCallback(() => {
    // Reset retry counter and force a fresh connection
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

    // Don't auto-reconnect - user needs to enter password again
    setStatus("disconnected");
  }, []);

  const connectWithPassword = useCallback((password: string) => {
    connect(password);
  }, [connect]);

  const logout = useCallback(() => {
    // Close the WebSocket connection
    if (socketRef.current) {
      socketRef.current.onclose = null;
      socketRef.current.onerror = null;
      socketRef.current.onmessage = null;
      socketRef.current.onopen = null;
      socketRef.current.close();
      socketRef.current = null;
    }

    // Reset state
    setStatus("disconnected");
    retryCountRef.current = 0;

    if (retryTimeoutRef.current !== null) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  return { status, viewerCount, sendInput, sendClear, sendReset, sendResize, reconnect, connectWithPassword, logout };
}

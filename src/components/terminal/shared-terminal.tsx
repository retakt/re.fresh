// ─── SharedTerminal ───────────────────────────────────────────────────────────
// Uses xterm.js native onKey for input — no textarea overlay.
// Password prompt is rendered inside the terminal itself.

import "@fontsource/fira-code";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";
import "./terminal.css";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTerminalWs } from "@/hooks/use-terminal-ws";
import { useAuthContext } from "@/components/providers/auth";
import { TerminalWindowChrome } from "./terminal-window-chrome";

export interface SharedTerminalProps {
  className?: string;
}

// ─── Terminal theme ───────────────────────────────────────────────────────────

const TERMINAL_THEME = {
  background: "#00000000",      // fully transparent — shows app grain bg through
  foreground: "#5eead4",
  cursor: "#fbbf24",
  cursorAccent: "#1a0f0a",
  selectionBackground: "#78350f80",
  black: "#21222c",
  red: "#f87171",
  green: "#34d399",
  yellow: "#fbbf24",
  blue: "#60a5fa",
  magenta: "#f472b6",
  cyan: "#22d3ee",
  white: "#f8f8f2",
  brightBlack: "#6272a4",
  brightRed: "#fca5a5",
  brightGreen: "#6ee7b7",
  brightYellow: "#fcd34d",
  brightBlue: "#93c5fd",
  brightMagenta: "#f9a8d4",
  brightCyan: "#67e8f9",
  brightWhite: "#ffffff",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function SharedTerminal({ className }: SharedTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  // Auth state managed inside the terminal
  const authStateRef = useRef<{
    authenticated: boolean;
    passwordBuffer: string;
  }>({ authenticated: false, passwordBuffer: "" });

  // Command history
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const currentLineRef = useRef(""); // tracks what user has typed on current line

  // Activity tracking
  const lastActivityRef = useRef(Date.now());
  const [isRunning, setIsRunning] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const { isAdmin } = useAuthContext();
  const { status, viewerCount, sendInput, sendClear, sendReset, sendResize, connectWithPassword, logout } =
    useTerminalWs({ terminalRef });

  // ── Helpers ────────────────────────────────────────────────────────────────

  const write = useCallback((data: string) => {
    terminalRef.current?.write(data);
  }, []);

  const writeln = useCallback((data: string) => {
    terminalRef.current?.writeln(data);
  }, []);

  const showPasswordPrompt = useCallback(() => {
    authStateRef.current = { authenticated: false, passwordBuffer: "" };
    terminalRef.current?.clear();
    writeln("\x1b[1;32mre.Terminal\x1b[0m");
    writeln("");
    write("\x1b[1;33mPassword:\x1b[0m ");
  }, [write, writeln]);

  // ── Logout helper (ref so it's always fresh inside the effect) ────────────
  const doLogoutRef = useRef<() => void>(() => {});

  const doLogout = useCallback(() => {
    logout();
    currentLineRef.current = "";
    historyIndexRef.current = -1;
    setTimeout(() => showPasswordPrompt(), 300);
  }, [logout, showPasswordPrompt]);

  // Keep the ref in sync
  useEffect(() => {
    doLogoutRef.current = doLogout;
  }, [doLogout]);

  // Keep sendResize accessible inside the mount effect via a ref
  const sendResizeRef = useRef(sendResize);
  useEffect(() => { sendResizeRef.current = sendResize; }, [sendResize]);

  // ── Mount xterm.js ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!containerRef.current) return;

    const terminal = new Terminal({
      cursorBlink: true,
      cursorStyle: "underline",
      fontSize: 13,
      lineHeight: 1.2,
      letterSpacing: 0,
      fontFamily: '"Fira Code", "Cascadia Code", "JetBrains Mono", monospace',
      theme: TERMINAL_THEME,
      scrollback: 10000,
      convertEol: true,
      allowProposedApi: false,
      allowTransparency: true,   // required for rgba background to work
      disableStdin: false,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);
    terminal.open(containerRef.current);

    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Helper: fit and notify server of new dimensions
    const fitAndResize = () => {
      fitAddon.fit();
      const { cols, rows } = terminal;
      sendResizeRef.current(cols, rows);
    };

    // Fit after a short delay so the container has its final size
    const fitTimer = setTimeout(() => {
      fitAndResize();
      setIsReady(true);
      // Show password prompt after terminal is ready
      terminal.clear();
      terminal.writeln("\x1b[1;32mre.Terminal\x1b[0m");
      terminal.writeln("");
      terminal.write("\x1b[1;33mPassword:\x1b[0m ");
      terminal.focus();
    }, 80);

    // ── Input handling via xterm.js native onKey ───────────────────────────
    // This is the ONLY place we handle keyboard input.
    // No textarea overlay, no React event handlers for keys.
    const keyDisposable = terminal.onKey(({ key, domEvent }) => {
      const auth = authStateRef.current;

      // ── Password prompt mode ─────────────────────────────────────────────
      if (!auth.authenticated) {
        if (domEvent.key === "Enter") {
          const pwd = auth.passwordBuffer;
          auth.passwordBuffer = "";
          terminal.writeln("");
          terminal.writeln("\x1b[1;36mConnecting...\x1b[0m");
          connectWithPassword(pwd);
          return;
        }
        if (domEvent.key === "Backspace") {
          if (auth.passwordBuffer.length > 0) {
            auth.passwordBuffer = auth.passwordBuffer.slice(0, -1);
            // Erase the last asterisk: move back, space, move back
            terminal.write("\b \b");
          }
          return;
        }
        // Printable character
        if (key.length === 1 && !domEvent.ctrlKey && !domEvent.altKey) {
          auth.passwordBuffer += key;
          terminal.write("*");
        }
        return;
      }

      // ── Normal terminal mode ─────────────────────────────────────────────
      lastActivityRef.current = Date.now();
      setIsRunning(true);

      const { ctrlKey, altKey, key: dKey } = domEvent;

      // Ctrl+C
      if (ctrlKey && dKey === "c") {
        sendInput("\x03");
        currentLineRef.current = "";
        historyIndexRef.current = -1;
        return;
      }

      // Ctrl+L — clear
      if (ctrlKey && dKey === "l") {
        sendClear();
        return;
      }

      // Ctrl+D — logout
      if (ctrlKey && dKey === "d") {
        doLogoutRef.current();
        return;
      }

      // Arrow Up — history prev
      if (dKey === "ArrowUp") {
        const hist = historyRef.current;
        if (hist.length === 0) return;
        const newIdx = historyIndexRef.current === -1
          ? hist.length - 1
          : Math.max(0, historyIndexRef.current - 1);
        historyIndexRef.current = newIdx;
        replaceCurrentLine(terminal, currentLineRef.current, hist[newIdx]);
        currentLineRef.current = hist[newIdx];
        return;
      }

      // Arrow Down — history next
      if (dKey === "ArrowDown") {
        const hist = historyRef.current;
        if (hist.length === 0 || historyIndexRef.current === -1) return;
        const newIdx = historyIndexRef.current + 1;
        if (newIdx >= hist.length) {
          replaceCurrentLine(terminal, currentLineRef.current, "");
          currentLineRef.current = "";
          historyIndexRef.current = -1;
        } else {
          historyIndexRef.current = newIdx;
          replaceCurrentLine(terminal, currentLineRef.current, hist[newIdx]);
          currentLineRef.current = hist[newIdx];
        }
        return;
      }

      // Arrow Left / Right — pass through to PTY
      if (dKey === "ArrowLeft") { sendInput("\x1b[D"); return; }
      if (dKey === "ArrowRight") { sendInput("\x1b[C"); return; }

      // Home / End
      if (dKey === "Home") { sendInput("\x1b[H"); return; }
      if (dKey === "End") { sendInput("\x1b[F"); return; }

      // Delete
      if (dKey === "Delete") { sendInput("\x1b[3~"); return; }

      // Tab
      if (dKey === "Tab") {
        sendInput("\t");
        return;
      }

      // Escape
      if (dKey === "Escape") {
        sendInput("\x1b");
        return;
      }

      // Enter
      if (dKey === "Enter") {
        const line = currentLineRef.current.trim();

        // Intercept logout before sending to PTY
        if (line.toLowerCase() === "logout") {
          doLogoutRef.current();
          return;
        }

        // Add to history
        if (line) {
          historyRef.current.push(line);
          if (historyRef.current.length > 200) historyRef.current.shift();
        }
        historyIndexRef.current = -1;
        currentLineRef.current = "";

        sendInput("\r");
        return;
      }

      // Backspace
      if (dKey === "Backspace") {
        if (currentLineRef.current.length > 0) {
          currentLineRef.current = currentLineRef.current.slice(0, -1);
        }
        sendInput("\x7f");
        return;
      }

      // Ctrl+key combos (pass through)
      if (ctrlKey && !altKey && key.length === 1) {
        sendInput(key);
        return;
      }

      // Printable characters
      if (!ctrlKey && !altKey && key.length === 1) {
        currentLineRef.current += key;
        sendInput(key);
        return;
      }
    });

    // ── Paste handling ─────────────────────────────────────────────────────
    const pasteDisposable = terminal.onData((data) => {
      // onData fires for paste events (multi-char) that onKey doesn't catch
      // Single chars are already handled by onKey above, so skip them
      if (data.length <= 1) return;
      if (!authStateRef.current.authenticated) return;

      // Multi-char paste
      const lines = data.split(/\r?\n/);
      if (lines.length > 1) {
        // Execute each line
        lines.forEach((line, i) => {
          if (!line) return;
          setTimeout(() => {
            for (const ch of line) sendInput(ch);
            sendInput("\r");
            if (line.trim()) historyRef.current.push(line.trim());
          }, i * 80);
        });
        currentLineRef.current = "";
        historyIndexRef.current = -1;
      } else {
        // Single line paste
        for (const ch of data) sendInput(ch);
        currentLineRef.current += data;
      }
    });

    // ── Resize handling ────────────────────────────────────────────────────
    let resizeTimer: ReturnType<typeof setTimeout>;
    const doFit = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => fitAndResize(), 80);
    };
    window.addEventListener("resize", doFit);

    const ro = new ResizeObserver(doFit);
    ro.observe(containerRef.current);

    // ── Cleanup ────────────────────────────────────────────────────────────
    return () => {
      clearTimeout(fitTimer);
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", doFit);
      ro.disconnect();
      keyDisposable.dispose();
      pasteDisposable.dispose();
      terminal.dispose();
      terminalRef.current = null;
      fitAddonRef.current = null;
      setIsReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Activity timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => {
      if (Date.now() - lastActivityRef.current > 3000) setIsRunning(false);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // ── React to connection status changes ─────────────────────────────────────
  const prevStatusRef = useRef(status);
  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;

    if (status === "connected" && !authStateRef.current.authenticated) {
      authStateRef.current.authenticated = true;
      writeln("");
      writeln("\x1b[1;32m✓ Connected!\x1b[0m");
      writeln("");
      // Send current terminal dimensions to server
      if (terminalRef.current) {
        sendResize(terminalRef.current.cols, terminalRef.current.rows);
      }
      terminalRef.current?.focus();
    } else if (status === "disconnected" && prev !== "disconnected") {
      // Only show auth-failed if we were previously connected or reconnecting
      // and the user didn't explicitly log out
      if (authStateRef.current.authenticated) {
        // Server dropped us
        writeln("");
        writeln("\x1b[1;31m✗ Connection lost\x1b[0m");
      } else if (prev === "reconnecting") {
        // Password was wrong
        writeln("");
        writeln("\x1b[1;31m✗ Authentication failed\x1b[0m");
        writeln("");
        write("\x1b[1;33mPassword:\x1b[0m ");
        authStateRef.current = { authenticated: false, passwordBuffer: "" };
      }
    }
  }, [status, write, writeln]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={`flex flex-col h-full min-h-0 ${className ?? ""}`}>
      <TerminalWindowChrome
        title="Terminal"
        status={status}
        viewerCount={viewerCount}
        isAdmin={isAdmin}
        isRunning={isRunning}
        onClear={sendClear}
        onReset={sendReset}
      />

      {/* Terminal viewport */}
      <div
        className="relative flex-1 min-h-0"
        onClick={() => terminalRef.current?.focus()}
      >
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-teal-300 text-sm">Initializing...</span>
          </div>
        )}

        <div
          ref={containerRef}
          className="terminal-container"
          style={{ width: "100%", height: "100%", opacity: isReady ? 1 : 0 }}
        />

        {!isAdmin && (
          <div className="absolute bottom-2 left-2 text-[10px] text-muted-foreground bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded border border-white/10 pointer-events-none z-10">
            Read-only
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Utility: replace the current typed line in the terminal ──────────────────
// Moves cursor to start of line, erases it, writes the new text.
function replaceCurrentLine(terminal: Terminal, oldLine: string, newLine: string) {
  // Move cursor back by oldLine.length
  if (oldLine.length > 0) {
    terminal.write(`\x1b[${oldLine.length}D`); // cursor left N
    terminal.write("\x1b[K"); // erase to end of line
  }
  if (newLine) {
    terminal.write(newLine);
  }
}

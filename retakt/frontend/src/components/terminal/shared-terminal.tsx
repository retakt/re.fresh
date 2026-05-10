// ─── SharedTerminal ───────────────────────────────────────────────────────────
// xterm.js is used purely as a display renderer.
// ALL input is forwarded raw to the PTY via onData — no local line editing.
// The PTY (bash/zsh) handles history, backspace, arrow keys, tab completion, etc.
//
// Browser shortcuts (Ctrl+Shift+C DevTools, Ctrl+T new tab, etc.) are blocked
// while the terminal has focus so they don't interfere.
// Ctrl+Shift+C / Ctrl+Shift+V are handled manually for clipboard.

import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";
import "./terminal.css";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTerminalContext } from "@/contexts/terminal-context";
import { useAuthContext } from "@/components/providers/auth";
import { TerminalWindowChrome } from "./terminal-window-chrome";

export interface SharedTerminalProps {
  className?: string;
}

// ─── Terminal theme — soft muted Dracula ─────────────────────────────────────

const TERMINAL_THEME = {
  background:          "#00000000",
  foreground:          "#a8a8a8",   // soft grey — not pure white
  cursor:              "#a8a8a8",
  cursorAccent:        "#282a36",
  selectionBackground: "#44475a",
  black:               "#21222c",
  red:                 "#c45a5a",   // muted red
  green:               "#45c46a",   // muted green
  yellow:              "#c4c45a",   // muted yellow
  blue:                "#7b7fc4",   // muted blue/purple
  magenta:             "#c47ba8",   // muted magenta
  cyan:                "#5ab8c4",   // muted cyan for directories
  white:               "#a8a8a8",   // same as foreground — soft grey
  brightBlack:         "#555555",
  brightRed:           "#d97070",
  brightGreen:         "#5ad97a",
  brightYellow:        "#d9d970",
  brightBlue:          "#9090d9",
  brightMagenta:       "#d990c0",
  brightCyan:          "#70ccd9",
  brightWhite:         "#c8c8c8",   // slightly brighter but still not pure white
};

// Editor shortcuts that should pass through to nano/vim
// These are NOT blocked so they can be handled by the terminal editor
const EDITOR_SHORTCUTS = new Set([
  "KeyX",  // nano: exit (Ctrl+X)
  "KeyO",  // nano: write out/save (Ctrl+O)
  "KeyS",  // nano: save (alternative), vim: save in some configs
  "KeyW",  // nano: search (Ctrl+W), vim: window commands (Ctrl+W)
  "KeyK",  // nano: cut line (Ctrl+K)
  "KeyG",  // nano: go to line (Ctrl+G), vim: file info (Ctrl+G)
]);

// Browser Ctrl+key shortcuts to block when terminal is focused
// Note: Editor shortcuts (KeyX, KeyO, KeyS, KeyW, KeyK, KeyG) are excluded
const BROWSER_CTRL_SHORTCUTS = new Set([
  "KeyT", "KeyN", "KeyR", "KeyL", "KeyF",
  "KeyH", "KeyJ", "KeyU", "KeyP", "KeyB",
  "KeyE", "KeyI", "KeyQ",
  "KeyY",
  "Digit1", "Digit2", "Digit3", "Digit4", "Digit5",
  "Digit6", "Digit7", "Digit8", "Digit9", "Digit0",
  "Minus", "Equal",
]);

// ─── Component ────────────────────────────────────────────────────────────────

export function SharedTerminal({ className }: SharedTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  // Password prompt state — only used before authentication
  const passwordBufferRef = useRef("");
  const isAuthenticatedLocalRef = useRef(false);

  const [isRunning, setIsRunning] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const lastActivityRef = useRef(Date.now());

  const { isAdmin } = useAuthContext();
  const {
    status,
    viewerCount,
    isAuthenticated,
    sendInput,
    sendClear,
    sendReset,
    sendResize,
    connectWithPassword,
    logout,
    registerTerminal,
    unregisterTerminal,
  } = useTerminalContext();

  // ── Helpers ────────────────────────────────────────────────────────────────

  const showPasswordPrompt = useCallback(() => {
    passwordBufferRef.current = "";
    isAuthenticatedLocalRef.current = false;
    const t = terminalRef.current;
    if (!t) return;
    t.options.cursorBlink = false;
    t.clear();
    t.writeln("\x1b[1;32mre.Terminal\x1b[0m");
    t.writeln("");
    t.write("\x1b[1;33mPassword:\x1b[0m ");
  }, []);

  const doLogout = useCallback(() => {
    logout();
    setTimeout(() => showPasswordPrompt(), 300);
  }, [logout, showPasswordPrompt]);

  const doLogoutRef = useRef(doLogout);
  useEffect(() => { doLogoutRef.current = doLogout; }, [doLogout]);

  // Keep sendInput accessible inside the keydown handler without stale closure
  const sendInputRef = useRef(sendInput);
  useEffect(() => { sendInputRef.current = sendInput; }, [sendInput]);

  // ── Touch scroll — route swipe gestures into xterm viewport ──────────────
  // On mobile, touch events on the xterm canvas don't automatically scroll
  // the xterm-viewport. We intercept touchmove on the container and manually
  // scroll the viewport, preventing the event from bubbling to the page.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let touchStartY = 0;

    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      const viewport = container.querySelector<HTMLElement>(".xterm-viewport");
      if (!viewport) return;

      const deltaY = touchStartY - e.touches[0].clientY;
      touchStartY = e.touches[0].clientY;

      // Only prevent default (page scroll) when the viewport can absorb the scroll
      const atTop = viewport.scrollTop === 0 && deltaY < 0;
      const atBottom =
        viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - 1 &&
        deltaY > 0;

      if (!atTop && !atBottom) {
        e.preventDefault();
        e.stopPropagation();
      }

      viewport.scrollTop += deltaY;
    };

    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  // ── Mount xterm.js ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!containerRef.current) return;

    // Responsive font size based on screen width
    // Small phones (<380px) → 12, normal phones → 13, tablets/desktop → 14
    const w = window.innerWidth;
    const responsiveFontSize = w < 380 ? 12 : w < 768 ? 13 : 14;

    const terminal = new Terminal({
      cursorBlink: true,
      cursorStyle: "block",
      fontSize: responsiveFontSize,
      lineHeight: 1.0,
      letterSpacing: 0,
      fontFamily: 'ui-monospace, "SF Mono", Menlo, Monaco, "Cascadia Mono", "Segoe UI Mono", monospace',
      theme: TERMINAL_THEME,
      scrollback: 10000,
      convertEol: true,
      allowProposedApi: true,
      allowTransparency: true,
      disableStdin: false,
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.loadAddon(new WebLinksAddon());
    terminal.open(containerRef.current);

    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;

    const fitAndResize = () => {
      fitAddon.fit();
      sendResize(terminal.cols, terminal.rows);
    };

    const fitTimer = setTimeout(() => {
      fitAndResize();
      setIsReady(true);
      registerTerminal(terminal);
      terminal.focus();

      // Only show password prompt if there's no active/restoring session
      // If status is "reconnecting" or "connected", the session effect handles display
      if (status === "disconnected" && !isAuthenticated) {
        showPasswordPrompt();
      }
    }, 80);

    // ── onData: forward all input raw to PTY ──────────────────────────────
    const dataDisposable = terminal.onData((data) => {

      // ── Password prompt mode ───────────────────────────────────────────
      if (!isAuthenticatedLocalRef.current) {
        for (const ch of data) {
          if (ch === "\r" || ch === "\n") {
            const pwd = passwordBufferRef.current;
            passwordBufferRef.current = "";
            terminal.writeln("");
            terminal.writeln("\x1b[1;36mConnecting...\x1b[0m");
            connectWithPassword(pwd);
          } else if (ch === "\x7f" || ch === "\b") {
            if (passwordBufferRef.current.length > 0) {
              passwordBufferRef.current = passwordBufferRef.current.slice(0, -1);
              terminal.write("\b \b");
            }
          } else if (ch >= " ") {
            passwordBufferRef.current += ch;
            terminal.write("*");
          }
        }
        return;
      }

      // ── Authenticated: forward everything raw to PTY ───────────────────
      lastActivityRef.current = Date.now();
      setIsRunning(true);

      // Ctrl+D → logout
      if (data === "\x04") {
        doLogoutRef.current();
        return;
      }

      sendInputRef.current(data);
    });

    // ── Block browser shortcuts at capture phase ───────────────────────────
    // Prevents Ctrl+Shift+C (DevTools), Ctrl+Shift+N (Vivaldi notes),
    // Ctrl+T (new tab), Ctrl+W (close tab), etc. from firing while the
    // terminal is focused. Clipboard is handled manually below.
    const container = containerRef.current;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;

      if (e.shiftKey) {
        // Ctrl+Shift+C → copy terminal selection to clipboard
        if (e.code === "KeyC") {
          e.preventDefault();
          e.stopPropagation();
          const sel = terminal.getSelection();
          if (sel) navigator.clipboard.writeText(sel).catch(() => {});
          return;
        }
        // Ctrl+Shift+V → paste clipboard into terminal
        if (e.code === "KeyV") {
          e.preventDefault();
          e.stopPropagation();
          navigator.clipboard.readText().then((text) => {
            if (text && isAuthenticatedLocalRef.current) sendInputRef.current(text);
          }).catch(() => {});
          return;
        }
        // Block ALL other Ctrl+Shift combos (DevTools, browser notes, etc.)
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // Allow editor shortcuts to pass through to PTY (nano/vim)
      if (EDITOR_SHORTCUTS.has(e.code)) {
        // Do NOT call preventDefault - let the event pass through to xterm
        return;
      }

      // Block common Ctrl+key browser shortcuts
      if (BROWSER_CTRL_SHORTCUTS.has(e.code)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // capture: true — fires before the browser processes the event
    container.addEventListener("keydown", handleKeyDown, true);

    // ── Resize handling ────────────────────────────────────────────────────
    let resizeTimer: ReturnType<typeof setTimeout>;
    const doFit = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(fitAndResize, 80);
    };
    window.addEventListener("resize", doFit);

    const handleClick = () => terminal.focus();
    container.addEventListener("click", handleClick);
    container.addEventListener("mousedown", handleClick);

    const ro = new ResizeObserver(doFit);
    ro.observe(containerRef.current);

    // ── Cleanup ────────────────────────────────────────────────────────────
    return () => {
      clearTimeout(fitTimer);
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", doFit);
      container.removeEventListener("keydown", handleKeyDown, true);
      container.removeEventListener("click", handleClick);
      container.removeEventListener("mousedown", handleClick);
      ro.disconnect();
      dataDisposable.dispose();
      unregisterTerminal();
      terminal.dispose();
      terminalRef.current = null;
      fitAddonRef.current = null;
      setIsReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registerTerminal, unregisterTerminal, sendResize, status, isAuthenticated, showPasswordPrompt]);

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
    const t = terminalRef.current;

    if (isAuthenticated && !isAuthenticatedLocalRef.current) {
      // Auth succeeded (either fresh login or session restore)
      isAuthenticatedLocalRef.current = true;
      if (t) {
        t.options.cursorBlink = true;
        if (prev !== "connected") {
          t.writeln("");
          t.writeln("\x1b[1;32m✓ Connected!\x1b[0m");
          t.writeln("");
        }
        t.focus();
      }
    } else if (!isAuthenticated && isAuthenticatedLocalRef.current) {
      // Lost auth — show password prompt
      isAuthenticatedLocalRef.current = false;
      if (t && isReady) showPasswordPrompt();
    } else if (status === "disconnected" && prev !== "disconnected" && !isAuthenticated) {
      // Disconnected with no session — show password prompt
      if (t && isReady) showPasswordPrompt();
    } else if (status === "reconnecting") {
      // Session restore in progress — show "Restoring..." instead of password prompt
      if (t && isReady && prev === "disconnected") {
        t.clear();
        t.writeln("\x1b[1;32mre.Terminal\x1b[0m");
        t.writeln("");
        t.writeln("\x1b[1;36mRestoring session...\x1b[0m");
      }
    }
  }, [status, isAuthenticated, showPasswordPrompt, isReady]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={`flex flex-col w-full h-full min-h-0 overflow-hidden ${className ?? ""}`}>
      <TerminalWindowChrome
        title="Terminal"
        status={status}
        viewerCount={viewerCount}
        isAdmin={isAdmin}
        isRunning={isRunning}
        onClear={sendClear}
        onReset={sendReset}
      />

      <div
        className="relative flex-1 min-h-0 w-full overflow-hidden"
        onClick={() => terminalRef.current?.focus()}
      >
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
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

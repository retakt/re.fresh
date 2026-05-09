// ─── TerminalWindowChrome ─────────────────────────────────────────────────────
// Clean, minimal terminal window header with functional design elements.
// Uses amber/teal theme matching simple-terminal.

import { Coffee, Square, Play } from "lucide-react";

// ─── Status colors ────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  connected: "#34d399",      // Emerald-400 (green)
  reconnecting: "#fbbf24",   // Amber-400 (yellow)
  disconnected: "#f87171",   // Red-400
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TerminalWindowChromeProps {
  /** Window title — defaults to "Terminal" */
  title?: string;
  /** Current WebSocket connection status */
  status: "connected" | "reconnecting" | "disconnected";
  /** Number of viewers — shown only when isAdmin === true */
  viewerCount?: number;
  /** Whether the current user has admin privileges */
  isAdmin: boolean;
  /** Whether a command is currently running */
  isRunning?: boolean;
  /** Called when the admin clicks "Clear" — admin only */
  onClear?: () => void;
  /** Called when the admin clicks "Reset" — admin only */
  onReset?: () => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Coffee mug with conditional glow based on connection status */
function CoffeeMugIndicator({
  status,
}: {
  status: TerminalWindowChromeProps["status"];
}) {
  const color = STATUS_COLORS[status];
  const isReconnecting = status === "reconnecting";

  return (
    <div className="relative flex items-center justify-center">
      {isReconnecting && (
        <span className="absolute inset-0 flex items-center justify-center animate-ping">
          <Coffee className="h-3 w-3 text-amber-400 opacity-75" />
        </span>
      )}
      <Coffee 
        className={`h-3 w-3 relative transition-all duration-300 ${
          status === "connected"
            ? "text-green-400"
            : status === "reconnecting"
              ? "text-amber-400"
              : "text-amber-400"
        }`}
        style={{
          filter: status === "connected" 
            ? "drop-shadow(0 0 8px rgba(74, 222, 128, 0.8))"
            : undefined
        }}
      />
    </div>
  );
}

/** Connection status dot + label */
function StatusIndicator({
  status,
}: {
  status: TerminalWindowChromeProps["status"];
}) {
  const color = STATUS_COLORS[status];

  const label =
    status === "connected"
      ? "connected"
      : status === "reconnecting"
        ? "reconnecting"
        : "disconnected";

  // Text color based on status
  const textColor =
    status === "connected"
      ? "text-green-400"
      : status === "reconnecting"
        ? "text-yellow-400"
        : "text-red-400";

  return (
    <div className="flex items-center gap-[5px]">
      <span
        className={status === "reconnecting" ? "animate-pulse" : undefined}
        aria-hidden="true"
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          backgroundColor: color,
          boxShadow: `0 0 8px ${color}80`,
          flexShrink: 0,
        }}
      />
      <span className={`text-[10px] tracking-wide font-medium ${textColor}`}>
        {label}
      </span>
    </div>
  );
}

/** Small admin action button — uses amber/teal theme */
function AdminButton({
  label,
  onClick,
  icon,
  iconOnly,
}: {
  label: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  iconOnly?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[11px] px-2 py-0.5 rounded border border-yellow-600/40 bg-amber-800/20 text-teal-300 hover:bg-amber-800/40 transition-colors cursor-pointer flex items-center gap-1"
      title={label}
    >
      {icon}
      {!iconOnly && label}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TerminalWindowChrome({
  title = "Terminal",
  status,
  viewerCount,
  isAdmin,
  isRunning = false,
  onClear,
  onReset,
}: TerminalWindowChromeProps) {
  return (
    <header
      className="flex items-center justify-between px-3 py-2 border-b bg-amber-900/15 backdrop-blur-sm border-yellow-600/60 shadow-[0_2px_10px_rgba(202,138,4,0.2)] shrink-0 select-none"
      aria-label="Terminal window chrome"
    >
      {/* ── Left: coffee mug + title ── */}
      <div className="flex items-center gap-1.5">
        <CoffeeMugIndicator status={status} />
        <span className="flex items-center gap-1">
          <span className="text-[11px] font-medium text-yellow-400 tracking-widest uppercase opacity-80">
            {title}
          </span>
          {status === "connected" && (
            <div className="relative">
              <div className="w-1 h-1 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]"></div>
              <div className="absolute inset-0 w-1 h-1 rounded-full bg-green-400 animate-pulse opacity-60 shadow-[0_0_12px_rgba(74,222,128,1)]"></div>
            </div>
          )}
        </span>
      </div>

      {/* ── Right: status + viewer count + controls ── */}
      <div className="flex items-center gap-2">
        <StatusIndicator status={status} />

        {/* Viewer count — admin only */}
        {isAdmin && viewerCount !== undefined && (
          <span
            className="text-[11px] text-teal-300"
            aria-label={`${viewerCount} viewer${viewerCount !== 1 ? "s" : ""} watching`}
          >
            👁 {viewerCount}
          </span>
        )}

        {/* Admin action buttons */}
        {isAdmin && (
          <>
            <AdminButton label="Clear" onClick={onClear} />
            {isRunning ? (
              <button
                type="button"
                onClick={onReset}
                className="p-1 rounded bg-transparent text-teal-300 hover:bg-amber-800/40 transition-colors cursor-pointer"
                title="Stop"
              >
                <Square className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onReset}
                className="p-1 rounded bg-transparent text-teal-300 hover:bg-amber-800/40 transition-colors cursor-pointer"
                title="Play"
              >
                <Play className="w-4 h-4" />
              </button>
            )}
          </>
        )}

        {/* Read-only badge — non-admin only */}
        {!isAdmin && (
          <span
            className="text-[10px] text-teal-300 bg-amber-800/30 px-1.5 py-0.5 rounded border border-yellow-600/40"
            aria-label="Read-only mode"
          >
            Read-only
          </span>
        )}
      </div>
    </header>
  );
}

/**
 * server/terminal-server.js
 *
 * Shared Live Terminal — backend server
 * Runs as a standalone Node.js process (ESM) on port 3003.
 *
 * Start with: node server/terminal-server.js
 * Or via npm:  npm run terminal-server
 */

import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import * as pty from "node-pty";
import { URL } from "url";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import fs from "fs";

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local.
// Prefer the repo root env file when deploying under /opt/retakt,
// but fall back to the terminal directory env for local development.
const rootEnvPath = path.join(__dirname, "..", ".env.local");
const localEnvPath = path.join(__dirname, ".env.local");
let loadedEnvPath = null;

if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath, override: true });
  loadedEnvPath = rootEnvPath;
} else if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath, override: true });
  loadedEnvPath = localEnvPath;
} else {
  console.warn("[Terminal Server] Warning: No .env.local found in root or terminal directory.");
}

if (loadedEnvPath) {
  console.log(`[Terminal Server] Loaded environment from: ${loadedEnvPath}`);
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const PORT = process.env.TERMINAL_PORT || 3003;
const CORS_ORIGIN = process.env.TERMINAL_CORS_ORIGIN || "*";
const TERMINAL_PASSWORD = process.env.TERMINAL_PASSWORD || "admin123";

const maskSecret = (value) => (typeof value === "string" ? "*".repeat(value.length) : null);

// Debug: Log environment variable loading
console.log("[Terminal Server] Environment loaded:");
console.log("  PORT:", PORT);
console.log(
  "  TERMINAL_PASSWORD:",
  TERMINAL_PASSWORD ? `✓ configured (${TERMINAL_PASSWORD.length} chars)` : "✗ missing"
);

if (!TERMINAL_PASSWORD) {
  console.error("[Terminal Server] WARNING: No TERMINAL_PASSWORD set. Using default 'admin123'");
}

/** Maximum number of PTY output chunks retained in the rolling buffer. */
const BUFFER_MAX_CHUNKS = 10_000;

// ---------------------------------------------------------------------------
// Custom Command Handling
// ---------------------------------------------------------------------------

/**
 * Command mappings: custom command → script path
 * These commands are intercepted before being sent to the PTY
 */
const CUSTOM_COMMANDS = {
  "system-status": "scripts/system/health-check.sh",
  "start-monitor": "scripts/system/start-monitor.sh",
  "stop-monitor": "scripts/system/stop-monitor.sh",
  "show-monitor": "scripts/system/monitor-status.sh",
  "ai-status": "scripts/status/ai-tools-status.sh",
  "check-ollama": "scripts/ai/check-ollama.sh",
  "check-searxng": "scripts/ai/check-searxng.sh",
  "check-all-ai": "scripts/ai/check-all-services.sh",
  "help": "builtin:help",
};

/**
 * Command aliases: alias → actual command
 */
const COMMAND_ALIASES = {
  "status": "system-status",
  "ai": "ai-status",
  "monitor": "show-monitor",
};

/**
 * Parse a command line to extract the command name and arguments
 * @param {string} line - The command line (e.g., "ai-check ollama")
 * @returns {{ command: string, args: string[] }}
 */
function parseCommand(line) {
  const trimmed = line.trim();
  const parts = trimmed.split(/\s+/);
  const command = parts[0] || "";
  const args = parts.slice(1);
  return { command, args };
}

/**
 * Check if a command is a custom command
 * @param {string} command - The command name
 * @returns {boolean}
 */
function isCustomCommand(command) {
  // Check direct command
  if (CUSTOM_COMMANDS[command]) return true;
  
  // Check aliases
  if (COMMAND_ALIASES[command]) return true;
  
  // Check if it starts with ai-check (special case with arguments)
  if (command === "ai-check") return true;
  
  return false;
}

/**
 * Execute a custom command script
 * @param {string} command - The command name
 * @param {string[]} args - Command arguments
 * @param {Function} onOutput - Callback for output chunks
 * @param {Function} onComplete - Callback when command completes
 */
function executeCustomCommand(command, args, onOutput, onComplete) {
  // Resolve aliases
  const actualCommand = COMMAND_ALIASES[command] || command;
  
  // Handle built-in commands
  if (actualCommand === "help" || CUSTOM_COMMANDS[actualCommand] === "builtin:help") {
    const helpText = `
\x1b[1;36m=== re.Terminal - Custom Commands ===\x1b[0m

\x1b[1;33mSystem Monitoring:\x1b[0m
  system-status     Comprehensive system health check
  start-monitor     Start 24/7 background monitoring
  stop-monitor      Stop background monitoring
  show-monitor      View monitor status and logs

\x1b[1;33mAI Status:\x1b[0m
  ai-status         Get AI tools status from API
  ai-check <tool>   Check specific AI tool (e.g., ai-check ollama)

\x1b[1;33mAI Service Checks:\x1b[0m
  check-ollama      Check Ollama AI service
  check-searxng     Check SearXNG web search
  check-all-ai      Check all AI services

\x1b[1;33mAliases:\x1b[0m
  status            → system-status
  ai                → ai-status
  monitor           → show-monitor

\x1b[1;33mStandard Commands:\x1b[0m
  All standard Unix commands work: cd, ls, cat, grep, etc.
  Use Ctrl+C to interrupt, Ctrl+L to clear, logout to disconnect

\x1b[1;36m==========================================\x1b[0m
`;
    onOutput(helpText);
    onComplete(0);
    return;
  }
  
  // Handle ai-check with arguments
  if (actualCommand === "ai-check") {
    if (args.length === 0) {
      onOutput("\x1b[1;31mError: ai-check requires a tool name\x1b[0m\n");
      onOutput("Usage: ai-check <tool-name>\n");
      onOutput("Example: ai-check ollama\n");
      onComplete(1);
      return;
    }
    
    const scriptPath = path.join(__dirname, "scripts/status/specific-tool-check.sh");
    executeScript(scriptPath, args, onOutput, onComplete);
    return;
  }
  
  // Get script path
  const scriptRelPath = CUSTOM_COMMANDS[actualCommand];
  if (!scriptRelPath) {
    onOutput(`\x1b[1;31mError: Unknown command: ${command}\x1b[0m\n`);
    onOutput("Type 'help' for available commands\n");
    onComplete(1);
    return;
  }
  
  const scriptPath = path.join(__dirname, scriptRelPath);
  executeScript(scriptPath, args, onOutput, onComplete);
}

/**
 * Execute a bash script and stream output
 * @param {string} scriptPath - Absolute path to the script
 * @param {string[]} args - Script arguments
 * @param {Function} onOutput - Callback for output chunks
 * @param {Function} onComplete - Callback when script completes
 */
function executeScript(scriptPath, args, onOutput, onComplete) {
  // Validate script path (security: only allow scripts in terminal/scripts/)
  const scriptsDir = path.join(__dirname, "scripts");
  const resolvedPath = path.resolve(scriptPath);
  
  if (!resolvedPath.startsWith(scriptsDir)) {
    onOutput("\x1b[1;31mError: Script path not allowed\x1b[0m\n");
    onComplete(1);
    return;
  }
  
  // Check if script exists
  if (!fs.existsSync(scriptPath)) {
    onOutput(`\x1b[1;31mError: Script not found: ${scriptPath}\x1b[0m\n`);
    onComplete(1);
    return;
  }
  
  // Spawn the script
  const shell = process.platform === "win32" ? "powershell.exe" : "bash";
  const scriptProcess = spawn(shell, [scriptPath, ...args], {
    cwd: path.join(__dirname, ".."), // Run from project root
    env: { ...process.env },
  });
  
  // Stream stdout
  scriptProcess.stdout.on("data", (data) => {
    onOutput(data.toString());
  });
  
  // Stream stderr
  scriptProcess.stderr.on("data", (data) => {
    onOutput(data.toString());
  });
  
  // Handle completion
  scriptProcess.on("close", (code) => {
    onComplete(code || 0);
  });
  
  // Handle errors
  scriptProcess.on("error", (err) => {
    onOutput(`\x1b[1;31mError executing script: ${err.message}\x1b[0m\n`);
    onComplete(1);
  });
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/** Rolling output buffer — each entry is a raw PTY output chunk (string). */
let outputBuffer = [];

/**
 * Connected WebSocket clients.
 * Key: WebSocket instance
 * Value: { role: string, userId: string }
 */
const clients = new Map();

/** Current PTY process instance. */
let ptyProcess = null;

/** Crash tracking for exponential backoff on PTY restarts. */
let crashCount = 0;
let lastCrashTime = 0;

/** Track current command line being typed (per client) */
const clientCommandLines = new Map(); // ws → string

// ---------------------------------------------------------------------------
// Buffer helpers
// ---------------------------------------------------------------------------

/**
 * Append a chunk to the rolling output buffer.
 * Drops the oldest chunk when the buffer exceeds BUFFER_MAX_CHUNKS.
 *
 * @param {string} chunk - Raw PTY output chunk.
 */
function appendToBuffer(chunk) {
  outputBuffer.push(chunk);
  if (outputBuffer.length > BUFFER_MAX_CHUNKS) {
    outputBuffer.shift();
  }
}

/**
 * Return the full buffer as a single concatenated string.
 * Used to replay history to newly connected clients.
 *
 * @returns {string}
 */
function getBufferSnapshot() {
  return outputBuffer.join("");
}

/**
 * Clear the output buffer entirely.
 */
function clearBuffer() {
  outputBuffer = [];
}

// ---------------------------------------------------------------------------
// Broadcast helpers
// ---------------------------------------------------------------------------

/**
 * Serialize `message` to JSON and send it to every open client.
 *
 * @param {object} message - The message object to broadcast.
 */
function broadcast(message) {
  const payload = JSON.stringify(message);
  for (const [ws] of clients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}

/**
 * Broadcast the current viewer count to all connected clients.
 */
function broadcastViewerCount() {
  broadcast({ type: "viewer-count", count: clients.size });
}

// ---------------------------------------------------------------------------
// Role helpers (exported for property-based tests)
// ---------------------------------------------------------------------------

/**
 * Returns true if and only if the given role is "admin".
 * Determines whether a client may write input to the PTY.
 *
 * @param {string} role
 * @returns {boolean}
 */
function canSendInput(role) {
  return role === "admin";
}

/**
 * Returns true if the role is "admin" AND the message type is one of the
 * admin-only command types: "input", "clear", "reset".
 *
 * @param {string} role
 * @param {string} messageType
 * @returns {boolean}
 */
function shouldHandleAdminMessage(role, messageType) {
  return role === "admin" && ["input", "clear", "reset"].includes(messageType);
}

// ---------------------------------------------------------------------------
// PTY management
// ---------------------------------------------------------------------------

/**
 * Spawn a new PTY process and wire up its event handlers.
 * Stores the instance in the module-level `ptyProcess` variable.
 * Uses the appropriate shell for the platform (bash on Unix, powershell on Windows).
 */
function spawnPty() {
  const isWindows = process.platform === "win32";
  const shell = isWindows ? "powershell.exe" : "bash";

  // On Windows: -NoLogo suppresses the banner, -NoProfile skips user customizations.
  // On Unix: --rcfile loads our custom .bashrc with color configurations
  const bashrcPath = path.join(__dirname, ".bashrc");
  const shellArgs = isWindows ? ["-NoLogo", "-NoProfile"] : ["--rcfile", bashrcPath];

  ptyProcess = pty.spawn(shell, shellArgs, {
    name: "xterm-256color",
    cols: 80,
    rows: 24,
    env: { 
      ...process.env, 
      TERM: "xterm-256color",
      COLORTERM: "truecolor",
      FORCE_COLOR: "1",
      CLICOLOR: "1",
      CLICOLOR_FORCE: "1",
    },
  });

  // On Windows, override the prompt to be plain left-aligned (no cursor positioning)
  if (isWindows) {
    setTimeout(() => {
      try {
        ptyProcess.write("function prompt { \"> \" }\r");
      } catch (_) {}
    }, 500);
  }

  // Stream PTY output → buffer + broadcast to all clients
  ptyProcess.onData((data) => {
    appendToBuffer(data);
    broadcast({ type: "output", data });
  });

  // Handle PTY exit — auto-restart with backoff
  ptyProcess.onExit((_exitInfo) => {
    const exitNotice =
      "\r\n\x1b[33m⚠ Session ended. Restarting...\x1b[0m\r\n";
    appendToBuffer(exitNotice);
    broadcast({ type: "output", data: exitNotice });

    // Crash-loop detection: reset counter if last crash was > 60s ago
    const now = Date.now();
    if (now - lastCrashTime > 60_000) {
      crashCount = 1;
    } else {
      crashCount += 1;
    }
    lastCrashTime = now;

    const isCrashLoop = crashCount > 5;
    const delay = isCrashLoop ? 30_000 : 1_000;

    if (isCrashLoop) {
      console.error(
        `PTY crash loop detected (${crashCount} crashes in <60s). ` +
          `Backing off ${delay / 1000}s before restart.`
      );
    }

    setTimeout(() => {
      spawnPty();

      const startNotice = "\r\n\x1b[32m✓ New session started.\x1b[0m\r\n";
      appendToBuffer(startNotice);
      broadcast({ type: "output", data: startNotice });
    }, delay);
  });
}

// ---------------------------------------------------------------------------
// Express + HTTP server
// ---------------------------------------------------------------------------

const app = express();

// CORS — allow the configured origin (default: all origins)
app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", CORS_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (_req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

// Health-check endpoint
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    clients: clients.size,
    bufferChunks: outputBuffer.length,
  });
});

const httpServer = createServer(app);

// ---------------------------------------------------------------------------
// WebSocket server
// ---------------------------------------------------------------------------

const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", async (ws, req) => {
  // -------------------------------------------------------------------------
  // Password authentication
  // -------------------------------------------------------------------------
  let role = "member";
  let userId = "user";

  try {
    // Extract password from query string: ws://host:3003?password=xxx
    const reqUrl = new URL(req.url, `http://${req.headers.host}`);
    const password = reqUrl.searchParams.get("password");

    console.log("[Terminal Server] Auth attempt:", {
      providedLength: password?.length ?? 0,
      expectedLength: TERMINAL_PASSWORD.length,
    });

    if (!password) {
      throw new Error("No password provided");
    }

    if (password !== TERMINAL_PASSWORD) {
      throw new Error("Invalid password");
    }

    // Password is correct - grant admin access
    role = "admin";
    userId = "admin-user";
  } catch (err) {
    // Auth failure — inform client and close
    console.error("[Terminal Server] Auth failed:", err.message);
    try {
      ws.send(
        JSON.stringify({
          type: "status",
          state: "disconnected",
          reason: "auth_failed",
        })
      );
    } catch (_sendErr) {
      // Ignore send errors during close
    }
    ws.close(4001, "Authentication failed");
    return;
  }

  // -------------------------------------------------------------------------
  // Auth success — register client
  // -------------------------------------------------------------------------
  console.log(`[Terminal Server] Client connected: userId=${userId}, role=${role}`);
  clients.set(ws, { role, userId });

  // Replay buffer history to the newly connected client.
  // Use setImmediate so any resize message sent by the client on open
  // is processed first, ensuring the PTY has correct dimensions.
  setImmediate(() => {
    try {
      ws.send(JSON.stringify({ type: "history", data: getBufferSnapshot() }));
    } catch (err) {
      console.error("Failed to send history to new client:", err.message);
    }
  });

  // Notify everyone (including the new client) of the updated viewer count
  broadcastViewerCount();

  // -------------------------------------------------------------------------
  // 2.3 — Message routing
  // -------------------------------------------------------------------------
  ws.on("message", (raw) => {
    let message;
    try {
      message = JSON.parse(raw.toString());
    } catch (err) {
      console.error("Malformed WebSocket message (not valid JSON):", raw.toString());
      return;
    }

    const clientInfo = clients.get(ws);
    if (!clientInfo) return;

    const { role: clientRole } = clientInfo;
    const { type, data } = message;

    switch (type) {
      case "input":
        // Only admins may write to the PTY
        if (canSendInput(clientRole) && ptyProcess) {
          try {
            // Track command line for custom command detection
            let currentLine = clientCommandLines.get(ws) || "";
            
            // Handle different input types
            if (data === "\r" || data === "\n") {
              // Enter key - check if it's a custom command
              const { command, args } = parseCommand(currentLine);
              
              if (isCustomCommand(command)) {
                // Execute custom command
                const commandLine = currentLine.trim();
                
                // Echo the command (PTY won't do it for custom commands)
                const echo = `\r\n`;
                appendToBuffer(echo);
                broadcast({ type: "output", data: echo });
                
                const notice = `\x1b[1;36m[Executing: ${commandLine}]\x1b[0m\r\n`;
                appendToBuffer(notice);
                broadcast({ type: "output", data: notice });
                
                executeCustomCommand(
                  command,
                  args,
                  (output) => {
                    // Stream output to all clients
                    appendToBuffer(output);
                    broadcast({ type: "output", data: output });
                  },
                  (exitCode) => {
                    // Command completed
                    const completeNotice = exitCode === 0
                      ? `\x1b[1;32m[Command completed]\x1b[0m\r\n`
                      : `\x1b[1;31m[Command failed with exit code ${exitCode}]\x1b[0m\r\n`;
                    appendToBuffer(completeNotice);
                    broadcast({ type: "output", data: completeNotice });
                    
                    // Clear command line
                    clientCommandLines.set(ws, "");
                  }
                );
              } else {
                // Regular command - send to PTY
                ptyProcess.write(data);
                clientCommandLines.set(ws, "");
              }
            } else if (data === "\x7f" || data === "\x08") {
              // Backspace - remove last character
              currentLine = currentLine.slice(0, -1);
              clientCommandLines.set(ws, currentLine);
              ptyProcess.write(data);
            } else if (data === "\x03") {
              // Ctrl+C - clear command line
              clientCommandLines.set(ws, "");
              ptyProcess.write(data);
            } else if (data.length === 1 && data >= " " && data <= "~") {
              // Printable character - add to command line
              currentLine += data;
              clientCommandLines.set(ws, currentLine);
              ptyProcess.write(data);
            } else {
              // Other control characters - just send to PTY
              ptyProcess.write(data);
            }
          } catch (err) {
            console.error("Failed to write input to PTY:", err.message);
          }
        }
        // Non-admin input is silently dropped
        break;

      case "resize":
        // Client reports its terminal dimensions — resize the PTY to match
        if (clientRole === "admin" && ptyProcess) {
          const cols = Math.max(10, Math.min(500, parseInt(data?.cols) || 80));
          const rows = Math.max(5, Math.min(200, parseInt(data?.rows) || 24));
          try {
            ptyProcess.resize(cols, rows);
          } catch (err) {
            console.error("Failed to resize PTY:", err.message);
          }
        }
        break;

      case "clear":
        if (shouldHandleAdminMessage(clientRole, "clear")) {
          clearBuffer();
          broadcast({ type: "clear" });
        }
        break;

      case "reset":
        if (shouldHandleAdminMessage(clientRole, "reset")) {
          // Kill the current PTY — the onExit handler will auto-restart it
          if (ptyProcess) {
            try {
              ptyProcess.kill();
            } catch (err) {
              console.error("Failed to kill PTY for reset:", err.message);
            }
          }
          // Broadcast the reset notice immediately (before the new PTY starts)
          const resetNotice =
            "\r\n\x1b[33m⚠ Session reset by admin.\x1b[0m\r\n";
          appendToBuffer(resetNotice);
          broadcast({ type: "output", data: resetNotice });
        }
        break;

      default:
        // Unknown message type — ignore silently
        break;
    }
  });

  // -------------------------------------------------------------------------
  // Client disconnect / error
  // -------------------------------------------------------------------------
  ws.on("close", () => {
    clients.delete(ws);
    clientCommandLines.delete(ws);
    broadcastViewerCount();
  });

  ws.on("error", (err) => {
    console.error("WebSocket client error:", err.message);
    clients.delete(ws);
    clientCommandLines.delete(ws);
    broadcastViewerCount();
  });
});

// ---------------------------------------------------------------------------
// Startup
// ---------------------------------------------------------------------------

// Spawn the initial PTY process
spawnPty();

// Start listening
httpServer.listen(PORT, () => {
  console.log(`Terminal server running on port ${PORT}`);
});

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------

function shutdown(signal) {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  if (ptyProcess) {
    try {
      ptyProcess.kill();
    } catch (_err) {
      // Already dead
    }
  }
  httpServer.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });
  // Force exit after 5s if server hasn't closed
  setTimeout(() => process.exit(1), 5_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// ---------------------------------------------------------------------------
// Exports — pure functions for property-based testing
// ---------------------------------------------------------------------------

/**
 * Reset the output buffer to an empty array.
 * Used exclusively in tests to isolate state between test runs.
 */
function resetBufferForTesting() {
  outputBuffer = [];
}

export {
  canSendInput,
  shouldHandleAdminMessage,
  appendToBuffer,
  getBufferSnapshot,
  clearBuffer,
  resetBufferForTesting,
};

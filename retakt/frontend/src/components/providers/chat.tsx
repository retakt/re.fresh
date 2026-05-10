import { createContext, useContext, useMemo, useRef, useState } from "react";
import { AssistantRuntimeProvider, useLocalRuntime } from "@assistant-ui/react";
import type { ChatModelAdapter, ChatModelRunOptions } from "@assistant-ui/react";
import { PauseDictationAdapter } from "@/lib/pause-dictation-adapter";
import { ImageAttachmentAdapter } from "@/lib/image-attachment-adapter";
import type { AttachedFile } from "@/pages/chat/page";
import { TOOLS } from "@/lib/ai-tools";
import { executeTool } from "@/lib/ai-executors";
import { SYSTEM_PROMPT } from "@/lib/ai-prompt";

// ── Ollama config ─────────────────────────────────────────────────────────────
const OLLAMA_URL = import.meta.env.VITE_OLLAMA_URL ?? "http://localhost:11434";
const MODEL_ID = "joe-speedboat/Gemma-4-Uncensored-HauhauCS-Aggressive:e4b";

// ── Malaysia time helper ──────────────────────────────────────────────────────
function getMalaysiaTime(): string {
  const now = new Date();
  const myt = new Intl.DateTimeFormat("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(now);
  return `${myt} (MYT, UTC+8)`;
}
// ─────────────────────────────────────────────────────────────────────────────

// ── Inference presets ─────────────────────────────────────────────────────────
// NO THINK (new default) — fastest, zero reasoning
const NO_THINK_OPTIONS: SessionOptions = {
  think: false,
  temperature: 0.3,
  top_k: 15,
  top_p: 1.0,
};
// BALANCED — light thinking for tool usage
const BALANCED_OPTIONS: SessionOptions = {
  think: false,
  temperature: 0.4,
  top_k: 20,
  top_p: 1.0,
};

// FULL THINK — model's original params, full reasoning power
const FULL_THINK_OPTIONS: SessionOptions = {
  think: true,
  temperature: 1,
  top_k: 64,
  top_p: 0.95,
};

const DEFAULT_OPTIONS = NO_THINK_OPTIONS; // Start with fastest mode

// ── Intelligent Mode Detection ────────────────────────────────────────────────
// Analyzes query complexity and determines optimal mode + context size

interface ModeDecision {
  mode: 'nothink' | 'balanced' | 'fullthink';
  options: SessionOptions;
  contextSize: number;
  reason: string;
}

function analyzeQueryComplexity(text: string, hasTools: boolean, turnCount: number): ModeDecision {
  const lower = text.toLowerCase().trim();
  const length = text.length;
  const sentences = (text.match(/[.!?]+/g) || []).length;
  const words = text.split(/\s+/).length;
  
  // Complexity scoring
  let complexityScore = 0;
  
  // Length factors
  if (length > 150) complexityScore += 2;
  if (length > 300) complexityScore += 3;
  if (sentences >= 2) complexityScore += 2;
  if (words > 30) complexityScore += 2;
  
  // High-priority patterns (immediate full-think)
  const highComplexityPatterns = [
    // Code-related
    /function|algorithm|implement|debug|code.*review|optimize.*code/,
    /javascript|python|react|component|programming/,
    /\.js|\.py|\.tsx?|\.jsx?|const |let |var |function\s*\(/,
    
    // Deep reasoning
    /explain.*why.*and.*how|compare.*pros.*cons|analyze.*and.*explain/,
    /step.*by.*step.*detailed|comprehensive.*analysis/,
    /design.*and.*implement|create.*algorithm/,
    
    // Multi-part queries
    /and.*also.*and|multiple.*different|several.*various/,
    /check.*and.*tell|status.*and.*weather.*and/,
  ];
  
  // Check for high complexity patterns first
  const hasHighComplexity = highComplexityPatterns.some(pattern => pattern.test(lower));
  if (hasHighComplexity) {
    complexityScore += 5; // Boost score significantly
  }
  
  // Medium complexity patterns
  const mediumComplexityPatterns = [
    /explain.*why|how.*work|what.*difference|compare|analyze|evaluate/,
    /detailed|comprehensive|thorough/,
    /pros.*cons|advantages.*disadvantages|benefits.*drawbacks/,
    /reasoning|logic|proof|derive|conclude/,
    /brainstorm|creative|innovative|design/,
    /help.*me.*understand|can.*you.*explain/,
    // News and current information queries
    /latest|recent|current|today|news|update|what.*happening|what's.*new/,
    /this.*year|this.*month|right.*now|just.*released/,
  ];
  
  mediumComplexityPatterns.forEach(pattern => {
    if (pattern.test(lower)) complexityScore += 2;
  });
  
  // Tool usage patterns
  const multiToolPatterns = [
    /search.*and.*tell|find.*and.*explain/,
    /check.*and.*also|status.*and.*weather/,
    /multiple.*tools|several.*things/,
    /and.*tell.*me|and.*also.*check/,
    /and.*explain.*why|tell.*me.*and.*explain/,
    /status.*and.*weather.*and|check.*tell.*explain/,
  ];
  
  multiToolPatterns.forEach(pattern => {
    if (pattern.test(lower)) complexityScore += 3;
  });
  
  // Count "and" connectors for multi-part queries
  const andCount = (lower.match(/\band\b/g) || []).length;
  if (andCount >= 2) complexityScore += 3;
  
  // Retry/frustration signals (escalate immediately)
  const retrySignals = [
    "wrong", "incorrect", "not right", "try again", "still not",
    "doesn't work", "not working", "failed", "error"
  ];
  
  const isRetry = retrySignals.some(signal => lower.includes(signal));
  if (isRetry && turnCount >= 2) {
    return {
      mode: 'fullthink',
      options: { ...FULL_THINK_OPTIONS },
      contextSize: 8192,
      reason: 'User retry/frustration detected - escalating to full reasoning'
    };
  }
  
  // Decision logic (use larger context sizes for 156K model)
  
  // Simple queries - stay fast
  if (complexityScore <= 1 && !hasTools && length < 80) {
    return {
      mode: 'nothink',
      options: { ...NO_THINK_OPTIONS },
      contextSize: 4096, // Increased from 2048
      reason: 'Simple query - using fastest mode'
    };
  }
  
  // Complex queries - full thinking (use more context)
  if (complexityScore >= 4 || hasHighComplexity || (hasTools && complexityScore >= 3)) {
    return {
      mode: 'fullthink',
      options: { ...FULL_THINK_OPTIONS },
      contextSize: 32768, // Increased from 8192 (32K for complex tasks)
      reason: 'Complex query detected - using full reasoning'
    };
  }
  
  // Tool usage or medium complexity - balanced mode
  if (hasTools || complexityScore >= 2) {
    return {
      mode: 'balanced',
      options: { ...BALANCED_OPTIONS },
      contextSize: 16384, // Increased from 4096 (16K for tools)
      reason: hasTools ? 'Tool usage detected - using balanced mode' : 'Medium complexity - using balanced mode'
    };
  }
  
  // Default to balanced for safety
  return {
    mode: 'balanced',
    options: { ...BALANCED_OPTIONS },
    contextSize: 16384,
    reason: 'Default balanced mode'
  };
}

// Legacy function for backward compatibility
function shouldAutoThink(text: string): boolean {
  const decision = analyzeQueryComplexity(text, false, 0);
  return decision.mode === 'fullthink';
}
// ─────────────────────────────────────────────────────────────────────────────

// ── Client-side tool pre-detection ───────────────────────────────────────────
// For obvious tool calls, skip the model tool-check pass entirely and call
// the tool directly. This saves a full Ollama inference round-trip.

interface PreDetectedTool {
  name: string;
  args: Record<string, string>;
}

function preDetectTool(text: string): PreDetectedTool | null {
  const lower = text.toLowerCase().trim();

  // Status/health checks - prioritize AI tools status (faster API)
  const statusMatch = lower.match(/(?:status|health|working|available|running|operational|check.*(?:tools?|services?|system))/);
  if (statusMatch && (lower.includes('tool') || lower.includes('service') || lower.includes('ai') || lower.includes('system'))) {
    return { name: "get_ai_tools_status", args: {} };
  }

  // Sandbox — "run X in the sandbox", "execute X", "run this command: X"
  const sandboxMatch = lower.match(/(?:run|execute|sandbox)[:\s]+(.+)/);
  if (sandboxMatch) {
    const cmd = sandboxMatch[1].trim();
    if (cmd.length > 0 && cmd.length < 500) {
      return { name: "execute_command", args: { command: cmd } };
    }
  }

  // Script — "run the X script", "run script X"
  const scriptNames = ["health-check", "check-ollama", "check-searxng", "check-all-ai", "ai-tools-status", "monitor-status"];
  for (const script of scriptNames) {
    if (lower.includes(script)) {
      return { name: "run_script", args: { script } };
    }
  }
  // Also match "check ollama" → "check-ollama" etc.
  if (lower.match(/check.?ollama/)) return { name: "run_script", args: { script: "check-ollama" } };
  if (lower.match(/check.?searxng/)) return { name: "run_script", args: { script: "check-searxng" } };
  if (lower.match(/check.?all.?ai/)) return { name: "run_script", args: { script: "check-all-ai" } };
  if (lower.match(/health.?check|server.?health/)) return { name: "run_script", args: { script: "health-check" } };

  // Repo analysis — "analyze repo X", "analyze https://github.com/..."
  const repoMatch = lower.match(/analyze\s+(?:repo\s+|repository\s+)?(https?:\/\/[^\s]+)/);
  if (repoMatch) {
    return { name: "analyze_repo", args: { repo_url: repoMatch[1] } };
  }

  // Weather — "weather in X", "what's the weather in X", "temperature in X"
  const weatherMatch = lower.match(/(?:weather|temperature|forecast|rain|humid|hot|cold)\s+(?:in|at|for)\s+([a-z\s]+?)(?:\?|$|,|\.|today|now|right)/);
  if (weatherMatch) {
    const city = weatherMatch[1].trim();
    if (city.length > 1 && city.length < 40) return { name: "get_weather", args: { city } };
  }

  // Time — "what time is it in X", "time in X"
  const timeMatch = lower.match(/(?:what(?:'s| is) the )?time\s+(?:in|at)\s+([a-z\s/]+?)(?:\?|$|,|\.)/);
  if (timeMatch) {
    const place = timeMatch[1].trim();
    // Map common city names to IANA timezones
    const tzMap: Record<string, string> = {
      "tokyo": "Asia/Tokyo", "japan": "Asia/Tokyo",
      "london": "Europe/London", "uk": "Europe/London",
      "new york": "America/New_York", "nyc": "America/New_York",
      "los angeles": "America/Los_Angeles", "la": "America/Los_Angeles",
      "paris": "Europe/Paris", "france": "Europe/Paris",
      "sydney": "Australia/Sydney", "australia": "Australia/Sydney",
      "dubai": "Asia/Dubai", "uae": "Asia/Dubai",
      "singapore": "Asia/Singapore",
      "kuala lumpur": "Asia/Kuala_Lumpur", "kl": "Asia/Kuala_Lumpur", "malaysia": "Asia/Kuala_Lumpur",
      "jakarta": "Asia/Jakarta", "indonesia": "Asia/Jakarta",
      "beijing": "Asia/Shanghai", "shanghai": "Asia/Shanghai", "china": "Asia/Shanghai",
      "seoul": "Asia/Seoul", "korea": "Asia/Seoul",
      "mumbai": "Asia/Kolkata", "india": "Asia/Kolkata",
      "moscow": "Europe/Moscow", "russia": "Europe/Moscow",
      "berlin": "Europe/Berlin", "germany": "Europe/Berlin",
    };
    const tz = tzMap[place] ?? `Asia/Kuala_Lumpur`;
    return { name: "get_time", args: { timezone: tz } };
  }

  // Exchange rate — "X to Y", "convert X to Y", "how much is X in Y"
  const fxMatch = lower.match(/(?:convert\s+)?(\d+\s+)?([a-z]{3})\s+(?:to|in)\s+([a-z]{3})(?:\?|$|\s)/);
  if (fxMatch) {
    const from = fxMatch[2].toUpperCase();
    const to = fxMatch[3].toUpperCase();
    const currencies = ["USD","EUR","GBP","JPY","MYR","SGD","AUD","CNY","KRW","THB","IDR","INR","CAD","CHF","HKD","TWD","BTC","ETH"];
    if (currencies.includes(from) && currencies.includes(to)) {
      return { name: "get_exchange_rate", args: { from, to } };
    }
  }

  return null;
}
// ─────────────────────────────────────────────────────────────────────────────
// When these appear in the user's message, we hint the model to use factcheck
// by injecting a note into the last user message before the tool-check pass.
// This supplements the model's own judgment for cases where it might be overconfident.
const FACTCHECK_TRIGGERS = [
  // Time-sensitive / current events
  "latest", "current", "today", "right now", "recent", "just released",
  "new version", "update", "this year", "2025", "2026",
  // Prices / rates / stats
  "price", "cost", "how much", "rate", "stock", "crypto", "bitcoin",
  "exchange rate", "currency",
  // Sports / scores
  "score", "result", "winner", "who won", "standings", "match", "game",
  "tournament", "league",
  // Verification signals
  "is it true", "did they", "have they", "has it", "what happened",
  "is he still", "is she still", "does it still", "is it still",
  // News
  "news", "announced", "released", "launched",
];

function shouldTriggerFactcheck(text: string): boolean {
  const lower = text.toLowerCase();
  return FACTCHECK_TRIGGERS.some((kw) => lower.includes(kw));
}
// ─────────────────────────────────────────────────────────────────────────────
// If the user is clearly retrying or expressing the answer was wrong,
// escalate to full think regardless of auto-think result.
const RETRY_SIGNALS = [
  "again", "still", "wrong", "incorrect", "not right", "that's not",
  "thats not", "no that", "not what", "doesn't work", "doesnt work",
  "same issue", "same problem", "same error", "try again", "not correct",
  "you said", "you told", "you were", "you got", "that was wrong",
  "still not", "still wrong", "still broken", "still failing",
  "not working", "didn't work", "didnt work", "failed again",
  // additional
  "nope", "nah", "no it", "not it", "nothing changed", "nothing works",
  "its same", "it's same", "same thing", "same result", "still same",
  "didn't fix", "didnt fix", "not fixed", "still broken", "still there",
  "still happening", "still occurs", "still getting", "still seeing",
  "doesn't help", "doesnt help", "didn't help", "didnt help",
  "no change", "no difference", "no effect", "no luck",
  "not working still", "still not working", "still not fixed",
];

function shouldEscalateToFullThink(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return RETRY_SIGNALS.some((s) => lower.includes(s));
}
// ─────────────────────────────────────────────────────────────────────────────
// Fall back to a manual UUID v4 when running on a local IP over HTTP.
function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // RFC 4122 v4 fallback using Math.random
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const SESSION_ID = generateUUID();

// ── Slash command parser ──────────────────────────────────────────────────────
// Supported commands that get passed directly to Ollama API options:
//   /think          → enable thinking
//   /nothink        → disable thinking
//   /temp <0-2>     → set temperature
//   /topk <int>     → set top_k
//   /clear          → signals context clear (handled by runtime)
//
// Returns null if the message is not a slash command.
interface SessionOptions {
  think: boolean;
  temperature: number;
  top_k: number;
  top_p: number;
}

interface SlashResult {
  isCommand: true;
  response: string;
  optionOverrides?: Partial<SessionOptions>;
  webSearchOverride?: boolean; // true = enable, false = disable
}

function parseSlashCommand(text: string): SlashResult | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith("/")) return null;

  const [cmd, ...args] = trimmed.slice(1).split(/\s+/);

  switch (cmd.toLowerCase()) {
    case "think":
      return {
        isCommand: true,
        response: "✓ Full thinking mode **enabled**. Re will reason deeply. Use `/nothink` or `/auto` to go back.",
        optionOverrides: { ...FULL_THINK_OPTIONS },
      };
    case "nothink":
      return {
        isCommand: true,
        response: "✓ Thinking **disabled**. Re will respond instantly. Use `/think` or `/auto` to change.",
        optionOverrides: { ...NO_THINK_OPTIONS },
      };
    case "auto":
      return {
        isCommand: true,
        response: "Intelligent auto mode enabled. Re will automatically optimize performance based on query complexity (no-think → balanced → full-think).",
        optionOverrides: { ...NO_THINK_OPTIONS }, // Start with fastest, auto-escalate
      };    case "temp": {
      const val = parseFloat(args[0] ?? "");
      if (isNaN(val) || val < 0 || val > 2)
        return { isCommand: true, response: "Usage: `/temp <0.0–2.0>`" };
      return {
        isCommand: true,
        response: `✓ Temperature set to **${val}**.`,
        optionOverrides: { temperature: val },
      };
    }
    case "topk": {
      const val = parseInt(args[0] ?? "", 10);
      if (isNaN(val) || val < 1)
        return { isCommand: true, response: "Usage: `/topk <integer>`" };
      return {
        isCommand: true,
        response: `✓ top_k set to **${val}**.`,
        optionOverrides: { top_k: val },
      };
    }
    case "dweb":
      return {
        isCommand: true,
        response: "✓ Web search **disabled**. Re will answer from training data only. Use `/eweb` to re-enable.",
        webSearchOverride: false,
      };
    case "eweb":
      return {
        isCommand: true,
        response: "✓ Web search **enabled**. Re will search the web when needed.",
        webSearchOverride: true,
      };
    case "help":
    case "?":
      return {
        isCommand: true,
        response: [
          "**commands:**",
          "- `/think` — force full reasoning mode",
          "- `/nothink` — force fastest mode, no reasoning",
          "- `/auto` — intelligent auto mode (analyzes complexity) ← default",
          "- `/temp <0–2>` — set temperature",
          "- `/topk <int>` — set top_k sampling",
          "- `/dweb` — web search disabled (training data)",
          "- `/eweb` — web search enabled",
          "- `/help` — show this list",
          "",
          "**intelligent auto mode:**",
          "- Simple queries → no-think mode (fastest)",
          "- Tool usage → balanced mode (optimized)",
          "- Complex queries → full-think mode (reasoning)",
          "- Auto context sizing (2K-8K tokens)",
          "- Retry detection → auto-escalate",
          "",
          "**built-in tools (Re uses these automatically):**",
          "- Weather — ask about weather in any city",
          "- Exchange rate — ask to convert currencies",
          "- Time — ask what time it is anywhere",
          "- Web search — modes: general, factcheck, news, reddit, wiki, code",
          "- AI Tools Status — ask about system health",
        ].join("\n"),
      };    default:
      return {
        isCommand: true,
        response: `Unknown command \`/${cmd}\`. Type \`/help\` for available commands.`,
      };
  }
}
// ─────────────────────────────────────────────────────────────────────────────

interface ChatContextValue {
  sessionId: string;
  attachedFile: AttachedFile | null;
  setAttachedFile: (f: AttachedFile | null) => void;
  lastSentImage: { dataUrl: string; timestamp: number } | null;
  setLastSentImage: (img: { dataUrl: string; timestamp: number } | null) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatContext must be used within ChatProvider");
  return ctx;
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const sessionId = SESSION_ID;
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [lastSentImage, setLastSentImage] = useState<{ dataUrl: string; timestamp: number } | null>(null);

  const attachedFileRef = useRef<AttachedFile | null>(null);
  attachedFileRef.current = attachedFile;

  // Mutable session options — slash commands update these in place
  // null = auto mode (default), non-null = manually overridden by user
  const sessionOptionsRef = useRef<SessionOptions>({ ...DEFAULT_OPTIONS });
  const thinkOverrideRef = useRef<boolean | null>(null); // null = auto
  // Track assistant turn count for hint injection and escalation
  const assistantTurnCountRef = useRef(0);
  // Web search toggle — enabled by default, reset on every page refresh
  const webSearchEnabledRef = useRef<boolean>(true);

  const adapter = useMemo((): ChatModelAdapter => ({
    async *run({ messages, abortSignal }: ChatModelRunOptions) {
      const file = attachedFileRef.current;

      // Get the last user message text
      const lastMsg = messages[messages.length - 1];
      const lastText = lastMsg?.content
        .filter((c) => c.type === "text")
        .map((c) => (c.type === "text" ? c.text : ""))
        .join("") ?? "";

      // ── Slash command handling ──────────────────────────────────────────────
      const slash = parseSlashCommand(lastText);
      if (slash) {
        if (slash.optionOverrides) {
          Object.assign(sessionOptionsRef.current, slash.optionOverrides);
          if ("think" in slash.optionOverrides) {
            const cmd = lastText.trim().slice(1).split(/\s+/)[0].toLowerCase();
            thinkOverrideRef.current = cmd === "auto" ? null : (slash.optionOverrides.think ?? null);
          }
        }
        if (slash.webSearchOverride !== undefined) {
          webSearchEnabledRef.current = slash.webSearchOverride;
        }
        yield { content: [{ type: "text" as const, text: slash.response }] };
        return;
      }
      // ───────────────────────────────────────────────────────────────────────

      // Build Ollama-format messages
      const apiMessages = messages.map((m, i) => {
        const isLast = i === messages.length - 1;
        const textContent = m.content
          .filter((c) => c.type === "text")
          .map((c) => (c.type === "text" ? c.text : ""))
          .join("");

        // Check for image attachments in message content (from assistant-ui attachment system OR custom system)
        const imageAttachments = m.content.filter((c: any) => c.type === "image");
        
        // For the last message, inject file attachment (legacy system)
        if (isLast && file) {
          if (file.type === "text") {
            return {
              role: m.role,
              content: `[Attached file: ${file.name}]\n\`\`\`\n${file.content}\n\`\`\`\n\n${textContent}`,
            };
          } else if (file.type === "image") {
            // Image will be in message content already (added by send interceptor)
            // Just extract base64 for Ollama
            const base64 = file.base64;
            return {
              role: m.role,
              content: textContent || "What is in this image?",
              images: [base64],
            };
          } else if (file.type === "audio") {
            // Gemma 4 audio input — pass as audio field
            return {
              role: m.role,
              content: textContent || "Please analyze this audio.",
              audio: file.base64,
            };
          }
        }

        // Handle image attachments from assistant-ui attachment system
        if (imageAttachments.length > 0) {
          const images = imageAttachments.map((img: any) => {
            // Extract base64 from data URL if needed
            const imageData = img.image;
            if (imageData.startsWith("data:")) {
              // Extract just the base64 part
              const base64Match = imageData.match(/^data:image\/[^;]+;base64,(.+)$/);
              return base64Match ? base64Match[1] : imageData;
            }
            return imageData;
          });

          return {
            role: m.role,
            content: textContent || "What is in this image?",
            images,
          };
        }

        return { role: m.role, content: textContent };
      });

      // Clear attachment immediately after reading — don't wait for stream to finish
      setAttachedFile(null);

      const webSearchEnabled = webSearchEnabledRef.current;

      // Build system prompt — inject web search status
      const systemPromptContent = SYSTEM_PROMPT.replace("{MALAYSIA_TIME}", getMalaysiaTime())
        + (webSearchEnabled ? "" : "\n\nWeb search is currently DISABLED by the user. Do NOT attempt to use search_web or any search tool. Answer only from your training data. If the query requires current information you don't have, say so clearly and suggest the user type `/eweb` to enable web search.");

      const systemMessage: Record<string, unknown> = { role: "system", content: systemPromptContent };

      // Filter tools — remove search_web when disabled
      const activeTools = webSearchEnabled
        ? TOOLS
        : TOOLS.filter((t) => t.function.name !== "search_web");

      // If client-side factcheck trigger detected, nudge the model to verify
      // by appending a subtle hint to the last user message in the tool-check pass only
      const factcheckHint = webSearchEnabled && shouldTriggerFactcheck(lastText)
        ? " [Note: this query may involve current or time-sensitive information — consider using search_web to verify]"
        : "";

      const baseMessages: Array<Record<string, unknown>> = [systemMessage, ...apiMessages];

      // ── Tool call pass ────────────────────────────────────────────────────
      // 1. Try client-side pre-detection first (no model inference needed)
      // 2. Fall back to model tool-check pass for ambiguous queries
      // 3. Execute tools in parallel, inject results into final messages

      const preDetected = preDetectTool(lastText);
      // Skip search_web pre-detection if web search is disabled
      const preDetectedFiltered = preDetected?.name === "search_web" && !webSearchEnabled
        ? null
        : preDetected;

      // ── Intelligent Mode Selection ────────────────────────────────────────────
      // Analyze query complexity and determine optimal mode + context size
      let modeDecision: ModeDecision;
      let think: boolean;
      let contextSize: number;
      
      if (thinkOverrideRef.current !== null) {
        // User manually set think mode via slash command — respect it
        think = thinkOverrideRef.current;
        contextSize = think ? 8192 : 4096;
        modeDecision = {
          mode: think ? 'fullthink' : 'nothink',
          options: think ? FULL_THINK_OPTIONS : NO_THINK_OPTIONS,
          contextSize,
          reason: 'Manual override by user'
        };
      } else {
        // Intelligent auto-selection
        const hasToolsDetected = !!preDetectedFiltered;
        modeDecision = analyzeQueryComplexity(lastText, hasToolsDetected, assistantTurnCountRef.current);
        think = modeDecision.options.think;
        contextSize = modeDecision.contextSize;
        
        // Log the decision for debugging
        console.log(`[Smart Mode] ${modeDecision.mode.toUpperCase()}: ${modeDecision.reason}`);
      }
      
      const { think: _think, ...inferenceOptions } = modeDecision.options;

      // Hint injection: every 4th assistant turn in auto mode (not manually overridden),
      // append a subtle hint to the response client-side so the model never sees it
      const shouldInjectHint =
        thinkOverrideRef.current === null &&
        assistantTurnCountRef.current > 0 &&
        assistantTurnCountRef.current % 4 === 0;

      let toolCalls: Array<{ function: { name: string; arguments: Record<string, string> } }> | undefined;

      if (preDetectedFiltered) {
        // Skip model tool-check entirely — we know what tool to call
        toolCalls = [{ function: { name: preDetectedFiltered.name, arguments: preDetectedFiltered.args } }];
      } else {
        // Truncate history for tool check — only last 3 messages needed to decide
        const recentMessages = apiMessages.slice(-3);
        const toolCheckMessages: Array<Record<string, unknown>> = [
          systemMessage,
          ...recentMessages.slice(0, -1),
          {
            ...recentMessages[recentMessages.length - 1],
            content: (recentMessages[recentMessages.length - 1]?.content ?? "") + factcheckHint,
          },
        ];

        const toolCheckRes = await fetch(`${OLLAMA_URL}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: MODEL_ID,
            messages: toolCheckMessages,
            stream: false,
            think: false,
            tools: activeTools,
            keep_alive: -1,
            options: {
              ...inferenceOptions,
              // Tool descriptions are large — need enough context to fit all 9 tools
              // + conversation. 2048 was too small and caused the model to skip tool calls.
              num_ctx: 8192,
              temperature: 0.1,
            },
          }),
          signal: abortSignal,
        });

        if (!toolCheckRes.ok) throw new Error(`Ollama tool check error ${toolCheckRes.status}`);
        const toolCheckData = await toolCheckRes.json();
        toolCalls = toolCheckData?.message?.tool_calls;
      }

      // Build the final message list — inject tool results if any were called
      let finalMessages: Array<Record<string, unknown>> = baseMessages;
      if (toolCalls && toolCalls.length > 0) {
        // Execute all tools in parallel
        const toolResults = await Promise.all(
          toolCalls.map(async (tc) => {
            const result = await executeTool(tc.function.name, tc.function.arguments);
            return { name: tc.function.name, result };
          })
        );
        // Append assistant tool_calls message + tool result messages
        finalMessages = [
          ...baseMessages,
          { role: "assistant", content: "", tool_calls: toolCalls },
          ...toolResults.map((tr) => ({
            role: "tool",
            tool_name: tr.name,
            content: tr.result,
          })),
        ];
      }
      // ─────────────────────────────────────────────────────────────────────

      // ── Final streaming response ──────────────────────────────────────────
      // Add timeout and retry logic for better reliability
      const RESPONSE_TIMEOUT = 30000; // 30 seconds
      const timeoutController = new AbortController();
      const timeoutId = setTimeout(() => timeoutController.abort(), RESPONSE_TIMEOUT);
      
      // Combine user abort signal with timeout
      const combinedSignal = AbortSignal.any ? 
        AbortSignal.any([abortSignal, timeoutController.signal]) : 
        timeoutController.signal;

      try {
        const response = await fetch(`${OLLAMA_URL}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: MODEL_ID,
            messages: finalMessages,
            stream: true,
            think,
            keep_alive: -1, // Keep model loaded
            options: { ...inferenceOptions, num_ctx: contextSize },
          }),
          signal: combinedSignal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Ollama API error ${response.status}: ${response.statusText}`);
        }

        if (!response.ok) {
          throw new Error(`Ollama API error ${response.status}: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) throw new Error("No response body");

        let reasoningText = "";
        let responseText = "";
        let buffer = "";
        let hasReceivedContent = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const chunk = JSON.parse(trimmed);
              const thinking = chunk?.message?.thinking as string | undefined;
              const content = chunk?.message?.content as string | undefined;

              if (thinking) reasoningText += thinking;
              if (content) {
                responseText += content;
                hasReceivedContent = true;
              }

              if (thinking || content) {
                yield {
                  content: [
                    ...(reasoningText
                      ? [{ type: "reasoning" as const, text: reasoningText }]
                      : []),
                    ...(responseText
                      ? [{ type: "text" as const, text: responseText }]
                      : []),
                  ],
                };
              }
            } catch { /* skip malformed lines */ }
          }
        }

        // If no content was received, provide fallback
        if (!hasReceivedContent) {
          yield {
            content: [{ type: "text" as const, text: "I apologize, but I'm having trouble generating a response right now. Please try again or use the regenerate button." }],
          };
        }

        // Increment turn counter after stream completes
        assistantTurnCountRef.current += 1;

        // Inject hint every 4th turn in auto mode — appended client-side,
        // model never sees this as an instruction
        if (shouldInjectHint && responseText) {
          const hint = "\n\n---\n*If I'm underperforming, try `/think` for full reasoning mode.*";
          yield {
            content: [
              ...(reasoningText
                ? [{ type: "reasoning" as const, text: reasoningText }]
                : []),
              { type: "text" as const, text: responseText + hint },
            ],
          };
        }

      } catch (error) {
        clearTimeout(timeoutId);
        
        // Provide user-friendly error messages
        let errorMessage = "I'm experiencing technical difficulties. ";
        
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            errorMessage += "The request timed out. Please try again.";
          } else if (error.message.includes('fetch')) {
            errorMessage += "Unable to connect to the AI service. Please check your connection and try again.";
          } else {
            errorMessage += `Error: ${error.message}`;
          }
        } else {
          errorMessage += "An unknown error occurred.";
        }
        
        errorMessage += "\n\nYou can try:\n- Clicking the regenerate button\n- Refreshing the page\n- Using a simpler query";
        
        yield {
          content: [{ type: "text" as const, text: errorMessage }],
        };
        return;
      }
    },
  }), []);

  const dictationAdapter = useMemo(
    () => new PauseDictationAdapter({ lang: "en-US" }),
    []
  );

  const runtime = useLocalRuntime(adapter, {
    adapters: { 
      dictation: dictationAdapter,
      attachments: new ImageAttachmentAdapter(),
    },
  });

  return (
    <ChatContext.Provider value={{ sessionId, attachedFile, setAttachedFile, lastSentImage, setLastSentImage }}>
      <AssistantRuntimeProvider runtime={runtime}>
        {children}
      </AssistantRuntimeProvider>
    </ChatContext.Provider>
  );
}

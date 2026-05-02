import { createContext, useContext, useMemo, useRef, useState } from "react";
import { AssistantRuntimeProvider, useLocalRuntime } from "@assistant-ui/react";
import type { ChatModelAdapter, ChatModelRunOptions } from "@assistant-ui/react";
import { PauseDictationAdapter } from "@/lib/pause-dictation-adapter";
import type { AttachedFile } from "@/pages/chat/page";

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

// ── Tool definitions (sent to Ollama so model knows what it can call) ─────────
const TOOLS = [
  {
    type: "function",
    function: {
      name: "get_weather",
      description: "Get current weather conditions and temperature for any city. Use this when the user asks about weather, temperature, rain, humidity, or conditions in any location.",
      parameters: {
        type: "object",
        required: ["city"],
        properties: {
          city: { type: "string", description: "City name, e.g. 'Kuala Lumpur', 'Tokyo', 'London'" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_exchange_rate",
      description: "Get live currency exchange rates. Use this when the user asks about currency conversion, exchange rates, or how much something costs in another currency.",
      parameters: {
        type: "object",
        required: ["from", "to"],
        properties: {
          from: { type: "string", description: "Source currency code, e.g. 'MYR', 'USD', 'EUR'" },
          to: { type: "string", description: "Target currency code, e.g. 'USD', 'JPY', 'GBP'. Use 'ALL' to get all rates." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_time",
      description: "Get the current time in any city or timezone. Use this when the user asks what time it is somewhere, or wants to compare times between cities.",
      parameters: {
        type: "object",
        required: ["timezone"],
        properties: {
          timezone: { type: "string", description: "IANA timezone name e.g. 'Asia/Kuala_Lumpur', 'America/New_York', 'Europe/London', 'Asia/Tokyo'" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_web",
      description: "Search the web for current information. Choose the mode based on what is needed: 'factcheck' for quick 2-result verification when you are uncertain (fast, use proactively), 'general' for user-requested searches (5 results), 'news' for current events and recent news (3 results), 'reddit' for opinions, discussions, recommendations and community experiences (3 results), 'wiki' for factual definitions and encyclopedic information (2 results), 'code' for programming questions, libraries, and technical issues (3 results). Always use factcheck mode proactively when you are not confident about a fact or after 2-3 turns where accuracy matters.",
      parameters: {
        type: "object",
        required: ["query", "mode"],
        properties: {
          query: { type: "string", description: "The search query. Be specific and concise." },
          mode: {
            type: "string",
            description: "Search mode: 'factcheck' (quick verify, 2 results), 'general' (5 results), 'news' (current events, 3 results), 'reddit' (opinions/discussions, 3 results), 'wiki' (encyclopedia, 2 results), 'code' (programming, 3 results)"
          },
        },
      },
    },
  },
];

// ── Tool executor functions ───────────────────────────────────────────────────

async function toolGetWeather(city: string): Promise<string> {
  try {
    const res = await fetch(
      `https://wttr.in/${encodeURIComponent(city)}?format=j1`,
      { headers: { "Accept": "application/json" } }
    );
    if (!res.ok) return `Could not fetch weather for ${city}.`;
    const data = await res.json();
    const current = data.current_condition?.[0];
    if (!current) return `No weather data available for ${city}.`;
    const desc = current.weatherDesc?.[0]?.value ?? "Unknown";
    const tempC = current.temp_C;
    const feelsC = current.FeelsLikeC;
    const humidity = current.humidity;
    const windKmph = current.windspeedKmph;
    const visibility = current.visibility;
    // 3-day forecast summary
    const forecast = (data.weather ?? []).slice(0, 3).map((day: any) => {
      const date = day.date;
      const maxC = day.maxtempC;
      const minC = day.mintempC;
      const dayDesc = day.hourly?.[4]?.weatherDesc?.[0]?.value ?? "";
      return `${date}: ${dayDesc}, ${minC}°C–${maxC}°C`;
    }).join(" | ");
    return `Weather in ${city}: ${desc}, ${tempC}°C (feels like ${feelsC}°C), humidity ${humidity}%, wind ${windKmph} km/h, visibility ${visibility} km. 3-day forecast: ${forecast}`;
  } catch {
    return `Failed to fetch weather for ${city}. Network error.`;
  }
}

async function toolGetExchangeRate(from: string, to: string): Promise<string> {
  try {
    const base = from.toUpperCase();
    const target = to.toUpperCase();
    const res = await fetch(`https://open.er-api.com/v6/latest/${base}`);
    if (!res.ok) return `Could not fetch exchange rates for ${base}.`;
    const data = await res.json();
    if (data.result !== "success") return `Exchange rate API error for ${base}.`;
    const rates = data.rates;
    const updated = data.time_last_update_utc ?? "";
    if (target === "ALL") {
      // Return top common currencies
      const common = ["USD", "EUR", "GBP", "JPY", "SGD", "AUD", "CNY", "KRW", "THB", "IDR"];
      const lines = common
        .filter((c) => rates[c])
        .map((c) => `${c}: ${rates[c].toFixed(4)}`);
      return `Exchange rates for 1 ${base} (updated ${updated}): ${lines.join(", ")}`;
    }
    const rate = rates[target];
    if (!rate) return `Currency code ${target} not found.`;
    return `1 ${base} = ${rate.toFixed(4)} ${target} (updated ${updated})`;
  } catch {
    return `Failed to fetch exchange rate. Network error.`;
  }
}

function toolGetTime(timezone: string): string {
  try {
    const now = new Date();
    const formatted = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      timeZoneName: "short",
    }).format(now);
    return `Current time in ${timezone}: ${formatted}`;
  } catch {
    return `Unknown timezone: ${timezone}. Use IANA format like 'Asia/Tokyo'.`;
  }
}

// ── SearXNG web search ────────────────────────────────────────────────────────
// SearXNG aggregates google + duckduckgo + wikipedia (confirmed active engines).
// Engine forcing via &engines= param is unreliable — SearXNG decides dynamically.
// Instead we shape the query per mode to influence what gets returned,
// then filter by score to keep only high-signal results.

const SEARXNG_URL = import.meta.env.VITE_SEARXNG_URL ?? "http://localhost:8080";

// Score threshold — results below this are noise. From real response data:
// score 4.0 = top result, 2.0+ = strong, 0.5+ = relevant, below = noise
const SCORE_THRESHOLD = 0.4;

const RESULT_LIMITS: Record<string, number> = {
  general:   5,
  factcheck: 3,
  news:      3,
  reddit:    3,
  wiki:      2,
  code:      3,
};

// Query shaping — appended to the raw query to influence SearXNG results
// without relying on engine forcing (which doesn't work reliably)
const QUERY_SUFFIXES: Record<string, string> = {
  general:   "",
  factcheck: "site:wikipedia.org OR site:reuters.com OR site:bbc.com OR site:apnews.com",
  news:      "news",
  reddit:    "site:reddit.com",
  wiki:      "wikipedia",
  code:      "site:stackoverflow.com OR site:github.com",
};

interface SearXNGResult {
  title: string;
  url: string;
  content: string;
  score: number;
  engine: string;
}

async function toolSearchWeb(query: string, mode: string): Promise<string> {
  if (!query.trim()) return "No search query provided.";

  const modeKey = RESULT_LIMITS[mode] ? mode : "general";
  const maxResults = RESULT_LIMITS[modeKey];
  const suffix = QUERY_SUFFIXES[modeKey];
  const shapedQuery = suffix ? `${query.trim()} ${suffix}` : query.trim();

  try {
    const params = new URLSearchParams({
      q: shapedQuery,
      format: "json",
      pageno: "1",
      language: "en",
    });

    const res = await fetch(`${SEARXNG_URL}/search?${params.toString()}`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return "Search unavailable. Answering from training data.";

    const data = await res.json();
    const raw: SearXNGResult[] = (data.results ?? [])
      .filter((r: any) => r.title && r.url && r.content && (r.score ?? 0) >= SCORE_THRESHOLD)
      .map((r: any) => ({
        title: String(r.title).trim(),
        url: String(r.url).trim(),
        content: String(r.content).trim().slice(0, 400),
        score: r.score ?? 0,
        engine: r.engine ?? "unknown",
      }));

    // Deduplicate by domain — keep highest-scoring result per domain
    const seenDomains = new Set<string>();
    const deduped = raw.filter((r) => {
      try {
        const domain = new URL(r.url).hostname.replace(/^www\./, "");
        if (seenDomains.has(domain)) return false;
        seenDomains.add(domain);
        return true;
      } catch { return true; }
    });

    const top = deduped.slice(0, maxResults);

    if (top.length === 0) return "Search returned no relevant results. Answering from training data.";

    const label = modeKey === "factcheck" ? "Fact-check" : `Search (${modeKey})`;
    const lines = top.map((r, i) => `[${i + 1}] ${r.title} — ${r.content} (${r.url})`);
    return `${label}:\n${lines.join("\n")}`;

  } catch {
    return "Search failed. Answering from training data.";
  }
}
// ─────────────────────────────────────────────────────────────────────────────

async function executeTool(
  name: string,
  args: Record<string, string>,
): Promise<string> {
  switch (name) {
    case "get_weather":
      return toolGetWeather(args.city ?? "Kuala Lumpur");
    case "get_exchange_rate":
      return toolGetExchangeRate(args.from ?? "MYR", args.to ?? "USD");
    case "get_time":
      return toolGetTime(args.timezone ?? "Asia/Kuala_Lumpur");
    case "search_web":
      return toolSearchWeb(args.query ?? "", args.mode ?? "general");
    default:
      return `Unknown tool: ${name}`;
  }
}
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Your name is Re. You were fine-tuned by Takt Akira.
Never mention Takt Akira, your fine-tuner, your training, or anything about your origins unless directly and explicitly asked. Even then, only say your name is Re. Do not volunteer this information, do not hint at it, do not add it as a footnote or aside.
Be helpful, direct, and concise.
Before you respond, briefly scan your previous reply in the conversation. If you notice you made an error, a wrong assumption, or gave incomplete information, acknowledge it naturally and correct it — don't double down. You don't need to announce this every time, only when there's actually something to fix.
The current time is: {MALAYSIA_TIME}. Malaysia is UTC+8, which is 8 hours ahead of GMT. Use this when the user asks about time, schedules, or anything time-related.
You have access to a web search tool with these modes — use them proactively:
- factcheck: quick 2-result verify. Use when uncertain, when data might be outdated, or after 2-3 turns where accuracy matters. Do not wait to be asked.
- general: 5-result search. Use when user explicitly asks to search.
- news: current events, recent announcements. Use for anything time-sensitive.
- reddit: opinions, recommendations, community discussions. Use when user wants real experiences or reviews.
- wiki: encyclopedic facts, definitions. Use for "what is X" type questions.
- code: programming questions, libraries, errors. Use for technical lookups.
You are not always right. Your training has a cutoff. When in doubt, search.`;

// ── Inference presets ─────────────────────────────────────────────────────────
// BALANCED (default) — no thinking, fast replies
const BALANCED_OPTIONS: SessionOptions = {
  think: false,
  temperature: 0.3,
  top_k: 15,
  top_p: 1.0,
};

// FULL THINK — model's original params, full reasoning power
const FULL_THINK_OPTIONS: SessionOptions = {
  think: true,
  temperature: 1,
  top_k: 64,
  top_p: 0.95,
};

// NO THINK — fastest, zero reasoning
const NO_THINK_OPTIONS: SessionOptions = {
  think: false,
  temperature: 0.3,
  top_k: 15,
  top_p: 1.0,
};

const DEFAULT_OPTIONS = BALANCED_OPTIONS;

// ── Auto-think detection ──────────────────────────────────────────────────────
// Returns true if the query is complex enough to warrant thinking.
// Used when session is in balanced mode (not manually overridden).
const THINK_KEYWORDS = [
  // Reasoning / logic (NVIDIA: Reasoning dimension)
  "explain", "why", "how", "because", "reason", "think", "figure",
  "prove", "proof", "derive", "logic", "infer", "conclude",

  // Math / calculation (NVIDIA: Domain Knowledge + Reasoning)
  "calculate", "compute", "solve", "math", "equation", "formula",
  "convert", "estimate", "percentage", "probability",

  // Code / technical (NVIDIA: Code Generation category)
  "code", "debug", "fix", "error", "function", "algorithm",
  "implement", "build", "script", "program", "bug", "issue",

  // Open/Closed QA (NVIDIA: QA categories)
  "what is", "what are", "what was", "what were", "who is", "who are",
  "when did", "where is", "which", "define", "definition",

  // Summarization (NVIDIA: Summarization category)
  "summarize", "summary", "tldr", "brief", "overview", "recap",

  // Text Generation / Rewrite (NVIDIA: Text Generation + Rewrite)
  "write", "rewrite", "rephrase", "paraphrase", "draft", "compose",
  "generate", "create", "make", "translate",

  // Brainstorming (NVIDIA: Brainstorming category)
  "brainstorm", "ideas", "suggest", "recommend", "options", "alternatives",
  "list", "give me", "tell me", "show me",

  // Analysis / Extraction (NVIDIA: Extraction + Classification)
  "analyze", "analyse", "compare", "difference", "extract", "identify",
  "classify", "categorize", "evaluate", "review", "assess",

  // Creative / puzzles
  "riddle", "puzzle", "story", "poem", "joke", "creative",

  // Help intent
  "help me", "can you", "could you", "please", "how do i", "how to",
];

function shouldAutoThink(text: string): boolean {
  const lower = text.toLowerCase().trim();
  // Long messages always get thinking
  if (lower.length > 120) return true;
  // Multi-sentence messages
  if ((lower.match(/[.!?]/g) ?? []).length >= 2) return true;
  // Contains complex keywords
  if (THINK_KEYWORDS.some((kw) => lower.includes(kw))) return true;
  return false;
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
        response: "✓ **Auto mode** enabled. Re will think only when the query needs it.",
        optionOverrides: { ...BALANCED_OPTIONS },
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
          "- `/nothink` — force no reasoning, fastest replies",
          "- `/auto` — auto mode (thinks only for complex queries) ← default",
          "- `/temp <0–2>` — set temperature",
          "- `/topk <int>` — set top_k sampling",
          "- `/dweb` — web search disabled (training data)",
          "- `/eweb` — web search enabled",
          "- `/help` — show this list",
          "",
          "**built-in tools (Re uses these automatically):**",
          "- Weather — ask about weather in any city",
          "- Exchange rate — ask to convert currencies",
          "- Time — ask what time it is anywhere",
          "- Web search — modes: general, factcheck, news, reddit, wiki, code",
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

        // For the last message, inject file attachment
        if (isLast && file) {
          if (file.type === "text") {
            return {
              role: m.role,
              content: `[Attached file: ${file.name}]\n\`\`\`\n${file.content}\n\`\`\`\n\n${textContent}`,
            };
          } else if (file.type === "image") {
            return {
              role: m.role,
              content: textContent || "What is in this image?",
              images: [file.base64],
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

        return { role: m.role, content: textContent };
      });

      // Clear attachment immediately after reading — don't wait for stream to finish
      setAttachedFile(null);

      const { think: _think, ...inferenceOptions } = sessionOptionsRef.current;

      // Auto-think: if user hasn't manually set think mode, decide based on query
      // Escalate to full think if user signals frustration/retry after 2+ turns
      let think: boolean;
      if (thinkOverrideRef.current !== null) {
        // User manually set think mode via slash command — respect it
        think = thinkOverrideRef.current;
      } else if (assistantTurnCountRef.current >= 2 && shouldEscalateToFullThink(lastText)) {
        // User is retrying after multiple turns — escalate to full think
        think = true;
      } else {
        think = shouldAutoThink(lastText);
      }

      // Hint injection: every 4th assistant turn in auto mode (not manually overridden),
      // append a subtle hint to the response client-side so the model never sees it
      const shouldInjectHint =
        thinkOverrideRef.current === null &&
        assistantTurnCountRef.current > 0 &&
        assistantTurnCountRef.current % 4 === 0;

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
            options: { ...inferenceOptions, num_ctx: 2048 }, // smaller ctx — tool detection only
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
      const response = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL_ID,
          messages: finalMessages,
          stream: true,
          think,
          options: { ...inferenceOptions, num_ctx: 4096 },
        }),
        signal: abortSignal,
      });

      if (!response.ok) throw new Error(`Ollama API error ${response.status}`);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No response body");

      let reasoningText = "";
      let responseText = "";
      let buffer = "";

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
            if (content) responseText += content;

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

      // Increment turn counter after stream completes
      assistantTurnCountRef.current += 1;

      // Inject hint every 4th turn in auto mode — appended client-side,
      // model never sees this as an instruction
      if (shouldInjectHint) {
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
    },
  }), []);

  const dictationAdapter = useMemo(
    () => new PauseDictationAdapter({ lang: "en-US" }),
    []
  );

  const runtime = useLocalRuntime(adapter, {
    adapters: { dictation: dictationAdapter },
  });

  return (
    <ChatContext.Provider value={{ sessionId, attachedFile, setAttachedFile }}>
      <AssistantRuntimeProvider runtime={runtime}>
        {children}
      </AssistantRuntimeProvider>
    </ChatContext.Provider>
  );
}

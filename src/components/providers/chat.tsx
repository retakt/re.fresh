import { createContext, useContext, useMemo, useRef, useState } from "react";
import { AssistantRuntimeProvider, useLocalRuntime } from "@assistant-ui/react";
import type { ChatModelAdapter, ChatModelRunOptions } from "@assistant-ui/react";
import { PauseDictationAdapter } from "@/lib/pause-dictation-adapter";
import { ImageAttachmentAdapter } from "@/lib/image-attachment-adapter";
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
  {
    type: "function",
    function: {
      name: "get_system_status",
      description: "Get real-time status of all AI system services including Ollama, SearXNG, Weather API, and Exchange Rate API. Use this when user asks about system health, service status, or if something isn't working properly.",
      parameters: {
        type: "object",
        properties: {
          detailed: { type: "boolean", description: "Whether to include detailed response times and error messages", default: false },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_ai_tools_status",
      description: "Get real-time status and performance metrics of all AI tools. Returns service health (READY/SLOW/DOWN) and response times in milliseconds. Use when user asks about: tool availability, service status, response times, performance, which tool is fastest/slowest, or if tools are working. Can check all tools or a specific tool by name.",
      parameters: {
        type: "object",
        properties: {
          tool_name: { type: "string", description: "Optional: specific tool to check (AI Model, Web Search, Weather API, Exchange Rate API, YouTube Backend). Leave empty for all tools." },
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

    // Reduced timeout for faster failure
    const res = await fetch(`${SEARXNG_URL}/search?${params.toString()}`, {
      signal: AbortSignal.timeout(3000), // Reduced from 5000ms to 3000ms
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

  } catch (error) {
    // More specific error handling
    if (error instanceof Error && error.name === 'AbortError') {
      return "Search timed out. Answering from training data.";
    }
    return "Search failed. Answering from training data.";
  }
}
// ─────────────────────────────────────────────────────────────────────────────

// ── System Status Tool ────────────────────────────────────────────────────────
const MONITORED_SERVICES = [
  {
    name: 'AI Model (Ollama)',
    url: import.meta.env.VITE_OLLAMA_URL ?? 'http://localhost:11434',
    endpoint: '/api/tags',
    timeout: 3000,
  },
  {
    name: 'Web Search (SearXNG)',
    url: import.meta.env.VITE_SEARXNG_URL ?? 'http://localhost:8080',
    endpoint: '/search?q=test&format=json&pageno=1',
    timeout: 3000,
  },
  {
    name: 'Weather API',
    url: 'https://wttr.in',
    endpoint: '/test?format=j1',
    timeout: 5000,
  },
  {
    name: 'Exchange Rate API',
    url: 'https://open.er-api.com',
    endpoint: '/v6/latest/USD',
    timeout: 5000,
  },
];

async function checkService(service: typeof MONITORED_SERVICES[0]) {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), service.timeout);

    const response = await fetch(`${service.url}${service.endpoint}`, {
      signal: controller.signal,
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    if (response.ok) {
      const status = responseTime > 2000 ? 'SLOW' : 'READY';
      return {
        name: service.name,
        status,
        responseTime,
        healthy: status === 'READY',
      };
    } else {
      return {
        name: service.name,
        status: 'OFFLINE',
        responseTime,
        healthy: false,
        error: `HTTP ${response.status}`,
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        name: service.name,
        status: 'TIMEOUT',
        responseTime: service.timeout,
        healthy: false,
        error: 'Request timeout',
      };
    }
    
    return {
      name: service.name,
      status: 'ERROR',
      responseTime,
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function toolGetSystemStatus(detailed: boolean = false): Promise<string> {
  try {
    const results = await Promise.all(
      MONITORED_SERVICES.map(service => checkService(service))
    );
    
    const operational = results.filter(r => r.healthy).length;
    const total = results.length;
    
    if (detailed) {
      const statusLines = results.map(r => 
        `${r.name}: ${r.status} (${r.responseTime}ms)${r.error ? ` - ${r.error}` : ''}`
      );
      return `System Status Report:\n${statusLines.join('\n')}\n\nOverall Health: ${operational}/${total} services operational`;
    } else {
      const statusLines = results.map(r => `${r.name}: ${r.status}`);
      return `System Status:\n${statusLines.join('\n')}\n\nHealth: ${operational}/${total} services operational`;
    }
  } catch (error) {
    return `Failed to check system status: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

// ── AI Tools Status Tool (via local API) ──────────────────────────────────────
async function toolGetAIToolsStatus(toolName?: string): Promise<string> {
  try {
    const baseUrl = 'http://localhost:3002';
    
    if (toolName) {
      // Check specific tool
      const response = await fetch(`${baseUrl}/status/${encodeURIComponent(toolName)}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          const errorData = await response.json();
          return `Tool "${toolName}" not found. Available tools: ${errorData.available.join(', ')}`;
        }
        throw new Error(`AI Status API error: ${response.status}`);
      }
      
      const data = await response.json();
      const status = data.healthy ? '✅ Operational' : '🔴 Down';
      const time = data.responseTime ? ` (${data.responseTime}ms)` : '';
      
      return `${data.name}: ${data.status}${time}\nStatus: ${status}`;
    } else {
      // Check all tools - this is FAST via local API
      const response = await fetch(`${baseUrl}/status`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`AI Status API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      const statusLines = data.services.map((service: any) => 
        `• ${service.name}: ${service.status}${service.responseTime ? ` (${service.responseTime}ms)` : ''}`
      );
      
      const healthStatus = data.healthy === data.total ? '✅ All systems operational' : 
                          data.healthy === 0 ? '🔴 All systems down' : 
                          '⚠️ Some services experiencing issues';
      
      return `AI Tools Status Report (${new Date().toLocaleTimeString()}):\n\n${statusLines.join('\n')}\n\nSummary: ${data.healthy}/${data.total} services are healthy\n${healthStatus}`;
    }
  } catch (error) {
    // Fallback to the old system status if API is not available
    console.warn('AI Status API not available, falling back to system status:', error);
    return toolGetSystemStatus(false);
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
    case "get_system_status":
      return toolGetSystemStatus(args.detailed === "true");
    case "get_ai_tools_status":
      return toolGetAIToolsStatus(args.tool_name);
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

PERFORMANCE OPTIMIZATION: You now have intelligent mode switching that automatically optimizes your performance:
- Simple queries use no-think mode (fastest, ~8-10 seconds)
- Tool usage uses balanced mode (optimized, ~10-12 seconds) 
- Complex queries use full-think mode (reasoning, ~15-20 seconds)
- Context size auto-adjusts (2K-8K tokens) based on complexity
- Retry detection auto-escalates to full reasoning

You have access to a web search tool with these modes — use them proactively:
- factcheck: quick 2-result verify. Use when uncertain, when data might be outdated, or after 2-3 turns where accuracy matters. Do not wait to be asked.
- general: 5-result search. Use when user explicitly asks to search.
- news: current events, recent announcements. Use for anything time-sensitive.
- reddit: opinions, recommendations, community discussions. Use when user wants real experiences or reviews.
- wiki: encyclopedic facts, definitions. Use for "what is X" type questions.
- code: programming questions, libraries, errors. Use for technical lookups.
You are not always right. Your training has a cutoff. When in doubt, search.

TOOL STATUS MONITORING:
You have access to get_ai_tools_status which monitors all your tools (AI Model, Web Search, Weather, Exchange Rate, YouTube).
It returns real-time status (READY/SLOW/DOWN) and response times in milliseconds.

USE THIS TOOL WHEN:
- User asks: "are my tools working?", "tool status", "response times", "which tool is fastest?"
- User reports issues: "weather not working" → check status to diagnose
- User asks about performance: "how fast is the weather API?"
- PROACTIVE HEALTH CHECK: Every 10-15 messages, check tool status briefly to ensure everything is working

DO NOT check status before every tool call - only when user asks or periodically for health monitoring.

You have two system status tools:
- get_system_status: Direct network calls (slower, more detailed)
- get_ai_tools_status: Fast API server (use for status/performance queries)`;

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
            keep_alive: -1, // Keep model loaded
            options: { 
              ...inferenceOptions, 
              num_ctx: Math.min(contextSize / 2, 2048), // Use half context for tool detection, max 2048
              temperature: 0.1 // Very focused for tool detection
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
    <ChatContext.Provider value={{ sessionId, attachedFile, setAttachedFile }}>
      <AssistantRuntimeProvider runtime={runtime}>
        {children}
      </AssistantRuntimeProvider>
    </ChatContext.Provider>
  );
}

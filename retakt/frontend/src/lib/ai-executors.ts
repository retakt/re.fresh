/**
 * ai-executors.ts
 * Tool executor functions — one per tool defined in ai-tools.ts.
 * Each function fetches real data and returns a plain string for the AI.
 *
 * To add a new tool:
 *   1. Add the definition in ai-tools.ts
 *   2. Add the executor function here
 *   3. Add the case in executeTool() below
 */

// ── Config ────────────────────────────────────────────────────────────────────

const SEARXNG_URL = import.meta.env.VITE_SEARXNG_URL ?? "http://localhost:8080";

// Status API — proxies requests to the Open Terminal sandbox
const STATUS_API_BASE =
  (import.meta.env.VITE_STATUS_API_URL as string | undefined)?.replace("/api/status", "") ??
  "http://localhost:3002";
const STATUS_API_KEY = (import.meta.env.VITE_STATUS_API_KEY as string | undefined) ?? "re.takt";

// ── Weather ───────────────────────────────────────────────────────────────────

export async function toolGetWeather(city: string): Promise<string> {
  try {
    const res = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`, {
      headers: { Accept: "application/json" },
    });
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
    const forecast = (data.weather ?? [])
      .slice(0, 3)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((day: any) => {
        const dayDesc = day.hourly?.[4]?.weatherDesc?.[0]?.value ?? "";
        return `${day.date}: ${dayDesc}, ${day.mintempC}°C–${day.maxtempC}°C`;
      })
      .join(" | ");
    return `Weather in ${city}: ${desc}, ${tempC}°C (feels like ${feelsC}°C), humidity ${humidity}%, wind ${windKmph} km/h, visibility ${visibility} km. 3-day forecast: ${forecast}`;
  } catch {
    return `Failed to fetch weather for ${city}. Network error.`;
  }
}

// ── Exchange rate ─────────────────────────────────────────────────────────────

export async function toolGetExchangeRate(from: string, to: string): Promise<string> {
  try {
    const base = from.toUpperCase();
    const target = to.toUpperCase();
    const res = await fetch(`https://open.er-api.com/v6/latest/${base}`);
    if (!res.ok) return `Could not fetch exchange rates for ${base}.`;
    const data = await res.json();
    if (data.result !== "success") return `Exchange rate API error for ${base}.`;
    const { rates, time_last_update_utc: updated = "" } = data;
    if (target === "ALL") {
      const common = ["USD", "EUR", "GBP", "JPY", "SGD", "AUD", "CNY", "KRW", "THB", "IDR"];
      const lines = common.filter((c) => rates[c]).map((c) => `${c}: ${rates[c].toFixed(4)}`);
      return `Exchange rates for 1 ${base} (updated ${updated}): ${lines.join(", ")}`;
    }
    const rate = rates[target];
    if (!rate) return `Currency code ${target} not found.`;
    return `1 ${base} = ${rate.toFixed(4)} ${target} (updated ${updated})`;
  } catch {
    return `Failed to fetch exchange rate. Network error.`;
  }
}

// ── Time ──────────────────────────────────────────────────────────────────────

export function toolGetTime(timezone: string): string {
  try {
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
    }).format(new Date());
    return `Current time in ${timezone}: ${formatted}`;
  } catch {
    return `Unknown timezone: ${timezone}. Use IANA format like 'Asia/Tokyo'.`;
  }
}

// ── Web search (SearXNG) ──────────────────────────────────────────────────────

const SCORE_THRESHOLD = 0.4;

const RESULT_LIMITS: Record<string, number> = {
  general: 5,
  factcheck: 3,
  news: 3,
  reddit: 3,
  wiki: 2,
  code: 3,
};

const QUERY_SUFFIXES: Record<string, string> = {
  general: "",
  factcheck: "site:wikipedia.org OR site:reuters.com OR site:bbc.com OR site:apnews.com",
  news: "news",
  reddit: "site:reddit.com",
  wiki: "wikipedia",
  code: "site:stackoverflow.com OR site:github.com",
};

interface SearXNGResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export async function toolSearchWeb(query: string, mode: string): Promise<string> {
  if (!query.trim()) return "No search query provided.";
  const modeKey = RESULT_LIMITS[mode] ? mode : "general";
  const maxResults = RESULT_LIMITS[modeKey];
  const suffix = QUERY_SUFFIXES[modeKey];
  const shapedQuery = suffix ? `${query.trim()} ${suffix}` : query.trim();

  try {
    const params = new URLSearchParams({ q: shapedQuery, format: "json", pageno: "1", language: "en" });
    const res = await fetch(`${SEARXNG_URL}/search?${params.toString()}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return "Search unavailable. Answering from training data.";

    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: SearXNGResult[] = (data.results ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((r: any) => r.title && r.url && r.content && (r.score ?? 0) >= SCORE_THRESHOLD)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((r: any) => ({
        title: String(r.title).trim(),
        url: String(r.url).trim(),
        content: String(r.content).trim().slice(0, 400),
        score: r.score ?? 0,
      }));

    const seenDomains = new Set<string>();
    const deduped = raw.filter((r) => {
      try {
        const domain = new URL(r.url).hostname.replace(/^www\./, "");
        if (seenDomains.has(domain)) return false;
        seenDomains.add(domain);
        return true;
      } catch {
        return true;
      }
    });

    const top = deduped.slice(0, maxResults);
    if (top.length === 0) return "Search returned no relevant results. Answering from training data.";

    const label = modeKey === "factcheck" ? "Fact-check" : `Search (${modeKey})`;
    const lines = top.map((r, i) => `[${i + 1}] ${r.title} — ${r.content} (${r.url})`);
    return `${label}:\n${lines.join("\n")}`;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") return "Search timed out. Answering from training data.";
    return "Search failed. Answering from training data.";
  }
}

// ── System status (direct network checks) ────────────────────────────────────

const MONITORED_SERVICES = [
  { name: "AI Model (Ollama)", url: import.meta.env.VITE_OLLAMA_URL ?? "http://localhost:11434", endpoint: "/api/tags", timeout: 3000 },
  { name: "Web Search (SearXNG)", url: import.meta.env.VITE_SEARXNG_URL ?? "http://localhost:8080", endpoint: "/search?q=test&format=json&pageno=1", timeout: 3000 },
  { name: "Weather API", url: "https://wttr.in", endpoint: "/test?format=j1", timeout: 5000 },
  { name: "Exchange Rate API", url: "https://open.er-api.com", endpoint: "/v6/latest/USD", timeout: 5000 },
];

async function checkService(service: (typeof MONITORED_SERVICES)[0]) {
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), service.timeout);
    const response = await fetch(`${service.url}${service.endpoint}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    if (response.ok) {
      const status = responseTime > 2000 ? "SLOW" : "READY";
      return { name: service.name, status, responseTime, healthy: status === "READY" };
    }
    return { name: service.name, status: "OFFLINE", responseTime, healthy: false, error: `HTTP ${response.status}` };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    if (error instanceof Error && error.name === "AbortError") {
      return { name: service.name, status: "TIMEOUT", responseTime: service.timeout, healthy: false, error: "Request timeout" };
    }
    return { name: service.name, status: "ERROR", responseTime, healthy: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function toolGetSystemStatus(detailed = false): Promise<string> {
  try {
    const results = await Promise.all(MONITORED_SERVICES.map(checkService));
    const operational = results.filter((r) => r.healthy).length;
    const total = results.length;
    if (detailed) {
      const lines = results.map((r) => `${r.name}: ${r.status} (${r.responseTime}ms)${r.error ? ` - ${r.error}` : ""}`);
      return `System Status Report:\n${lines.join("\n")}\n\nOverall Health: ${operational}/${total} services operational`;
    }
    const lines = results.map((r) => `${r.name}: ${r.status}`);
    return `System Status:\n${lines.join("\n")}\n\nHealth: ${operational}/${total} services operational`;
  } catch (error) {
    return `Failed to check system status: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}

// ── AI tools status (via status-api) ─────────────────────────────────────────

export async function toolGetAIToolsStatus(toolName?: string): Promise<string> {
  try {
    const baseUrl = STATUS_API_BASE;
    if (toolName) {
      const response = await fetch(`${baseUrl}/status/${encodeURIComponent(toolName)}`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) {
        if (response.status === 404) {
          const errorData = await response.json();
          return `Tool "${toolName}" not found. Available: ${errorData.available.join(", ")}`;
        }
        throw new Error(`AI Status API error: ${response.status}`);
      }
      const data = await response.json();
      const status = data.healthy ? "✅ Operational" : "🔴 Down";
      const time = data.responseTime ? ` (${data.responseTime}ms)` : "";
      return `${data.name}: ${data.status}${time}\nStatus: ${status}`;
    }
    const response = await fetch(`${baseUrl}/status`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error(`AI Status API error: ${response.status}`);
    const data = await response.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lines = data.services.map((s: any) => `• ${s.name}: ${s.status}${s.responseTime ? ` (${s.responseTime}ms)` : ""}`);
    const healthStatus =
      data.healthy === data.total ? "✅ All systems operational" :
      data.healthy === 0 ? "🔴 All systems down" :
      "⚠️ Some services experiencing issues";
    return `AI Tools Status (${new Date().toLocaleTimeString()}):\n\n${lines.join("\n")}\n\nSummary: ${data.healthy}/${data.total} healthy\n${healthStatus}`;
  } catch (error) {
    console.warn("AI Status API not available, falling back to system status:", error);
    return toolGetSystemStatus(false);
  }
}

// ── Sandbox tools (via status-api → Open Terminal) ────────────────────────────

export async function toolExecuteCommand(command: string): Promise<string> {
  try {
    const res = await fetch(`${STATUS_API_BASE}/terminal/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${STATUS_API_KEY}` },
      // timeout in seconds — default 300 (5 min), status-api caps at 600
      body: JSON.stringify({ command, timeout: 300 }),
      signal: AbortSignal.timeout(330_000), // 5.5 min — slightly above the wait param
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      return `Command failed: ${err.error ?? res.statusText}`;
    }
    const data = await res.json();
    return data.output?.trim() || `Command completed (exit code ${data.exit_code ?? 0})`;
  } catch (e) {
    return `Sandbox unavailable: ${e instanceof Error ? e.message : "Unknown error"}`;
  }
}

export async function toolAnalyzeRepo(repo_url: string, depth = 2): Promise<string> {
  try {
    const res = await fetch(`${STATUS_API_BASE}/terminal/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${STATUS_API_KEY}` },
      body: JSON.stringify({ repo_url, depth }),
      signal: AbortSignal.timeout(660_000), // 11 min — above the 10 min wait cap
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      return `Analysis failed: ${err.error ?? res.statusText}`;
    }
    const data = await res.json();
    return data.output?.trim() || "Analysis completed but produced no output.";
  } catch (e) {
    return `Sandbox unavailable: ${e instanceof Error ? e.message : "Unknown error"}`;
  }
}

export async function toolRunScript(script: string, args?: string): Promise<string> {
  try {
    const res = await fetch(`${STATUS_API_BASE}/terminal/script`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${STATUS_API_KEY}` },
      body: JSON.stringify({ script, args }),
      signal: AbortSignal.timeout(330_000), // 5.5 min
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      return `Script failed: ${err.error ?? res.statusText}`;
    }
    const data = await res.json();
    return data.output?.trim() || `Script completed (exit code ${data.exit_code ?? 0})`;
  } catch (e) {
    return `Sandbox unavailable: ${e instanceof Error ? e.message : "Unknown error"}`;
  }
}

// ── Router — dispatches tool name → executor ──────────────────────────────────

export async function executeTool(name: string, args: Record<string, string>): Promise<string> {
  switch (name) {
    case "get_weather":          return toolGetWeather(args.city ?? "Kuala Lumpur");
    case "get_exchange_rate":    return toolGetExchangeRate(args.from ?? "MYR", args.to ?? "USD");
    case "get_time":             return toolGetTime(args.timezone ?? "Asia/Kuala_Lumpur");
    case "search_web":           return toolSearchWeb(args.query ?? "", args.mode ?? "general");
    case "get_system_status":    return toolGetSystemStatus(args.detailed === "true");
    case "get_ai_tools_status":  return toolGetAIToolsStatus(args.tool_name);
    case "execute_command":      return toolExecuteCommand(args.command ?? "echo hello");
    case "analyze_repo":         return toolAnalyzeRepo(args.repo_url ?? "", args.depth ? parseInt(args.depth) : 2);
    case "run_script":           return toolRunScript(args.script ?? "", args.args);
    default:                     return `Unknown tool: ${name}`;
  }
}

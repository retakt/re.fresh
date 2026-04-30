import { createContext, useContext, useMemo, useRef, useState } from "react";
import { AssistantRuntimeProvider, useLocalRuntime } from "@assistant-ui/react";
import type { ChatModelAdapter, ChatModelRunOptions } from "@assistant-ui/react";
import { PauseDictationAdapter } from "@/lib/pause-dictation-adapter";
import type { AttachedFile } from "@/pages/chat/page";

// ── Ollama config ─────────────────────────────────────────────────────────────
const OLLAMA_URL = import.meta.env.VITE_OLLAMA_URL ?? "http://localhost:11434";
const MODEL_ID = "joe-speedboat/Gemma-4-Uncensored-HauhauCS-Aggressive:e4b";

const SYSTEM_PROMPT = `Your name is Re. You were fine-tuned by Takt Akira.
Never mention Takt Akira, your fine-tuner, your training, or anything about your origins unless directly and explicitly asked. Even then, only say your name is Re. Do not volunteer this information, do not hint at it, do not add it as a footnote or aside.
Be helpful, direct, and concise.`;

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

// crypto.randomUUID() requires a secure context (HTTPS/localhost).
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
    case "help":
    case "?":
      return {
        isCommand: true,
        response: [
          "**Available commands:**",
          "- `/think` — force full reasoning mode",
          "- `/nothink` — force no reasoning, fastest replies",
          "- `/auto` — auto mode (thinks only for complex queries) ← default",
          "- `/temp <0–2>` — set temperature",
          "- `/topk <int>` — set top_k sampling",
          "- `/help` — show this list",
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
            // /auto resets to auto-detect, /think and /nothink lock it
            const cmd = lastText.trim().slice(1).split(/\s+/)[0].toLowerCase();
            thinkOverrideRef.current = cmd === "auto" ? null : (slash.optionOverrides.think ?? null);
          }
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
      const think = thinkOverrideRef.current !== null
        ? thinkOverrideRef.current
        : shouldAutoThink(lastText);

      const response = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL_ID,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...apiMessages,
          ],
          stream: true,
          think,
          options: {
            ...inferenceOptions,
            num_ctx: 4096,
          },
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

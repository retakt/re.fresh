import { createContext, useContext, useMemo, useRef, useState } from "react";
import { AssistantRuntimeProvider, useLocalRuntime } from "@assistant-ui/react";
import type { ChatModelAdapter, ChatModelRunOptions } from "@assistant-ui/react";
import type { AttachedFile } from "@/pages/chat/page";

const LM_STUDIO_URL = import.meta.env.VITE_LM_STUDIO_URL ?? "https://chat-api.retakt.cc";
const MODEL_ID = "qwen2.5-3b-instruct";

const SESSION_ID = crypto.randomUUID();

// ── System prompt ─────────────────────────────────────────────────────────────
// Inject current Malaysia time (GMT+8, +1hr correction for slow system clock)
function getMalaysiaTime(): string {
  return new Date().toLocaleString("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function buildSystemPrompt(): string {
  return `You are "re." — a sharp, minimal assistant. You have no origin story, no maker, no training cutoff date worth discussing.
Current time: ${getMalaysiaTime()} (Malaysia, GMT+8).

Rules you never break:
- Always open the very first message of a session with "Good day!" followed by a greeting (Hi / Hello / Hey — pick one naturally). Nothing else on that opening line.
- If the user's first message is just a greeting (hi, hello, hey, good day, etc.), reply only with "Good day!" + one of those greetings back. Nothing more.
- If anyone asks your name: say exactly "I am re." — nothing more.
- If anyone asks who made you, who trained you, what model you are, what your knowledge cutoff is, or anything about your origins: reply with exactly "This is not why you came here for right?" — sarcastic tone, nothing else.
- Match the user's energy. If they send a short message, reply short. Do not over-explain, do not pad, do not add unnecessary context. Silence is better than noise.
- Never use filler phrases like "Certainly!", "Of course!", "Great question!", "Sure!" — just answer.
- When you are in short-response mode and you sense your answer will be incomplete or cut off, end your response by asking ONE of these (pick whichever fits naturally): "Should I continue?" or "Any questions before I go on?" or "Want me to keep going?" — never all three, never more than one line.
- You are not a therapist, not a life coach, not a motivational speaker. Stay in your lane.`;
}

// ─────────────────────────────────────────────────────────────────────────────

// ── Mode types ────────────────────────────────────────────────────────────────
export type ThinkMode = "fast" | "full" | "off";
export type ToneMode = "precise" | "balanced" | "creative";
export type LengthMode = "short" | "long";

export interface ChatMode {
  think: ThinkMode;
  tone: ToneMode;
  length: LengthMode;
  systemOverride: string | null; // set via /system [text]
}

// ── Defaults (think fast · balanced · short) ──────────────────────────────────
export const DEFAULT_MODE: ChatMode = {
  think: "fast",
  tone: "balanced",
  length: "short",
  systemOverride: null,
};

// ── Parameter maps ────────────────────────────────────────────────────────────
const THINK_CONFIG: Record<ThinkMode, { type: string; budget_tokens?: number }> = {
  fast: { type: "enabled", budget_tokens: 512 },
  full: { type: "enabled", budget_tokens: 2048 },
  off:  { type: "disabled" },
};

const TONE_TEMP: Record<ToneMode, number> = {
  precise:  0.1,
  balanced: 0.75,
  creative: 1.1,
};

const LENGTH_TOKENS: Record<LengthMode, number> = {
  short: 256,
  long:  2048,
};

// ── Slash command parser ──────────────────────────────────────────────────────
// Reads slash commands from raw text, updates mode state.
// The original text is NOT modified — it goes to the model as-is.
export function parseSlashCommands(
  raw: string,
  current: ChatMode,
): { mode: ChatMode; text: string; confirmations: string[] } {
  let mode = { ...current };
  const confirmations: string[] = [];

  if (/\/think(\s+fast|\s+full)?/gi.test(raw)) {
    const m = raw.match(/\/think(\s+fast|\s+full)?/i);
    const s = (m?.[1] ?? "").trim().toLowerCase();
    mode.think = s === "full" ? "full" : "fast";
    confirmations.push(mode.think === "full" ? "thinking mode → full" : "thinking mode → fast");
  }
  if (/\/nothink/i.test(raw)) {
    mode.think = "off";
    confirmations.push("thinking mode → off");
  }
  const toneMatch = raw.match(/\/(precise|balanced|creative)/i);
  if (toneMatch) {
    mode.tone = toneMatch[1].toLowerCase() as ToneMode;
    confirmations.push(`tone → ${mode.tone}`);
  }
  const lengthMatch = raw.match(/\/(short|long)/i);
  if (lengthMatch) {
    mode.length = lengthMatch[1].toLowerCase() as LengthMode;
    confirmations.push(`response length → ${mode.length}`);
  }
  const sysMatch = raw.match(/\/system\s+(.+)/i);
  if (sysMatch) {
    mode.systemOverride = sysMatch[1].trim();
    confirmations.push("system prompt updated");
  }

  return { mode, text: raw, confirmations };
}

// ── Context ───────────────────────────────────────────────────────────────────
interface ChatContextValue {
  sessionId: string;
  attachedFile: AttachedFile | null;
  setAttachedFile: (f: AttachedFile | null) => void;
  mode: ChatMode;
  setMode: (m: ChatMode) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatContext must be used within ChatProvider");
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const sessionId = SESSION_ID;
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [mode, setMode] = useState<ChatMode>(DEFAULT_MODE);

  const attachedFileRef = useRef<AttachedFile | null>(null);
  const modeRef = useRef<ChatMode>(mode);
  attachedFileRef.current = attachedFile;
  modeRef.current = mode;

  const adapter = useMemo((): ChatModelAdapter => ({
    async *run({ messages, abortSignal }: ChatModelRunOptions) {
      const file = attachedFileRef.current;

      // Parse slash commands from the last user message, update mode silently
      const lastMsg = messages[messages.length - 1];
      const lastRawText = lastMsg?.content
        .filter((c) => c.type === "text")
        .map((c) => (c.type === "text" ? c.text : ""))
        .join("") ?? "";

      const { mode: parsedMode, text: _cleanLastText, confirmations: _c } = parseSlashCommands(lastRawText, modeRef.current);
      // Mutate ref immediately so this run uses the new mode
      modeRef.current = parsedMode;
      setMode(parsedMode);

      const currentMode = parsedMode;
      const systemContent = currentMode.systemOverride ?? buildSystemPrompt();

      const apiMessages = [
        { role: "system", content: systemContent },
        ...messages.map((m, i) => {
          const isLast = i === messages.length - 1;
          const rawText = m.content
            .filter((c) => c.type === "text")
            .map((c) => (c.type === "text" ? c.text : ""))
            .join("");
          // Send original text — model sees the slash command and can acknowledge it
          const content =
            isLast && file
              ? `[Attached file: ${file.name}]\n\`\`\`\n${file.content}\n\`\`\`\n\n${rawText}`
              : rawText;
          return { role: m.role, content };
        }),
      ];

      const response = await fetch(`${LM_STUDIO_URL}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL_ID,
          messages: apiMessages,
          stream: true,
          temperature: TONE_TEMP[currentMode.tone],
          top_p: 0.95,
          max_tokens: LENGTH_TOKENS[currentMode.length],
          frequency_penalty: 0.3,
          extra_body: {
            thinking: THINK_CONFIG[currentMode.think],
          },
        }),
        signal: abortSignal,
      });

      if (!response.ok) throw new Error(`API error ${response.status}`);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No response body");

      let text = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const delta = JSON.parse(data)?.choices?.[0]?.delta?.content;
            if (delta) {
              text += delta;
              yield { content: [{ type: "text" as const, text }] };
            }
          } catch { /* skip */ }
        }
      }

      setAttachedFile(null);
    },
  }), []);

  const runtime = useLocalRuntime(adapter);

  return (
    <ChatContext.Provider value={{ sessionId, attachedFile, setAttachedFile, mode, setMode }}>
      <AssistantRuntimeProvider runtime={runtime}>
        {children}
      </AssistantRuntimeProvider>
    </ChatContext.Provider>
  );
}

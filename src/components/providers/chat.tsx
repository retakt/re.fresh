import { createContext, useContext, useMemo, useRef, useState } from "react";
import { AssistantRuntimeProvider, useLocalRuntime } from "@assistant-ui/react";
import type { ChatModelAdapter, ChatModelRunOptions } from "@assistant-ui/react";
import type { AttachedFile } from "@/pages/chat/page";

const LM_STUDIO_URL = import.meta.env.VITE_LM_STUDIO_URL ?? "https://chat-api.retakt.cc";
const MODEL_ID = "qwen2.5-3b-instruct";

// New UUID every page load — matches AI memory which also resets on refresh
const SESSION_ID = crypto.randomUUID();

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

  const adapter = useMemo((): ChatModelAdapter => ({
    async *run({ messages, abortSignal }: ChatModelRunOptions) {
      const file = attachedFileRef.current;
      const apiMessages = messages.map((m, i) => {
        const isLast = i === messages.length - 1;
        const textContent = m.content
          .filter((c) => c.type === "text")
          .map((c) => (c.type === "text" ? c.text : ""))
          .join("");
        const content = isLast && file
          ? `[Attached file: ${file.name}]\n\`\`\`\n${file.content}\n\`\`\`\n\n${textContent}`
          : textContent;
        return { role: m.role, content };
      });

      const response = await fetch(`${LM_STUDIO_URL}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL_ID,
          messages: apiMessages,
          stream: true,
          temperature: 0.6,
          top_p: 0.95,
          extra_body: { thinking: { type: "enabled", budget_tokens: 2048 } },
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
    <ChatContext.Provider value={{ sessionId, attachedFile, setAttachedFile }}>
      <AssistantRuntimeProvider runtime={runtime}>
        {children}
      </AssistantRuntimeProvider>
    </ChatContext.Provider>
  );
}

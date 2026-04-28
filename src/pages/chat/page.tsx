import { AssistantRuntimeProvider, useLocalRuntime } from "@assistant-ui/react";
import { Thread } from "@/components/thread-custom";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChatModelAdapter, ChatModelRunOptions } from "@assistant-ui/react";

const LM_STUDIO_URL = import.meta.env.VITE_LM_STUDIO_URL ?? "https://chat-api.retakt.cc";
const MODEL_ID = "qwen2.5-3b-instruct";

// ── Session ID — lives in sessionStorage, cleared on refresh ─────────────────
function getSessionId(): string {
  const key = "chatSessionId";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
}

// ── File attachment state shared via context ──────────────────────────────────
export type AttachedFile = { name: string; content: string };

export default function ChatPage() {
  const sessionId = useMemo(() => getSessionId(), []);
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const attachedFileRef = useRef<AttachedFile | null>(null);
  attachedFileRef.current = attachedFile;

  // Lock page scroll on desktop only
  useEffect(() => {
    if (window.innerWidth >= 768) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const adapter = useMemo((): ChatModelAdapter => ({
    async *run({ messages, abortSignal }: ChatModelRunOptions) {
      // Inject file content into the last user message if present
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
          // Qwen3 thinking mode — always on
          extra_body: { thinking: { type: "enabled", budget_tokens: 2048 } },
        }),
        signal: abortSignal,
      });

      if (!response.ok) {
        throw new Error(`API error ${response.status}: ${await response.text()}`);
      }

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
          } catch { /* skip malformed */ }
        }
      }

      // Clear file after sending
      setAttachedFile(null);
    },
  }), []);

  const runtime = useLocalRuntime(adapter);

  return (
    <div
      className="-mx-3 sm:-mx-4 lg:-mx-8 md:-mb-14 flex flex-col"
      style={{ height: "calc(100vh - 3.5rem - 30px)" }}
    >
      <AssistantRuntimeProvider runtime={runtime}>
        <Thread
          sessionId={sessionId}
          attachedFile={attachedFile}
          onAttachFile={setAttachedFile}
          onRemoveFile={() => setAttachedFile(null)}
        />
      </AssistantRuntimeProvider>
    </div>
  );
}

import { Thread } from "@/components/thread-custom";
import { useChatContext } from "@/components/providers/chat";
import { PageMeta } from "@/components/seo/page-meta";

export type AttachedFile =
  | { type: "text"; name: string; content: string }
  | { type: "image"; name: string; base64: string; mimeType: string }
  | { type: "audio"; name: string; base64: string; mimeType: string };

export default function ChatPage() {
  const { sessionId, attachedFile, setAttachedFile } = useChatContext();

  return (
    <div
      data-chat-page="true"
      className="flex flex-col flex-1 min-h-0 h-full w-full overflow-hidden"
    >
      <PageMeta
        title="Chat_re.Takt"
        description="Ask anything. An AI assistant built into re.Takt for creative and technical questions."
        url="https://retakt.com/chat"
        type="website"
      />
      <Thread
        sessionId={sessionId}
        attachedFile={attachedFile}
        onAttachFile={setAttachedFile}
        onRemoveFile={() => setAttachedFile(null)}
      />
    </div>
  );
}

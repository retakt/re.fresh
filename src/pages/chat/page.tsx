import { useEffect } from "react";
import { Thread } from "@/components/thread-custom";
import { useChatContext } from "@/components/providers/chat";

export type AttachedFile =
  | { type: "text"; name: string; content: string }
  | { type: "image"; name: string; base64: string; mimeType: string }
  | { type: "audio"; name: string; base64: string; mimeType: string };

export default function ChatPage() {
  const { sessionId, attachedFile, setAttachedFile } = useChatContext();

  // Lock page scroll on desktop only
  useEffect(() => {
    if (window.innerWidth >= 768) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="-mx-3 sm:-mx-4 lg:-mx-8 md:-mb-14 flex flex-col"
      style={{ height: "calc(100vh - 3.5rem - 30px)" }}
    >
      <Thread
        sessionId={sessionId}
        attachedFile={attachedFile}
        onAttachFile={setAttachedFile}
        onRemoveFile={() => setAttachedFile(null)}
      />
    </div>
  );
}

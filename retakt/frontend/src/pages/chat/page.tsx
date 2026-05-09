import { Thread } from "@/components/thread-custom";
import { useChatContext } from "@/components/providers/chat";
import { PageMeta } from "@/components/seo/page-meta";
import { AnimatedGrainyBg } from "@/components/ui/animated-grainy-bg";

export type AttachedFile =
  | { type: "text"; name: string; content: string }
  | { type: "image"; name: string; base64: string; mimeType: string }
  | { type: "audio"; name: string; base64: string; mimeType: string };

export default function ChatPage() {
  const { sessionId, attachedFile, setAttachedFile } = useChatContext();

  return (
    <div
      data-chat-page="true"
      className="flex flex-col flex-1 min-h-0 max-h-full w-full overflow-hidden relative"
    >
      <PageMeta
        title="Chat_re.Takt"
        description="Ask anything. An AI assistant built into re.Takt for creative and technical questions."
        url="https://retakt.com/chat"
        type="website"
      />
      
      {/* Animated Grainy Background - Chat specific with pulse animation */}
      <AnimatedGrainyBg
        animationType="pulse"
        grainType="paper"
        grainIntensity={30}
        grainSize={100}
        colors={["#000000", "#1a1a1a", "#0d0d0d", "#151515"]}
        speed={0.8}
        darkMode={true}
        position="absolute"
        zIndex={0}
        size="full"
        grainBlendMode="overlay"
        className="pointer-events-none"
      />
      
      {/* Chat Content */}
      <div className="relative z-10 flex flex-col flex-1 min-h-0 max-h-full w-full">
        <Thread
          sessionId={sessionId}
          attachedFile={attachedFile}
          onAttachFile={setAttachedFile}
          onRemoveFile={() => setAttachedFile(null)}
        />
      </div>
    </div>
  );
}

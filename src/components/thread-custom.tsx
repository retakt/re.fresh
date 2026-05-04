import { MarkdownText } from "@/components/markdown-text";
import { Reasoning, ReasoningGroup } from "@/components/reasoning";
import { ToolFallback } from "@/components/tool-fallback";
import { TooltipIconButton } from "@/components/tooltip-icon-button";
import { PulseLoader } from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import { EncryptedText } from "@/components/ui/encrypted-text";
import { GooeyInput } from "@/components/ui/gooey-input";
import { cn } from "@/lib/utils";
import {
  ActionBarPrimitive,
  AuiIf,
  BranchPickerPrimitive,
  ComposerPrimitive,
  ErrorPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useAui,
  useAuiState,
} from "@assistant-ui/react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  MicIcon,
  MicOffIcon,
  PaperclipIcon,
  BrainIcon,
  PencilIcon,
  RefreshCwIcon,
  SquareIcon,
  XIcon,
} from "lucide-react";
import type { FC } from "react";
import { useEffect, useRef, useState } from "react";
import type { AttachedFile } from "@/pages/chat/page";
import { CanvasText } from "@/components/ui/canvas-text";

// ── Minimal Web Audio tones for mic on/off ────────────────────────────────────
function playMicTone(type: "on" | "off") {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    if (type === "on") {
      // Two quick ascending tones
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.07);
    } else {
      // Two quick descending tones
      osc.frequency.setValueAtTime(1100, ctx.currentTime);
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.07);
    }
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.18);
    osc.onended = () => ctx.close();
  } catch { /* AudioContext not available */ }
}
// ─────────────────────────────────────────────────────────────────────────────

// ── Customize these ───────────────────────────────────────────────────────────
const WELCOME_TITLE = "Good day!";
const WELCOME_SUBTITLE = (
  <>
    Whatever you chat here will always be{" "}
    <CanvasText
      text="temporary!"
      className="text-2xl sm:text-2xl font-bold align-middle"
      backgroundClassName="bg-[#D03D56]"
      colors={[
        "#FF6B8A",
        "#F0476A",
        "#E8325A",
        "#D03D56",
        "#C32148",
        "#B5406C",
        "#FF8FA3",
        "#F06080",
        "#E84070",
        "#FF6B8A",
      ]}
      lineGap={1}
      animationDuration={15}
    />
    <br />
    Don't refresh before you're done.
  </>
);
// ─────────────────────────────────────────────────────────────────────────────

// Accepted text file types for the file picker
const ACCEPTED_TEXT =
  ".txt,.md,.json,.csv,.js,.ts,.tsx,.jsx,.py,.html,.css,.xml,.yaml,.yml,.env,.sh,.sql";

// Accepted image types
const ACCEPTED_IMAGE = ".jpg,.jpeg,.png,.gif,.webp";

// Accepted audio types
const ACCEPTED_AUDIO = ".mp3,.wav,.ogg,.m4a,.webm,.aac";

const ACCEPTED = `${ACCEPTED_TEXT},${ACCEPTED_IMAGE},${ACCEPTED_AUDIO}`;

const IMAGE_MIME: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
  gif: "image/gif", webp: "image/webp",
};

const AUDIO_MIME: Record<string, string> = {
  mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg",
  m4a: "audio/mp4", webm: "audio/webm", aac: "audio/aac",
};

// ── Typography tokens — change here, applies everywhere ──────────────────────
// Desktop: 14px / 1.55 line-height  |  Mobile: 14px / 1.55
// Composer input: 16px on mobile (prevents iOS zoom), 14px on desktop
const PROSE_SIZE = "text-[14px] sm:text-[14px]";
const PROSE_LEADING = "leading-[1.55]";
const COMPOSER_INPUT_SIZE = "text-[16px] sm:text-[14px]";
const COMPOSER_INPUT_LEADING = "leading-[1.3]";
const USER_BUBBLE_SIZE = "text-[15px] sm:text-[14px]";
const USER_BUBBLE_LEADING = "leading-[1.4]";
// ─────────────────────────────────────────────────────────────────────────────

interface ThreadProps {
  sessionId: string;
  attachedFile: AttachedFile | null;
  onAttachFile: (file: AttachedFile) => void;
  onRemoveFile: () => void;
}

export const Thread: FC<ThreadProps> = ({
  sessionId,
  attachedFile,
  onAttachFile,
  onRemoveFile,
}) => {
  // Shared file processor — used by DragOverlay and Composer
  const processFile = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const isImage = ext in IMAGE_MIME || file.type.startsWith("image/");
    const isAudio = ext in AUDIO_MIME || file.type.startsWith("audio/");
    const reader = new FileReader();
    if (isImage) {
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        const base64 = dataUrl.split(",")[1] ?? "";
        onAttachFile({ type: "image", name: file.name, base64, mimeType: IMAGE_MIME[ext] ?? file.type });
      };
      reader.readAsDataURL(file);
    } else if (isAudio) {
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        const base64 = dataUrl.split(",")[1] ?? "";
        onAttachFile({ type: "audio", name: file.name, base64, mimeType: AUDIO_MIME[ext] ?? file.type });
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = (ev) => {
        onAttachFile({ type: "text", name: file.name, content: ev.target?.result as string });
      };
      reader.readAsText(file);
    }
  };

  return (
    <>
      <DragOverlay onFile={processFile} />
      <ThreadPrimitive.Root
      className="aui-root aui-thread-root @container flex h-full flex-col bg-background"
      style={{
        ["--thread-max-width" as string]: "44rem",
        ["--composer-radius" as string]: "24px",
        ["--composer-padding" as string]: "10px",
      }}
    >
      <ThreadPrimitive.Viewport
        turnAnchor="top"
        data-slot="aui_thread-viewport"
        className="chat-scrollbar relative flex flex-1 flex-col overflow-x-hidden overflow-y-auto scroll-smooth"
      >
        <div className="mx-auto flex w-full max-w-(--thread-max-width) flex-1 flex-col px-4 pt-2 sm:pt-4">
          <AuiIf condition={(s) => s.thread.isEmpty}>
            <ThreadWelcome sessionId={sessionId} />
          </AuiIf>

          <div
            data-slot="aui_message-group"
            className="mb-10 flex flex-col gap-y-8 empty:hidden"
          >
            <ThreadPrimitive.Messages>{() => <ThreadMessage />}</ThreadPrimitive.Messages>
          </div>

          <ThreadPrimitive.ViewportFooter
            data-slot="aui_thread-viewport-footer"
            className="sticky bottom-0 mt-auto flex flex-col gap-2 overflow-visible rounded-t-(--composer-radius) bg-background pb-6 md:pb-12"
          >
            <ThreadScrollToBottom />
            <Composer
              attachedFile={attachedFile}
              onAttachFile={onAttachFile}
              onRemoveFile={onRemoveFile}
              processFile={processFile}
            />
          </ThreadPrimitive.ViewportFooter>
        </div>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
    </>
  );
};

// ── Full-page drag-and-drop overlay ──────────────────────────────────────────
// Triggers when a file is dragged anywhere over the browser window.
const DragOverlay: FC<{ onFile: (file: File) => void }> = ({ onFile }) => {
  const [visible, setVisible] = useState(false);
  const counterRef = useRef(0); // track nested dragenter/dragleave pairs

  useEffect(() => {
    const onDragEnter = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes("Files")) return;
      counterRef.current += 1;
      setVisible(true);
    };
    const onDragLeave = () => {
      counterRef.current -= 1;
      if (counterRef.current <= 0) {
        counterRef.current = 0;
        setVisible(false);
      }
    };
    const onDrop = () => {
      counterRef.current = 0;
      setVisible(false);
    };
    document.addEventListener("dragenter", onDragEnter);
    document.addEventListener("dragleave", onDragLeave);
    document.addEventListener("drop", onDrop);
    return () => {
      document.removeEventListener("dragenter", onDragEnter);
      document.removeEventListener("dragleave", onDragLeave);
      document.removeEventListener("drop", onDrop);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        counterRef.current = 0;
        setVisible(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onFile(file);
      }}
    >
      <PaperclipIcon size={36} style={{ color: "#D03D56" }} className="mb-4" />
      <p className="font-semibold text-2xl text-foreground">Drop anything</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Don't worry! Nothing is stored.   
      </p>
    </div>
  );
};

// ── Message router ────────────────────────────────────────────────────────────

const ThreadMessage: FC = () => {
  const role = useAuiState((s) => s.message.role);
  const isEditing = useAuiState((s) => s.message.composer.isEditing);
  if (isEditing) return <EditComposer />;
  if (role === "user") return <UserMessage />;
  return <AssistantMessage />;
};

// ── Scroll to bottom ──────────────────────────────────────────────────────────

const ThreadScrollToBottom: FC = () => (
  <ThreadPrimitive.ScrollToBottom asChild>
    <TooltipIconButton
      tooltip="Scroll to bottom"
      variant="outline"
      className="absolute -top-12 z-10 self-center rounded-full p-4 disabled:invisible hover:text-primary hover:bg-primary/10 hover:border-primary/30"
    >
      <ArrowDownIcon />
    </TooltipIconButton>
  </ThreadPrimitive.ScrollToBottom>
);

// ── Welcome screen ────────────────────────────────────────────────────────────

const ThreadWelcome: FC<{ sessionId: string }> = ({ sessionId }) => (
  <div
    data-slot="aui_thread-welcome"
    className="my-auto flex grow flex-col items-center justify-center pt-4"
  >
    <div className="w-full px-4">
      <div className="mb-4">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
          <BrainIcon size={20} className="text-primary" />
        </div>
      </div>
      <h1 className="fade-in slide-in-from-bottom-1 animate-in fill-mode-both font-semibold text-2xl duration-200">
        {WELCOME_TITLE}
      </h1>
      <p className="fade-in slide-in-from-bottom-1 animate-in fill-mode-both text-muted-foreground sm:text-xl text-sm delay-75 duration-100">
        {WELCOME_SUBTITLE}
      </p>
      <p className="mt-4 font-mono text-[12px] text-muted-foreground/40">
        Uncensored session: {sessionId.slice(0, 8)}
      </p>
      <div className="mt-2 space-y-1">
        {[
          { cmd: "/dweb", desc: "disable web search" },
          { cmd: "/eweb", desc: "enable web search (default)" },
          { cmd: "/auto", desc: "ai decides when to think (current)" },
          { cmd: "/think", desc: "all parameters unlocked" },
          { cmd: "/nothink", desc: "rapid-fire responses" },
          { cmd: "/help", desc: "details (extra tweaks)" },
        ].map(({ cmd, desc }) => (
          <p key={cmd} className="font-mono text-[11px] font-medium text-muted-foreground/55 flex items-baseline gap-1.5">
            <span className="text-primary">•</span>
            <span>{cmd}</span>
            <span className="font-normal opacity-80">— {desc}</span>
          </p>
        ))}
      </div>
    </div>
  </div>
);

// ── Composer ──────────────────────────────────────────────────────────────────

interface ComposerProps {
  attachedFile: AttachedFile | null;
  onAttachFile: (file: AttachedFile) => void;
  onRemoveFile: () => void;
  processFile: (file: File) => void;
}

const Composer: FC<ComposerProps> = ({ attachedFile, onAttachFile, onRemoveFile, processFile }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const aui = useAui();
  const [isDragOver, setIsDragOver] = useState(false);

  // ── Message history (↑/↓ navigation) ───────────────────────────────────────
  const historyRef = useRef<string[]>([]);
  const historyIdxRef = useRef<number>(-1); // -1 = not navigating
  const savedDraftRef = useRef<string>(""); // saves current draft when navigating up

  const navigateHistory = (dir: "up" | "down") => {
    const history = historyRef.current;
    if (history.length === 0) return;

    const currentText = aui.composer().getState().text;

    if (dir === "up") {
      if (historyIdxRef.current === -1) {
        // Save current draft before navigating
        savedDraftRef.current = currentText;
        historyIdxRef.current = history.length - 1;
      } else if (historyIdxRef.current > 0) {
        historyIdxRef.current -= 1;
      } else {
        return; // already at oldest
      }
      aui.composer().setText(history[historyIdxRef.current]);
    } else {
      if (historyIdxRef.current === -1) return;
      if (historyIdxRef.current < history.length - 1) {
        historyIdxRef.current += 1;
        aui.composer().setText(history[historyIdxRef.current]);
      } else {
        // Back to draft
        historyIdxRef.current = -1;
        aui.composer().setText(savedDraftRef.current);
      }
    }
  };

  // Track sends to build history
  const composerText = useAuiState((s) => s.composer.text);
  const prevTextRef = useRef("");
  prevTextRef.current = composerText;

  const handleSend = () => {
    const text = prevTextRef.current.trim();
    if (text) {
      // Avoid duplicate consecutive entries
      const history = historyRef.current;
      if (history[history.length - 1] !== text) {
        historyRef.current = [...history, text].slice(-50); // keep last 50
      }
    }
    historyIdxRef.current = -1;
    savedDraftRef.current = "";
  };
  // ───────────────────────────────────────────────────────────────────────────

  // Play sound + track dictation state for instant reset on send
  const isDictating = useAuiState((s) => s.composer.dictation != null);
  const prevDictatingRef = useRef(false);
  useEffect(() => {
    if (isDictating && !prevDictatingRef.current) playMicTone("on");
    if (!isDictating && prevDictatingRef.current) playMicTone("off");
    prevDictatingRef.current = isDictating;
  }, [isDictating]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
    e.target.value = "";
  };

  // Handle paste — images from clipboard
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;

        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string;
          const base64 = dataUrl.split(",")[1] ?? "";
          onAttachFile({
            type: "image",
            name: `pasted-${Date.now()}.png`,
            base64,
            mimeType: item.type,
          });
        };
        reader.readAsDataURL(file);
        return;
      }
    }
  };

  return (
    <ComposerPrimitive.Root
      data-slot="aui_composer-root"
      className="relative flex w-full flex-col"
    >
      <div
        className={cn(
          "flex w-full flex-col rounded-(--composer-radius) border border-primary/40 bg-background transition-all focus-within:border-primary/90 focus-within:ring-8 focus-within:ring-primary/20 focus-within:shadow-[0_0_60px_20px_hsl(var(--primary)/0.4)] dark:focus-within:shadow-[0_0_48px_16px_hsl(var(--primary)/0.25)]",
          isDragOver && "border-primary/60 ring-2 ring-primary/20",
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) processFile(file);
        }}
      >

        {/* Attached file chip */}
        {attachedFile && (
          <div className="mx-3 mt-2.5 flex w-fit max-w-full items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-xs text-primary">
            {attachedFile.type === "image" ? (
              <img
                src={`data:${attachedFile.mimeType};base64,${attachedFile.base64}`}
                alt={attachedFile.name}
                className="size-6 rounded object-cover shrink-0"
              />
            ) : attachedFile.type === "audio" ? (
              <MicIcon size={11} className="shrink-0" />
            ) : (
              <PaperclipIcon size={11} className="shrink-0" />
            )}
            <span className="max-w-[200px] truncate">{attachedFile.name}</span>
            <button
              onClick={onRemoveFile}
              className="ml-0.5 shrink-0 rounded p-0.5 hover:bg-primary/20"
              aria-label="Remove file"
            >
              <XIcon size={10} />
            </button>
          </div>
        )}

        {/* Live dictation transcript preview */}
        <AuiIf condition={(s) => s.composer.dictation != null}>
          <div className="mx-3 mt-2 flex items-center gap-1.5 text-xs text-muted-foreground italic">
            <MicIcon size={11} className="shrink-0 text-primary animate-pulse" />
            <ComposerPrimitive.DictationTranscript className="line-clamp-2" />
          </div>
        </AuiIf>

        {/* Input row */}
        <div className="flex items-center gap-2 px-2 py-2">
          {/* File picker */}
          <div className="shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED}
              className="hidden"
              onChange={handleFileChange}
            />
            <TooltipIconButton
              tooltip="Attach file or image"
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
              onClick={() => fileInputRef.current?.click()}
            >
              <PaperclipIcon className="size-4" />
            </TooltipIconButton>
          </div>

          {/* Textarea */}
          <div className="relative flex-1">
            <ComposerPrimitive.Input
              placeholder=""
              className={cn(
                "max-h-40 min-h-[2rem] w-full resize-none bg-transparent px-0 pt-4 pb-2 outline-none caret-primary terminal-cursor text-base",
                COMPOSER_INPUT_LEADING,
              )}
              style={{
                caretColor: 'var(--primary)',
                fontSize: '15px',
              }}
              rows={1}
              autoFocus
              aria-label="Message input"
              onPaste={handlePaste}
              onKeyDown={(e) => {
                const ta = e.target as HTMLTextAreaElement;
                // ↑ at start of empty or single-line input → history back
                if (e.key === "ArrowUp" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                  if (ta.selectionStart === 0 && ta.selectionEnd === 0) {
                    e.preventDefault();
                    navigateHistory("up");
                    return;
                  }
                }
                // ↓ at end of input → history forward
                if (e.key === "ArrowDown" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                  if (ta.selectionStart === ta.value.length && ta.selectionEnd === ta.value.length) {
                    e.preventDefault();
                    navigateHistory("down");
                    return;
                  }
                }
                // Enter sends — record history
                if (e.key === "Enter" && !e.shiftKey) {
                  handleSend();
                  if (window.innerWidth < 768) {
                    setTimeout(() => ta.blur(), 50);
                  }
                }
              }}
            />
{/* Custom placeholder with encrypted text */}
            {!composerText && (
              <div className="pointer-events-none absolute inset-0 flex items-center">
                <span className="text-muted-foreground/80 text-[15px] leading-[1.3]">
                  <span className="mr-[2px]">
                    Go ahead!
                  </span>
                  <EncryptedText
                    text="[I'm Uncensored]"
                    className="inline opacity-50"
                    revealDelayMs={40}
                    flipDelayMs={30}
                  />
                  
                </span>
              </div>
            )}
          </div>

          {/* Voice Mode Button */}
          <div className="shrink-0">
            <AuiIf condition={(s) => s.composer.dictation == null}>
              <ComposerPrimitive.Dictate asChild>
                <TooltipIconButton
                  tooltip="Start voice input"
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
                >
                  <MicIcon className="size-4" />
                </TooltipIconButton>
              </ComposerPrimitive.Dictate>
            </AuiIf>
            <AuiIf condition={(s) => s.composer.dictation != null}>
              <ComposerPrimitive.StopDictation asChild>
                <TooltipIconButton
                  tooltip="Stop voice input"
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-full text-primary hover:text-primary hover:bg-primary/10 animate-pulse [filter:drop-shadow(0_0_6px_hsl(var(--primary)/0.8))]"
                >
                  <MicOffIcon className="size-4" />
                </TooltipIconButton>
              </ComposerPrimitive.StopDictation>
            </AuiIf>
          </div>

          {/* Send / Stop */}
          <div className="shrink-0">
            <AuiIf condition={(s) => !s.thread.isRunning}>
              <ComposerPrimitive.Send asChild>
                <TooltipIconButton
                  tooltip="Send message"
                  side="bottom"
                  type="button"
                  variant="default"
                  size="icon"
                  className="size-8 rounded-full"
                  onClick={handleSend}
                >
                  <ArrowUpIcon className="size-4" />
                </TooltipIconButton>
              </ComposerPrimitive.Send>
            </AuiIf>
            <AuiIf condition={(s) => s.thread.isRunning}>
              <ComposerPrimitive.Cancel asChild>
                <Button
                  type="button"
                  variant="default"
                  size="icon"
                  className="size-8 rounded-full"
                >
                  <SquareIcon className="size-3 fill-current" />
                </Button>
              </ComposerPrimitive.Cancel>
            </AuiIf>
          </div>
        </div>
      </div>
    </ComposerPrimitive.Root>
  );
};

// ── Error display ─────────────────────────────────────────────────────────────

const MessageError: FC = () => (
  <MessagePrimitive.Error>
    <ErrorPrimitive.Root className="mt-2 rounded-md border border-destructive bg-destructive/10 p-3 text-destructive text-sm">
      <ErrorPrimitive.Message className="line-clamp-2" />
    </ErrorPrimitive.Root>
  </MessagePrimitive.Error>
);

// ── Assistant message ─────────────────────────────────────────────────────────

/**
 * Shows a pulse loader while the AI is running but hasn't emitted any text yet
 * (the "blank thinking" moment before the first token arrives).
 */
const AssistantMessage: FC = () => {
  const ACTION_BAR_HEIGHT = "-mb-7.5 min-h-7.5 pt-1.5";
  const isRunning = useAuiState((s) => s.message.status?.type === "running");

  return (
    <MessagePrimitive.Root
      data-slot="aui_assistant-message-root"
      data-role="assistant"
      className="fade-in slide-in-from-bottom-1 relative animate-in duration-150"
    >
      <div
        data-slot="aui_assistant-message-content"
        className="wrap-break-word px-2 text-foreground"
      >
        {isRunning && <div className="py-1"><PulseLoader /></div>}
        <div
          className={cn(
            "prose max-w-none",
            PROSE_SIZE,
            PROSE_LEADING,
            "[&_p]:my-2 [&_p]:leading-[1.55]",
            "[&_li]:leading-[1.55]",
            "[&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm",
            "[&>*:empty]:hidden [&_ul:empty]:hidden [&_li:empty]:hidden",
          )}
        >
          <MessagePrimitive.Parts
            components={{
              Text: MarkdownText,
              Reasoning,
              ReasoningGroup,
              tools: { Fallback: ToolFallback },
            }}
          />
        </div>
        <MessageError />
      </div>

      <div
        data-slot="aui_assistant-message-footer"
        className={cn("ms-2 flex items-center", ACTION_BAR_HEIGHT)}
      >
        <BranchPicker />
        <AssistantActionBar />
      </div>
    </MessagePrimitive.Root>
  );
};

const AssistantActionBar: FC = () => (
  <ActionBarPrimitive.Root
    hideWhenRunning
    autohide="not-last"
    className="-ms-1 flex gap-1 text-muted-foreground"
  >
    <ActionBarPrimitive.Copy asChild>
      <TooltipIconButton tooltip="Copy" className="hover:text-primary hover:bg-primary/10">
        <AuiIf condition={(s) => s.message.isCopied}>
          <CheckIcon />
        </AuiIf>
        <AuiIf condition={(s) => !s.message.isCopied}>
          <CopyIcon />
        </AuiIf>
      </TooltipIconButton>
    </ActionBarPrimitive.Copy>
    <ActionBarPrimitive.Reload asChild>
      <TooltipIconButton tooltip="Regenerate" className="hover:text-primary hover:bg-primary/10">
        <RefreshCwIcon />
      </TooltipIconButton>
    </ActionBarPrimitive.Reload>
  </ActionBarPrimitive.Root>
);

// ── User message ──────────────────────────────────────────────────────────────

const UserMessage: FC = () => (
  <MessagePrimitive.Root
    data-slot="aui_user-message-root"
    data-role="user"
    className="fade-in slide-in-from-bottom-1 grid animate-in auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] content-start gap-y-2 px-2 duration-150 [&:where(>*)]:col-start-2"
  >
    <div className="relative col-start-2 min-w-0">
      <div
        className={cn(
          "wrap-break-word peer rounded-2xl bg-muted px-4 py-2.5 text-foreground empty:hidden",
          USER_BUBBLE_SIZE,
          USER_BUBBLE_LEADING,
        )}
      >
        <MessagePrimitive.Parts />
      </div>
      <div className="absolute start-0 top-1/2 -translate-x-full -translate-y-1/2 pe-2 peer-empty:hidden">
        <UserActionBar />
      </div>
    </div>
    <BranchPicker className="col-span-full col-start-1 row-start-3 -me-1 justify-end" />
  </MessagePrimitive.Root>
);

const UserActionBar: FC = () => (
  <ActionBarPrimitive.Root
    hideWhenRunning
    autohide="not-last"
    className="flex flex-col items-end"
  >
    <ActionBarPrimitive.Edit asChild>
      <TooltipIconButton tooltip="Edit" className="p-4 hover:text-primary hover:bg-primary/10">
        <PencilIcon />
      </TooltipIconButton>
    </ActionBarPrimitive.Edit>
  </ActionBarPrimitive.Root>
);

// ── Edit composer ─────────────────────────────────────────────────────────────

const EditComposer: FC = () => (
  <MessagePrimitive.Root
    data-slot="aui_edit-composer-wrapper"
    className="flex flex-col px-2"
  >
    <ComposerPrimitive.Root className="ms-auto flex w-full max-w-[85%] flex-col rounded-2xl bg-muted">
      <ComposerPrimitive.Input
        className="min-h-14 w-full resize-none bg-transparent p-4 text-foreground text-sm outline-none"
        autoFocus
      />
      <div className="mx-3 mb-3 flex items-center gap-2 self-end">
        <ComposerPrimitive.Cancel asChild>
          <Button variant="ghost" size="sm">Cancel</Button>
        </ComposerPrimitive.Cancel>
        <ComposerPrimitive.Send asChild>
          <Button size="sm">Send</Button>
        </ComposerPrimitive.Send>
      </div>
    </ComposerPrimitive.Root>
  </MessagePrimitive.Root>
);

// ── Branch picker ─────────────────────────────────────────────────────────────

const BranchPicker: FC<BranchPickerPrimitive.Root.Props> = ({ className, ...rest }) => (
  <BranchPickerPrimitive.Root
    hideWhenSingleBranch
    className={cn(
      "-ms-2 me-2 inline-flex items-center text-muted-foreground text-xs",
      className,
    )}
    {...rest}
  >
    <BranchPickerPrimitive.Previous asChild>
      <TooltipIconButton tooltip="Previous" className="hover:text-primary hover:bg-primary/10">
        <ChevronLeftIcon />
      </TooltipIconButton>
    </BranchPickerPrimitive.Previous>
    <span className="font-medium">
      <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
    </span>
    <BranchPickerPrimitive.Next asChild>
      <TooltipIconButton tooltip="Next" className="hover:text-primary hover:bg-primary/10">
        <ChevronRightIcon />
      </TooltipIconButton>
    </BranchPickerPrimitive.Next>
  </BranchPickerPrimitive.Root>
);

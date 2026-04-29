import { MarkdownText } from "@/components/markdown-text";
import { Reasoning, ReasoningGroup } from "@/components/reasoning";
import { ToolFallback } from "@/components/tool-fallback";
import { TooltipIconButton } from "@/components/tooltip-icon-button";
import { PulseLoader } from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ActionBarPrimitive,
  AuiIf,
  BranchPickerPrimitive,
  ComposerPrimitive,
  ErrorPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
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
  PencilIcon,
  RefreshCwIcon,
  SparklesIcon,
  SquareIcon,
  XIcon,
} from "lucide-react";
import type { FC } from "react";
import { useEffect, useRef } from "react";
import type { AttachedFile } from "@/pages/chat/page";

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
    Whatever you chat here will always be <strong>temporary</strong>!<br />
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
const PROSE_SIZE = "text-[14px]";
const PROSE_LEADING = "leading-[1.55]";
const COMPOSER_INPUT_SIZE = "text-[16px] sm:text-[14px]";
const COMPOSER_INPUT_LEADING = "leading-[1.3]";
const USER_BUBBLE_SIZE = "text-[14px]";
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
  return (
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
        <div className="mx-auto flex w-full max-w-(--thread-max-width) flex-1 flex-col px-4 pt-4">
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
            />
          </ThreadPrimitive.ViewportFooter>
        </div>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
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
      className="absolute -top-12 z-10 self-center rounded-full p-4 disabled:invisible"
    >
      <ArrowDownIcon />
    </TooltipIconButton>
  </ThreadPrimitive.ScrollToBottom>
);

// ── Welcome screen ────────────────────────────────────────────────────────────

const ThreadWelcome: FC<{ sessionId: string }> = ({ sessionId }) => (
  <div
    data-slot="aui_thread-welcome"
    className="my-auto flex grow flex-col items-center justify-center"
  >
    <div className="w-full px-4">
      <div className="mb-4">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
          <SparklesIcon size={20} className="text-primary" />
        </div>
      </div>
      <h1 className="fade-in slide-in-from-bottom-1 animate-in fill-mode-both font-semibold text-2xl duration-200">
        {WELCOME_TITLE}
      </h1>
      <p className="fade-in slide-in-from-bottom-1 animate-in fill-mode-both text-muted-foreground sm:text-xl text-sm delay-75 duration-200">
        {WELCOME_SUBTITLE}
      </p>
      <p className="mt-3 font-mono text-[10px] text-muted-foreground/40">
        session: {sessionId.slice(0, 8)}
      </p>
      <div className="mt-16 space-y-1">
        {[
          { cmd: "/think", desc: "all parameters unlocked" },
          { cmd: "/auto", desc: "auto decides when to think (current)" },
          { cmd: "/nothink", desc: "rapid-fire responses" },
          { cmd: "/help", desc: "temp/top_k (extra tweaks)" },
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
}

const Composer: FC<ComposerProps> = ({ attachedFile, onAttachFile, onRemoveFile }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const isImage = ext in IMAGE_MIME;
    const isAudio = ext in AUDIO_MIME;

    const reader = new FileReader();

    if (isImage) {
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        const base64 = dataUrl.split(",")[1] ?? "";
        onAttachFile({ type: "image", name: file.name, base64, mimeType: IMAGE_MIME[ext] });
      };
      reader.readAsDataURL(file);
    } else if (isAudio) {
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        const base64 = dataUrl.split(",")[1] ?? "";
        onAttachFile({ type: "audio", name: file.name, base64, mimeType: AUDIO_MIME[ext] });
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        onAttachFile({ type: "text", name: file.name, content });
      };
      reader.readAsText(file);
    }

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
      <div className="flex w-full flex-col rounded-(--composer-radius) border bg-background transition-shadow focus-within:border-ring/75 focus-within:ring-2 focus-within:ring-ring/20">

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
        <div className="flex items-end gap-1 px-2 py-2">
          {/* File picker */}
          <div className="shrink-0 self-end pb-0.5">
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
              className="size-8 rounded-full text-muted-foreground hover:text-foreground"
              onClick={() => fileInputRef.current?.click()}
            >
              <PaperclipIcon className="size-4" />
            </TooltipIconButton>
          </div>

          {/* Textarea */}
          <ComposerPrimitive.Input
            placeholder="Send a message…"
            className={cn(
              "max-h-40 min-h-[2rem] flex-1 resize-none bg-transparent py-1.5 outline-none placeholder:text-muted-foreground/80",
              COMPOSER_INPUT_SIZE,
              COMPOSER_INPUT_LEADING,
            )}
            rows={1}
            autoFocus
            aria-label="Message input"
            onPaste={handlePaste}
            onKeyDown={(e) => {
              // On mobile, blur after Enter so the keyboard dismisses
              if (e.key === "Enter" && !e.shiftKey && window.innerWidth < 768) {
                setTimeout(() => (e.target as HTMLTextAreaElement).blur(), 50);
              }
            }}
          />

          {/* Mic — toggles dictation, right before send */}
          <div className="shrink-0 self-end pb-0.5">
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
          <div className="shrink-0 self-end pb-0.5">
            <AuiIf condition={(s) => !s.thread.isRunning}>
              <ComposerPrimitive.Send asChild>
                <TooltipIconButton
                  tooltip="Send message"
                  side="bottom"
                  type="button"
                  variant="default"
                  size="icon"
                  className="size-8 rounded-full"
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
const AssistantThinkingLoader: FC = () => {
  const show = useAuiState((s) => {
    if (s.message.status?.type !== "running") return false;
    // Hide once there's any text content
    const hasText = s.message.parts.some((p) => p.type === "text" && (p as { text?: string }).text);
    return !hasText;
  });
  if (!show) return null;
  return (
    <div className="px-2 py-1 text-muted-foreground">
      <PulseLoader />
    </div>
  );
};

const AssistantMessage: FC = () => {
  // ACTION_BAR_PT drives the footer padding; -mb compensates so message spacing stays consistent
  const ACTION_BAR_HEIGHT = "-mb-7.5 min-h-7.5 pt-1.5";

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
        <AssistantThinkingLoader />
        <div
          className={cn(
            "prose max-w-none",
            PROSE_SIZE,
            PROSE_LEADING,
            // Prose element overrides to respect our token sizes
            "[&_p]:my-2 [&_p]:leading-[1.55]",
            "[&_li]:leading-[1.55]",
            "[&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm",
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
      <TooltipIconButton tooltip="Copy">
        <AuiIf condition={(s) => s.message.isCopied}>
          <CheckIcon />
        </AuiIf>
        <AuiIf condition={(s) => !s.message.isCopied}>
          <CopyIcon />
        </AuiIf>
      </TooltipIconButton>
    </ActionBarPrimitive.Copy>
    <ActionBarPrimitive.Reload asChild>
      <TooltipIconButton tooltip="Regenerate">
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
      <TooltipIconButton tooltip="Edit" className="p-4">
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
          <Button size="sm">Update</Button>
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
      <TooltipIconButton tooltip="Previous">
        <ChevronLeftIcon />
      </TooltipIconButton>
    </BranchPickerPrimitive.Previous>
    <span className="font-medium">
      <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
    </span>
    <BranchPickerPrimitive.Next asChild>
      <TooltipIconButton tooltip="Next">
        <ChevronRightIcon />
      </TooltipIconButton>
    </BranchPickerPrimitive.Next>
  </BranchPickerPrimitive.Root>
);

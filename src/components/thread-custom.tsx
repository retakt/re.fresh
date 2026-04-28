import { MarkdownText } from "@/components/markdown-text";
import { ToolFallback } from "@/components/tool-fallback";
import { TooltipIconButton } from "@/components/tooltip-icon-button";
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
  PaperclipIcon,
  PencilIcon,
  RefreshCwIcon,
  SparklesIcon,
  SquareIcon,
  XIcon,
} from "lucide-react";
import type { FC } from "react";
import { useRef } from "react";
import type { AttachedFile } from "@/pages/chat/page";

// ── Customize these ───────────────────────────────────────────────────────────
const WELCOME_TITLE = "Good day!";
const WELCOME_SUBTITLE = (
  <>
    Whatever you chat here will always be <strong>temporary</strong>!<br />
    Don't refresh before you're done.
  </>
);
// ─────────────────────────────────────────────────────────────────────────────

// Supported text file types
const ACCEPTED = ".txt,.md,.json,.csv,.js,.ts,.tsx,.jsx,.py,.html,.css,.xml,.yaml,.yml,.env,.sh,.sql";

interface ThreadProps {
  sessionId: string;
  attachedFile: AttachedFile | null;
  onAttachFile: (file: AttachedFile) => void;
  onRemoveFile: () => void;
}

export const Thread: FC<ThreadProps> = ({ sessionId, attachedFile, onAttachFile, onRemoveFile }) => {
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
        className="chat-scrollbar relative flex flex-1 flex-col overflow-x-auto overflow-y-auto scroll-smooth"
      >
        <div className="mx-auto flex w-full max-w-(--thread-max-width) flex-1 flex-col px-4 pt-4">
          <AuiIf condition={(s) => s.thread.isEmpty}>
            <ThreadWelcome sessionId={sessionId} />
          </AuiIf>

          <div className="mb-10 flex flex-col gap-y-8 empty:hidden">
            <ThreadPrimitive.Messages>
              {() => <ThreadMessage />}
            </ThreadPrimitive.Messages>
          </div>

          <ThreadPrimitive.ViewportFooter className="sticky bottom-0 mt-auto flex flex-col gap-2 overflow-visible rounded-t-(--composer-radius) bg-background pb-6 md:pb-12">
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

const ThreadMessage: FC = () => {
  const role = useAuiState((s) => s.message.role);
  const isEditing = useAuiState((s) => s.message.composer.isEditing);
  if (isEditing) return <EditComposer />;
  if (role === "user") return <UserMessage />;
  return <AssistantMessage />;
};

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

const ThreadWelcome: FC<{ sessionId: string }> = ({ sessionId }) => (
  <div className="my-auto flex grow flex-col items-center justify-center">
    <div className="px-4 w-full">
      <div className="mb-4">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
          <SparklesIcon size={20} className="text-primary" />
        </div>
      </div>
      <h1 className="fade-in slide-in-from-bottom-1 animate-in fill-mode-both font-semibold text-2xl duration-200">
        {WELCOME_TITLE}
      </h1>
      <p className="fade-in slide-in-from-bottom-1 animate-in fill-mode-both text-muted-foreground sm:text-xl text-sm delay-75 duration-200">        {WELCOME_SUBTITLE}
      </p>
      <p className="mt-3 text-[10px] text-muted-foreground/40 font-mono">
        session: {sessionId.slice(0, 8)}
      </p>
    </div>
  </div>
);

interface ComposerProps {
  attachedFile: AttachedFile | null;
  onAttachFile: (file: AttachedFile) => void;
  onRemoveFile: () => void;
}

const Composer: FC<ComposerProps> = ({ attachedFile, onAttachFile, onRemoveFile }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      onAttachFile({ name: file.name, content });
    };
    reader.readAsText(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  return (
    <ComposerPrimitive.Root className="relative flex w-full flex-col">
      <div className="flex w-full flex-col gap-2 rounded-(--composer-radius) border bg-background p-(--composer-padding) transition-shadow focus-within:border-ring/75 focus-within:ring-2 focus-within:ring-ring/20">
        {/* File attachment chip */}
        {attachedFile && (
          <div className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-xs text-primary w-fit max-w-full">
            <PaperclipIcon size={11} className="shrink-0" />
            <span className="truncate max-w-[200px]">{attachedFile.name}</span>
            <button
              onClick={onRemoveFile}
              className="ml-0.5 rounded hover:bg-primary/20 p-0.5 shrink-0"
              aria-label="Remove file"
            >
              <XIcon size={10} />
            </button>
          </div>
        )}

        <ComposerPrimitive.Input
          placeholder="Send a message..."
          className="max-h-32 min-h-10 w-full resize-none bg-transparent px-1.75 py-1 text-[16px] sm:text-[14px] leading-[1.3] outline-none placeholder:text-muted-foreground/80"
          rows={1}
          autoFocus
          aria-label="Message input"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              // Blur on mobile to close keyboard after send
              if (window.innerWidth < 768) {
                setTimeout(() => (e.target as HTMLTextAreaElement).blur(), 50);
              }
            }
          }}
        />

        <div className="relative flex items-center justify-between">
          {/* File picker */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED}
              className="hidden"
              onChange={handleFileChange}
            />
            <TooltipIconButton
              tooltip="Attach file"
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 rounded-full text-muted-foreground hover:text-foreground"
              onClick={() => fileInputRef.current?.click()}
            >
              <PaperclipIcon className="size-4" />
            </TooltipIconButton>
          </div>

          {/* Send / Stop */}
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
              <Button type="button" variant="default" size="icon" className="size-8 rounded-full">
                <SquareIcon className="size-3 fill-current" />
              </Button>
            </ComposerPrimitive.Cancel>
          </AuiIf>
        </div>
      </div>
    </ComposerPrimitive.Root>
  );
};

const MessageError: FC = () => (
  <MessagePrimitive.Error>
    <ErrorPrimitive.Root className="mt-2 rounded-md border border-destructive bg-destructive/10 p-3 text-destructive text-sm">
      <ErrorPrimitive.Message className="line-clamp-2" />
    </ErrorPrimitive.Root>
  </MessagePrimitive.Error>
);

const AssistantMessage: FC = () => (
  <MessagePrimitive.Root data-role="assistant" className="fade-in slide-in-from-bottom-1 relative animate-in duration-150">
    <div className="wrap-break-word px-2 text-foreground leading-relaxed">
      {/* Match blog post font: prose-sm on desktop (14px), 12px on mobile */}
      <div className="prose prose-sm max-w-none hidden sm:block [&_*]:leading-[1.3]">
        <MessagePrimitive.Parts components={{ Text: MarkdownText, tools: { Fallback: ToolFallback } }} />
      </div>
      <div className="prose max-w-none sm:hidden [&_*]:leading-[1.3]" style={{ fontSize: "14px" }}>
        <MessagePrimitive.Parts components={{ Text: MarkdownText, tools: { Fallback: ToolFallback } }} />
      </div>
      <MessageError />
    </div>
    <div className="ms-2 flex items-center -mb-7.5 min-h-7.5 pt-1.5">
      <BranchPicker />
      <AssistantActionBar />
    </div>
  </MessagePrimitive.Root>
);

const AssistantActionBar: FC = () => (
  <ActionBarPrimitive.Root hideWhenRunning autohide="not-last" className="-ms-1 flex gap-1 text-muted-foreground">
    <ActionBarPrimitive.Copy asChild>
      <TooltipIconButton tooltip="Copy">
        <AuiIf condition={(s) => s.message.isCopied}><CheckIcon /></AuiIf>
        <AuiIf condition={(s) => !s.message.isCopied}><CopyIcon /></AuiIf>
      </TooltipIconButton>
    </ActionBarPrimitive.Copy>
    <ActionBarPrimitive.Reload asChild>
      <TooltipIconButton tooltip="Regenerate"><RefreshCwIcon /></TooltipIconButton>
    </ActionBarPrimitive.Reload>
  </ActionBarPrimitive.Root>
);

const UserMessage: FC = () => (
  <MessagePrimitive.Root
    className="fade-in slide-in-from-bottom-1 grid animate-in auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] content-start gap-y-2 px-2 duration-150 [&:where(>*)]:col-start-2"
    data-role="user"
  >
    <div className="relative col-start-2 min-w-0">
      <div className="wrap-break-word peer rounded-2xl bg-muted px-4 py-2.5 text-foreground empty:hidden text-[14px] sm:text-[14px] leading-[1.3]" style={{ fontSize: undefined }}>
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
  <ActionBarPrimitive.Root hideWhenRunning autohide="not-last" className="flex flex-col items-end">
    <ActionBarPrimitive.Edit asChild>
      <TooltipIconButton tooltip="Edit" className="p-4"><PencilIcon /></TooltipIconButton>
    </ActionBarPrimitive.Edit>
  </ActionBarPrimitive.Root>
);

const EditComposer: FC = () => (
  <MessagePrimitive.Root className="flex flex-col px-2">
    <ComposerPrimitive.Root className="ms-auto flex w-full max-w-[85%] flex-col rounded-2xl bg-muted">
      <ComposerPrimitive.Input className="min-h-14 w-full resize-none bg-transparent p-4 text-foreground text-sm outline-none" autoFocus />
      <div className="mx-3 mb-3 flex items-center gap-2 self-end">
        <ComposerPrimitive.Cancel asChild><Button variant="ghost" size="sm">Cancel</Button></ComposerPrimitive.Cancel>
        <ComposerPrimitive.Send asChild><Button size="sm">Update</Button></ComposerPrimitive.Send>
      </div>
    </ComposerPrimitive.Root>
  </MessagePrimitive.Root>
);

const BranchPicker: FC<BranchPickerPrimitive.Root.Props> = ({ className, ...rest }) => (
  <BranchPickerPrimitive.Root
    hideWhenSingleBranch
    className={cn("-ms-2 me-2 inline-flex items-center text-muted-foreground text-xs", className)}
    {...rest}
  >
    <BranchPickerPrimitive.Previous asChild>
      <TooltipIconButton tooltip="Previous"><ChevronLeftIcon /></TooltipIconButton>
    </BranchPickerPrimitive.Previous>
    <span className="font-medium">
      <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
    </span>
    <BranchPickerPrimitive.Next asChild>
      <TooltipIconButton tooltip="Next"><ChevronRightIcon /></TooltipIconButton>
    </BranchPickerPrimitive.Next>
  </BranchPickerPrimitive.Root>
);

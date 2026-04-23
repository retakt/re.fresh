import { useRef, useState } from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import CharacterCount from "@tiptap/extension-character-count";
import {
  Bold,
  Italic,
  UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link2,
  Link2Off,
  Undo,
  Redo,
  Code,
  Image as ImageIcon,
  Video,
  Paperclip,
  Link as LinkIcon,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { cn } from "@/lib/utils.ts";
import {
  createYouTubeEmbedUrl,
  isImageFile,
  isVideoFile,
  normalizeEmbedUrl,
  uploadPublicAsset,
} from "@/lib/media";
import { toast } from "sonner";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

const MediaImage = Node.create({
  name: "mediaImage",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "img[data-media-image]" }, { tag: "img[src]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "img",
      mergeAttributes(
        {
          "data-media-image": "true",
          class: "my-4 rounded-xl border border-border/60 max-h-[34rem] w-full object-cover",
        },
        HTMLAttributes,
      ),
    ];
  },
});

const MediaVideo = Node.create({
  name: "mediaVideo",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      title: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "video[data-media-video]" }, { tag: "video[src]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "video",
      mergeAttributes(
        {
          "data-media-video": "true",
          controls: "true",
          class: "my-4 w-full rounded-xl border border-border/60 bg-black",
        },
        HTMLAttributes,
      ),
    ];
  },
});

const MediaEmbed = Node.create({
  name: "mediaEmbed",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      title: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "iframe[data-media-embed]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "iframe",
      mergeAttributes(
        {
          "data-media-embed": "true",
          class: "my-4 aspect-video w-full rounded-xl border border-border/60 bg-background",
          loading: "lazy",
          allowfullscreen: "true",
          referrerpolicy: "no-referrer",
        },
        HTMLAttributes,
      ),
    ];
  },
});

const MediaAttachment = Node.create({
  name: "mediaAttachment",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      href: { default: null },
      name: { default: null },
      mimeType: { default: null },
      size: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "a[data-media-attachment]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "a",
      mergeAttributes(
        {
          "data-media-attachment": "true",
          download: "true",
          class:
            "my-4 flex items-center gap-3 rounded-xl border border-border/70 bg-muted/30 px-3 py-2 no-underline",
        },
        HTMLAttributes,
      ),
      HTMLAttributes.name || HTMLAttributes.href || "Attachment",
    ];
  },
});

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "p-1.5 rounded transition-colors cursor-pointer",
        active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:text-foreground hover:bg-muted",
        disabled && "opacity-30 cursor-not-allowed",
      )}
    >
      {children}
    </button>
  );
}

type MediaMode = "image" | "video" | "file";

function isImageUrl(url: string) {
  return /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(url);
}

function isVideoUrl(url: string) {
  return /\.(mp4|webm|mov|m4v|ogv)$/i.test(url);
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your content here...",
  className,
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const insertMediaFromFile = async (file: File) => {
    if (!editor) return;

    setUploading(true);
    try {
      const asset = await uploadPublicAsset(file, "editor");

      if (isImageFile(file)) {
        editor.chain().focus().insertContent({
          type: "mediaImage",
          attrs: {
            src: asset.url,
            alt: file.name,
            title: file.name,
          },
        }).run();
      } else if (isVideoFile(file)) {
        editor.chain().focus().insertContent({
          type: "mediaVideo",
          attrs: {
            src: asset.url,
            title: file.name,
          },
        }).run();
      } else {
        editor.chain().focus().insertContent({
          type: "mediaAttachment",
          attrs: {
            href: asset.url,
            name: file.name,
            mimeType: file.type,
            size: file.size,
          },
        }).run();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const insertEmbed = (rawUrl: string) => {
    if (!editor) return;

    const embedUrl = normalizeEmbedUrl(rawUrl);
    const youtubeUrl = createYouTubeEmbedUrl(embedUrl);

    if (!youtubeUrl && !embedUrl.includes("vimeo.com")) {
      toast.error("Only YouTube and Vimeo embeds are supported here.");
      return;
    }

    editor.chain().focus().insertContent({
      type: "mediaEmbed",
      attrs: {
        src: embedUrl,
        title: rawUrl,
      },
    }).run();
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      CharacterCount,
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "underline text-primary cursor-pointer" },
      }),
      MediaImage,
      MediaVideo,
      MediaEmbed,
      MediaAttachment,
    ],
    content: value || "",
    onUpdate({ editor: currentEditor }) {
      onChange(currentEditor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-64 px-4 py-3",
      },
      handlePaste(_view, event) {
        const files = Array.from(event.clipboardData?.files ?? []);
        if (files.length > 0) {
          event.preventDefault();
          void files.forEach((file) => {
            void insertMediaFromFile(file);
          });
          return true;
        }

        const text = event.clipboardData?.getData("text/plain").trim();
        if (text) {
          const youtubeUrl = createYouTubeEmbedUrl(text);
          const embedUrl = normalizeEmbedUrl(text);

          if (youtubeUrl || embedUrl.includes("vimeo.com")) {
            event.preventDefault();
            insertEmbed(text);
            return true;
          }

          if (isImageUrl(text)) {
            event.preventDefault();
            editor?.chain().focus().insertContent({
              type: "mediaImage",
              attrs: { src: text, alt: text, title: text },
            }).run();
            return true;
          }
        }

        return false;
      },
      handleDrop(_view, event) {
        const files = Array.from(event.dataTransfer?.files ?? []);
        if (files.length > 0) {
          event.preventDefault();
          void files.forEach((file) => {
            void insertMediaFromFile(file);
          });
          return true;
        }

        return false;
      },
    },
  });

  const setLink = () => {
    if (!editor) return;
    const url = window.prompt("Enter URL", editor.getAttributes("link").href ?? "");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addEmbed = () => {
    const url = window.prompt("Paste YouTube or Vimeo URL");
    if (!url) return;
    insertEmbed(url);
  };

  const openPicker = (mode: MediaMode) => {
    if (!fileInputRef.current) return;

    fileInputRef.current.accept =
      mode === "image" ? "image/*" : mode === "video" ? "video/*" : "";
    fileInputRef.current.click();
  };

  if (!editor) return null;

  const charCount = editor.storage.characterCount.characters();

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/30 px-2 py-1.5">
        <ToolbarButton
          title="Undo"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo size={14} />
        </ToolbarButton>
        <ToolbarButton
          title="Redo"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo size={14} />
        </ToolbarButton>

        <div className="w-px h-4 bg-border mx-1" />

        <ToolbarButton
          title="Heading 1"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive("heading", { level: 1 })}
        >
          <Heading1 size={14} />
        </ToolbarButton>
        <ToolbarButton
          title="Heading 2"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
        >
          <Heading2 size={14} />
        </ToolbarButton>
        <ToolbarButton
          title="Heading 3"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
        >
          <Heading3 size={14} />
        </ToolbarButton>

        <div className="w-px h-4 bg-border mx-1" />

        <ToolbarButton
          title="Bold"
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
        >
          <Bold size={14} />
        </ToolbarButton>
        <ToolbarButton
          title="Italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
        >
          <Italic size={14} />
        </ToolbarButton>
        <ToolbarButton
          title="Underline"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
        >
          <UnderlineIcon size={14} />
        </ToolbarButton>
        <ToolbarButton
          title="Strikethrough"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
        >
          <Strikethrough size={14} />
        </ToolbarButton>
        <ToolbarButton
          title="Inline code"
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive("code")}
        >
          <Code size={14} />
        </ToolbarButton>

        <div className="w-px h-4 bg-border mx-1" />

        <ToolbarButton
          title="Bullet list"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
        >
          <List size={14} />
        </ToolbarButton>
        <ToolbarButton
          title="Ordered list"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
        >
          <ListOrdered size={14} />
        </ToolbarButton>
        <ToolbarButton
          title="Blockquote"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
        >
          <Quote size={14} />
        </ToolbarButton>
        <ToolbarButton
          title="Horizontal rule"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus size={14} />
        </ToolbarButton>

        <div className="w-px h-4 bg-border mx-1" />

        <ToolbarButton title="Set link" onClick={setLink} active={editor.isActive("link")}>
          <Link2 size={14} />
        </ToolbarButton>
        {editor.isActive("link") && (
          <ToolbarButton
            title="Remove link"
            onClick={() => editor.chain().focus().unsetLink().run()}
          >
            <Link2Off size={14} />
          </ToolbarButton>
        )}

        <div className="w-px h-4 bg-border mx-1" />

        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 gap-1.5 px-2 text-xs"
          onClick={() => openPicker("image")}
        >
          <ImageIcon size={13} /> Image
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 gap-1.5 px-2 text-xs"
          onClick={() => openPicker("video")}
        >
          <Video size={13} /> Video
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 gap-1.5 px-2 text-xs"
          onClick={() => openPicker("file")}
        >
          <Paperclip size={13} /> File
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 gap-1.5 px-2 text-xs"
          onClick={addEmbed}
        >
          <LinkIcon size={13} /> Embed
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=""
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            await insertMediaFromFile(file);
          }}
        />

        <span className="ml-auto flex items-center gap-2 text-xs text-muted-foreground tabular-nums">
          {uploading && (
            <span className="inline-flex items-center gap-1">
              <Upload size={12} className="animate-pulse" /> Uploading
            </span>
          )}
          {charCount} chars
        </span>
      </div>

      <EditorContent editor={editor} className="bg-background" />
    </div>
  );
}

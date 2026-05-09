import { useRef, useState, useEffect } from "react";
import { Node, Mark, mergeAttributes, Extension } from "@tiptap/core";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import CharacterCount from "@tiptap/extension-character-count";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { AnimatedCodeBlock } from "@/components/rich-text-editor-code-block";
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
  Sun,
  Baseline,
  Type,
  ChevronDown,
  FileCode,
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
import { toast } from "@/lib/toast";

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

// ── Glow mark ────────────────────────────────────────────────────────────────
const GlowMark = Mark.create({
  name: "glow",
  priority: 1000,
  addAttributes() {
    return { intensity: { default: 8 } };
  },
  parseHTML() { return [{ tag: "span[data-glow]" }]; },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, {
      "data-glow": "true",
      style: `text-shadow: 0 0 ${HTMLAttributes.intensity ?? 8}px currentColor; filter: brightness(1.3);`,
    }), 0];
  },
});

// ── Font Size extension ──────────────────────────────────────────────────────

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (size: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
  }
}

const FontSize = Extension.create({
  name: "fontSize",

  addOptions() {
    return {
      types: ["textStyle"],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize || null,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }) => {
          return chain().setMark("textStyle", { fontSize }).run();
        },
      unsetFontSize:
        () =>
        ({ chain }) => {
          return chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run();
        },
    };
  },
});

// ── Color palette (from screenshot) ──────────────────────────────────────────
const COLORS = [
  { hex: "#ec4899", label: "Pink" },
  { hex: "#8b5cf6", label: "Purple" },
  { hex: "#3b82f6", label: "Blue" },
  { hex: "#ef4444", label: "Red" },
  { hex: "#f97316", label: "Orange" },
  { hex: "#10b981", label: "Green" },
];

const FONT_SIZES = [
  { value: "12px", label: "Small" },
  { value: "14px", label: "Normal" },
  { value: "18px", label: "Large" },
  { value: "24px", label: "X-Large" },
  { value: "32px", label: "XX-Large" },
];

const CODE_LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "b", label: "B" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "sql", label: "SQL" },
  { value: "bash", label: "Bash" },
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
  { value: "markdown", label: "Markdown" },
  { value: "plaintext", label: "Plain Text" },
];

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
  const [colorOpen, setColorOpen] = useState(false);
  const [fontSizeOpen, setFontSizeOpen] = useState(false);
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [glowIntensity, setGlowIntensity] = useState(8);
  const colorRef = useRef<HTMLDivElement>(null);
  const fontSizeRef = useRef<HTMLDivElement>(null);
  const codeDialogRef = useRef<HTMLDivElement>(null);

  // Close color picker when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (colorRef.current && !colorRef.current.contains(e.target as HTMLElement)) {
        setColorOpen(false);
      }
      if (fontSizeRef.current && !fontSizeRef.current.contains(e.target as HTMLElement)) {
        setFontSizeOpen(false);
      }
      if (codeDialogRef.current && !codeDialogRef.current.contains(e.target as HTMLElement)) {
        setCodeDialogOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable built-ins we're configuring manually below
        link: false,
        underline: false,
        codeBlock: false, // Disable default code block
      }),
      TextStyle.extend({
        priority: 1001,
      }),
      Color.configure({
        types: ['textStyle'],
      }),
      FontSize,
      GlowMark,
      Underline,
      CharacterCount,
      AnimatedCodeBlock, // Add animated code block
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
          "prose prose-sm max-w-none focus:outline-none min-h-64 px-4 py-3",
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

  // Sync glow intensity with current selection
  useEffect(() => {
    if (!editor) return;
    
    const updateIntensity = () => {
      if (editor.isActive("glow")) {
        const currentIntensity = editor.getAttributes("glow").intensity;
        if (currentIntensity && currentIntensity !== glowIntensity) {
          setGlowIntensity(currentIntensity);
        }
      }
    };

    editor.on("selectionUpdate", updateIntensity);
    editor.on("transaction", updateIntensity);

    return () => {
      editor.off("selectionUpdate", updateIntensity);
      editor.off("transaction", updateIntensity);
    };
  }, [editor, glowIntensity]);

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
          title="Heading 1 (applies to entire paragraph)"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive("heading", { level: 1 })}
        >
          <Heading1 size={14} />
        </ToolbarButton>
        <ToolbarButton
          title="Heading 2 (applies to entire paragraph)"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
        >
          <Heading2 size={14} />
        </ToolbarButton>
        <ToolbarButton
          title="Heading 3 (applies to entire paragraph)"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
        >
          <Heading3 size={14} />
        </ToolbarButton>

        <div className="w-px h-4 bg-border mx-1" />
        <span className="text-[9px] text-muted-foreground/60 px-1">Text formatting</span>
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

        {/* Color picker */}
        <div className="relative" ref={colorRef}>
          <button
            type="button"
            title="Text color"
            onClick={() => setColorOpen((o) => !o)}
            className="p-1.5 rounded transition-colors text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-1"
          >
            <Baseline size={14} />
            <span
              className="w-2.5 h-2.5 rounded-full border border-border/60"
              style={{ background: editor.getAttributes("textStyle").color ?? "currentColor" }}
            />
          </button>

          {colorOpen && (
            <div className="absolute top-full right-0 mt-1 z-50 rounded-xl border border-white/10 bg-neutral-900 p-2 shadow-xl space-y-2 w-48">
              {/* Swatches */}
              <div className="flex items-center gap-1 flex-wrap">
                {COLORS.map((c) => {
                  const isActive = editor.getAttributes("textStyle").color === c.hex;
                  return (
                    <button
                      key={c.hex}
                      type="button"
                      title={c.label}
                      onClick={() => { editor.chain().focus().setColor(c.hex).run(); setColorOpen(false); }}
                      className="w-6 h-6 rounded-lg transition-all hover:scale-110 active:scale-95 flex items-center justify-center shrink-0"
                      style={{ background: c.hex, boxShadow: isActive ? `0 0 0 2px white, 0 0 0 3px ${c.hex}` : "none" }}
                    >
                      {isActive && <span className="text-white text-[9px]">✓</span>}
                    </button>
                  );
                })}
              </div>

              {/* Glow scrubber */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-[10px] text-white/60"><Sun size={10} /> Glow intensity</span>
                  <span className="text-[10px] text-white/60 tabular-nums">{glowIntensity}px</span>
                </div>
                <div className="relative h-6 flex items-center cursor-pointer"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                    const val = Math.round(pct * 24) + 1;
                    setGlowIntensity(val);
                    // Always update the glow intensity if glow is active
                    if (editor.isActive("glow")) {
                      editor.chain().focus().updateAttributes("glow", { intensity: val }).run();
                    }
                  }}
                >
                  <div className="absolute inset-x-0 h-1 rounded-full bg-white/10" />
                  <div className="absolute left-0 h-1 rounded-full bg-white/40"
                    style={{ width: `${((glowIntensity - 1) / 24) * 100}%` }} />
                  <div className="absolute w-3 h-3 rounded-full bg-white shadow-md -translate-x-1/2"
                    style={{ left: `${((glowIntensity - 1) / 24) * 100}%` }} />
                </div>
              </div>

              {/* Reset + Glow toggle — equal width */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => { editor.chain().focus().unsetColor().run(); editor.chain().focus().unsetMark("glow").run(); setColorOpen(false); }}
                  className="flex items-center justify-center gap-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-medium py-1.5 transition-colors"
                >
                  ↺ Reset
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (editor.isActive("glow")) {
                      editor.chain().focus().unsetMark("glow").run();
                    } else {
                      editor.chain().focus().setMark("glow", { intensity: glowIntensity }).run();
                    }
                  }}
                  className={`flex items-center justify-center gap-1 rounded-lg py-1.5 text-[10px] font-medium transition-colors ${
                    editor.isActive("glow") ? "bg-white/30 text-white" : "bg-white/10 hover:bg-white/20 text-white/70"
                  }`}
                >
                  <Sun size={10} /> {editor.isActive("glow") ? "Off" : "Glow"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Font size picker */}
        <div className="relative" ref={fontSizeRef}>
          <button
            type="button"
            title="Font size"
            onClick={() => setFontSizeOpen((o) => !o)}
            className="p-1.5 rounded transition-colors text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-0.5"
          >
            <Type size={14} />
            <ChevronDown size={10} />
          </button>

          {fontSizeOpen && (
            <div className="absolute top-full right-0 mt-1 z-50 rounded-xl border border-white/10 bg-neutral-900 p-1.5 shadow-xl space-y-0.5 w-32">
              {FONT_SIZES.map((size) => {
                const isActive = editor.getAttributes("textStyle").fontSize === size.value;
                return (
                  <button
                    key={size.value}
                    type="button"
                    onClick={() => {
                      editor.chain().focus().setFontSize(size.value).run();
                      setFontSizeOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-2 py-1 rounded-lg text-[11px] transition-colors",
                      isActive
                        ? "bg-white/20 text-white font-medium"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {size.label}
                  </button>
                );
              })}
              <div className="border-t border-white/10 my-0.5" />
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().unsetFontSize().run();
                  setFontSizeOpen(false);
                }}
                className="w-full text-left px-2 py-1 rounded-lg text-[10px] text-white/60 hover:bg-white/10 hover:text-white transition-colors"
              >
                Reset
              </button>
            </div>
          )}
        </div>

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

        {/* Code Block Button with Dropdown */}
        <div className="relative" ref={codeDialogRef}>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 gap-1.5 px-2 text-xs"
            onClick={() => setCodeDialogOpen(!codeDialogOpen)}
          >
            <FileCode size={13} /> Code
          </Button>

          {codeDialogOpen && (
            <div className="absolute top-full left-0 mt-1 z-50 rounded-xl border border-white/10 bg-neutral-900 p-2 shadow-xl w-72">
              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-white/60 font-medium">Language</label>
                  <select
                    id="code-language"
                    className="w-full h-7 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                    defaultValue="javascript"
                  >
                    {CODE_LANGUAGES.map((lang) => (
                      <option key={lang.value} value={lang.value} className="bg-neutral-900">
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-white/60 font-medium">Code</label>
                  <textarea
                    id="code-content"
                    rows={4}
                    placeholder="Paste your code here..."
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
                  />
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const language = (document.getElementById("code-language") as HTMLSelectElement)?.value || "plaintext";
                      const code = (document.getElementById("code-content") as HTMLTextAreaElement)?.value || "";
                      if (code.trim()) {
                        // Insert code block with both language and code attributes
                        editor.chain().focus().insertContent({
                          type: 'animatedCodeBlock',
                          attrs: {
                            language,
                            code,
                          },
                        }).run();
                        setCodeDialogOpen(false);
                        // Clear inputs
                        (document.getElementById("code-content") as HTMLTextAreaElement).value = "";
                      }
                    }}
                    className="flex-1 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-[10px] font-medium py-1.5 transition-colors"
                  >
                    Insert
                  </button>
                  <button
                    type="button"
                    onClick={() => setCodeDialogOpen(false)}
                    className="px-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

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

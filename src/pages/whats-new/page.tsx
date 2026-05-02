import { CanvasText } from "@/components/ui/canvas-text";
import { cn } from "@/lib/utils";

// ΓöÇΓöÇ Per-version title color palettes ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
const VERSION_COLORS: Record<string, { bg: string; lines: string[] }> = {
  "v1.5.5": { bg: "bg-[#0ecfba]", lines: ["#11D8C2","#0a9e8f","#07c4b0","#059080","#0bbfab","#07a08e","#11D8C2","#059080"] },
  "v1.5":   { bg: "bg-[#38bdf8]", lines: ["#0ea5e9","#0284c7","#38bdf8","#0369a1","#0ea5e9","#0284c7","#38bdf8","#0369a1"] },
  "v1.4":   { bg: "bg-[#ff80b5]", lines: ["#ec4899","#f472b6","#db2777","#be185d","#ec4899","#db2777","#f472b6","#ec4899"] },
  "v1.3.5": { bg: "bg-[#ff6b8a]", lines: ["#FF6B8A","#F0476A","#E8325A","#D03D56","#C32148","#B5406C","#FF8FA3","#F06080"] },
  "v1.3":   { bg: "bg-[#d946ef]", lines: ["#a855f7","#c084fc","#7c3aed","#a855f7","#c084fc","#8b5cf6","#c084fc","#a855f7"] },
  "v1.2.5": { bg: "bg-[#fcd34d]", lines: ["#e69b00","#e6b400","#e6cc00","#e5de00","#e8e337","#ece75f","#e6b400","#e6cc00"] },
  "v1.2":   { bg: "bg-[#22c55e]", lines: ["#16a34a","#22c55e","#4ade80","#22c55e","#16a34a","#4ade80","#22c55e","#16a34a"] },
  "v1.0":   { bg: "bg-[#3b82f6]", lines: ["#2563eb","#3b82f6","#1d4ed8","#3b82f6","#2563eb","#1d4ed8","#3b82f6","#2563eb"] },
};

const RELEASED: { version: string; date: string; title: string; items: string[] }[] = [
  {
    version: "v1.5.5",
    date: "2nd May, 2026",
    title: "Chat Pro (II)",
    items: [
      "chat - Gemma 4 e4b (multimodel for tool calling)",
      "Web search ΓÇö news, factcheck, reddit, wiki, code (SearXNG)",
      "weather, exchange rate, and world clock (tools)",
      "cloudflare tunnel for SearXNG at search-api.retakt.cc (privacy)",
    ],
  },
  {
    version: "v1.5",
    date: "2nd May, 2026",
    title: "Chat Pro",
    items: [
      "model update - trying google multimodal",
      "voice input ΓÇö speak to type, text drops in on pause",
      "audio file attachment ΓÇö model analyzes .mp3/.wav",
      "Γåæ/Γåô arrow keys cycle",
    ],
  },
  {
    version: "v1.4",
    date: "1st May, 2026",
    title: "Chat",
    items: [
      "chat open sourced ΓÇö llm (qwen3.5)",
      "--auto-mode (fine-tuned to perform without assistance)",
      "slash (/) commands, thinking modes, streaming responses",
      "image + text file attachments, syntax highlighting",
      "restore, edit sent messages",
    ],
  },
  {
    version: "v1.3.5",
    date: "30th April, 2026",
    title: "Enhancements",
    items: [
      "Rich text editor ΓÇö Tiptap with code blocks, media upload, text effects",
      "blog post live ΓÇö Hello, World!",
      "Music updated ΓÇö it begins by Kensuke Ushio",
      "canvas text, magnetic buttons, animated menu icon",
    ],
  },
  {
    version: "v1.3",
    date: "29th April, 2026",
    title: "comments & Chat Frontend",
    items: [
      "threaded comments (reddit style), attachments, markdown",
      "Chat frontend built ΓÇö connected to OpenRouter (temporary)",
      "pull-to-refresh, skeleton loaders, empty states across all pages",
    ],
  },
  {
    version: "v1.2.5",
    date: "28th April, 2026",
    title: "music_Player",
    items: [
      "draggable player ΓÇö pill + full mode, snap-to-edge",
      "scrubber, volume, socials (spotify, youtube)",
      "cross page navigation",
    ],
  },
  {
    version: "v1.2",
    date: "27th April, 2026",
    title: "live...",
    items: [
      "music, blog, tutorials, files pages deployed",
      "#tag filtering, view_counts, prefetch and more",
      "search - added",
      "music_test ΓÇö Runway (Kanye West ├ù Biggie)",
    ],
  },
  {
    version: "v1.0",
    date: "26th April, 2026",
    title: "starting...",
    items: [
      "navbar, sidebar, mobile drawer, bottom nav, footer",
      "auth - login, roles (admin/editor/member), avatar_history",
      "theme toggle, responsive design, and basics",
    ],
  },
];

const UPCOMING: string[] = [
  "TTS (still thinking...)",
  "post reactions (still thinking)",
  "Notification system",
  "Tools (Major Update)",
];

// Dot is at left-[5.5rem] + gap-4 (1rem) = ~6.5rem from left edge of the flex container
// The flex container starts after the w-20 (5rem) left column + gap-4 (1rem) = dot center at ~5.5rem + 0.3125rem (half of 0.625rem dot)
// Timeline line must pass through dot center: left = w-20 + gap-4 + half-dot-width
// w-20 = 5rem, gap-4 = 1rem, half of size-2.5 (0.625rem) = 0.3125rem ΓåÆ total = 6.3125rem
const TIMELINE_LEFT = "left-[calc(3rem+0.25rem+0.3125rem)]";

export default function WhatsNewPage() {
  return (
    <div className="w-full max-w-2xl space-y-3 pb-8">
      {/* Header */}
      <div>
        <div className="pb-2">
          <CanvasText
            text="Changelog: "
            className="text-2xl font-bold"
            backgroundClassName="bg-[#11D8C2]"
            colors={["#11D8C2","#0ecfba","#0bbfab","#09af9c","#07a08e","#059080","#11D8C2","#0ecfba"]}
            animationDuration={12}
          />
        </div>
        <p className="mt-1.5 text-sm text-muted-foreground">
          What's shipped yet....
        </p>
      </div>
      {/* Released */}
      <section>
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-primary/70 mb-4">
          Released
        </h2>

        <div className="relative pl-6">
          {/* Timeline line ΓÇö 0.75rem from left (center of dot) */}
          <div className="absolute left-[0.6875rem] top-2 bottom-2 w-px bg-primary/40" />

          <div className="space-y-2">
            {RELEASED.map((entry) => {
              const { bg, lines } = VERSION_COLORS[entry.version] ?? VERSION_COLORS["v1.0"];
              return (
                <div key={entry.version} className="relative">

                  {/* Dot ΓÇö on the line */}
                  <div className="absolute -left-6 top-1 z-10 flex items-center justify-center w-[1.375rem]">
                    <div
                      className="size-2.5 rounded-full border-2"
                      style={{ borderColor: "#11D8C2", backgroundColor: "var(--background)" }}
                    />
                  </div>

                  {/* Version + date ΓÇö above title, left aligned */}
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="border-b border-red-500">
                      <CanvasText
                        text={entry.version}
                        className="font-mono text-xs font-bold"
                        backgroundClassName="bg-[#ef4444]"
                        colors={["#ef4444","#dc2626","#ef4444","#b91c1c","#dc2626","#ef4444","#b91c1c","#dc2626"]}
                        lineGap={1}
                        animationDuration={30}
                      />
                    </span>
                    <span className="text-[10px] text-muted-foreground/50">{entry.date}</span>
                  </div>

                  {/* Title */}
                  <div className="text-lg font-bold leading-tight mb-2">
                    <CanvasText
                      text={entry.title}
                      backgroundClassName={bg}
                      colors={lines}
                      lineGap={1}
                      animationDuration={30}
                    />
                  </div>

                  {/* Items */}
                  <ul className="space-y-1">
                    {entry.items.map((item, i) => (
                      <li key={i} className="text-[13px] text-muted-foreground leading-relaxed flex gap-2">
                        <span className="shrink-0 mt-[0.45rem] size-1 rounded-full bg-primary/50" />
                        <span className="min-w-0">{item}</span>
                      </li>
                    ))}
                  </ul>

                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="border-t border-border/40 border-dashed" />

      {/* Upcoming */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-primary">
            Coming up
          </h2>
          <span className="text-[9px] font-semibold text-muted-foreground/40 border border-border/40 rounded px-1.5 py-0.5">
            no dates
          </span>
        </div>
        <ul className="space-y-1.5">
          {UPCOMING.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[13px] text-muted-foreground/70">
              <span className="shrink-0 mt-0.5 text-[10px] font-bold" style={{ color: "#11D8C2", opacity: 0.6 }}>Γùï</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

    </div>
  );
}

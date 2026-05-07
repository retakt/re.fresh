import { CanvasText } from "@/components/ui/canvas-text";
import { motion } from "motion/react";
import { useState, useEffect, useRef } from "react";

// ── Per-version title color palettes ─────────────────────────────────────────
const VERSION_COLORS: Record<string, { bg: string; lines: string[] }> = {
  "v1.6":   { bg: "bg-[#dc143c]", lines: ["#8B0000","#A52A2A","#B22222","#DC143C","#FF0000","#8B0000","#A52A2A","#DC143C"] },
  "v1.6-major": { bg: "bg-[#F5F5DC]", lines: ["#8B8B9E","#9FA0C3","#D3D3D3","#E8E4D9","#F5F5DC","#8B8B9E","#9FA0C3","#E8E4D9"] },
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
    version: "v1.6",
    date: "4th May, 2026",
    title: "y0uTube Downloader",
    items: [
      "y0uTube Downloader - yt.retakt.cc (yt-dlp backend)",
      "auto/audio/mute modes, quality settings (max to 2160p)",
      "codec selection (h264, av1, vp9)",
      "auto-detect clipboard",
      "download manager with queue, progress tracking",
    ],
  },
  {
    version: "v1.5.5",
    date: "2nd May, 2026",
    title: "Chat Pro (II)",
    items: [
      "chat - Gemma 4 e4b (multimodel for tool calling)",
      "Web search -- news, factcheck, reddit, wiki, code (SearXNG)",
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
      "voice input - speak to type, text drops in on pause",
      "audio file attachment - model analyzes .mp3/.wav",
      "↑/↓ arrow keys cycle",
    ],
  },
  {
    version: "v1.4",
    date: "1st May, 2026",
    title: "Chat",
    items: [
      "chat open sourced - llm (qwen3.5)",
      "--auto-mode (fine-tuned to perform without assistance)",
      "slash (/) commands, thinking modes, streaming responses",
      "image + text file attachments",
    ],
  },
  {
    version: "v1.3.5",
    date: "30th April, 2026",
    title: "Enhancements",
    items: [
      "Rich text editor - Tiptap with code blocks, media upload, text effects",
      "blog post live - Hello, World!",
      "Music updated - it begins by Kensuke Ushio",
      "canvas text, magnetic buttons, animated menu icon",
    ],
  },
  {
    version: "v1.3",
    date: "29th April, 2026",
    title: "comments & Chat Frontend",
    items: [
      "threaded comments (reddit style), attachments, markdown",
      "Chat frontend built - connected to OpenRouter (temporary)",
      "pull-to-refresh, skeleton loaders, empty states across all pages",
    ],
  },
  {
    version: "v1.2.5",
    date: "28th April, 2026",
    title: "music_Player",
    items: [
      "draggable player - pill + full mode, snap-to-edge",
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
      "music_test — Runway (Kanye West × Biggie)",
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

export default function WhatsNewPage() {
  const [activeVersion, setActiveVersion] = useState<string | null>(null);
  const [hoveredVersion, setHoveredVersion] = useState<string | null>(null);
  const [linePosition, setLinePosition] = useState({ top: 0, height: 0 });
  const timelineRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Track scroll position to update active section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const version = entry.target.getAttribute("data-version");
            if (version) {
              setActiveVersion(version);
            }
          }
        });
      },
      {
        rootMargin: "-20% 0px -50% 0px",
        threshold: 0,
      }
    );

    sectionRefs.current.forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  // Update glowing line segment position to cover active section only (shorter)
  useEffect(() => {
    const targetVersion = hoveredVersion || activeVersion;
    if (!targetVersion || !timelineRef.current) return;

    const targetElement = sectionRefs.current.get(targetVersion);

    if (targetElement && timelineRef.current) {
      const timelineRect = timelineRef.current.getBoundingClientRect();
      const targetRect = targetElement.getBoundingClientRect();
      
      const top = targetRect.top - timelineRect.top;
      const height = targetRect.height + 8; // Add small padding to cover gaps between sections
      
      // Constrain the line to stay within timeline bounds
      const maxBottom = timelineRect.height - 8; // Leave 8px padding at bottom
      const constrainedHeight = Math.min(height, maxBottom - top);

      setLinePosition({ top, height: Math.max(0, constrainedHeight) });
    }
  }, [activeVersion, hoveredVersion]);

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

        <div ref={timelineRef} className="relative pl-6">
          {/* Base dim line - full height */}
          <div 
            className="absolute left-[0.6875rem] top-2 bottom-2 w-[0.5px] -translate-x-1/2" 
            style={{ 
              backgroundColor: "#11D8C2", 
              opacity: 1,
            }}
          />
          
          {/* Clipping container for glowing line */}
          <div className="absolute left-0 top-0 bottom-0 w-full overflow-hidden pointer-events-none" style={{ isolation: "isolate" }}>
            {/* Animated glowing line segment - short bright segment around active section */}
            <motion.div
              className="absolute left-[0.6875rem] w-[0.5px] -translate-x-1/2"
              style={{ 
                backgroundColor: "#11D8C2",
                opacity: 1,
                boxShadow: "0 0 12px rgba(17, 216, 194, 0.9), 0 0 6px rgba(17, 216, 194, 0.7), 0 0 3px rgba(17, 216, 194, 0.9), 0 0 1px #11D8C2"
              }}
              animate={{ 
                top: linePosition.top + 8,
                height: linePosition.height 
              }}
              transition={{ type: "spring", stiffness: 80, damping: 20 }}
            />
          </div>

          <div className="space-y-2">
            {RELEASED.map((entry) => {
              const { bg, lines } = VERSION_COLORS[entry.version] ?? VERSION_COLORS["v1.0"];
              const isActive = activeVersion === entry.version || hoveredVersion === entry.version;
              
              return (
                <div
                  key={entry.version}
                  ref={(el) => {
                    if (el) sectionRefs.current.set(entry.version, el);
                  }}
                  data-version={entry.version}
                  onMouseEnter={() => setHoveredVersion(entry.version)}
                  onMouseLeave={() => setHoveredVersion(null)}
                  className="relative transition-opacity duration-200 hover:opacity-100"
                  style={{ opacity: isActive ? 1 : 0.85 }}
                >
                  {/* Static circle that changes color when active */}
                  <div className="absolute -left-6 top-1 z-10 flex items-center justify-center w-[1.375rem]">
                    <motion.div
                      className="size-2.5 rounded-full border-2 transition-colors duration-300"
                      style={{
                        borderColor: isActive ? "#11D8C2" : "#0ecfba",
                        backgroundColor: "var(--background)",
                      }}
                      animate={{
                        scale: isActive ? 1.2 : 1,
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    />
                  </div>

                  <div className="relative">

                    {/* Version + date — above title, left aligned */}
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
                      {entry.version === "v1.6" ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <CanvasText
                            text="y0uTube Downloader"
                            backgroundClassName={bg}
                            colors={lines}
                            lineGap={1}
                            animationDuration={30}
                          />
                          <CanvasText
                            text="[Major]"
                            backgroundClassName={VERSION_COLORS["v1.6-major"].bg}
                            colors={VERSION_COLORS["v1.6-major"].lines}
                            lineGap={1}
                            animationDuration={30}
                          />
                        </div>
                      ) : (
                        <CanvasText
                          text={entry.title}
                          backgroundClassName={bg}
                          colors={lines}
                          lineGap={1}
                          animationDuration={30}
                        />
                      )}
                    </div>

                    {/* Items */}
                    <ul className="space-y-1">
                      {entry.items.map((item, i) => (
                        <li key={i} className="text-[13px] text-muted-foreground leading-relaxed flex gap-2">
                          <span className="shrink-0 mt-[0.45rem] size-1 rounded-full" style={{ backgroundColor: "#11D8C2" }} />
                          <span className="min-w-0">
                            {entry.version === "v1.6" && i === 0 ? (
                              // Special handling for YouTube Downloader link
                              <span>
                                y0uTube Downloader - 
                                <a 
                                  href="https://yt.retakt.cc" 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-block ml-1 hover:opacity-80 transition-opacity"
                                >
                                  <CanvasText
                                    text="yt.retakt.cc"
                                    className="text-[13px] font-medium align-middle whitespace-nowrap"
                                    backgroundClassName={VERSION_COLORS["v1.6-major"].bg}
                                    colors={VERSION_COLORS["v1.6-major"].lines}
                                    lineGap={1}
                                    animationDuration={30}
                                  />
                                </a>
                                {" "}(yt-dlp backend)
                              </span>
                            ) : (
                              item
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

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
              <span className="shrink-0 mt-0.5 text-[10px] font-bold" style={{ color: "#11D8C2", opacity: 0.6 }}>○</span>
              {item}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

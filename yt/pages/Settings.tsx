import { useState, useEffect } from "react";
import { ArrowLeft, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "../components/ThemeToggle";
import { AnimatedTooltip } from "../components/AnimatedTooltip";

type VideoQuality = "max" | "2160" | "1440" | "1080" | "720" | "480" | "360" | "240" | "144";
type VideoCodec = "h264" | "av1" | "vp9";
type AudioFormat = "best" | "mp3" | "opus" | "ogg" | "wav";
type FileContainer = "auto" | "mp4" | "webm" | "mkv";

interface Settings {
  videoQuality: VideoQuality;
  videoCodec: VideoCodec;
  audioFormat: AudioFormat;
  fileContainer: FileContainer;
  filenamePattern: string;
  audioQuality: string;
  embedThumbnail: boolean;
  embedMetadata: boolean;
  embedSubtitles: boolean;
  downloadSubtitles: boolean;
  subtitleLang: string;
}

const SETTINGS_KEY = "yt-downloader-settings";

const defaultSettings: Settings = {
  videoQuality: "1080",
  videoCodec: "h264",
  audioFormat: "mp3",
  fileContainer: "auto",
  filenamePattern: "%(title)s",
  audioQuality: "192",
  embedThumbnail: true,
  embedMetadata: true,
  embedSubtitles: false,
  downloadSubtitles: false,
  subtitleLang: "en",
};

function SettingButton({
  active,
  onClick,
  label,
  small,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-[9px] px-3 py-2 text-[13px] font-medium transition-all border",
        small && "px-2.5 py-1.5 text-[12px]",
        active
          ? "bg-[#18181b] text-white border-[#18181b] dark:bg-[#e1e1e1] dark:text-black dark:border-[#e1e1e1]"
          : "bg-transparent text-[#a1a1aa] border-transparent hover:bg-[#f4f4f5] hover:text-[#71717a] hover:border-[#e4e4e7] dark:bg-[#191919] dark:text-[#818181] dark:border-white/5 dark:hover:text-[#e1e1e1] dark:hover:border-white/10"
      )}
    >
      {label}
    </button>
  );
}

export default function Settings({ 
  onNavigate,
  theme,
  onThemeChange,
}: { 
  onNavigate: (page: string) => void;
  theme: "light" | "dark";
  onThemeChange: (theme: "light" | "dark") => void;
}) {
  // Load settings from localStorage
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  }, [settings]);

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    if (confirm("Reset all settings to defaults?")) {
      setSettings(defaultSettings);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b dark:border-white/5 border-black/5">
        <button
          onClick={() => onNavigate("home")}
          className={cn(
            "flex items-center gap-2 text-[13px] font-medium transition-all",
            "dark:text-[#818181] dark:hover:text-[#e1e1e1] dark:hover:bg-[#191919]",
            "text-[#75757e] hover:text-black hover:bg-[#e8e4d9]",
            "rounded-[9px] px-2 py-1.5"
          )}
        >
          <ArrowLeft size={16} />
          <span>back</span>
        </button>

        <div className="flex items-center gap-2 text-[15px] font-bold tracking-tight">
          <span className="dark:text-[#ed2236] text-[#ff0000]">YT</span>
          <span className="dark:text-[#818181] text-[#75757e]">.</span>
          <span className="dark:text-[#818181] text-[#75757e]">re</span>
        </div>

        <div className="w-16" />
      </header>

      {/* Main */}
      <main className="flex-1 px-6 py-8 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[20px] font-bold dark:text-[#e1e1e1] text-[#18181b]">settings</h1>
          
          <button
            onClick={resetSettings}
            className={cn(
              "text-[11px] font-medium px-3 py-1.5 rounded-[9px] transition-all",
              "dark:text-[#818181] dark:hover:text-[#e1e1e1] dark:hover:bg-[#191919]",
              "text-[#71717a] hover:text-[#3f3f46] hover:bg-[#f4f4f5]"
            )}
          >
            reset to defaults
          </button>
        </div>

        <div className="space-y-8">
          {/* Theme - DISABLED */}
          <div className="space-y-3 opacity-50 pointer-events-none">
            <div>
              <h2 className="text-[13px] font-bold uppercase tracking-widest dark:text-[#818181] text-[#75757e] mb-1">
                appearance (temporarily disabled)
              </h2>
              <p className="text-[12px] dark:text-[#818181] text-[#75757e] leading-relaxed">
                light mode styling issues - locked to dark mode for now.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[12px] dark:text-[#818181] text-[#75757e]">
                dark
              </span>
              <ThemeToggle theme="dark" onChange={() => {}} />
            </div>
          </div>

          {/* Video Quality */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[13px] font-bold uppercase tracking-widest dark:text-[#818181] text-[#75757e]">
                video quality
              </h2>
              <AnimatedTooltip content="Best available quality if selected isn't available">
                <Info size={13} className="dark:text-[#818181] text-[#75757e] cursor-help" />
              </AnimatedTooltip>
            </div>
            <p className="text-[12px] dark:text-[#818181] text-[#75757e] leading-relaxed">
              if preferred video quality isn't available, next best is picked instead.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(["max", "2160", "1440", "1080", "720", "480", "360", "240", "144"] as VideoQuality[]).map((q) => (
                <SettingButton
                  key={q}
                  active={settings.videoQuality === q}
                  onClick={() => updateSetting("videoQuality", q)}
                  label={q === "max" ? "max" : `${q}p`}
                  small
                />
              ))}
            </div>
          </div>

          {/* Video Codec */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[13px] font-bold uppercase tracking-widest dark:text-[#818181] text-[#75757e]">
                preferred youtube video codec
              </h2>
              <AnimatedTooltip content="Codec affects quality, file size, and compatibility">
                <Info size={13} className="dark:text-[#818181] text-[#75757e] cursor-help" />
              </AnimatedTooltip>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <SettingButton
                active={settings.videoCodec === "h264"}
                onClick={() => updateSetting("videoCodec", "h264")}
                label="h264 + aac"
              />
              <SettingButton
                active={settings.videoCodec === "av1"}
                onClick={() => updateSetting("videoCodec", "av1")}
                label="av1 + opus"
              />
              <SettingButton
                active={settings.videoCodec === "vp9"}
                onClick={() => updateSetting("videoCodec", "vp9")}
                label="vp9 + opus"
              />
            </div>
            <div className="text-[11px] dark:text-[#818181] text-[#75757e] leading-relaxed space-y-1">
              <p><span className="dark:text-[#e1e1e1] text-black">h264:</span> best compatibility, average quality. max quality is 1080p.</p>
              <p><span className="dark:text-[#e1e1e1] text-black">av1:</span> best quality and efficiency. supports 8k & HDR.</p>
              <p><span className="dark:text-[#e1e1e1] text-black">vp9:</span> same quality as av1, but file is ~2x bigger. supports 4k & HDR.</p>
            </div>
          </div>

          {/* File Container */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[13px] font-bold uppercase tracking-widest dark:text-[#818181] text-[#75757e]">
                youtube file container
              </h2>
              <AnimatedTooltip content="Container format for the downloaded video">
                <Info size={13} className="dark:text-[#818181] text-[#75757e] cursor-help" />
              </AnimatedTooltip>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(["auto", "mp4", "webm", "mkv"] as FileContainer[]).map((c) => (
                <SettingButton
                  key={c}
                  active={settings.fileContainer === c}
                  onClick={() => updateSetting("fileContainer", c)}
                  label={c}
                />
              ))}
            </div>
            <p className="text-[11px] dark:text-[#818181] text-[#75757e] leading-relaxed">
              when "auto" is selected, best container is picked automatically: mp4 for h264; webm for vp9/av1.
            </p>
          </div>

          {/* Audio Format */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[13px] font-bold uppercase tracking-widest dark:text-[#818181] text-[#75757e]">
                audio format
              </h2>
              <AnimatedTooltip content="Audio codec for downloads">
                <Info size={13} className="dark:text-[#818181] text-[#75757e] cursor-help" />
              </AnimatedTooltip>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(["best", "mp3", "opus", "ogg", "wav"] as AudioFormat[]).map((f) => (
                <SettingButton
                  key={f}
                  active={settings.audioFormat === f}
                  onClick={() => updateSetting("audioFormat", f)}
                  label={f}
                />
              ))}
            </div>
            <p className="text-[11px] dark:text-[#818181] text-[#75757e] leading-relaxed">
              "best" option downloads audio in best available format. usually it's opus.
            </p>
          </div>

          {/* Audio Quality */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[13px] font-bold uppercase tracking-widest dark:text-[#818181] text-[#75757e]">
                audio bitrate
              </h2>
              <AnimatedTooltip content="Higher bitrate = better quality, larger file">
                <Info size={13} className="dark:text-[#818181] text-[#75757e] cursor-help" />
              </AnimatedTooltip>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {["128", "192", "256", "320"].map((q) => (
                <SettingButton
                  key={q}
                  active={settings.audioQuality === q}
                  onClick={() => updateSetting("audioQuality", q)}
                  label={`${q}kbps`}
                  small
                />
              ))}
            </div>
            <p className="text-[11px] dark:text-[#818181] text-[#75757e] leading-relaxed">
              higher bitrate means better audio quality but larger file size.
            </p>
          </div>

          {/* Filename Pattern */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[13px] font-bold uppercase tracking-widest dark:text-[#818181] text-[#75757e]">
                filename pattern
              </h2>
              <AnimatedTooltip content="Use yt-dlp variables to customize filenames">
                <Info size={13} className="dark:text-[#818181] text-[#75757e] cursor-help" />
              </AnimatedTooltip>
            </div>
            <input
              type="text"
              value={settings.filenamePattern}
              onChange={(e) => updateSetting("filenamePattern", e.target.value)}
              className={cn(
                "w-full rounded-[9px] px-3 py-2 text-[13px] font-medium border outline-none transition-all",
                "bg-[#e8e4d9] text-black border-black/5 focus:border-[#ff0000]/40",
                "dark:bg-[#191919] dark:text-[#e1e1e1] dark:border-white/5 dark:focus:border-[#ed2236]/40"
              )}
              placeholder="%(title)s"
            />
            <p className="text-[11px] dark:text-[#818181] text-[#75757e] leading-relaxed">
              use <span className="dark:text-[#e1e1e1] text-black">%(title)s</span> for video title, <span className="dark:text-[#e1e1e1] text-black">%(id)s</span> for video id, <span className="dark:text-[#e1e1e1] text-black">%(ext)s</span> for extension.
            </p>
          </div>

          {/* Download Options */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[13px] font-bold uppercase tracking-widest dark:text-[#818181] text-[#75757e]">
                download options
              </h2>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={settings.embedThumbnail}
                  onChange={(e) => updateSetting("embedThumbnail", e.target.checked)}
                  className={cn(
                    "w-4 h-4 rounded border transition-all cursor-pointer",
                    "bg-[#e8e4d9] border-black/10 checked:bg-[#ff0000] checked:border-[#ff0000]",
                    "dark:bg-[#191919] dark:border-white/10 dark:checked:bg-[#ed2236] dark:checked:border-[#ed2236]"
                  )}
                />
                <span className="text-[12px] dark:text-[#e1e1e1] text-black group-hover:dark:text-white group-hover:text-black/80 transition-colors">
                  embed thumbnail in file
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={settings.embedMetadata}
                  onChange={(e) => updateSetting("embedMetadata", e.target.checked)}
                  className={cn(
                    "w-4 h-4 rounded border transition-all cursor-pointer",
                    "bg-[#e8e4d9] border-black/10 checked:bg-[#ff0000] checked:border-[#ff0000]",
                    "dark:bg-[#191919] dark:border-white/10 dark:checked:bg-[#ed2236] dark:checked:border-[#ed2236]"
                  )}
                />
                <span className="text-[12px] dark:text-[#e1e1e1] text-black group-hover:dark:text-white group-hover:text-black/80 transition-colors">
                  embed metadata (title, artist, etc.)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={settings.embedSubtitles}
                  onChange={(e) => updateSetting("embedSubtitles", e.target.checked)}
                  className={cn(
                    "w-4 h-4 rounded border transition-all cursor-pointer",
                    "bg-[#e8e4d9] border-black/10 checked:bg-[#ff0000] checked:border-[#ff0000]",
                    "dark:bg-[#191919] dark:border-white/10 dark:checked:bg-[#ed2236] dark:checked:border-[#ed2236]"
                  )}
                />
                <span className="text-[12px] dark:text-[#e1e1e1] text-black group-hover:dark:text-white group-hover:text-black/80 transition-colors">
                  embed subtitles (if available)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={settings.downloadSubtitles}
                  onChange={(e) => updateSetting("downloadSubtitles", e.target.checked)}
                  className={cn(
                    "w-4 h-4 rounded border transition-all cursor-pointer",
                    "bg-[#e8e4d9] border-black/10 checked:bg-[#ff0000] checked:border-[#ff0000]",
                    "dark:bg-[#191919] dark:border-white/10 dark:checked:bg-[#ed2236] dark:checked:border-[#ed2236]"
                  )}
                />
                <span className="text-[12px] dark:text-[#e1e1e1] text-black group-hover:dark:text-white group-hover:text-black/80 transition-colors">
                  download subtitles as separate file
                </span>
              </label>
            </div>
          </div>

          {/* Subtitle Language */}
          {settings.downloadSubtitles && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-[13px] font-bold uppercase tracking-widest dark:text-[#818181] text-[#75757e]">
                  subtitle language
                </h2>
                <AnimatedTooltip content="Language code (e.g., en, es, fr)">
                  <Info size={13} className="dark:text-[#818181] text-[#75757e] cursor-help" />
                </AnimatedTooltip>
              </div>
              <input
                type="text"
                value={settings.subtitleLang}
                onChange={(e) => updateSetting("subtitleLang", e.target.value)}
                className={cn(
                  "w-full rounded-[9px] px-3 py-2 text-[13px] font-medium border outline-none transition-all",
                  "bg-[#e8e4d9] text-black border-black/5 focus:border-[#ff0000]/40",
                  "dark:bg-[#191919] dark:text-[#e1e1e1] dark:border-white/5 dark:focus:border-[#ed2236]/40"
                )}
                placeholder="en"
              />
              <p className="text-[11px] dark:text-[#818181] text-[#75757e] leading-relaxed">
                use comma-separated codes for multiple languages (e.g., "en,es,fr")
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

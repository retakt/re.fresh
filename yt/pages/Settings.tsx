import { useState, useEffect } from "react";
import { ArrowLeft, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "../components/ThemeToggle";
import { AnimatedTooltip } from "../components/AnimatedTooltip";
import { CanvasText } from "../components/CanvasText";

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
          ? "dark:bg-[#e1e1e1] dark:text-black dark:border-[#e1e1e1] bg-black text-white border-black"
          : "dark:bg-[#191919] dark:text-[#9ca3af] dark:border-white/5 dark:hover:text-[#e1e1e1] dark:hover:border-white/10 bg-[#e8e4d9] text-[#9ca3af] border-black/5 hover:text-black hover:border-black/10"
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
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

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
      <header className="flex items-center justify-between px-4 py-2 border-b dark:border-white/5 border-black/5">
        <button
          onClick={() => onNavigate("home")}
          className={cn(
            "flex items-center gap-1.5 text-[13px] font-medium transition-all",
            "dark:text-[#9ca3af] dark:hover:text-[#e1e1e1] dark:hover:bg-[#191919]",
            "text-[#9ca3af] hover:text-black hover:bg-[#e8e4d9]",
            "rounded-[9px] px-1.5 py-1.5 -ml-1"
          )}
        >
          <ArrowLeft size={16} />
          <span>back</span>
        </button>

        <div className="flex items-center gap-1 text-[15px] font-bold tracking-tight">
          <CanvasText
            text="YT"
            className="text-[15px] font-bold align-middle"
            backgroundClassName="bg-[#ed2236]"
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
          <span className="dark:text-[#9ca3af] text-[#9ca3af]">.</span>
          <span className="dark:text-[#9ca3af] text-[#9ca3af]">reTakt</span>
        </div>

        <div className="w-16" />
      </header>

      <main className="flex-1 px-4 py-4 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-[20px] font-bold dark:text-[#e1e1e1] text-black">settings</h1>
          
          <button
            onClick={resetSettings}
            className={cn(
              "text-[11px] font-medium px-3 py-1.5 rounded-[9px] transition-all",
              "dark:text-[#9ca3af] dark:hover:text-[#e1e1e1] dark:hover:bg-[#191919]",
              "text-[#9ca3af] hover:text-black hover:bg-[#e8e4d9]"
            )}
          >
            reset to defaults
          </button>
        </div>

        <div className="space-y-6">
          {/* Theme */}
          <div className="space-y-3">
            <div>
              <h2 className="text-[13px] font-bold uppercase tracking-widest dark:text-[#9ca3af] text-[#9ca3af] mb-1">
                appearance
              </h2>
              <p className="text-[12px] dark:text-[#9ca3af] text-[#9ca3af] leading-relaxed">
                choose between light and dark theme.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[12px] dark:text-[#9ca3af] text-[#9ca3af]">
                {theme === "dark" ? "dark" : "light"}
              </span>
              <ThemeToggle theme={theme} onChange={onThemeChange} />
            </div>
          </div>

          {/* Video Quality */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[13px] font-bold uppercase tracking-widest dark:text-[#9ca3af] text-[#9ca3af]">
                video quality
              </h2>
              <AnimatedTooltip content="Best available quality if selected isn't available">
                <Info size={13} className="dark:text-[#9ca3af] text-[#9ca3af] cursor-help" />
              </AnimatedTooltip>
            </div>
            <p className="text-[12px] dark:text-[#9ca3af] text-[#9ca3af] leading-relaxed">
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
              <h2 className="text-[13px] font-bold uppercase tracking-widest dark:text-[#9ca3af] text-[#9ca3af]">
                preferred youtube video codec
              </h2>
              <AnimatedTooltip content="Codec affects quality, file size, and compatibility">
                <Info size={13} className="dark:text-[#9ca3af] text-[#9ca3af] cursor-help" />
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
            <div className="text-[11px] dark:text-[#9ca3af] text-[#9ca3af] leading-relaxed space-y-1">
              <p><span className="dark:text-[#e1e1e1] text-black">h264:</span> best compatibility, average quality. max quality is 1080p.</p>
              <p><span className="dark:text-[#e1e1e1] text-black">av1:</span> best quality and efficiency. supports 8k & HDR.</p>
              <p><span className="dark:text-[#e1e1e1] text-black">vp9:</span> same quality as av1, but file is ~2x bigger. supports 4k & HDR.</p>
            </div>
          </div>

          {/* File Container */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[13px] font-bold uppercase tracking-widest dark:text-[#9ca3af] text-[#9ca3af]">
                youtube file container
              </h2>
              <AnimatedTooltip content="Container format for the downloaded video">
                <Info size={13} className="dark:text-[#9ca3af] text-[#9ca3af] cursor-help" />
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
            <p className="text-[11px] dark:text-[#9ca3af] text-[#9ca3af] leading-relaxed">
              when "auto" is selected, best container is picked automatically: mp4 for h264; webm for vp9/av1.
            </p>
          </div>

          {/* Audio Format */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[13px] font-bold uppercase tracking-widest dark:text-[#9ca3af] text-[#9ca3af]">
                audio format
              </h2>
              <AnimatedTooltip content="Audio codec for downloads">
                <Info size={13} className="dark:text-[#9ca3af] text-[#9ca3af] cursor-help" />
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
            <p className="text-[11px] dark:text-[#9ca3af] text-[#9ca3af] leading-relaxed">
              "best" option downloads audio in best available format. usually it's opus.
            </p>
          </div>

          {/* Audio Quality */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[13px] font-bold uppercase tracking-widest dark:text-[#9ca3af] text-[#9ca3af]">
                audio bitrate
              </h2>
              <AnimatedTooltip content="Higher bitrate = better quality, larger file">
                <Info size={13} className="dark:text-[#9ca3af] text-[#9ca3af] cursor-help" />
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
            <p className="text-[11px] dark:text-[#9ca3af] text-[#9ca3af] leading-relaxed">
              higher bitrate means better audio quality but larger file size.
            </p>
          </div>

          {/* Filename Pattern */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[13px] font-bold uppercase tracking-widest dark:text-[#9ca3af] text-[#9ca3af]">
                filename pattern
              </h2>
              <AnimatedTooltip content="Use yt-dlp variables to customize filenames">
                <Info size={13} className="dark:text-[#9ca3af] text-[#9ca3af] cursor-help" />
              </AnimatedTooltip>
            </div>
            <input
              type="text"
              value={settings.filenamePattern}
              onChange={(e) => updateSetting("filenamePattern", e.target.value)}
              className={cn(
                "w-full rounded-[9px] px-3 py-2 text-[13px] font-medium border outline-none transition-all",
                "dark:bg-[#191919] dark:text-[#e1e1e1] dark:border-white/5 dark:focus:border-[#ed2236]/40",
                "bg-[#e8e4d9] text-black border-black/5 focus:border-[#ff0000]/40"
              )}
              placeholder="%(title)s"
            />
            <p className="text-[11px] dark:text-[#9ca3af] text-[#9ca3af] leading-relaxed">
              use <span className="dark:text-[#e1e1e1] text-black">%(title)s</span> for video title, <span className="dark:text-[#e1e1e1] text-black">%(id)s</span> for video id, <span className="dark:text-[#e1e1e1] text-black">%(ext)s</span> for extension.
            </p>
          </div>

          {/* Download Options */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[13px] font-bold uppercase tracking-widest dark:text-[#9ca3af] text-[#9ca3af]">
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
                    "dark:bg-[#191919] dark:border-white/10 dark:checked:bg-[#ed2236] dark:checked:border-[#ed2236]",
                    "bg-[#e8e4d9] border-black/10 checked:bg-[#ff0000] checked:border-[#ff0000]"
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
                    "dark:bg-[#191919] dark:border-white/10 dark:checked:bg-[#ed2236] dark:checked:border-[#ed2236]",
                    "bg-[#e8e4d9] border-black/10 checked:bg-[#ff0000] checked:border-[#ff0000]"
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
                    "dark:bg-[#191919] dark:border-white/10 dark:checked:bg-[#ed2236] dark:checked:border-[#ed2236]",
                    "bg-[#e8e4d9] border-black/10 checked:bg-[#ff0000] checked:border-[#ff0000]"
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
                    "dark:bg-[#191919] dark:border-white/10 dark:checked:bg-[#ed2236] dark:checked:border-[#ed2236]",
                    "bg-[#e8e4d9] border-black/10 checked:bg-[#ff0000] checked:border-[#ff0000]"
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
                <h2 className="text-[13px] font-bold uppercase tracking-widest dark:text-[#9ca3af] text-[#9ca3af]">
                  subtitle language
                </h2>
                <AnimatedTooltip content="Language code (e.g., en, es, fr)">
                  <Info size={13} className="dark:text-[#9ca3af] text-[#9ca3af] cursor-help" />
                </AnimatedTooltip>
              </div>
              <input
                type="text"
                value={settings.subtitleLang}
                onChange={(e) => updateSetting("subtitleLang", e.target.value)}
                className={cn(
                  "w-full rounded-[9px] px-3 py-2 text-[13px] font-medium border outline-none transition-all",
                  "dark:bg-[#191919] dark:text-[#e1e1e1] dark:border-white/5 dark:focus:border-[#ed2236]/40",
                  "bg-[#e8e4d9] text-black border-black/5 focus:border-[#ff0000]/40"
                )}
                placeholder="en"
              />
              <p className="text-[11px] dark:text-[#9ca3af] text-[#9ca3af] leading-relaxed">
                use comma-separated codes for multiple languages (e.g., "en,es,fr")
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

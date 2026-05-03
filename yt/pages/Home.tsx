import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "motion/react";
import {
  Music,
  Sparkles,
  VolumeX,
  ArrowRight,
  X,
  Settings as SettingsIcon,
  Clipboard,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NoticeBox } from "../components/NoticeBox";
import { getStoredSettings, type DownloadMode } from "../lib/settings";
import { startDownload, getDownloadStatus, cancelDownload, APIError } from "../lib/api";
import DownloadManager, { type DownloadItem } from "../components/DownloadManager";

function isValidYouTubeUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    return (
      u.hostname === "youtube.com" ||
      u.hostname === "www.youtube.com" ||
      u.hostname === "youtu.be" ||
      u.hostname === "m.youtube.com" ||
      u.hostname === "music.youtube.com"
    );
  } catch {
    return false;
  }
}

function ModeButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-[9px] px-3.5 py-2 text-[13px] font-medium transition-all",
        active
          ? "text-[#18181b] bg-[#18181b]/8 dark:text-white dark:bg-[#e1e1e1]/10"
          : "text-[#a1a1aa] hover:bg-[#f4f4f5] dark:text-[#818181] dark:hover:bg-[#191919]"
      )}
    >
      <Icon size={14} className="shrink-0" />
      <span>{label}</span>
    </button>
  );
}

export default function Home({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState<DownloadMode>("auto");
  const [loading, setLoading] = useState(false);
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // ANONYMOUS MODE: No persistence
  // Downloads are cleared on page refresh/close
  // This is intentional for privacy

  // Cleanup polling intervals on unmount
  useEffect(() => {
    return () => {
      pollIntervalsRef.current.forEach(interval => clearInterval(interval));
      pollIntervalsRef.current.clear();
    };
  }, []);

  // Cancel active downloads when user closes/refreshes page
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Cancel all active downloads
      downloads.forEach(download => {
        if (download.status === "pending" || download.status === "processing") {
          // Fire and forget - browser is closing anyway
          cancelDownload(download.id).catch(() => {});
        }
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [downloads]);

  // Poll for download status
  const pollDownloadStatus = useCallback((id: string) => {
    // Clear existing interval if any
    const existingInterval = pollIntervalsRef.current.get(id);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    // Poll every 2 seconds
    const interval = setInterval(async () => {
      try {
        const status = await getDownloadStatus(id);
        
        setDownloads(prev => prev.map(d => {
          if (d.id === id) {
            return {
              ...d,
              title: status.title || d.title,
              thumbnail: status.thumbnail || d.thumbnail,
              status: status.status === "completed" ? "completed" : 
                      status.status === "error" ? "error" : 
                      status.status === "downloading" ? "processing" : "pending",
              progress: status.progress,
              error: status.error,
            };
          }
          return d;
        }));

        // Stop polling if completed or error
        if (status.status === "completed" || status.status === "error") {
          clearInterval(interval);
          pollIntervalsRef.current.delete(id);
        }
      } catch (error) {
        console.error("Failed to poll status:", error);
        // Stop polling on repeated errors
        clearInterval(interval);
        pollIntervalsRef.current.delete(id);
        
        // Mark as error in UI
        setDownloads(prev => prev.map(d => {
          if (d.id === id) {
            return {
              ...d,
              status: "error" as const,
              error: "Failed to fetch status"
            };
          }
          return d;
        }));
      }
    }, 2000);

    pollIntervalsRef.current.set(id, interval);
  }, []);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text.trim());
    } catch {
      inputRef.current?.focus();
    }
  }, []);

  const handleClear = useCallback(() => {
    setUrl("");
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      const trimmed = url.trim();
      
      if (!trimmed) {
        return;
      }
      
      if (!isValidYouTubeUrl(trimmed)) {
        alert("Invalid YouTube URL");
        return;
      }

      setLoading(true);
      
      try {
        const settings = getStoredSettings();
        
        // Start download with backend API
        const response = await startDownload({
          url: trimmed,
          mode,
          settings,
        });
        
        // Add to download queue
        const newDownload: DownloadItem = {
          id: response.id,
          url: trimmed,
          title: response.title || "YouTube Video",
          thumbnail: response.thumbnail,
          status: "processing",
          progress: response.progress || 0,
          createdAt: Date.now(),
        };
        
        setDownloads(prev => [newDownload, ...prev]);
        
        // Start polling for status updates
        pollDownloadStatus(response.id);
        
        // Clear input
        setUrl("");
        
      } catch (error) {
        console.error("Download error:", error);
        
        if (error instanceof APIError) {
          alert("Download failed: " + error.message);
        } else {
          alert("Network error. Check console for details.");
        }
      } finally {
        setLoading(false);
      }
    },
    [url, mode, pollDownloadStatus]
  );

  const handleRemoveDownload = useCallback(async (id: string) => {
    // Stop polling if active
    const interval = pollIntervalsRef.current.get(id);
    if (interval) {
      clearInterval(interval);
      pollIntervalsRef.current.delete(id);
    }
    
    // Cancel download on server
    try {
      await cancelDownload(id);
    } catch (error) {
      console.error('Failed to cancel download:', error);
      // Continue with removal even if cancel fails
    }
    
    // Remove from list
    setDownloads(prev => prev.filter(d => d.id !== id));
  }, []);

  const handleClearDownloads = useCallback(async () => {
    // Stop all polling
    pollIntervalsRef.current.forEach(interval => clearInterval(interval));
    pollIntervalsRef.current.clear();
    
    // Cancel all downloads on server
    const cancelPromises = downloads.map(download => 
      cancelDownload(download.id).catch(console.error)
    );
    
    // Wait for all cancellations (with timeout)
    await Promise.race([
      Promise.all(cancelPromises),
      new Promise(resolve => setTimeout(resolve, 2000)) // 2 second timeout
    ]);
    
    // Clear all downloads
    setDownloads([]);
  }, [downloads]);

  const isYT = isValidYouTubeUrl(url);

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[15px] font-bold tracking-tight">
            <span className="dark:text-[#ed2236] text-[#ff0000]">YT</span>
            <span className="dark:text-[#818181] text-[#75757e]">.</span>
            <span className="dark:text-[#818181] text-[#75757e]">re</span>
          </div>
        </div>

        <button
          onClick={() => onNavigate("settings")}
          className={cn(
            "flex items-center gap-1.5 rounded-[9px] px-3 py-1.5 text-[12px] font-medium transition-all",
            "dark:text-[#818181] dark:hover:text-[#e1e1e1] dark:hover:bg-[#191919]",
            "text-[#71717a] hover:text-[#3f3f46] hover:bg-[#f4f4f5]"
          )}
        >
          <SettingsIcon size={13} />
          <span>settings</span>
        </button>
      </header>

      {/* Main */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-20">
        <div className="w-full max-w-[640px] space-y-6">
          
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl dark:bg-[#ed2236]/10 bg-[#ff0000]/10 dark:border-[#ed2236]/20 border-[#ff0000]/20 border">
              <Video size={32} className="dark:text-[#ed2236] text-[#ff0000]" />
            </div>
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="space-y-2">
            <div
              className={cn(
                "flex items-center rounded-[11px] border-[1.5px] transition-all",
                isYT
                  ? "border-[#ff0000]/40 shadow-[0_0_0_2px_rgba(255,0,0,0.1)] dark:border-[#ed2236]/40 dark:shadow-[0_0_0_2px_rgba(237,34,54,0.1)]"
                  : "border-[#e4e4e7] dark:border-[#383838]"
              )}
              style={{
                backgroundColor: document.documentElement.classList.contains('dark') ? '#000' : '#fff'
              }}
            >
              <div className="pl-4 pr-2 shrink-0">
                <Video
                  size={16}
                  className={cn(
                    "transition-colors",
                    isYT ? "text-[#ff0000] dark:text-[#ed2236]" : "text-[#adadb7] dark:text-[#383838]"
                  )}
                />
              </div>

              <input
                ref={inputRef}
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="paste the link here"
                className={cn(
                  "flex-1 bg-transparent py-3.5 text-[14px] font-medium outline-none",
                  "text-[#18181b]",
                  "dark:text-[#e1e1e1]",
                  "placeholder:text-[#a1a1aa]",
                  "placeholder:dark:text-[#818181]",
                  "placeholder:opacity-100"
                )}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />

              <div className="flex items-center gap-1 pr-2 shrink-0">
                {url && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="rounded-full p-1.5 dark:text-[#818181] dark:hover:text-[#e1e1e1] dark:hover:bg-white/5 text-[#75757e] hover:text-black hover:bg-black/5 transition-all"
                    aria-label="Clear"
                  >
                    <X size={14} />
                  </button>
                )}

                <button
                  type="submit"
                  disabled={loading || !isYT}
                  className={cn(
                    "flex items-center justify-center rounded-[10px] w-10 h-10 transition-all",
                    isYT
                      ? "bg-[#ff0000] hover:bg-[#cc0000] text-white dark:bg-[#ed2236] dark:hover:bg-[#d61c2e]"
                      : "bg-[#e8e4d9] text-[#adadb7] cursor-not-allowed dark:bg-[#191919] dark:text-[#383838]"
                  )}
                  aria-label="Download"
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 rounded-full border-2 border-current border-t-transparent"
                    />
                  ) : (
                    <ArrowRight size={16} />
                  )}
                </button>
              </div>
            </div>

            {/* Mode + Paste */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 rounded-[11px] p-1">
                <ModeButton
                  active={mode === "auto"}
                  onClick={() => setMode("auto")}
                  icon={Sparkles}
                  label="auto"
                />
                <ModeButton
                  active={mode === "audio"}
                  onClick={() => setMode("audio")}
                  icon={Music}
                  label="audio"
                />
                <ModeButton
                  active={mode === "mute"}
                  onClick={() => setMode("mute")}
                  icon={VolumeX}
                  label="mute"
                />
              </div>

              <button
                type="button"
                onClick={handlePaste}
                className={cn(
                  "flex items-center gap-1.5 rounded-[11px] px-3.5 py-2 text-[13px] font-medium transition-all",
                  "dark:text-[#818181] dark:hover:text-[#e1e1e1] dark:hover:bg-[#191919]",
                  "text-[#71717a] hover:text-[#3f3f46] hover:bg-[#f4f4f5]"
                )}
              >
                <Clipboard size={14} />
                <span>paste</span>
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Notice Box */}
      <NoticeBox>
        <p className="text-[12px] dark:text-[#818181] text-[#75757e] leading-relaxed break-words">
          supports <span className="dark:text-[#e1e1e1] text-black font-medium">youtube.com</span>,{" "}
          <span className="dark:text-[#e1e1e1] text-black font-medium">youtu.be</span>,{" "}
          <span className="dark:text-[#e1e1e1] text-black font-medium">music.youtube.com</span>.
          no account needed.
        </p>
      </NoticeBox>

      {/* Footer */}
      <footer className="px-5 py-5 text-center">
        <p className="text-[11px] dark:text-[#818181] text-[#75757e] font-medium">
          by continuing, you agree to{" "}
          <a href="/terms" className="dark:text-[#e1e1e1] text-black hover:underline">
            terms and ethics of use
          </a>
        </p>
      </footer>

      {/* Download Manager */}
      <DownloadManager
        downloads={downloads}
        onRemove={handleRemoveDownload}
        onClear={handleClearDownloads}
      />
    </div>
  );
}

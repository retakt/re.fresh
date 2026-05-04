import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "motion/react";
import {
  Music,
  Sparkles,
  VolumeX,
  ArrowRight,
  Settings as SettingsIcon,
  Clipboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NoticeBox } from "../components/NoticeBox";
import { CanvasText } from "../components/CanvasText";
import { CanvasSVG } from "../components/CanvasSVG";
import { TermsDialog } from "../components/TermsDialog";
import { EncryptedText } from "../components/EncryptedText";
import { AnimatedPasteIcon } from "../components/AnimatedPasteIcon";
import AnimatedCloseIcon from "../components/AnimatedCloseIcon";
import { getStoredSettings, type DownloadMode } from "../lib/settings";
import { startDownload, getDownloadStatus, cancelDownload, APIError } from "../lib/api";
import { isValidYouTubeUrl, normalizeYouTubeUrl } from "../lib/youtube";
import DownloadManager, { type DownloadItem } from "../components/DownloadManager";

const YouTubeSVG = `<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" viewBox="0 0 24 24" id="youtube" width="40" height="40">
  <path fill="#000000" d="M12 23.427c-1.172 0-2.345-.051-3.509-.152l-5.294-.46A3.48 3.48 0 0 1 0 19.328v-4.75a3.48 3.48 0 0 1 3.197-3.487l5.294-.46a40.513 40.513 0 0 1 7.018 0l5.294.46A3.482 3.482 0 0 1 24 14.578v4.75a3.48 3.48 0 0 1-3.197 3.487l-5.294.46a40.631 40.631 0 0 1-3.509.152zm0-11.948c-1.144 0-2.287.049-3.422.148l-5.294.46A2.488 2.488 0 0 0 1 14.578v4.75c0 1.307.982 2.377 2.284 2.491l5.294.46c2.271.197 4.574.197 6.844 0l5.294-.46A2.487 2.487 0 0 0 23 19.328v-4.75a2.487 2.487 0 0 0-2.284-2.491l-5.294-.46A39.802 39.802 0 0 0 12 11.479z"></path>
  <path fill="#000000" d="M4.5 20.578a.5.5 0 0 1-.5-.5v-6a.5.5 0 0 1 1 0v6a.5.5 0 0 1-.5.5z"></path>
  <path fill="#000000" d="M6.5 14.578h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 1 0 1zM4.5 5.578a.5.5 0 0 1-.4-.2l-3-4a.5.5 0 1 1 .8-.6l2.6 3.466L7.1.778a.5.5 0 0 1 .8.6l-3 4a.5.5 0 0 1-.4.2z"></path>
  <path fill="#000000" d="M4.5 9.578a.5.5 0 0 1-.5-.5v-4a.5.5 0 0 1 1 0v4a.5.5 0 0 1-.5.5zM10 9.578c-1.654 0-3-1.346-3-3v-1c0-1.654 1.346-3 3-3s3 1.346 3 3v1c0 1.655-1.346 3-3 3zm0-6c-1.103 0-2 .897-2 2v1c0 1.103.897 2 2 2s2-.897 2-2v-1c0-1.103-.897-2-2-2zM17 9.578c-1.654 0-3-1.346-3-3v-3.5a.5.5 0 0 1 1 0v3.5c0 1.103.897 2 2 2s2-.897 2-2v-3.5a.5.5 0 0 1 1 0v3.5c0 1.655-1.346 3-3 3z"></path>
  <path fill="#000000" d="M21.5 9.578c-2.5 0-2.5-2.634-2.5-3.5a.5.5 0 0 1 1 0c0 2.075.6 2.5 1.5 2.5a.5.5 0 0 1 0 1zM9 20.578c-1.103 0-2-.897-2-2v-2.5a.5.5 0 0 1 1 0v2.5c0 .551.449 1 1 1s1-.449 1-1v-2.5a.5.5 0 0 1 1 0v2.5c0 1.104-.897 2-2 2zM12.5 20.578a.5.5 0 0 1-.5-.5v-6a.5.5 0 0 1 1 0v6a.5.5 0 0 1-.5.5zM21 20.578h-1c-1.103 0-2-.897-2-2v-1c0-1.103.897-2 2-2s2 .897 2 2v.5a.5.5 0 0 1-.5.5H19c0 .551.449 1 1 1h1a.5.5 0 0 1 0 1zm-2-3h2c0-.551-.449-1-1-1s-1 .449-1 1z"></path>
  <path fill="#000000" d="M14.5 20.578c-1.378 0-2.5-1.122-2.5-2.5s1.122-2.5 2.5-2.5 2.5 1.122 2.5 2.5-1.122 2.5-2.5 2.5zm0-4c-.827 0-1.5.673-1.5 1.5s.673 1.5 1.5 1.5 1.5-.673 1.5-1.5-.673-1.5-1.5-1.5z"></path>
</svg>`;

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
          : "text-[#a1a1aa] hover:bg-[#f4f4f5] dark:text-[#9ca3af] dark:hover:bg-[#191919]"
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
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [showEncrypted, setShowEncrypted] = useState(false);
  const [encryptedUrl, setEncryptedUrl] = useState("");
  const [isPasteAnimating, setIsPasteAnimating] = useState(false);
  const [hasValidUrl, setHasValidUrl] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const hasAutoPastedRef = useRef(false);

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

  // Handle manual paste event (Ctrl+V or right-click paste)
  const handleManualPaste = useCallback(async (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    const pastedText = e.clipboardData.getData('text');
    const trimmed = pastedText.trim();
    
    if (trimmed && isValidYouTubeUrl(trimmed)) {
      const normalized = normalizeYouTubeUrl(trimmed);
      
      if (normalized) {
        // Set valid URL state immediately (turns icon red)
        setHasValidUrl(true);
        
        // Trigger paste icon animation
        setIsPasteAnimating(true);
        setTimeout(() => setIsPasteAnimating(false), 500);
        
        setEncryptedUrl(normalized);
        setShowEncrypted(true);
      }
    } else {
      // Not a YouTube URL, just paste normally
      setHasValidUrl(false);
      setUrl(trimmed);
    }
  }, []);

  // Auto-detect and paste YouTube URL from clipboard on focus
  const handleInputFocus = useCallback(async () => {
    // Only auto-paste once per session and if input is empty
    if (hasAutoPastedRef.current || url) return;
    
    try {
      const clipboardText = await navigator.clipboard.readText();
      const trimmed = clipboardText.trim();
      
      // Check if clipboard contains a YouTube URL
      if (trimmed && isValidYouTubeUrl(trimmed)) {
        const normalized = normalizeYouTubeUrl(trimmed);
        
        if (normalized) {
          hasAutoPastedRef.current = true;
          
          // Set valid URL state immediately (turns icon red)
          setHasValidUrl(true);
          
          // Trigger paste icon animation
          setIsPasteAnimating(true);
          setTimeout(() => setIsPasteAnimating(false), 500);
          
          setEncryptedUrl(normalized);
          setShowEncrypted(true);
        }
      }
    } catch (error) {
      // Clipboard access denied or not available
      console.log("Clipboard access not available");
    }
  }, [url]);

  const handleEncryptedComplete = useCallback(() => {
    setShowEncrypted(false);
    setUrl(encryptedUrl);
    setEncryptedUrl("");
  }, [encryptedUrl]);

  const handleClear = useCallback(() => {
    setUrl("");
    setHasValidUrl(false);
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

      // Normalize the URL to standard format
      const normalizedUrl = normalizeYouTubeUrl(trimmed);
      
      if (!normalizedUrl) {
        alert("Could not parse YouTube URL");
        return;
      }

      setLoading(true);
      
      try {
        const settings = getStoredSettings();
        
        // Start download with normalized URL
        const response = await startDownload({
          url: normalizedUrl, // Send normalized URL to backend
          mode,
          settings,
        });
        
        // Add to download queue
        const newDownload: DownloadItem = {
          id: response.id,
          url: normalizedUrl, // Store normalized URL
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
      <header className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3">
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
        </div>

        <button
          onClick={() => onNavigate("settings")}
          className={cn(
            "flex items-center gap-1.5 rounded-[9px] px-1.5 py-1.5 text-[12px] font-medium transition-all duration-150 -mr-1",
            "text-white hover:text-black hover:bg-[#d1d5db]"
          )}
        >
          <SettingsIcon size={13} />
          <span>settings</span>
        </button>
      </header>

      {/* Main */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-16">
        <div className="w-full max-w-[640px] space-y-4">
          
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              {/* Pulsing outer ring */}
              <div className="absolute inset-0 rounded-2xl animate-pulse-ring" 
                style={{
                  animation: 'pulse-ring 5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  boxShadow: '0 0 0 24px rgba(34, 255, 94, 0)',
                }}
              />
              
              {/* Main logo container */}
              <div className="relative w-16 h-16 rounded-2xl bg-[#dc143c] border-2 border-[#ff6b8a]/20 overflow-hidden shadow-lg shadow-[#dc143c]/30 animate-heartbeat"
                style={{
                  animation: 'heartbeat 5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                }}
              >
                <CanvasSVG
                  svgContent={YouTubeSVG}
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
                  lineGap={2}
                  animationDuration={15}
                  opacity={0.35}
                />
              </div>
            </div>
            
            <style>{`
              @keyframes pulse-ring {
                0% {
                  box-shadow: 0 0 0 0 rgba(34, 255, 94, 0.38);
                }
                5% {
                  box-shadow: 0 0 0 4px rgba(34, 255, 94, 0.29);
                }
                10% {
                  box-shadow: 0 0 0 8px rgba(34, 255, 94, 0.21);
                }
                15% {
                  box-shadow: 0 0 0 12px rgba(34, 255, 94, 0.13);
                }
                20% {
                  box-shadow: 0 0 0 16px rgba(34, 255, 94, 0.06);
                }
                25% {
                  box-shadow: 0 0 0 24px rgba(34, 255, 94, 0);
                }
                26%, 49% {
                  box-shadow: 0 0 0 0 rgba(34, 255, 94, 0);
                }
                50% {
                  box-shadow: 0 0 0 0 rgba(34, 255, 94, 0.38);
                }
                55% {
                  box-shadow: 0 0 0 4px rgba(34, 255, 94, 0.29);
                }
                60% {
                  box-shadow: 0 0 0 8px rgba(34, 255, 94, 0.21);
                }
                65% {
                  box-shadow: 0 0 0 12px rgba(34, 255, 94, 0.13);
                }
                70% {
                  box-shadow: 0 0 0 16px rgba(34, 255, 94, 0.06);
                }
                75% {
                  box-shadow: 0 0 0 24px rgba(34, 255, 94, 0);
                }
                76%, 100% {
                  box-shadow: 0 0 0 0 rgba(34, 255, 94, 0);
                }
              }
              
              @keyframes heartbeat {
                0% {
                  transform: scale(1);
                }
                10% {
                  transform: scale(1.05);
                }
                20% {
                  transform: scale(1);
                }
                50% {
                  transform: scale(1);
                }
                60% {
                  transform: scale(1.05);
                }
                70% {
                  transform: scale(1);
                }
                100% {
                  transform: scale(1);
                }
              }
            `}</style>
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
              <div className="pl-4 pr-2 shrink-0 mt-1">
                <AnimatedPasteIcon
                  isAnimating={isPasteAnimating}
                  size={15}
                  className={cn(
                    "transition-colors",
                    hasValidUrl ? "text-[#ff0000] dark:text-[#ed2236]" : "text-[#adadb7] dark:text-[#383838]"
                  )}
                />
              </div>

              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onFocus={handleInputFocus}
                  onPaste={handleManualPaste}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder="paste your link!"
                  className={cn(
                    "w-full bg-transparent py-3.5 text-[14px] font-medium outline-none",
                    "text-[#18181b]",
                    "dark:text-[#e1e1e1]",
                    "placeholder:text-[#a1a1aa]",
                    "placeholder:dark:text-[#9ca3af]",
                    "placeholder:opacity-100",
                    showEncrypted && "opacity-0"
                  )}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
                
                {/* Encrypted Text Overlay */}
                {showEncrypted && encryptedUrl && (
                  <div className="absolute inset-0 flex items-center pointer-events-none">
                    <EncryptedText
                      text={encryptedUrl}
                      className="text-[14px] font-medium dark:text-[#e1e1e1] text-[#18181b]"
                      revealDelayMs={20}
                      flipDelayMs={20}
                      onComplete={handleEncryptedComplete}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 pr-2 shrink-0">
                {url && (
                  <AnimatedCloseIcon
                    onClick={handleClear}
                    size={24}
                    className="dark:text-[#9ca3af] dark:hover:text-[#e1e1e1] text-[#9ca3af] hover:text-black"
                  />
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
                  "dark:text-[#9ca3af] dark:hover:text-[#e1e1e1] dark:hover:bg-[#191919]",
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
        <p className="text-[12px] dark:text-[#9ca3af] text-[#9ca3af] leading-relaxed break-words text-center">
          supports <span className="dark:text-[#e1e1e1] text-black font-bold">youtube.com</span>,{" "}
          <span className="dark:text-[#e1e1e1] text-black font-bold">youtu.be</span>,{" "}
          <span className="dark:text-[#e1e1e1] text-black font-bold">music.youtube.com</span>.{" "}
          <CanvasText
            text="free for everyone"
            className="text-[12px] font-bold align-middle"
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
        </p>
      </NoticeBox>

      {/* Footer */}
      <footer className="px-5 py-3 text-center">
        <p className="text-[11px] dark:text-[#9ca3af] text-[#9ca3af] font-medium">
          by downloading, you agree to{" "}
          <button 
            onClick={() => setIsTermsOpen(true)}
            className="dark:text-[#e1e1e1] text-black hover:underline cursor-pointer"
          >
            terms and conditions!
          </button>
        </p>
      </footer>

      {/* Terms Dialog */}
      <TermsDialog isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />

      {/* Download Manager */}
      <DownloadManager
        downloads={downloads}
        onRemove={handleRemoveDownload}
        onClear={handleClearDownloads}
      />
    </div>
  );
}

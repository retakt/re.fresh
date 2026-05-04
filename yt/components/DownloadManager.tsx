import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle2, AlertCircle, Loader2, ArrowDown, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDownloadFileUrl } from "../lib/api";
import AnimatedCloseIcon from "./AnimatedCloseIcon";
import NotificationBadge from "./smoothui/notification-badge";

export interface DownloadItem {
  id: string;
  url: string;
  title?: string;
  thumbnail?: string;
  status: "pending" | "processing" | "completed" | "error";
  progress?: number;
  error?: string;
  createdAt: number;
}

interface DownloadManagerProps {
  downloads: DownloadItem[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

function DownloadCard({ download, onRemove }: { download: DownloadItem; onRemove: () => void }) {
  const getStatusIcon = () => {
    switch (download.status) {
      case "pending":
      case "processing":
        return <Loader2 size={16} className="animate-spin dark:text-[#ed2236] text-[#ff0000]" />;
      case "completed":
        return <CheckCircle2 size={16} className="dark:text-green-400 text-green-600" />;
      case "error":
        return <AlertCircle size={16} className="dark:text-red-400 text-red-600" />;
    }
  };

  const getStatusText = () => {
    switch (download.status) {
      case "pending":
        return "queued...";
      case "processing":
        return download.progress ? `${download.progress}%` : "processing...";
      case "completed":
        return "ready to download";
      case "error":
        return download.error || "failed";
    }
  };

  const handleDownload = () => {
    if (download.status === "completed") {
      const downloadUrl = getDownloadFileUrl(download.id);
      window.open(downloadUrl, "_blank");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn(
        "flex items-center gap-3 rounded-[11px] border p-3 transition-all",
        "dark:border-white/5 dark:bg-[#191919]",
        "border-black/5 bg-[#e8e4d9]"
      )}
    >
      {/* Thumbnail or Icon */}
      <div className="shrink-0">
        {download.thumbnail ? (
          <img
            src={download.thumbnail}
            alt=""
            className="w-12 h-12 rounded-lg object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg dark:bg-[#ed2236]/10 bg-[#ff0000]/10 flex items-center justify-center">
            {getStatusIcon()}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium dark:text-[#e1e1e1] text-black truncate">
          {download.title || "YouTube Video"}
        </p>
        <p className="text-[11px] dark:text-[#9ca3af] text-[#9ca3af] mt-0.5">
          {getStatusText()}
        </p>
        
        {/* Progress Bar */}
        {download.status === "processing" && download.progress !== undefined && (
          <div className="mt-2 h-1 rounded-full dark:bg-white/5 bg-black/5 overflow-hidden">
            <motion.div
              className="h-full dark:bg-[#ed2236] bg-[#ff0000]"
              initial={{ width: 0 }}
              animate={{ width: `${download.progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {download.status === "completed" && (
          <button
            onClick={handleDownload}
            className={cn(
              "rounded-[9px] px-3 py-1.5 text-[12px] font-medium transition-all",
              "dark:bg-[#ed2236] dark:hover:bg-[#d61c2e] dark:text-white",
              "bg-[#ff0000] hover:bg-[#cc0000] text-white",
              "flex items-center gap-1.5"
            )}
          >
            <Download size={12} />
            <span>download</span>
          </button>
        )}
        
        <button
          onClick={onRemove}
          className="rounded-full p-1.5 dark:text-[#9ca3af] dark:hover:text-[#e1e1e1] dark:hover:bg-white/5 text-[#9ca3af] hover:text-black hover:bg-black/5 transition-all"
          aria-label="Remove"
        >
          <X size={14} />
        </button>
      </div>
    </motion.div>
  );
}

export default function DownloadManager({ downloads, onRemove, onClear }: DownloadManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const activeDownloads = downloads.filter(d => d.status === "pending" || d.status === "processing");
  const completedDownloads = downloads.filter(d => d.status === "completed");
  const hasDownloads = downloads.length > 0;
  const hasCompletedDownloads = completedDownloads.length > 0;

  // Auto-open when there are downloads
  useEffect(() => {
    if (hasDownloads) {
      setIsOpen(true);
    }
  }, [hasDownloads]);

  // Click outside to close - simplified approach
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Check if click is outside both panel and button
      if (
        panelRef.current &&
        buttonRef.current &&
        !panelRef.current.contains(target) &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    // Add listener after a small delay to avoid immediate closure
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      {/* Floating Button - Top Right under Settings */}
      <div className="fixed top-20 right-6 z-50">
        <NotificationBadge
          variant="count"
          count={activeDownloads.length > 0 ? activeDownloads.length : completedDownloads.length}
          max={99}
          showZero={false}
          position="top-right"
          className={cn(
            activeDownloads.length > 0 
              ? "bg-white text-[#ed2236]" // White background for active downloads
              : "bg-green-500 text-white"  // Green background for completed downloads
          )}
        >
          <motion.button
            ref={buttonRef}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "w-10 h-10 rounded-full shadow-lg",
              "flex items-center justify-center",
              "transition-all border-2",
              hasDownloads 
                ? "dark:bg-[#ed2236] dark:hover:bg-[#d61c2e] bg-[#ff0000] hover:bg-[#cc0000] border-transparent" 
                : "dark:bg-transparent dark:hover:bg-[#ed2236]/10 bg-transparent hover:bg-[#ff0000]/10 dark:border-[#ed2236] border-[#ff0000]"
            )}
            style={{
              boxShadow: hasDownloads 
                ? '0 0 0 0 rgba(237, 34, 54, 0.7)' 
                : 'none',
              animation: hasDownloads 
                ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' 
                : 'none'
            }}
          >
            <ArrowDown 
              size={14} 
              className={cn(
                "transition-colors",
                hasDownloads ? "text-white" : "dark:text-[#ed2236] text-[#ff0000]"
              )} 
            />
          </motion.button>
        </NotificationBadge>
      </div>

      {/* Download Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Invisible backdrop for click-outside */}
            <div
              className="fixed inset-0 z-30"
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, x: 20, y: -10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 20, y: -10 }}
              className={cn(
                "fixed top-36 right-6 z-40",
                "w-[400px] max-w-[calc(100vw-3rem)]",
                "rounded-[15px] border shadow-2xl",
                "dark:border-white/10 dark:bg-[#0a0a0a]",
                "border-black/10 bg-white",
                "overflow-hidden"
              )}
            >
              {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b dark:border-white/5 border-black/5">
              <div className="flex items-center gap-2">
                <ArrowDown size={16} className="dark:text-[#ed2236] text-[#ff0000]" />
                <h3 className="text-[14px] font-bold dark:text-[#e1e1e1] text-black">
                  Downloads {hasDownloads && `(${downloads.length})`}
                </h3>
              </div>
              
              <div className="flex items-center gap-1">
                {downloads.length > 0 && (
                  <button
                    onClick={onClear}
                    className="text-[11px] font-medium px-2 py-1 rounded-[7px] dark:text-[#9ca3af] dark:hover:text-[#e1e1e1] dark:hover:bg-[#191919] text-[#9ca3af] hover:text-black hover:bg-[#e8e4d9] transition-all"
                  >
                    clear all
                  </button>
                )}
                <AnimatedCloseIcon
                  onClick={() => setIsOpen(false)}
                  size={20}
                  className="dark:text-[#9ca3af] dark:hover:text-[#e1e1e1] text-[#9ca3af] hover:text-black"
                />
              </div>
            </div>

            {/* Downloads List or Empty State */}
            <div className="max-h-[400px] overflow-y-auto p-3">
              {hasDownloads ? (
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {downloads.map((download) => (
                      <DownloadCard
                        key={download.id}
                        download={download}
                        onRemove={() => onRemove(download.id)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 px-4">
                  <div className="w-16 h-16 rounded-full dark:bg-[#191919] bg-[#e8e4d9] flex items-center justify-center mb-3">
                    <ArrowDown size={24} className="dark:text-[#9ca3af] text-[#9ca3af]" />
                  </div>
                  <p className="text-[12px] font-medium dark:text-[#e1e1e1] text-black mb-1">
                    its quiet here heh.
                  </p>
                  <p className="text-[11px] dark:text-[#9ca3af] text-[#9ca3af]">
                    try downloading!
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            {completedDownloads.length > 0 && (
              <div className="px-4 py-2 border-t dark:border-white/5 border-black/5">
                <p className="text-[11px] dark:text-[#9ca3af] text-[#9ca3af] text-center">
                  {completedDownloads.length} download{completedDownloads.length !== 1 ? "s" : ""} ready
                </p>
              </div>
            )}
          </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

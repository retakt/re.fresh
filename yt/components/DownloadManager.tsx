import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Download, X, CheckCircle2, AlertCircle, Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDownloadFileUrl, type DownloadResponse } from "../lib/api";

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
        <p className="text-[11px] dark:text-[#818181] text-[#75757e] mt-0.5">
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
          className="rounded-full p-1.5 dark:text-[#818181] dark:hover:text-[#e1e1e1] dark:hover:bg-white/5 text-[#75757e] hover:text-black hover:bg-black/5 transition-all"
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
  const activeDownloads = downloads.filter(d => d.status === "pending" || d.status === "processing");
  const completedDownloads = downloads.filter(d => d.status === "completed");
  const hasDownloads = downloads.length > 0;

  // Auto-open when there are downloads
  useEffect(() => {
    if (hasDownloads) {
      setIsOpen(true);
    }
  }, [hasDownloads]);

  if (!hasDownloads) return null;

  return (
    <>
      {/* Floating Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50",
          "w-14 h-14 rounded-full shadow-lg",
          "dark:bg-[#ed2236] dark:hover:bg-[#d61c2e]",
          "bg-[#ff0000] hover:bg-[#cc0000]",
          "flex items-center justify-center",
          "transition-all"
        )}
      >
        <div className="relative">
          <Download size={20} className="text-white" />
          {activeDownloads.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full dark:bg-white bg-white text-[10px] font-bold dark:text-[#ed2236] text-[#ff0000] flex items-center justify-center">
              {activeDownloads.length}
            </span>
          )}
        </div>
      </motion.button>

      {/* Download Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={cn(
              "fixed bottom-24 right-6 z-40",
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
                <Download size={16} className="dark:text-[#ed2236] text-[#ff0000]" />
                <h3 className="text-[14px] font-bold dark:text-[#e1e1e1] text-black">
                  Downloads ({downloads.length})
                </h3>
              </div>
              
              <div className="flex items-center gap-1">
                {downloads.length > 0 && (
                  <button
                    onClick={onClear}
                    className="text-[11px] font-medium px-2 py-1 rounded-[7px] dark:text-[#818181] dark:hover:text-[#e1e1e1] dark:hover:bg-[#191919] text-[#75757e] hover:text-black hover:bg-[#e8e4d9] transition-all"
                  >
                    clear all
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-1 dark:text-[#818181] dark:hover:text-[#e1e1e1] dark:hover:bg-white/5 text-[#75757e] hover:text-black hover:bg-black/5 transition-all"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Downloads List */}
            <div className="max-h-[400px] overflow-y-auto p-3 space-y-2">
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

            {/* Footer */}
            {completedDownloads.length > 0 && (
              <div className="px-4 py-2 border-t dark:border-white/5 border-black/5">
                <p className="text-[11px] dark:text-[#818181] text-[#75757e] text-center">
                  {completedDownloads.length} download{completedDownloads.length !== 1 ? "s" : ""} ready
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

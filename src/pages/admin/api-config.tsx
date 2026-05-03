import { useState, useEffect, useRef } from "react";
import { Video, AlertCircle, CheckCircle2, ChevronDown, Upload, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SystemStatus {
  cookies: {
    exists: boolean;
    ageInDays: number | null;
    needsRotation: boolean;
  };
  warp: {
    exists: boolean;
    ageInDays: number | null;
    currentIP: string | null;
    connected: boolean;
  };
  timestamp: string;
}

interface Stats {
  queue: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  };
  timestamp: string;
}

const API_URL = "https://yt.retakt.cc/api/admin";

// Number Flow Component
function NumberFlow({ value, className = "" }: { value: number; className?: string }) {
  return (
    <motion.div
      key={value}
      initial={{ scale: 1.3, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={className}
    >
      {value}
    </motion.div>
  );
}

export default function YouTubeDownloaderAdmin() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [cookieText, setCookieText] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");
  const [showInstructions, setShowInstructions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Force animations to always show (ignore reduced motion preference for this admin panel)
  const prefersReducedMotion = false;

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchStatus(), fetchStats()]);
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/status`);
      if (res.ok) {
        setStatus(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch status:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/stats`);
      if (res.ok) {
        setStats(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      setCookieText(content);
      
      // Auto-upload if valid
      if (content.includes("# Netscape HTTP Cookie File")) {
        await uploadCookies(content);
      } else {
        showMessage("Invalid cookie file format", "error");
      }
    };
    reader.readAsText(file);
  };

  const uploadCookies = async (cookies: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/cookies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cookies }),
      });

      const data = await res.json();
      if (res.ok) {
        showMessage("✅ Cookies updated successfully!", "success");
        setCookieText("");
        setTimeout(() => {
          fetchStatus();
          setMessage("");
        }, 3000);
      } else {
        showMessage(`❌ ${data.error}`, "error");
      }
    } catch (error) {
      showMessage("❌ Failed to upload cookies", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadCookies = async () => {
    if (!cookieText.trim()) {
      showMessage("Please paste cookies or upload a file", "error");
      return;
    }

    if (!cookieText.includes("# Netscape HTTP Cookie File")) {
      showMessage("Invalid format. Cookies must be in Netscape format.", "error");
      return;
    }

    await uploadCookies(cookieText);
  };

  const showMessage = (msg: string, type: "success" | "error" | "info") => {
    setMessage(msg);
    setMessageType(type);
  };

  const getCleanIP = (ipString: string | null): string => {
    if (!ipString) return "Unknown";
    if (ipString.includes("<!DOCTYPE")) {
      const match = ipString.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
      return match ? match[0] : "Unknown";
    }
    return ipString;
  };

  return (
    <div className="space-y-3 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
          <Video className="w-4 h-4 text-red-500" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">API & Configs</h1>
          <p className="text-xs text-muted-foreground">yt-dlp stats • auto-refresh every 30s</p>
        </div>
      </div>

      {/* Status Grid - Compact */}
      <div className="grid grid-cols-2 gap-2">
        {/* Cookies Status */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-visible rounded-lg border border-border bg-card p-3"
          style={{ isolation: 'isolate' }}
        >
          {/* Pulse animation - GREEN when active, RED when missing/needs rotation */}
          <motion.div
            className="absolute inset-0 pointer-events-none rounded-lg z-0"
            initial={{
              backgroundColor: (status?.cookies.exists && !status?.cookies.needsRotation)
                ? "rgba(34, 197, 94, 0.05)"
                : "rgba(239, 68, 68, 0.05)"
            }}
            animate={{
              backgroundColor: (status?.cookies.exists && !status?.cookies.needsRotation)
                ? [
                    "rgba(34, 197, 94, 0.05)",
                    "rgba(34, 197, 94, 0.15)",
                    "rgba(34, 197, 94, 0.05)"
                  ]
                : [
                    "rgba(239, 68, 68, 0.05)",
                    "rgba(239, 68, 68, 0.15)",
                    "rgba(239, 68, 68, 0.05)"
                  ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 1,
              ease: "easeInOut",
            }}
          />
          
          <div className="flex items-start justify-between mb-2 relative z-10">
            <div className="flex items-center gap-1.5">
              <div className="text-xs font-medium text-muted-foreground">Cookies</div>
              {status?.cookies.needsRotation && (
                <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                  ⚠️ Rotation needed
                </div>
              )}
            </div>
            <motion.div
              animate={{
                scale: !prefersReducedMotion ? [1, 1.15, 1] : 1,
              }}
              transition={{
                duration: 0.6,
                repeat: !prefersReducedMotion ? Infinity : 0,
                repeatDelay: 4.4,
                ease: "easeInOut",
              }}
            >
              {status?.cookies.exists && !status?.cookies.needsRotation ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-red-500" />
              )}
            </motion.div>
          </div>
          
          {status?.cookies && (
            <div className="space-y-1 relative z-10">
              <div className="text-sm font-semibold">
                {status.cookies.exists 
                  ? (status.cookies.needsRotation ? "Needs Rotation" : "Active")
                  : "Missing"}
              </div>
              {status.cookies.ageInDays !== null && (
                <div className="text-xs text-muted-foreground">
                  {status.cookies.ageInDays} days old
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Network Status */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-visible rounded-lg border border-border bg-card p-3"
          style={{ isolation: 'isolate' }}
        >
          {/* Pulse animation - BLUE when connected, RED when disconnected */}
          <motion.div
            className="absolute inset-0 pointer-events-none rounded-lg z-0"
            initial={{
              backgroundColor: status?.warp.connected
                ? "rgba(59, 130, 246, 0.05)"
                : "rgba(239, 68, 68, 0.05)"
            }}
            animate={{
              backgroundColor: status?.warp.connected
                ? [
                    "rgba(59, 130, 246, 0.05)",
                    "rgba(59, 130, 246, 0.15)",
                    "rgba(59, 130, 246, 0.05)"
                  ]
                : [
                    "rgba(239, 68, 68, 0.05)",
                    "rgba(239, 68, 68, 0.15)",
                    "rgba(239, 68, 68, 0.05)"
                  ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 1,
              ease: "easeInOut",
            }}
          />
          
          <div className="flex items-start justify-between mb-2 relative z-10">
            <div className="text-xs font-medium text-muted-foreground">Network [WARP++]</div>
            <motion.div
              animate={{
                rotate: status?.warp.connected && !prefersReducedMotion ? 360 : 0,
              }}
              transition={{
                duration: 2,
                repeat: status?.warp.connected && !prefersReducedMotion ? Infinity : 0,
                ease: "linear",
              }}
            >
              {status?.warp.connected ? (
                <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-red-500" />
              )}
            </motion.div>
          </div>
          
          {status?.warp && (
            <div className="space-y-1 relative z-10">
              <div className="text-sm font-semibold">
                {status.warp.connected ? "Connected" : "Disconnected"}
              </div>
              {status.warp.currentIP && (
                <div className="text-xs text-muted-foreground font-mono break-all">
                  {getCleanIP(status.warp.currentIP)}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Queue Stats - Compact with Number Flow */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-lg border bg-card p-3"
        >
          <div className="text-xs font-medium text-muted-foreground mb-2">Queue Statistics</div>
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center">
              <NumberFlow value={stats.queue.waiting} className="text-lg font-bold text-yellow-500" />
              <div className="text-[10px] text-muted-foreground mt-0.5">Waiting</div>
            </div>
            <div className="text-center">
              <NumberFlow value={stats.queue.active} className="text-lg font-bold text-blue-500" />
              <div className="text-[10px] text-muted-foreground mt-0.5">Active</div>
            </div>
            <div className="text-center">
              <NumberFlow value={stats.queue.completed} className="text-lg font-bold text-green-500" />
              <div className="text-[10px] text-muted-foreground mt-0.5">Done</div>
            </div>
            <div className="text-center">
              <NumberFlow value={stats.queue.failed} className="text-lg font-bold text-red-500" />
              <div className="text-[10px] text-muted-foreground mt-0.5">Failed</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Cookie Upload - With File Upload */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-lg border bg-card p-3"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-medium text-muted-foreground">Upload New Cookies</div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 transition-colors"
          >
            <Upload className="w-3 h-3" />
            Upload File
          </button>
        </div>
        
        {/* Accordion Instructions */}
        <div className="mb-2">
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="flex items-center justify-between w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            <span>How to export cookies</span>
            <motion.div
              animate={{ rotate: showInstructions ? 180 : 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <ChevronDown className="w-3 h-3" />
            </motion.div>
          </button>

          <motion.div
            initial={false}
            animate={{
              height: showInstructions ? "auto" : 0,
              opacity: showInstructions ? 1 : 0,
            }}
            transition={{
              height: { duration: 0.2, ease: "easeInOut" },
              opacity: { duration: 0.15, ease: "easeInOut" },
            }}
            className="overflow-hidden"
          >
            <ol className="list-decimal list-inside text-[11px] text-muted-foreground space-y-0.5 ml-2 pt-1">
              <li>Install "Get cookies.txt LOCALLY" extension</li>
              <li>Go to youtube.com (logged in)</li>
              <li>Click extension → Export → Save as .txt</li>
              <li>Upload file or paste content below</li>
            </ol>
          </motion.div>
        </div>

        <textarea
          value={cookieText}
          onChange={(e) => setCookieText(e.target.value)}
          placeholder="# Netscape HTTP Cookie File&#10;.youtube.com    TRUE    /    TRUE    ...&#10;&#10;Or click 'Upload File' above"
          className="w-full h-24 px-2 py-1.5 text-[11px] font-mono rounded border bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring transition-shadow"
        />
        
        <motion.button
          onClick={handleUploadCookies}
          disabled={loading || !cookieText.trim()}
          whileHover={!loading && cookieText.trim() ? { scale: 1.01 } : {}}
          whileTap={!loading && cookieText.trim() ? { scale: 0.99 } : {}}
          className="w-full mt-2 px-3 py-1.5 bg-red-500 hover:bg-red-600 disabled:bg-muted disabled:text-muted-foreground text-white text-xs font-medium rounded transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-1">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="inline-block"
              >
                ⟳
              </motion.span>
              Uploading...
            </span>
          ) : (
            "Upload Cookies"
          )}
        </motion.button>

        <AnimatePresence mode="wait">
          {message && (
            <motion.div
              key={message}
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: "auto", opacity: 1, marginTop: 8 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className={`overflow-hidden p-2 rounded text-[11px] ${
                messageType === "success"
                  ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
                  : messageType === "error"
                  ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
                  : "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
              }`}
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Status Explanation - Compact */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="rounded-lg border bg-muted/30 p-3"
      >
        <div className="text-xs font-medium mb-1.5">How It Works</div>
        <div className="space-y-1 text-[11px] text-muted-foreground leading-relaxed">
          <div>• <strong>Cookies:</strong> File age check only - can't detect if expired</div>
          <div>• <strong>Network:</strong> Shows VPS IP (WARP is used for downloads, not status)</div>
          <div>• <strong>Detection:</strong> No lightweight validation - monitor failed downloads</div>
          <div>• <strong>Best practice:</strong> Rotate cookies weekly or when downloads fail</div>
        </div>
      </motion.div>
    </div>
  );
}

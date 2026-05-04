import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Download, X, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type QueueItem = {
  id: string;
  title: string;
  thumbnail: string;
  progress: number;
  status: "pending" | "downloading" | "completed" | "error";
  error?: string;
};

export function DownloadQueue({
  items,
  onRemove,
}: {
  items: QueueItem[];
  onRemove: (id: string) => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  
  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 w-80 max-h-96 overflow-hidden rounded-[11px] dark:bg-[#191919] bg-[#f1f1f1] dark:border-white/5 border-black/5 border shadow-lg">
      <div className="p-4 border-b dark:border-white/5 border-black/5">
        <div className="flex items-center justify-between">
          <h3 className="text-[13px] font-bold dark:text-[#e1e1e1] text-black">
            processing queue
          </h3>
          <span className="text-[11px] dark:text-[#9ca3af] text-[#9ca3af]">
            {items.filter((i) => i.status === "downloading").length} active
          </span>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 border-b dark:border-white/5 border-black/5 last:border-b-0"
            >
              <div className="flex items-start gap-3">
                <img
                  src={item.thumbnail}
                  alt=""
                  className="w-12 h-12 rounded object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium dark:text-[#e1e1e1] text-black truncate">
                    {item.title}
                  </p>
                  
                  {item.status === "downloading" && (
                    <div className="mt-2">
                      <div className="h-1.5 rounded-full dark:bg-[#242424] bg-[#e8e4d9] overflow-hidden relative">
                        <motion.div
                          className="h-full dark:bg-[#ed2236] bg-[#ff0000] rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${item.progress}%` }}
                          transition={
                            shouldReduceMotion
                              ? { duration: 0 }
                              : {
                                  type: "spring",
                                  stiffness: 100,
                                  damping: 20,
                                }
                          }
                        />
                        {/* Shimmer effect */}
                        {item.progress < 100 && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                            animate={{
                              x: ["-100%", "100%"],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                          />
                        )}
                      </div>
                      <p className="text-[10px] dark:text-[#9ca3af] text-[#9ca3af] mt-1 font-medium">
                        {item.progress}%
                      </p>
                    </div>
                  )}

                  {item.status === "completed" && (
                    <div className="flex items-center gap-1 mt-1">
                      <CheckCircle size={12} className="text-green-500" />
                      <span className="text-[10px] text-green-500">completed</span>
                    </div>
                  )}

                  {item.status === "error" && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertCircle size={12} className="text-red-500" />
                      <span className="text-[10px] text-red-500">{item.error}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onRemove(item.id)}
                  className="shrink-0 p-1 rounded dark:text-[#9ca3af] dark:hover:text-[#e1e1e1] dark:hover:bg-white/5 text-[#9ca3af] hover:text-black hover:bg-black/5 transition-all"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

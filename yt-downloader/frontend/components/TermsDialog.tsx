import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import AnimatedCloseIcon from "./AnimatedCloseIcon";

interface TermsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TermsDialog({ isOpen, onClose }: TermsDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-60"
            onClick={onClose}
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ 
                duration: 0.3,
                ease: [0.16, 1, 0.3, 1]
              }}
              className="w-full max-w-2xl max-h-[85vh] pointer-events-auto"
            >
              <div className={cn(
                "rounded-[16px] border overflow-hidden",
                "dark:bg-black dark:border-white/10",
                "bg-white border-black/10",
                "shadow-2xl"
              )}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b dark:border-white/10 border-black/10">
                  <h2 className="text-[18px] font-bold dark:text-[#e1e1e1] text-black">
                    terms and conditions
                  </h2>
                  <AnimatedCloseIcon 
                    onClick={onClose}
                    size={28}
                    className="dark:text-[#9ca3af] dark:hover:text-[#e1e1e1] text-[#9ca3af] hover:text-black"
                  />
                </div>

                {/* Content with custom scrollbar */}
                <div className="overflow-y-auto max-h-[calc(85vh-80px)] px-6 py-6 custom-scrollbar">
                  <style>{`
                    .custom-scrollbar::-webkit-scrollbar {
                      width: 8px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                      background: transparent;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                      background: #ed2236;
                      border-radius: 4px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                      background: #d61c2e;
                    }
                    /* Firefox */
                    .custom-scrollbar {
                      scrollbar-width: thin;
                      scrollbar-color: #ed2236 transparent;
                    }
                  `}</style>
                  <div className="space-y-6">
                    {/* General */}
                    <motion.section
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="space-y-3"
                    >
                      <h3 className="text-[14px] font-bold uppercase tracking-widest dark:text-[#9ca3af] text-[#9ca3af] flex items-center gap-2">
                        <span className="text-[#ed2236]">//</span>
                        general
                      </h3>
                      <p className="text-[13px] dark:text-[#e1e1e1] text-black leading-relaxed">
                        these terms apply when using this yt-downloader tool. 
                        by using my tools, you agree to follow these guidelines and 
                        accept responsibility for your actions.
                      </p>
                    </motion.section>

                    {/* Saving */}
                    <motion.section
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="space-y-3"
                    >
                      <h3 className="text-[14px] font-bold uppercase tracking-widest dark:text-[#9ca3af] text-[#9ca3af] flex items-center gap-2">
                        <span className="text-[#ed2236]">#</span>
                        downloading
                      </h3>
                      <div className="space-y-3 text-[13px] dark:text-[#e1e1e1] text-black leading-relaxed">
                        <p>
                          this service tool simplifies downloading content from y0utube and 
                          I take zero liability for what the downloaded content is used for.
                        </p>
                        <p>
                          processing servers operate like advanced proxies and don't ever 
                          write any requested content to disk. everything is handled in RAM 
                          and permanently purged once the download is completed. I have no 
                          downloading logs and cannot identify anyone.
                        </p>
                        <p className="text-[12px] dark:text-[#9ca3af] text-[#9ca3af]">
                          all downloads are processed anonymously (ip-rotation).
                        </p>
                      </div>
                    </motion.section>

                    {/* User Responsibilities */}
                    <motion.section
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="space-y-3"
                    >
                      <h3 className="text-[14px] font-bold uppercase tracking-widest dark:text-[#9ca3af] text-[#9ca3af] flex items-center gap-2">
                        <span className="text-[#ed2236]">#</span>
                        Your responsibilities
                      </h3>
                      <div className="space-y-3 text-[13px] dark:text-[#e1e1e1] text-black leading-relaxed">
                        <p>
                          you (end user) are responsible for what you do with my tools, 
                          how you use and distribute resulting content. please be mindful 
                          when using content of others and always credit original creators. 
                          make sure you don't violate any terms or licenses.
                        </p>
                        <p>
                          When used in educational purposes, always cite sources and credit 
                          original creators. we open-source devs dont want anything else just some recognition!
                        </p>
                        <p className="font-medium dark:text-[#ed2236] text-[#ff0000]">
                          fair use for everyone.
                        </p>
                      </div>
                    </motion.section>

                    {/* Reporting Abuse */}
                    <motion.section
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      className="space-y-3"
                    >
                      <h3 className="text-[14px] font-bold uppercase tracking-widest dark:text-[#9ca3af] text-[#9ca3af] flex items-center gap-2">
                        <span className="text-[#ed2236]">#</span>
                        reporting abuse
                      </h3>
                      <div className="space-y-3 text-[13px] dark:text-[#e1e1e1] text-black leading-relaxed">
                        <p>
                          I have no way of detecting abusive behavior automatically because 
                          the tool is fully anonymous. 
                        </p>
                        <p className="font-mono text-[12px] dark:text-[#ed2236] text-[#ff0000] font-medium">
                          no-reply@retakt.cc
                        </p>
                        <p className="text-[12px] dark:text-[#9ca3af] text-[#9ca3af] italic">
                          email is not intended for user support
                        </p>
                      </div>
                    </motion.section>

                    {/* YouTube Terms */}
                    <motion.section
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="space-y-3"
                    >
                      <h3 className="text-[14px] font-bold uppercase tracking-widest dark:text-[#9ca3af] text-[#9ca3af] flex items-center gap-2">
                        <span className="text-[#ed2236]">#</span>
                        youtube terms
                      </h3>
                      <div className="space-y-3 text-[13px] dark:text-[#e1e1e1] text-black leading-relaxed">
                        <p>
                          by downloading content from youtube, you agree to comply with{" "}
                          <a 
                            href="https://www.youtube.com/t/terms" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="dark:text-[#ed2236] text-[#ff0000] hover:underline font-medium"
                          >
                            youtube's terms of service
                          </a>
                          . downloading copyrighted content without permission may violate 
                          youtube's policies and applicable laws.
                        </p>
                        <p className="text-[12px] dark:text-[#9ca3af] text-[#9ca3af]">
                          use this tool responsibly and respect content creators' rights.
                        </p>
                      </div>
                    </motion.section>

                    {/* Disclaimer */}
                    <motion.section
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                      className={cn(
                        "rounded-[11px] border px-4 py-3",
                        "dark:bg-[#191919] dark:border-white/5",
                        "bg-[#f4f4f5] border-black/5"
                      )}
                    >
                      <p className="text-[12px] dark:text-[#9ca3af] text-[#9ca3af] leading-relaxed text-center">
                        this tool is provided "as is" without warranties. I am not 
                        responsible for any misuse of downloaded content or violations of 
                        third-party rights.
                      </p>
                    </motion.section>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

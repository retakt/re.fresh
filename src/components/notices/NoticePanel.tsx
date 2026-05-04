import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNotice } from '@/hooks/useNotice';
import { NoticeShareButton } from './NoticeShareButton';
import { CanvasText } from '@/components/ui/canvas-text';
import { cn } from '@/lib/utils';
import './notice-panel.css';

// ══════════════════════════════════════════════════════════════════════════════
// Notice Panel - Glass Blur (Command Palette Style)
// ══════════════════════════════════════════════════════════════════════════════

export function NoticePanel() {
  const { notice, shouldShow, isVisible, dismiss } = useNotice();

  if (!shouldShow || !notice) return null;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="notice-panel"
          onClick={dismiss}
        >
          {/* Glass Panel - Very Thin */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ 
              duration: 0.3,
              ease: [0.16, 1, 0.3, 1]
            }}
            className="notice-panel-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Canvas Text - Always Horizontal */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-white/10">
              <div className="flex flex-row items-center gap-1 sm:gap-1.5">
                {/* Canvas Text - Update (Green) - BIGGER */}
                <CanvasText
                  text="Update"
                  className="text-base xs:text-lg sm:text-2xl md:text-3xl font-black align-middle whitespace-nowrap"
                  backgroundClassName="bg-[#22c55e]"
                  colors={["#16a34a","#22c55e","#4ade80","#22c55e","#16a34a","#4ade80","#22c55e","#16a34a"]}
                  lineGap={1}
                  animationDuration={30}
                />
                
                {/* Canvas Text - v1.6 (Red) - SMALLER */}
                <CanvasText
                  text="v1.6"
                  className="text-xs xs:text-sm sm:text-base md:text-lg font-black align-middle whitespace-nowrap"
                  backgroundClassName="bg-[#ef4444]"
                  colors={["#ef4444","#dc2626","#ef4444","#b91c1c","#dc2626","#ef4444","#b91c1c","#dc2626"]}
                  lineGap={1}
                  animationDuration={30}
                />
              </div>
              
              <button
                onClick={dismiss}
                className="p-1 sm:p-1.5 rounded-lg transition-colors text-white/60 hover:text-white hover:bg-white/10 shrink-0"
                aria-label="Close notice"
              >
                <X size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>
            </div>

            {/* Content - Changelog Style */}
            <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {/* Date - Responsive */}
                <div className="text-[10px] sm:text-xs text-white/50 font-mono mb-2 sm:mb-3">
                  {notice.date}
                </div>

                {/* Title with Canvas Text - Same as Changelog */}
                <div className="text-sm sm:text-base md:text-lg font-bold leading-tight mb-2 sm:mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CanvasText
                      text="YouTube Downloader"
                      backgroundClassName="bg-[#dc143c]"
                      colors={["#8B0000","#A52A2A","#B22222","#DC143C","#FF0000","#8B0000","#A52A2A","#DC143C"]}
                      lineGap={1}
                      animationDuration={30}
                    />
                    <CanvasText
                      text="[Major]"
                      backgroundClassName="bg-[#F5F5DC]"
                      colors={["#8B8B9E","#9FA0C3","#D3D3D3","#E8E4D9","#F5F5DC","#8B8B9E","#9FA0C3","#E8E4D9"]}
                      lineGap={1}
                      animationDuration={30}
                    />
                  </div>
                </div>

                {/* Features List - Responsive */}
                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-white/80 leading-relaxed">
                  <p className="font-medium">YouTube downloader tool - yt.retakt.cc (yt-dlp backend)</p>
                  
                  <ul className="space-y-1 sm:space-y-1.5 ml-1.5 sm:ml-2">
                    <li className="flex gap-1.5 sm:gap-2">
                      <span className="shrink-0 mt-[0.35rem] sm:mt-[0.4rem] size-0.5 sm:size-1 rounded-full bg-white/50" />
                      <span>auto/audio/mute modes, quality settings (max to 144p)</span>
                    </li>
                    <li className="flex gap-1.5 sm:gap-2">
                      <span className="shrink-0 mt-[0.35rem] sm:mt-[0.4rem] size-0.5 sm:size-1 rounded-full bg-white/50" />
                      <span>codec selection (h264, av1, vp9), container formats</span>
                    </li>
                    <li className="flex gap-1.5 sm:gap-2">
                      <span className="shrink-0 mt-[0.35rem] sm:mt-[0.4rem] size-0.5 sm:size-1 rounded-full bg-white/50" />
                      <span>encrypted URL paste animation, auto-detect clipboard</span>
                    </li>
                    <li className="flex gap-1.5 sm:gap-2">
                      <span className="shrink-0 mt-[0.35rem] sm:mt-[0.4rem] size-0.5 sm:size-1 rounded-full bg-white/50" />
                      <span>download manager with queue, progress tracking</span>
                    </li>
                    <li className="flex gap-1.5 sm:gap-2">
                      <span className="shrink-0 mt-[0.35rem] sm:mt-[0.4rem] size-0.5 sm:size-1 rounded-full bg-white/50" />
                      <span>admin panel - cookie rotation, WARP++ status, queue stats</span>
                    </li>
                    <li className="flex gap-1.5 sm:gap-2">
                      <span className="shrink-0 mt-[0.35rem] sm:mt-[0.4rem] size-0.5 sm:size-1 rounded-full bg-white/50" />
                      <span>canvas text with blood red texture (#dc143c)</span>
                    </li>
                  </ul>
                </div>

                {/* Link CTA - Responsive */}
                {notice.link && (
                  <a
                    href={notice.link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-3 sm:mt-4 text-xs sm:text-sm font-medium text-white hover:text-white/80 transition-colors"
                  >
                    {notice.link.text}
                  </a>
                )}
              </motion.div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between p-4 border-t border-white/10 bg-black/20">
              <NoticeShareButton noticeId={notice.id} />
              
              <button
                onClick={dismiss}
                className="text-xs font-medium text-white/60 hover:text-white transition-colors"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

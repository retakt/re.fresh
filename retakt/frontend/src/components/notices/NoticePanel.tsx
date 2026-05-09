import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNotice } from '@/hooks/useNotice';
import { ShareButton } from '@/components/animate-ui/components/community/share-button';
import { CanvasText } from '@/components/ui/canvas-text';
import { GlassContainer } from '@/components/ui/apple-glass-effect';
import { cn } from '@/lib/utils';

// ══════════════════════════════════════════════════════════════════════════════
// Notice Panel - Glass Blur (Command Palette Style)
// ══════════════════════════════════════════════════════════════════════════════

export function NoticePanel() {
  const { notice, shouldShow, isVisible, dismiss } = useNotice();

  const handleShare = async (platform: 'telegram' | 'facebook' | 'copy') => {
    if (!notice) return;
    
    const shareUrl = `${window.location.origin}/n/${notice.id}`;
    const shareText = `Check out this update: ${notice.title}`;
    
    if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(shareUrl);
        // You could add a toast notification here
      } catch (error) {
        console.error('Failed to copy:', error);
      }
      return;
    }
    
    const urls = {
      telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    };
    
    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'noopener,noreferrer');
    }
  };

  const handleShareClick = async () => {
    if (!notice) return;
    
    const shareUrl = `${window.location.origin}/n/${notice.id}`;
    const shareText = `Check out this update: ${notice.title}`;
    
    // Use Web Share API on mobile if available
    if (navigator.share && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      try {
        await navigator.share({
          title: shareText,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (error) {
        // Fall back to clipboard if user cancels or error occurs
        console.log('Share cancelled or failed, falling back to clipboard');
      }
    }
    
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (!shouldShow || !notice) return null;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex items-start justify-center p-5 pt-20 backdrop-blur-[3px] bg-black/12"
          onClick={dismiss}
        >
          {/* Glass Panel using GlassContainer */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ 
              duration: 0.3,
              ease: [0.16, 1, 0.3, 1]
            }}
            className="w-full max-w-[420px] sm:max-w-[560px]"
          >
            <GlassContainer
              blur={20}
              opacity={0.1}
              highlightOpacity={0.3}
              innerGlowOpacity={0.2}
              specularIntensity={0.5}
              variant="regular"
              tint="neutral"
              hover={false}
              className="p-0 rounded-xl shadow-2xl cursor-default"
            >
              {/* Header with Canvas Text - Always Horizontal */}
              <div className="flex items-center justify-between p-3 sm:p-4 border-b border-white/20">
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
              </div>

              {/* Content - Changelog Style */}
              <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {/* Date - Responsive */}
                  <div className="text-[10px] sm:text-xs text-white/40 font-mono mb-2 sm:mb-3">
                    {notice.date}
                  </div>

                  {/* Title with Canvas Text - Same as Changelog */}
                  <div className="text-sm sm:text-base md:text-lg font-bold leading-tight mb-2 sm:mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CanvasText
                        text="y0uTube Downloader"
                        backgroundClassName="bg-[#dc143c]"
                        colors={["#8B0000","#A52A2A","#B22222","#DC143C","#FF0000","#8B0000","#A52A2A","#DC143C"]}
                        lineGap={1}
                        animationDuration={30}
                      />
                      <CanvasText
                        text="[-tool]"
                        backgroundClassName="bg-[#F5F5DC]"
                        colors={["#8B8B9E","#9FA0C3","#D3D3D3","#E8E4D9","#F5F5DC","#8B8B9E","#9FA0C3","#E8E4D9"]}
                        lineGap={1}
                        animationDuration={30}
                      />
                    </div>
                  </div>

                  {/* Features List - Responsive */}
                  <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-white/60 leading-relaxed">
                    <p className="font-medium">
                      y0uTube Downloader - 
                      <a 
                        href="https://yt.retakt.cc" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-block ml-1 underline hover:no-underline transition-all"
                      >
                        <CanvasText
                          text="yt.retakt.cc"
                          className="text-xs sm:text-sm font-medium align-middle whitespace-nowrap"
                          backgroundClassName="bg-[#dc143c]"
                          colors={["#8B0000","#A52A2A","#B22222","#DC143C","#FF0000","#8B0000","#A52A2A","#DC143C"]}
                          lineGap={1}
                          animationDuration={30}
                        />
                      </a>
                      {" "}(yt-dlp backend)
                    </p>
                    
                    <ul className="space-y-1 sm:space-y-1.5 ml-1.5 sm:ml-2">
                      <li className="flex gap-1.5 sm:gap-2">
                        <span className="shrink-0 mt-[0.35rem] sm:mt-[0.4rem] size-0.5 sm:size-1 rounded-full bg-white/30" />
                        <span>auto/audio/mute modes, quality settings (max to 2140p)</span>
                      </li>
                      <li className="flex gap-1.5 sm:gap-2">
                        <span className="shrink-0 mt-[0.35rem] sm:mt-[0.4rem] size-0.5 sm:size-1 rounded-full bg-white/30" />
                        <span>codec selection (h264, av1, vp9)</span>
                      </li>
                      <li className="flex gap-1.5 sm:gap-2">
                        <span className="shrink-0 mt-[0.35rem] sm:mt-[0.4rem] size-0.5 sm:size-1 rounded-full bg-white/30" />
                        <span>auto-detect clipboard</span>
                      </li>
                      <li className="flex gap-1.5 sm:gap-2">
                        <span className="shrink-0 mt-[0.35rem] sm:mt-[0.4rem] size-0.5 sm:size-1 rounded-full bg-white/30" />
                        <span>download manager with queue, progress tracking</span>
                      </li>
                    </ul>
                  </div>

                  {/* Link CTA - Responsive */}
                  {notice.link && (
                    <a
                      href={notice.link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-block mt-3 sm:mt-4 underline hover:no-underline transition-all"
                    >
                      <CanvasText
                        text={notice.link.text}
                        className="text-sm sm:text-base font-semibold align-middle whitespace-nowrap"
                        backgroundClassName="bg-[#dc143c]"
                        colors={["#8B0000","#A52A2A","#B22222","#DC143C","#FF0000","#8B0000","#A52A2A","#DC143C"]}
                        lineGap={1}
                        animationDuration={30}
                      />
                    </a>
                  )}
                </motion.div>
              </div>

              {/* Actions - Only Share Button */}
              <div className="flex items-center justify-end px-3 py-2 sm:px-4 border-t border-white/20">
                <div onClick={(e) => e.stopPropagation()}>
                  <ShareButton 
                    size="sm"
                    icon="suffix"
                    onClick={handleShareClick}
                    onIconClick={handleShare}
                    className="bg-white/10 text-white hover:bg-white/20 border border-white/20"
                  >
                    Share
                  </ShareButton>
                </div>
              </div>
            </GlassContainer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

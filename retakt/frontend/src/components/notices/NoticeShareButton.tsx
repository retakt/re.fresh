import { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// ══════════════════════════════════════════════════════════════════════════════
// Notice Share Button - Copy share link to clipboard
// ══════════════════════════════════════════════════════════════════════════════

interface NoticeShareButtonProps {
  noticeId: string;
  className?: string;
}

export function NoticeShareButton({ noticeId, className }: NoticeShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/n/${noticeId}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      
      // Reset after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <button
      onClick={handleShare}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg",
        "text-xs font-medium transition-all",
        "dark:text-white/70 dark:hover:text-white",
        "text-gray-700 hover:text-gray-900",
        "border border-white/10",
        copied && "dark:text-green-400 text-green-600",
        className
      )}
    >
      {copied ? (
        <>
          <Check size={12} />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <Share2 size={12} />
          <span>Share</span>
        </>
      )}
    </button>
  );
}

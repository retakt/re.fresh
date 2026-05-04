import { useState, useEffect } from 'react';
import { getActiveNotice, isNoticeExpired, type Notice } from '@/config/notices';

const STORAGE_KEY = 'retakt_notices_seen';
const LAST_CHECK_KEY = 'retakt_last_check';

// ══════════════════════════════════════════════════════════════════════════════
// Notice Hook - Manages notice display logic and localStorage
// ══════════════════════════════════════════════════════════════════════════════

export function useNotice() {
  const [activeNotice, setActiveNotice] = useState<Notice | null>(null);
  const [shouldShow, setShouldShow] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Delay showing notice to let page load first
    const timer = setTimeout(() => {
      checkAndShowNotice();
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const checkAndShowNotice = () => {
    const notice = getActiveNotice();
    
    if (!notice) return;

    // Check if expired
    if (isNoticeExpired(notice)) return;

    // Check if already seen
    const seenIds = getSeenNotices();
    if (seenIds.includes(notice.id)) return;

    // Show the notice
    setActiveNotice(notice);
    setShouldShow(true);
    
    // Fade in after a brief moment
    setTimeout(() => setIsVisible(true), 50);
  };

  const dismissNotice = () => {
    if (!activeNotice) return;

    // Fade out
    setIsVisible(false);

    // Wait for animation, then hide
    setTimeout(() => {
      markAsSeen(activeNotice.id);
      setShouldShow(false);
      setActiveNotice(null);
    }, 300);
  };

  return {
    notice: activeNotice,
    shouldShow,
    isVisible,
    dismiss: dismissNotice
  };
}

// ── localStorage Helpers ──────────────────────────────────────────────────────

function getSeenNotices(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function markAsSeen(noticeId: string) {
  try {
    const seenIds = getSeenNotices();
    if (!seenIds.includes(noticeId)) {
      seenIds.push(noticeId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seenIds));
      localStorage.setItem(LAST_CHECK_KEY, new Date().toISOString());
    }
  } catch (error) {
    console.error('Failed to mark notice as seen:', error);
  }
}

// ── Export for manual control ─────────────────────────────────────────────────

export function clearSeenNotices() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LAST_CHECK_KEY);
}

export function hasSeenNotice(noticeId: string): boolean {
  return getSeenNotices().includes(noticeId);
}

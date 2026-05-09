// ══════════════════════════════════════════════════════════════════════════════
// Notice System Configuration
// ══════════════════════════════════════════════════════════════════════════════

export interface Notice {
  id: string;
  title: string;
  body: string;
  tag: 'update' | 'drop' | 'note' | 'major';
  date: string;
  priority?: number;
  expiresAt?: string;
  link?: {
    text: string;
    url: string;
  };
}

// ── Notice Data ───────────────────────────────────────────────────────────────
export const NOTICES: Notice[] = [
  {
    id: "n_001",
    title: "y0uTube Downloader [Major]",
    body: `y0uTube Downloader - yt.retakt.cc (yt-dlp backend)

• auto/audio/mute modes, quality settings (max to 2160p)
• codec selection (h264, av1, vp9), container formats  
• encrypted URL paste animation, auto-detect clipboard
• download manager with queue, progress tracking`,
    tag: "major",
    date: "4th May, 2026",
    priority: 1,
    link: {
      text: "Try it! →",
      url: "https://yt.retakt.cc"
    }
  },
  // Add more notices here
];

// ── Active Notice ─────────────────────────────────────────────────────────────
// Change this ID to show a new notice to all visitors
export const ACTIVE_NOTICE_ID = "n_001";

// ── Tag Colors ────────────────────────────────────────────────────────────────
export const TAG_COLORS = {
  update: { bg: '#3b82f6', text: '#dbeafe', border: '#60a5fa' },
  drop: { bg: '#22c55e', text: '#dcfce7', border: '#4ade80' },
  note: { bg: '#f59e0b', text: '#fef3c7', border: '#fbbf24' },
  major: { bg: '#dc2626', text: '#fee2e2', border: '#ef4444' }
};

// ── Helper Functions ──────────────────────────────────────────────────────────
export function getActiveNotice(): Notice | null {
  return NOTICES.find(n => n.id === ACTIVE_NOTICE_ID) || null;
}

export function getNoticeById(id: string): Notice | null {
  return NOTICES.find(n => n.id === id) || null;
}

export function isNoticeExpired(notice: Notice): boolean {
  if (!notice.expiresAt) return false;
  return new Date(notice.expiresAt) < new Date();
}

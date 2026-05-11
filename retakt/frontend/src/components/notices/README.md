# 🔔 Notice System

Ambient dispatch system for re.Takt - glassmorphic first-visit notices with shareable card pages.

## 📁 Files

```
src/
├── config/
│   └── notices.ts                    # Notice data + configuration
├── components/notices/
│   ├── NoticePanel.tsx               # Main floating panel
│   ├── NoticeCard.tsx                # Reusable card component
│   ├── NoticeShareButton.tsx         # Share button with copy
│   ├── notice-panel.css              # Panel glassmorphism styles
│   └── README.md                     # This file
├── pages/notice/
│   ├── [id].tsx                      # Dynamic route /n/:id
│   └── notice-page.css               # Share page styles
└── hooks/
    └── useNotice.ts                  # Logic + localStorage
```

## 🚀 Quick Start

### 1. Add a New Notice

Edit `src/config/notices.ts`:

```typescript
export const NOTICES: Notice[] = [
  {
    id: "n_002",                      // Unique ID
    title: "New Feature Live",        // Title
    body: "Check out our latest...",  // Body text
    tag: "update",                    // Tag: update|drop|note|major
    date: "2025-05-05",               // Date string
    priority: 1,                      // Optional: higher = more important
    expiresAt: "2025-06-01",          // Optional: auto-hide after date
    link: {                           // Optional: CTA button
      text: "Try it now →",
      url: "https://example.com"
    }
  }
];
```

### 2. Activate the Notice

Change the active notice ID:

```typescript
export const ACTIVE_NOTICE_ID = "n_002";
```

That's it! The notice will show to all visitors who haven't seen it yet.

## 🎨 Customization

### Tag Colors

Edit `TAG_COLORS` in `notices.ts`:

```typescript
export const TAG_COLORS = {
  update: { bg: '#3b82f6', text: '#dbeafe', border: '#60a5fa' },
  drop: { bg: '#22c55e', text: '#dcfce7', border: '#4ade80' },
  note: { bg: '#f59e0b', text: '#fef3c7', border: '#fbbf24' },
  major: { bg: '#dc2626', text: '#fee2e2', border: '#ef4444' }
};
```

### Panel Position

Edit `notice-panel.css`:

```css
.notice-panel {
  /* Desktop: bottom-right */
  bottom: 24px;
  right: 24px;
  
  /* Change to bottom-left */
  /* left: 24px; */
  
  /* Change to top-right */
  /* top: 24px; */
}
```

### Animation Timing

Edit `useNotice.ts`:

```typescript
// Delay before showing (default: 800ms)
const timer = setTimeout(() => {
  checkAndShowNotice();
}, 800); // Change this value
```

## 📱 Features

### ✅ First-Visit Only
- Uses localStorage to track seen notices
- Shows once per notice ID
- Persists across sessions

### ✅ Shareable Cards
- Each notice has a unique URL: `/n/[id]`
- Full-screen card view
- OG meta tags for social sharing
- Copy-to-clipboard button

### ✅ Glassmorphism
- Backdrop blur effects
- Subtle borders and shadows
- Light/dark mode support
- Smooth animations

### ✅ Mobile Responsive
- Bottom sheet on mobile
- Floating panel on desktop
- Touch-friendly dismiss

### ✅ Keyboard Support
- Click anywhere to dismiss
- ESC key support (can be added)

## 🔧 Advanced Usage

### Multiple Active Notices

Show first unseen notice from array:

```typescript
// In notices.ts
export const ACTIVE_NOTICE_IDS = ["n_001", "n_002", "n_003"];

// In useNotice.ts - modify getActiveNotice()
export function getActiveNotice(): Notice | null {
  const seenIds = getSeenNotices();
  
  for (const id of ACTIVE_NOTICE_IDS) {
    const notice = NOTICES.find(n => n.id === id);
    if (notice && !seenIds.includes(id) && !isNoticeExpired(notice)) {
      return notice;
    }
  }
  
  return null;
}
```

### Clear Seen Notices (Dev/Testing)

```typescript
import { clearSeenNotices } from '@/hooks/useNotice';

// In browser console or dev tools
clearSeenNotices();
```

### Check if User Saw Notice

```typescript
import { hasSeenNotice } from '@/hooks/useNotice';

if (hasSeenNotice('n_001')) {
  console.log('User saw notice n_001');
}
```

### Analytics Tracking

Add to `useNotice.ts`:

```typescript
const checkAndShowNotice = () => {
  const notice = getActiveNotice();
  
  if (!notice) return;
  
  // ... existing checks ...
  
  // Track impression
  trackNoticeView(notice.id);
  
  setActiveNotice(notice);
  setShouldShow(true);
};

function trackNoticeView(noticeId: string) {
  // Send to your analytics
  if (window.gtag) {
    window.gtag('event', 'notice_view', {
      notice_id: noticeId
    });
  }
}
```

## 🎯 Best Practices

### 1. Keep It Short
- Title: 5-8 words max
- Body: 2-3 sentences max
- Users should grasp it in 3 seconds

### 2. Use Expiration Dates
```typescript
expiresAt: "2025-06-01"  // Auto-hide after this date
```

### 3. Priority System
```typescript
priority: 1  // Higher numbers show first (if multiple active)
```

### 4. Test Before Deploy
```typescript
// Temporarily change ID to test
export const ACTIVE_NOTICE_ID = "n_test";
```

### 5. Archive Old Notices
Keep them in the array for share links to work:

```typescript
export const NOTICES: Notice[] = [
  // Active notices
  { id: "n_003", ... },
  
  // Archived (still accessible via /n/n_001)
  { id: "n_001", ... },
  { id: "n_002", ... },
];
```

## 🐛 Troubleshooting

### Notice Not Showing?

1. Check `ACTIVE_NOTICE_ID` matches a notice ID
2. Clear localStorage: `clearSeenNotices()`
3. Check browser console for errors
4. Verify notice isn't expired

### Share Link Not Working?

1. Check notice ID exists in `NOTICES` array
2. Verify route is registered in `App.tsx`
3. Check for typos in URL

### Styling Issues?

1. Import CSS files in components
2. Check Tailwind classes are available
3. Verify dark mode classes work

## 📊 localStorage Structure

```json
{
  "retakt_notices_seen": ["n_001", "n_002"],
  "retakt_last_check": "2025-05-04T12:00:00.000Z"
}
```

## 🔮 Future Enhancements

- [ ] A/B testing support
- [ ] Multiple notices queue
- [ ] Snooze functionality
- [ ] Admin dashboard for managing notices
- [ ] Analytics dashboard
- [ ] Rich media support (images, videos)
- [ ] Action buttons (not just links)
- [ ] Notification center (view all past notices)

---

Built with ❤️ for re.Takt

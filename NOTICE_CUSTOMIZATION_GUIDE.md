# 🎨 Notice System - Customization Guide

## 📍 **Where "YouTube Downloader Live" Text Comes From**

```typescript
// src/config/notices.ts - Line 25
export const NOTICES: Notice[] = [
  {
    id: "n_001",
    title: "YouTube Downloader is Live", // ← CHANGE THIS TEXT HERE!
    body: "Download videos in max quality...", // ← AND THIS DESCRIPTION
    tag: "major",
    date: "2025-05-04",
    link: {
      text: "Try it now →", // ← AND THIS BUTTON TEXT
      url: "https://yt.retakt.cc" // ← AND THIS URL
    }
  }
];
```

---

## 🎯 **New Design - Centered & Subtle**

I've redesigned the notice system to match your TermsDialog style:

### ✅ **What Changed**
- **Centered** - No longer bottom-right corner, now center of screen
- **Thin** - Reduced width from 380px to 400px max
- **Subtle** - Clean white/dark cards instead of glassmorphism
- **Page-like** - Similar to your TermsDialog structure
- **Better mobile** - Responsive design

### 🎨 **Visual Comparison**

**Before (Bottom-right glassmorphism):**
```
┌─────────────────────────────────────┐
│                                     │
│  Your Site Content                  │
│                                     │
│                    ┌────────────────┤
│                    │ Glassy Panel   │
│                    │ YouTube Down...│
│                    │ [Share] Dismiss│
│                    └────────────────┘
└─────────────────────────────────────┘
```

**After (Centered clean card):**
```
┌─────────────────────────────────────┐
│           [Dark Backdrop]           │
│                                     │
│        ┌─────────────────┐          │
│        │ [MAJOR] 2025-05 │ ✕       │
│        ├─────────────────┤          │
│        │ YouTube Down... │          │
│        │ Download vid... │          │
│        │ [Try it now →]  │          │
│        ├─────────────────┤          │
│        │ [Share] Dismiss │          │
│        └─────────────────┘          │
└─────────────────────────────────────┘
```

---

## 🛠️ **Easy Customizations**

### 1. **Change Notice Content**

```typescript
// src/config/notices.ts
{
  id: "n_002", // New ID
  title: "New Feature Released", // Your title
  body: "We've added amazing new functionality that will help you...", // Your message
  tag: "update", // update|drop|note|major
  date: "2025-05-05", // Today's date
  link: { // Optional
    text: "Learn more →",
    url: "/your-page"
  }
}

// Activate it
export const ACTIVE_NOTICE_ID = "n_002";
```

### 2. **Change Tag Colors**

```typescript
// src/config/notices.ts
export const TAG_COLORS = {
  update: { bg: '#3b82f6', text: '#dbeafe', border: '#60a5fa' }, // Blue
  drop: { bg: '#22c55e', text: '#dcfce7', border: '#4ade80' },   // Green
  note: { bg: '#f59e0b', text: '#fef3c7', border: '#fbbf24' },   // Yellow
  major: { bg: '#dc2626', text: '#fee2e2', border: '#ef4444' }   // Red
};
```

### 3. **Adjust Panel Width**

```css
/* src/components/notices/NoticePanel.tsx - Line 67 */
className="w-full max-w-md pointer-events-auto"
                    ↑
/* Change to: max-w-sm (smaller) or max-w-lg (larger) */
```

### 4. **Change Animation Delay**

```typescript
// src/hooks/useNotice.ts - Line 18
const timer = setTimeout(() => {
  checkAndShowNotice();
}, 800); // Change this number (milliseconds)
```

### 5. **Disable Backdrop Blur**

```typescript
// src/components/notices/NoticePanel.tsx - Line 45
className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
                                        ↑
/* Remove: backdrop-blur-sm */
```

---

## 📱 **Mobile Behavior**

The notice now works perfectly on mobile:
- **Responsive width** - Adapts to screen size
- **Touch-friendly** - Large tap targets
- **Proper spacing** - Comfortable padding
- **Backdrop dismiss** - Tap outside to close

---

## 🎯 **Testing Your Changes**

### 1. **Clear localStorage** (to see notice again)
```javascript
// Browser console
localStorage.removeItem('retakt_notices_seen');
location.reload();
```

### 2. **Test Different Content**
```typescript
// Try different lengths
title: "Short Title"
body: "Short message."

// vs
title: "This is a Much Longer Title That Wraps"
body: "This is a longer message that explains more details about the feature and provides additional context that users might need to understand what's happening."
```

### 3. **Test Share Functionality**
1. Click "Share" button
2. Visit the copied URL: `retakt.cc/n/n_001`
3. Should show full-page card view

---

## 🎨 **Advanced Customizations**

### 1. **Change Card Style**

```css
/* src/components/notices/NoticePanel.tsx - Line 75 */
className={cn(
  "rounded-[16px] border overflow-hidden",
  "dark:bg-black dark:border-white/10",
  "bg-white border-black/10",
  "shadow-2xl"
)}

/* Change to different styles: */
/* Rounded corners: rounded-[8px] (less) or rounded-[24px] (more) */
/* Background: bg-gray-50 (light gray) or bg-blue-50 (light blue) */
/* Border: border-2 (thicker) or border-0 (no border) */
```

### 2. **Add Custom Animations**

```typescript
// src/components/notices/NoticePanel.tsx - Line 52
initial={{ opacity: 0, scale: 0.95, y: 20 }}
animate={{ opacity: 1, scale: 1, y: 0 }}

/* Try different animations: */
/* Slide from left: x: -100 → x: 0 */
/* Bounce: scale: 0.8 → scale: 1.1 → scale: 1 */
/* Rotate: rotate: -5 → rotate: 0 */
```

### 3. **Multiple Notices Queue**

```typescript
// src/config/notices.ts
export const ACTIVE_NOTICE_IDS = ["n_001", "n_002", "n_003"];

// Shows first unseen notice from array
```

---

## 🔧 **Common Issues & Fixes**

### **Notice Not Showing?**
1. Check `ACTIVE_NOTICE_ID` matches a notice ID
2. Clear localStorage: `localStorage.removeItem('retakt_notices_seen')`
3. Check browser console for errors

### **Wrong Styling?**
1. Make sure CSS files are imported
2. Check Tailwind classes are available
3. Verify dark mode is working

### **Share Link Broken?**
1. Check notice ID exists in `NOTICES` array
2. Verify route is in `App.tsx`
3. Test URL manually: `/n/n_001`

---

## 📊 **Current Notice Content**

```typescript
{
  id: "n_001",
  title: "YouTube Downloader is Live",
  body: "Download videos in max quality with custom codec selection, quality settings, and more. Features auto-detect clipboard, encrypted URL animations, and download queue management.",
  tag: "major", // Red tag
  date: "2025-05-04",
  link: {
    text: "Try it now →",
    url: "https://yt.retakt.cc"
  }
}
```

**To customize:** Edit the values above in `src/config/notices.ts`

---

## 🚀 **Quick Start Checklist**

- [ ] Edit notice content in `notices.ts`
- [ ] Test on desktop (centered modal)
- [ ] Test on mobile (responsive)
- [ ] Test share functionality
- [ ] Test dismiss behavior
- [ ] Clear localStorage to test again
- [ ] Deploy!

---

**The notice system is now centered, thin, and subtle - just like your TermsDialog! 🎉**
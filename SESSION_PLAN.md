# Session Plan — Final Fixes Before Deploy

## What You Asked For (Prioritized)

### 🔴 CRITICAL — Do First

1. **Invite 401 Fix** ✅ DONE
   - Added `getFreshToken()` with `refreshSession()` before every invite
   - Should fix the intermittent 401 errors

2. **Members Layout** ✅ DONE
   - Email + date on Row 1, username + role on Row 2, reset password on Row 3
   - Custom role scaffold added
   - Enter key saves username (not reset password)

3. **Icon Weights** ✅ DONE
   - Increased `strokeWidth` on sidebar, bottom-nav, navbar, comments icons
   - Cancel (X) buttons now `strokeWidth={2.5}` — clearly visible

### 🟡 HIGH PRIORITY — Do Next

4. **Admin Tiles — Mobile Sizing**
   - Tiles are too large, footer not visible
   - Need: smaller padding, smaller icons, smaller text on mobile
   - Target: fit all 6 tiles in 80% of viewport

5. **Music Card — Alignment & Marquee**
   - Artist name needs marquee (currently only title has it)
   - Separators `·` too faint — make them `text-foreground/60` and bolder
   - Desktop: keep fixed-width columns (already done)
   - Mobile: center artist/release/year in middle of screen
   - Social icons: bigger (70% space), edit/delete smaller (30%), pushed bottom-right

6. **Login Page — Input Sizing**
   - Inputs too wide, labels too close to edge
   - Change `max-w-sm` → `max-w-xs`, add more horizontal padding

7. **Quotes — Remove Supabase, Local Only**
   - Current: fetches from DB, merges with defaults, shuffles once
   - Problem: shuffle is deterministic, 20-min timer broken, DB query is slow
   - Fix: hardcode all quotes in `quotes.ts`, shuffle on every mount, advance index every 20 min
   - Benefit: faster, simpler, truly random

8. **Page Transitions — Fade**
   - Add `<motion.div>` wrapper in `<Outlet>` with 150ms fade
   - Smooth the abrupt cut when switching pages

### 🟢 MEDIUM PRIORITY — Do After

9. **Footer Auto-fit**
   - Already works correctly (flex layout)
   - The issue is admin tiles are too tall — fix #4 will solve this

10. **Marquee on All Content Pages**
    - Apply `MarqueeText` to blog cards, tutorial cards, file cards (not just music)

---

## What I Recommend

**Do in this order:**
1. Admin tiles mobile sizing (fixes footer visibility)
2. Login page sizing (quick win)
3. Music card alignment + marquee artist (visual polish)
4. Quotes local-only (removes DB dependency, fixes randomness)
5. Page transitions (smooth UX)
6. Marquee on all cards (consistency)

**Then deploy and test everything end-to-end.**

---

## Technical Notes

### Quotes Randomness Issue
The current code does this:
```js
const pool = merged.sort(() => Math.random() - 0.5);  // ← shuffles ONCE on mount
setQuotes(pool);
```

The problem: `Math.random()` is called once per comparison during the sort. The resulting order is pseudo-random but **deterministic** for that session. The 20-min timer advances the index, but the pool order never changes. So you see the same sequence every time.

**Fix**: Shuffle the pool on every mount (not just once), OR advance the index randomly (not sequentially).

### Footer "Not Visible" Issue
The layout already uses `flex min-h-screen` — the footer naturally sits at the bottom when content is short, and scrolls when content is long. The issue is the admin tiles are so tall that they push the footer off-screen on mobile. Reducing tile size will fix this.

### Marquee on Artist Name
Currently only the title has `<MarqueeText>`. The artist is in a `<span className="truncate">` which cuts it off with `...`. To make it marquee, wrap it in `<MarqueeText>` too.

### Social Icons "70-30" Split
Right now social icons and edit/delete are in separate rows. You want them in the same visual area with social icons taking 70% of the space and edit/delete 30%. This means restructuring the right column into a single row with `flex-[0.7]` and `flex-[0.3]` or similar.

---

## My Suggestion

Let's do the critical fixes now (admin tiles, login, music alignment, quotes) and deploy. The rest (page transitions, marquee on all cards) can be a follow-up session since they're polish, not blockers.

Sound good?

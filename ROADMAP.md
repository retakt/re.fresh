# re.Takt — Implementation Roadmap
> Created: April 24, 2026 · Current: Beta v1.2

---

## IMMEDIATE FIXES (This Session)

### 1. Admin Tiles — Mobile Sizing ✅ NEXT
- **Issue**: Admin dashboard tiles are too large on mobile, footer not visible without scroll
- **Fix**: Reduce tile padding, icon size, text size on mobile
- **Target**: 80% of viewport height for all 6 tiles + header

### 2. Music Admin Card — Marquee + Alignment
- **Issue**: Artist name doesn't marquee, separators too faint, layout not aligned
- **Desktop**: Artist/Release/Year should be in fixed-width columns so they align vertically across cards
- **Mobile**: Artist/Release/Year should center in the middle of the screen (not left-aligned)
- **Separators**: Make `·` bolder and more visible (`text-foreground/60` instead of `/30`)
- **Social icons**: Bigger (70% of space), edit/delete smaller (30%), pushed to bottom-right

### 3. Login Page — Input Sizing
- **Issue**: Inputs too wide, labels too close to edge
- **Fix**: Reduce max-width to `max-w-xs` (320px), add more padding

### 4. Quotes System — Remove Supabase, Use Local Only
- **Issue**: Quotes still fetching from Supabase, not truly random, 20-min timer broken
- **Root cause**: `useEffect` runs on mount, fetches DB quotes, merges with defaults, shuffles once. But the shuffle is seeded by `Math.random()` which is called once — so the order is deterministic after that. The 20-min check happens but the pool order never changes.
- **Fix**: Remove Supabase query entirely. Move all quotes (including custom ones) to `src/lib/quotes.ts` as a hardcoded array. Shuffle on every mount. 20-min timer advances index in the shuffled pool.
- **Benefit**: Faster load, no DB query, truly random rotation

### 5. Page Transitions — Fade Effect
- **Issue**: Abrupt cut when switching pages
- **Fix**: Add `<motion.div>` wrapper in `Outlet` with `initial={{ opacity: 0 }}` and `animate={{ opacity: 1 }}`
- **Duration**: 150ms (fast, just enough to smooth the transition)

### 6. Footer + Bottom Nav — Auto-fit Content
- **Issue**: Footer is fixed at bottom, but on short pages (like admin dashboard) there's a big gap
- **Fix**: Use `min-h-screen` on layout, `flex-1` on main, footer naturally sits at bottom when content is short, scrolls when content is long
- **This is already implemented** — the issue is the admin tiles are too tall on mobile

---

## SCAFFOLDED (Ready for Implementation)

### Reset Username via Email
- **Status**: Button exists, shows "coming soon" toast
- **Next**: Create `supabase/functions/reset-username/index.ts` that sends an email with a magic link to a `/reset-username?token=...` page where the user can enter a new username

### Custom Roles
- **Status**: Dropdown has "Custom…" option, opens text input, backend accepts any string
- **Next**: 
  - Create `profiles.custom_role` column (nullable string)
  - Update `admin-manage-member` to save to `custom_role` when role is not in `["admin", "editor", "member"]`
  - Display `custom_role ?? role` in UI
  - Add a "Manage custom roles" page to list/edit/delete custom role definitions

### Custom Dialog Boxes
- **Status**: Currently using `toast()` and `confirm()`
- **Next**: Create `<ConfirmDialog>`, `<SuccessDialog>`, `<ErrorDialog>` components with Radix Dialog, centered on screen, custom styling

---

## HIGH PRIORITY (Not Started)

### Profile Picture in Comments
- **File**: `src/components/comments/comments-section.tsx`
- **Issue**: `loadComments()` fetches `username` and `role` but not `avatar_url`
- **Fix**: Add `avatar_url` to the profiles query, pass it to `CommentCard`, render `<Avatar>` instead of initials-only

### About Page Content
- **File**: `src/pages/about/page.tsx`
- **Issue**: Shows "Coming soon...", Spotify and Globe links are `"..."`
- **Fix**: Add real bio content, actual social URLs

### Tools Section
- **Status**: All 8 tools are `enabled: false`, no pages exist
- **Next**: Implement `/tools/bg-remover`, `/tools/yt-download`, etc. Set `enabled: true` when ready

---

## MEDIUM PRIORITY

### Search — Full Text
- Current: `ilike` on title only
- Improvement: Search content, excerpt, tags, artist

### Notifications
- Toggle exists but does nothing
- Needs: VAPID keys, subscription endpoint, server-side push

### Pagination
- All lists load everything at once
- Add when content grows large

---

## LOW PRIORITY

### Admin Role → "Dev"
- Simple text change, user deferred

### `use-debounce` Package
- Remove from `package.json` (we have a custom hook)

### PWA Version Sync
- `package.json` is `0.0.0`, PWA shows `v1.2.0`

### `yt-downloader` Empty Folder
- Delete or add `config.ts`

---

## TECHNICAL DEBT

### `v0_1_2` Migration Missing
- Migrations jump from `v0_1_1` to `v0_1_3`
- Not a functional issue but worth noting

### Supabase Dynamic Import Warning
- Vite warns about `supabase.ts` being both dynamically and statically imported
- Harmless but could be cleaned up

---

## PERFORMANCE OPTIMIZATIONS (Future)

### Virtual List
- `useVirtualList` hook exists but unused
- Apply to music/blog/tutorial lists when they grow large

### Image Optimization
- Add `loading="lazy"` to all images (mostly done)
- Consider WebP conversion for user uploads

### Code Splitting
- Already using React.lazy for all pages
- Could split large components (RichTextEditor, FloatingPlayer)

---

## DEPLOYMENT CHECKLIST

- [ ] Run `npm run build` — verify exit 0
- [ ] Check `dist/` folder size (~2MB is normal)
- [ ] Deploy `dist/` to VPS
- [ ] Verify Supabase Site URL is `https://retakt.cc`
- [ ] Verify Resend domain `retakt.cc` is verified
- [ ] Add `RESEND_API_KEY` to Supabase Edge Function secrets
- [ ] Test invite flow end-to-end
- [ ] Test login with username
- [ ] Test comment voting (auth + anon)
- [ ] Test music player (play/pause/resume/collapse/pill)
- [ ] Test PWA install on mobile
- [ ] Check Sentry for errors

---

## NOTES

- **JWT Key Rotation**: After switching from ES256 to HS256, all users need to log out and back in to get fresh tokens. Old tokens will fail with 401.
- **Resend Rate Limits**: Without Resend API key, Supabase's built-in email has strict rate limits (that's why some invites worked and others didn't).
- **Quote Rotation**: The current Supabase-based approach is over-engineered. Moving to local-only quotes will be faster and simpler.

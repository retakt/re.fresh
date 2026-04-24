# re.Takt — Session Log
> Beta v1.3 · April 24–25, 2026

---

## IMPLEMENTED

### 1. Vivaldi / Browser Auth Fix
- **Root cause 1**: `SIGNED_OUT` event was not in `PROFILE_FETCH_EVENTS` set — `setLoading(false)` never ran after logout, leaving `ProtectedRoute` stuck on skeleton forever
- **Root cause 2**: Supabase client had no explicit storage config — Vivaldi's aggressive privacy settings corrupted session state
- **Fixes**:
  - `src/components/providers/auth.tsx` — handle `SIGNED_OUT` explicitly before the event check, always call `setLoading(false)`
  - `src/lib/supabase.ts` — added `storageKey: "retakt-auth"`, `persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: true`
  - `src/components/account/user-menu.tsx` — logout now does `window.location.href = "/"` (hard navigate) instead of staying in place, clears stale React state

### 2. Double Back Button Removal
- Every admin page and editor had its own inline `← Back` / `← Admin` button duplicating the navbar's `BackButton`
- Removed inline back buttons from all 10 admin pages:
  - `admin/posts.tsx`, `admin/tutorials.tsx`, `admin/music.tsx`, `admin/files.tsx`, `admin/quotes.tsx`, `admin/members.tsx`
  - `admin/post-editor.tsx`, `admin/tutorial-editor.tsx`, `admin/music-editor.tsx`, `admin/file-editor.tsx`
- Content pages (blog/post, tutorials/post, music/song, music/album) kept their contextual `← Blog` / `← Album Name` links — those tell you *where* you're going, which the navbar arrow doesn't

### 3. Page Freeze Fallback (ErrorBoundary per route)
- `src/pages/layout.tsx` — wrapped `<Outlet>` in `<ErrorBoundary key={location.pathname} fallback={<PageFallback />}>`
- `PageFallback` shows "Go back" + "Reload" buttons instead of a frozen blank screen
- `key={location.pathname}` resets the boundary automatically on navigation
- Also changed `AnimatePresence mode="wait"` → `mode="sync"` — `mode="wait"` blocked mounting the new page until exit animation completed, causing freezes on fast navigation

### 4. YT Downloader Frontend (`yt.retakt.cc`)
- New standalone subdomain entry point — separate from the main app
- Files created:
  - `yt/index.html` — standalone HTML with its own theme flash prevention
  - `yt/main.tsx` — mini React root mounting to `#yt-root`
  - `yt/YTApp.tsx` — ThemeProvider + Toaster wrapper
  - `yt/YTPage.tsx` — cobalt-inspired UI: URL input with YouTube detection, paste button, auto/audio/mute mode toggles, settings panel (video quality + audio format), thumbnail preview card, download button (frontend only — backend not wired yet)
- `src/features/tools/yt-downloader/config.ts` — tool config with `enabled: true`, `href: "https://yt.retakt.cc"`
- `src/features/tools/index.ts` — replaced inline yt-download object with import from config file
- `src/pages/Index.tsx` — tools grid now renders enabled tools as `<a>` links (external links open in new tab), disabled tools stay `cursor-not-allowed`
- `vite.config.ts` — added `input: { main, yt }` for multi-entry build

### 5. Marquee Text — iOS Fix
- **Root cause**: Invisible spacer had `h-0 overflow-hidden` — gave the container zero height, so absolutely-positioned copies had nothing to anchor `inset-y-0` to and ran invisibly
- **Fix** (`src/components/ui/marquee-text.tsx`):
  - Spacer uses `opacity-0` instead — hides visually but keeps real height in layout flow
  - Added `will-change: transform` + `-webkit-backface-visibility: hidden` for iOS Safari layer promotion
  - Gap between copies is now an inline `<span className="inline-block w-10">` spacer (paddingRight unreliable on WebKit absolutely-positioned elements)
  - Speed formula adjusted: `Math.max(4, text.length * 0.22)s`

### 6. Admin Music Card — 3-Line Layout Redesign
- Rebuilt as `flex-col` with three explicit rows:
  - **Line 1**: `<MarqueeText title>` (flex-1) · Live/Draft + AUDIO badges (center) · Social icons at 17px (right)
  - **Line 2**: `<MarqueeText artist>` (flex-1) · Year `·` Type in `min-w-[5rem] justify-center` block · `<PublishToggle>` (right)
  - **Line 3**: Tags (flex-1, wrap) · Edit + Delete icons at 11px, very muted, only go red on hover (right edge)
- Removed the old top-right year/type stacked column that was causing misalignment

### 7. Album Page Redesign
- Removed broken separator + duplicate info panel below it
- New layout: cover (compact `w-20/w-24`) + play button directly below cover (icon only, no "Play" text) on left · all text details stacked on right
- Edit button routes to `/admin/music/edit/${tracks[0].id}` (actual editor)
- Description renders inline if it exists — no separator needed
- Tags, year, release type all in the right column with the other details

### 8. Glass Toast System
- `src/components/ui/sonner.tsx` — complete rewrite:
  - `position="top-center"` — visible on all screen sizes including iPhone 8
  - `richColors` — success=green, error=red, info=blue tints on glass base
  - `duration={3500}`, `visibleToasts={3}`, `offset={16}`
  - Removed JS `isDark` logic — colors now driven entirely by CSS
- `src/index.css` — glass toast CSS section:
  - Color vars set via `[data-sonner-toaster][data-sonner-theme='light/dark']` selectors — respond to theme automatically
  - **Mobile centering fix**: Sonner's own CSS cancels `translateX(-50%)` on `< 600px` and uses `--mobile-offset-left/right` vars. Set both to `16px` so toast stays centered with equal margins
  - `backdrop-filter: blur(20px) saturate(1.6)` + `-webkit-backdrop-filter` for Safari
  - `border-radius: 16px`, inner highlight `inset 0 1px 0 rgba(255,255,255,0.12)`
  - `width: calc(100vw - 32px)` on mobile, `max-width: 380px` on desktop
  - Close button bumped to `24×24px` for better tap target
  - Responsive font: 13px mobile, 13.5px desktop, 12px on `< 360px` phones

### 9. Code Audit — Unused Imports & Hooks
Across all admin/content pages:
- Removed unused `useNavigate` from 10 files (posts, tutorials, files, music, post-editor, tutorial-editor, music-editor, file-editor, song, blog/post)
- Removed unused `BookMarked` from `tutorials/post.tsx`
- Removed unused `playing` from `song.tsx` player destructure
- Removed unused `ExternalLink` from `music/page.tsx`
- Fixed `useEffect` deps — all fetch functions now wrapped in `useCallback` and passed as deps
- Added `void` prefix to all async calls in `useEffect` across all admin pages
- Fixed `fetchDbQuotes` hoisting bug in `quotes.tsx` — was defined after the `useEffect` that called it
- Fixed `useEffect` deps `navigate` → `goBack` in all 4 editor pages

### 10. Members Page — fetchMembers Fixes
- `src/pages/admin/members.tsx`:
  - Added `useCallback` import
  - `fetchMembers` wrapped in `useCallback`, moved before `useEffect`
  - `useEffect` now uses `void fetchMembers()` with `[fetchMembers]` dep
  - All 5 inline `fetchMembers()` calls → `void fetchMembers()`
  - `setTimeout(fetchMembers, 1500)` → `setTimeout(() => { void fetchMembers(); }, 1500)`
  - `member.role as any` → `member.role as typeof ROLE_OPTIONS[number]`

### 11. Account Page — fetchAvatarHistory Fixes
- `src/pages/account/page.tsx`:
  - Added `useCallback` import
  - `fetchAvatarHistory` wrapped in `useCallback([user])`, moved before `useEffect`
  - `useEffect` dep array updated to include `fetchAvatarHistory`

### 12. Blog Post — Type Safety
- `src/pages/blog/post.tsx`:
  - `(post as any).tags` → `(post.tags ?? [])` — `Post` type already has `tags: string[]`

### 13. void Prefix Consistency
- `src/pages/blog/page.tsx` — `fetchPosts()` → `void fetchPosts()`
- `src/pages/tutorials/page.tsx` — `fetchTutorials()` → `void fetchTutorials()`
- `src/pages/admin/quotes.tsx` — all `fetchDbQuotes()` calls → `void fetchDbQuotes()`
- `src/pages/admin/tutorials.tsx` — `togglePublish` now checks error and shows toast
- `src/pages/admin/files.tsx` — `togglePublish` now checks error and shows toast
- `src/pages/admin/music.tsx` — `togglePublish` now checks error and shows toast

---

## DELETED

### UI Components (35 files removed from `src/components/ui/`)
These were shadcn scaffolding — never imported by any page or component:

| File | Radix package removed |
|------|-----------------------|
| accordion.tsx | @radix-ui/react-accordion |
| alert.tsx | — |
| alert-dialog.tsx | @radix-ui/react-alert-dialog |
| breadcrumb.tsx | — |
| button-group.tsx | — |
| calendar.tsx | — |
| card.tsx | — |
| carousel.tsx | embla-carousel-react |
| chart.tsx | recharts |
| checkbox.tsx | @radix-ui/react-checkbox |
| command.tsx | cmdk |
| drawer.tsx | vaul |
| error-state.tsx | — |
| field.tsx | — |
| form.tsx | react-hook-form, @hookform/resolvers, zod |
| input-group.tsx | — |
| input-otp.tsx | input-otp |
| item.tsx | — |
| kbd.tsx | — |
| navigation-menu.tsx | @radix-ui/react-navigation-menu |
| pagination.tsx | — |
| popover.tsx | @radix-ui/react-popover |
| progress.tsx | @radix-ui/react-progress |
| resizable.tsx | react-resizable-panels |
| scroll-area.tsx | @radix-ui/react-scroll-area |
| select.tsx | @radix-ui/react-select |
| separator.tsx | @radix-ui/react-separator |
| sheet.tsx | — |
| sidebar.tsx | — |
| signin.tsx | — |
| slider.tsx | @radix-ui/react-slider |
| table.tsx | — |
| tabs.tsx | @radix-ui/react-tabs |
| toggle.tsx | @radix-ui/react-toggle |
| toggle-group.tsx | @radix-ui/react-toggle-group |

### Hooks (3 files removed from `src/hooks/`)
| File | Reason |
|------|--------|
| use-service-worker.ts | SW registration done directly in main.tsx with workbox-window |
| use-virtual-list.ts | Scaffolded, never used anywhere |
| use-mobile.ts | Only used by the deleted sidebar.tsx component |

### npm Packages Removed (16 from dependencies)
| Package | Why removed |
|---------|-------------|
| use-debounce | Custom hook `src/hooks/use-debounce.ts` does the same thing |
| recharts | Only used by deleted chart.tsx |
| embla-carousel-react | Only used by deleted carousel.tsx |
| react-day-picker | Only used by deleted calendar.tsx |
| input-otp | Only used by deleted input-otp.tsx |
| cmdk | Only used by deleted command.tsx |
| vaul | Only used by deleted drawer.tsx |
| react-resizable-panels | Only used by deleted resizable.tsx |
| react-hook-form | Only used by deleted form.tsx |
| @hookform/resolvers | Only used by deleted form.tsx |
| zod | Only used by deleted form.tsx |
| simple-icons | Never used anywhere |
| @radix-ui/react-accordion | Only used by deleted accordion.tsx |
| @radix-ui/react-alert-dialog | Only used by deleted alert-dialog.tsx |
| @radix-ui/react-checkbox | Only used by deleted checkbox.tsx |
| @radix-ui/react-navigation-menu | Only used by deleted navigation-menu.tsx |
| @radix-ui/react-popover | Only used by deleted popover.tsx |
| @radix-ui/react-progress | Only used by deleted progress.tsx |
| @radix-ui/react-scroll-area | Only used by deleted scroll-area.tsx |
| @radix-ui/react-select | Only used by deleted select.tsx |
| @radix-ui/react-separator | Only used by deleted separator.tsx |
| @radix-ui/react-slider | Only used by deleted slider.tsx |
| @radix-ui/react-tabs | Only used by deleted tabs.tsx |
| @radix-ui/react-toggle | Only used by deleted toggle.tsx |
| @radix-ui/react-toggle-group | Only used by deleted toggle-group.tsx |

### Other
- `avatar-history-dialog.tsx` — replaced `<ScrollArea>` with plain `overflow-x-auto div` + `scrollbar-none` CSS class. Visually identical (scrollbar was hidden on touch devices anyway; `scrollbar-none` hides it on desktop too)

---

## BUNDLE IMPACT
| Metric | Before | After |
|--------|--------|-------|
| Radix chunk | 110KB gzip | 98KB gzip |
| PWA precache | 2105KB | 2031KB |
| Reduction | — | ~74KB gzip / ~500KB uncompressed |
| npm packages | 47 deps | 31 deps |
| UI component files | 54 | 19 |

---

## WHAT STAYS (UI components kept)
avatar, badge, button, dialog, dropdown-menu, empty, floating-save, input, label, marquee-text, page-loading-fallback, publish-toggle, pull-to-refresh, skeleton, sonner, spinner, switch, textarea, tooltip

## WHAT STAYS (Radix packages kept)
@radix-ui/react-avatar, @radix-ui/react-dialog, @radix-ui/react-dropdown-menu, @radix-ui/react-label, @radix-ui/react-slot, @radix-ui/react-switch, @radix-ui/react-tooltip

---

## NOTES FOR NEXT SESSION
- Tools section is next — all 8 tools are `enabled: false` except `yt-download` (enabled, routes to `yt.retakt.cc`)
- When adding a new tool: create `src/features/tools/<name>/config.ts`, register in `src/features/tools/index.ts`, add route in `App.tsx`
- `bg-remover` has a config but no page — needs `/tools/bg-remover` route and implementation
- `yt.retakt.cc` frontend is done — needs backend API wired to `handleDownload` in `yt/YTPage.tsx`
- About page still shows "Coming soon..." — needs real bio content and social URLs
- Profile picture in comments still shows initials — `avatar_url` not fetched in `loadComments()`

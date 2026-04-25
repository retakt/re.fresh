# re.Takt — Project Summary & Roadmap
> Last updated: April 2026 · Beta v1.2 · Commit `111c778`

---

## 1. What This Project Is

**re.Takt** is a personal website / PWA for Takt Akira — a music producer and content creator. It is a full-stack React + Supabase application with:

- A public-facing site (blog, music, tutorials, files, about, search)
- A private admin panel (content management, member management, quotes)
- A floating music player with queue support
- A comment system with voting, threading, and block-level anchoring
- A PWA with service worker, offline support, and push notification scaffolding
- Sentry error monitoring
- Supabase Edge Functions for invite, member management, password reset

**Stack:** React 19, TypeScript, Vite 7, Tailwind CSS v4, Radix UI, Framer Motion, Supabase (Postgres + Auth + Storage + Edge Functions), Sentry, Workbox PWA

---

## 2. Everything Completed This Session

### 2.1 Admin List Pages — 3-Line Card Layout
All 4 admin list pages (music, posts, tutorials, files) were redesigned with:
- **Consistent 3-line layout**: Line 1 = title + Live/Draft badge, Line 2 = metadata, Line 3 = tags
- **`items-stretch` + `flex-col justify-center`** on both left and right columns — badges and action icons are now vertically aligned across all cards regardless of title length
- **`MarqueeText` component** applied to all titles — scrolls right-to-left only when text overflows, static otherwise
- **Right-side actions** (toggle + edit + delete) always centered vertically

### 2.2 MarqueeText Component (`src/components/ui/marquee-text.tsx`)
- **Two-copy seamless loop** using two absolutely-positioned `<span>` elements with `marquee-a` and `marquee-b` keyframes
- `marquee-a`: `translateX(0%) → translateX(-100%)` — scrolls out left
- `marquee-b`: `translateX(100%) → translateX(0%)` — arrives from right simultaneously
- **No jitter**: mathematically perfect handoff because both copies move exactly 100% of their own width at the same speed
- `ResizeObserver` detects overflow — only animates when text actually doesn't fit
- Speed scales with text length (`Math.max(5, text.length * 0.25)s`)
- Fade mask on both edges via `maskImage`

### 2.3 FloatingSave Component (`src/components/ui/floating-save.tsx`)
- Fixed bottom-right pill button on all 4 editor pages (post, music, tutorial, file)
- Mobile: icon only, sits above bottom nav
- Desktop: icon + label ("Save" / "Create" / "Add")
- Spinner while saving, disabled state

### 2.4 Music Player — Complete Rewrite
**`src/lib/player.tsx`** — Fixed 3 bugs:
1. **Resume bug**: `play()` now checks if the same track is already loaded — if yes, calls `audio.play()` to resume from current position. Only a different track resets `audio.src` and `progress: 0`
2. **Stale state bug**: Added `stateRef` to keep a ref to current state so `play()` and `togglePlay()` never read stale closure values
3. **`stop()` cleanup**: Properly resets all state without losing volume preference

**`src/components/player/FloatingPlayer.tsx`** — Complete rewrite:
- **3 view states**: `"full"` (bar at bottom), `"pill"` (minimised side tab), nothing (no track)
- **New track → full player** always. Same track resume → view state unchanged (pill stays pill)
- **Drag handle** on full player: `onPointerDown` raw handler, swipe down 60px → collapses to pill. No Framer Motion drag (was causing gesture conflicts and eating clicks)
- **Pill**: plain `<button>`, tap to expand back to full. No drag on pill (was unreliable)
- **3 action buttons** in main row: `ChevronUp` (expand details), `ChevronLeft` (collapse to pill), `X` (stop)
- Removed the old "Minimise player" button buried in expanded panel

### 2.5 Avatar History Dialog (`src/components/account/avatar-history-dialog.tsx`)
- Image size reduced: `size-28 sm:size-36` (was full-screen sized)
- Background: `bg-secondary/30` (theme-aware, was hardcoded white)
- Border: `border-border/50` (matches app's light border style)
- Removed "Tap a thumbnail to switch back to an older photo." hint text
- History thumbnails smaller: `size-16 sm:size-20`
- Removed `DialogDescription` import (no longer needed)

### 2.6 Account Page — Camera Icon Interaction
- **Long press moved from avatar image to camera icon** — avoids Safari's native image long-press context menu
- Camera icon enlarged: `size-8` (was `size-6`) — bigger tap target
- **Tap camera** = open file picker (change photo)
- **Long press camera** = open history panel
- `WebkitTouchCallout: none` on button to suppress Safari context menu
- Removed "Tap to change. Press and hold to preview photo history." hint text
- Avatar image itself is now just a display element (no press handlers)

### 2.7 Search Page — Fully Wired Up (`src/pages/search/page.tsx`)
- Was completely stubbed out with TODO comments
- Now does live Supabase `ilike` queries across posts, tutorials, and music
- 300ms debounce via `useDebounce` hook
- Music results route correctly (albums/EPs → album page, singles → song page)
- Results have icon badges, tags, proper card styling with `Link` (not `<a>`)
- `use-debounce.ts` hook created (file existed but was empty)

### 2.8 Music Routing Fixes
- **EP routing**: EPs and Albums both go to album page (grouped view). Singles go to song page
- **Album page**: Removed track numbers, replaced with always-visible play/pause buttons
- **Animated equalizer bars** (`PlayingBars` component) on active track in album list
- **Song page back button**: Shows album name when track belongs to one ("← My Album" instead of "← Music")
- **Song page loading**: Uses shared `SongDetailSkeleton` instead of inline markup
- **Home page music links**: Albums/EPs now link to album page (was always linking to song page)

### 2.9 Blog Post & Tutorial Post Loading States
- Both were using inline `animate-pulse` divs
- Now use shared `PostDetailSkeleton` component

### 2.10 Account Page Logout
- Was navigating to `/` after logout
- Now stays on current page (no redirect)

### 2.11 Files Page
- `fetchFiles` wrapped in `useCallback` (was recreated on every render)

### 2.12 Anonymous Vote Bug Fix (`src/components/comments/comments-section.tsx`)
- `handleVote` now reads current vote from `localStorage` directly for anon users
- Prevents the -2 bug where stale React state caused incorrect delta calculation

### 2.13 Admin Card Layout — Previous Session
- Music admin: `[AUDIO]` badge on Line 1, artist/release/year on Line 2, tags on Line 3
- Posts admin: title + badge on Line 1, date on Line 2, tags on Line 3
- Tutorials admin: title + badge on Line 1, difficulty · category on Line 2, tags on Line 3
- Files admin: name + badge on Line 1, category · size on Line 2, file_type on Line 3
- All cards: `min-h-[4.5rem]`, consistent height

### 2.14 CSS Additions (`src/index.css`)
- `@keyframes musicbar` — animated equalizer bars for album page
- `@keyframes marquee-a` and `@keyframes marquee-b` — two-copy seamless marquee loop

---

## 3. Full Codebase Audit — Current State

### 3.1 Pages

| Page | Status | Notes |
|------|--------|-------|
| `/` (Index) | ✅ Complete | Quote rotation, content feed, tools grid |
| `/blog` | ✅ Complete | Tag filter, pull-to-refresh, prefetch |
| `/blog/:slug` | ✅ Complete | Block-level comments, swipe back |
| `/music` | ✅ Complete | Filter tabs, tag filter, pull-to-refresh |
| `/music/album/:name` | ✅ Complete | Spotify-style, play buttons, equalizer bars |
| `/music/song/:id` | ✅ Complete | Smart back nav, play/pause |
| `/tutorials` | ✅ Complete | Tag/difficulty filter, pull-to-refresh |
| `/tutorials/:slug` | ✅ Complete | Full content, tags, swipe back |
| `/files` | ✅ Complete | Download cards, category |
| `/search` | ✅ Complete | Live Supabase search, debounced |
| `/about` | ⚠️ Placeholder | "Coming soon..." — needs real content |
| `/account` | ✅ Complete | Avatar, username, role, notifications |
| `/login` | ✅ Complete | Email/username login, `?from=` redirect |
| `/admin` | ✅ Complete | Tile grid, role-gated |
| `/admin/posts` | ✅ Complete | 3-line cards, marquee, aligned |
| `/admin/posts/new` | ✅ Complete | Rich text, tags, cover image, floating save |
| `/admin/posts/edit/:id` | ✅ Complete | Same as above |
| `/admin/music` | ✅ Complete | 3-line cards, marquee, platform icons |
| `/admin/music/new` | ✅ Complete | Full form, audio URL, platform links, floating save |
| `/admin/music/edit/:id` | ✅ Complete | Same as above |
| `/admin/tutorials` | ✅ Complete | 3-line cards, marquee, aligned |
| `/admin/tutorials/new` | ✅ Complete | Rich text, tags, difficulty, floating save |
| `/admin/tutorials/edit/:id` | ✅ Complete | Same as above |
| `/admin/files` | ✅ Complete | 3-line cards, marquee, aligned |
| `/admin/files/new` | ✅ Complete | File upload, floating save |
| `/admin/files/edit/:id` | ✅ Complete | Same as above |
| `/admin/members` | ✅ Complete | Invite, role change, username edit, reset pw |
| `/admin/quotes` | ✅ Complete | DB + default quotes, hide/restore, edit |
| `/editor` | ✅ Complete | Editor-role dashboard (posts + tutorials only) |
| `/404` | ✅ Complete | NotFound page |

### 3.2 Components

| Component | Status | Notes |
|-----------|--------|-------|
| `FloatingPlayer` | ✅ Fixed | Full/pill/hidden states, no drag bugs |
| `CommentsSection` | ✅ Complete | Threading, voting, attachments, anon votes |
| `MarqueeText` | ✅ Complete | Two-copy seamless loop |
| `FloatingSave` | ✅ Complete | All editor pages |
| `PublishToggle` | ✅ Complete | Teal on/off toggle |
| `AvatarHistoryDialog` | ✅ Fixed | Compact, theme-aware |
| `UserMenu` | ✅ Complete | Avatar, role badge, logout |
| `Navbar` | ✅ Complete | Back button, search, theme toggle |
| `Sidebar` | ✅ Complete | Prefetch on hover |
| `BottomNav` | ✅ Complete | Prefetch on touch |
| `PageHeader` | ✅ Complete | Title, subtitle, action slot |
| `ErrorBoundary` | ✅ Complete | Sentry integration |
| `ProtectedRoute` | ✅ Complete | Role-based access |
| `RichTextEditor` | ✅ Complete | Tiptap, markdown, image upload |
| `ImageUpload` | ✅ Complete | Supabase storage |
| `FileUpload` | ✅ Complete | Supabase storage |

### 3.3 Hooks

| Hook | Status | Notes |
|------|--------|-------|
| `useAuth` | ✅ Complete | User, profile, role, avatar, notifications |
| `useBackNav` | ✅ Complete | Smart back navigation |
| `useDebounce` | ✅ Complete | Created this session |
| `useLongPress` | ✅ Complete | Used for camera icon |
| `useMobile` | ✅ Complete | Breakpoint detection |
| `usePersistedState` | ✅ Complete | localStorage-backed state |
| `usePullToRefresh` | ✅ Complete | Mobile pull gesture |
| `useServiceWorker` | ✅ Complete | PWA update prompts |
| `useSwipeBack` | ✅ Complete | iOS-style swipe back |
| `useVirtualList` | ✅ Complete | Exists but not used yet |

### 3.4 Supabase Edge Functions

| Function | Status | Notes |
|----------|--------|-------|
| `invite-user` | ✅ Deployed v7 | ES256 JWT fix, sends invite email |
| `admin-manage-member` | ✅ Deployed | Delete, role change, username update |
| `admin-reset-password` | ✅ Deployed | Sends password reset email |
| `admin-update-email` | ✅ Deployed | Updates member email |
| `resolve-login-identifier` | ✅ Deployed | Username → email lookup for login |

### 3.5 Database Migrations Applied

| Migration | Description |
|-----------|-------------|
| `v0_1_1` | Avatar history table + username guardrails |
| `v0_1_3` | Comments table + editor media uploads |
| `v0_1_4` | Tutorial tags column |
| `v0_1_5` | Fix comments RLS policies |
| `v0_1_6` | Fix difficulty constraint on tutorials |
| `v0_1_7` | Comment votes table |

### 3.6 Empty / Stub Folders Found

| Path | Status |
|------|--------|
| `src/features/tools/yt-downloader/` | **EMPTY** — no files, just a folder |
| `src/features/tools/bg-remover/` | Has `config.ts` only — no page implementation |

---

## 4. What Is Left To Do

### 4.1 HIGH PRIORITY

#### About Page Content
- **File**: `src/pages/about/page.tsx`
- Currently shows "Coming soon..." with placeholder social links (Spotify and Globe links are `"..."`)
- **Needs**: Real bio content, actual Spotify profile URL, actual website URL
- Social links structure is already built — just needs real URLs filled in

#### Profile Picture Visibility in Comments
- Avatar in comments shows initials instead of actual photo for some users
- The `userMeta` in comments only fetches `username` and `role` from `profiles` — it does NOT fetch `avatar_url`
- **Fix needed**: Add `avatar_url` to the profiles query in `loadComments()` in `comments-section.tsx`, then display it in `CommentCard`

#### `yt-downloader` Empty Folder
- `src/features/tools/yt-downloader/` is completely empty
- Either add a `config.ts` (like `bg-remover`) or delete the folder
- Currently harmless but messy

### 4.2 MEDIUM PRIORITY

#### Tools Section — "Soon™" State
- All 8 tools on the home page are `enabled: false` and show "Soon™"
- The tools grid is purely decorative right now
- **When ready**: Set `enabled: true` in each tool's config and add `href` to route to the tool page
- `bg-remover` has a config but no page implementation at `/tools/bg-remover`
- No `/tools/*` routes exist in `App.tsx` yet

#### Search — Full Text Search
- Current search uses `ilike` (case-insensitive LIKE) which only matches title
- Does not search content, excerpt, tags, or artist
- **Improvement**: Add Supabase full-text search (`to_tsvector`) or search across more fields
- Also: search results don't show excerpt for music (no excerpt field on music)

#### Music Player — Seek on Mobile
- The seek bar in the expanded panel works on desktop
- On mobile, the drag gesture on the player handle can interfere with the seek slider
- The bottom progress bar (tap to seek) works but is a small tap target
- **Improvement**: Make the seek area in expanded panel larger on mobile

#### Notifications
- `notificationsEnabled` toggle exists in account page and `useAuth`
- Push notification logic is scaffolded in `use-service-worker.ts`
- **Not actually wired up** — toggling it does nothing beyond storing the preference
- Needs: VAPID keys, subscription endpoint, server-side push sending

#### `useVirtualList` Hook
- Exists at `src/hooks/use-virtual-list.ts` but is not used anywhere
- If the music list or blog list grows very large, this would improve performance
- Currently not needed but worth keeping

### 4.3 LOW PRIORITY / NICE TO HAVE

#### Admin Role Display → "Dev"
- User requested changing "Admin" role display to "Dev" in comments and account page
- Currently shows "admin" badge in `RoleBadge` component in comments and `ROLE_BADGE` in account
- Simple text change, deferred by user

#### `use-debounce` vs `use-debounce` package
- `package.json` has `"use-debounce": "^10.1.1"` as a dependency
- But `src/hooks/use-debounce.ts` is a custom implementation
- The search page imports from the custom hook
- **Minor**: Either use the package or remove it from `package.json` to avoid confusion

#### Cover Image on Music Song Page
- When a song has no cover image, shows a generic music icon
- Could show the album cover if the track belongs to an album (fetch from album's first track)

#### Pagination / Load More
- Blog, tutorials, music all load everything at once (limited to 10 on home page, unlimited on list pages)
- For large content libraries, pagination or infinite scroll would be needed
- `useVirtualList` hook is already there for this

#### PWA Version
- `package.json` version is `"0.0.0"` but PWA shows `v1.2.0` (set in `vite.config`)
- Should sync these

#### Missing `v0_1_2` Migration
- Migrations jump from `v0_1_1` to `v0_1_3` — `v0_1_2` is missing
- Likely was applied manually or renamed. Not a functional issue but worth noting.

---

## 5. Architecture Notes

### Data Flow
```
User → React Router → Page Component
                    → useAuth (Supabase Auth)
                    → supabase.from() (Supabase Postgres)
                    → Supabase Storage (images, audio, files)
                    → Edge Functions (admin operations)
```

### Auth Model
- **admin**: Full access to all admin pages, can manage members, music, files, quotes
- **editor**: Access to posts and tutorials only (via `/editor` route)
- **member**: Can comment, vote, update own profile
- **anonymous**: Can view all published content, vote on comments (localStorage)

### Player Architecture
- `PlayerProvider` wraps the entire app in `DefaultProviders`
- Single `<audio>` element, never recreated
- `stateRef` keeps current state accessible in callbacks without stale closures
- `play(track)` — if same track: resume. If different: load new src and play from start
- `FloatingPlayer` has 3 view states: `"full"`, `"pill"`, hidden (no track)
- New track always opens full player. Resume/pause never changes view state.

### Comment System
- Threaded (parent_id), sorted by created_at ascending
- Block-level anchoring: clicking "Reply" on a content block sets `anchor_id` + `anchor_label`
- Votes: authenticated users → `comment_votes` table. Anonymous → `localStorage["anon-votes"]`
- Attachments: images, videos, files uploaded to Supabase Storage `comments` bucket

---

## 6. Deployment

- **Frontend**: VPS (user deploys manually after build)
- **Backend**: Supabase cloud project `yroedxnorqfndcajlmpu`
- **Build command**: `npm run build` → `dist/` folder
- **PWA**: Workbox service worker, 75-76 precache entries, ~2MB
- **Sentry**: Configured via `VITE_SENTRY_DSN` env var
- **Supabase Site URL**: Must be set to `https://retakt.cc` in Auth → URL Configuration

---

## 7. Environment Variables Required

```env
VITE_SUPABASE_URL=https://yroedxnorqfndcajlmpu.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_SENTRY_DSN=...          # optional, monitoring
VITE_SENTRY_ENVIRONMENT=...  # optional, "production"
VITE_SENTRY_TRACES_SAMPLE_RATE=... # optional, 0.2
```

---

## 8. Git History (This Session)

| Commit | Message |
|--------|---------|
| `6047509` | beta v1.2 |
| `bb653f2` | beta v1.2 — marquee titles, floating save, avatar panel fixes |
| `8012e01` | fix: player resume, pill state, drag collapse |
| `111c778` | fix: marquee jitter, vertical alignment all admin pages |
| `bcac75c` | docs: add full project summary and roadmap |
| `9e4dab5` | fix: music card alignment, members layout, social icons |
| `d1ba89c` | fix: members layout, invite token refresh, icon weights, custom role scaffold |

---

## 9. Pending / Scaffolded (Not Yet Implemented)

| Feature | Status | Notes |
|---------|--------|-------|
| Reset Username via email | Scaffolded | `handleResetUsername` in members.tsx — shows "coming soon" toast. Wire up when email flow is ready |
| Custom roles | Scaffolded | "Custom…" option in role dropdown opens native text input. Backend `update_role` already accepts any string. Future: validate/list custom roles |
| Custom dialog boxes | Planned | Replace `toast` + `confirm()` with custom modal components |
| Profile picture in comments | Not started | `avatar_url` not fetched in comments query |
| About page content | Not started | Real bio + social URLs needed |
| Tools section | Not started | All 8 tools are `enabled: false` |

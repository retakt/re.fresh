# re.Takt — PLAN2.md
## Status as of 2026-04-22 (post v0.1.5)

---

## ✅ What Was Just Fixed / Shipped

| Item | Status |
|---|---|
| Comments posting (RLS migration) | ✅ Run migration `v0_1_5` |
| Comments visible to public (anon read) | ✅ Done |
| Usernames shown on comments with per-user colour | ✅ Done |
| Role badges on comments (admin = fuchsia, editor = amber) | ✅ Done |
| Thread-style replies (left border line, indented) | ✅ Done |
| Delete own comment (owner) / delete any comment (admin) | ✅ Done |
| Cmd+Enter to post comment | ✅ Done |
| Reply shows target username in colour | ✅ Done |
| Tutorial editor — dedicated route `/admin/tutorials/new` and `/admin/tutorials/edit/:id` | ✅ Done |
| Tutorial list page — clean list, no inline form | ✅ Done |
| "Add tutorial" from public page → goes directly to editor (1 click) | ✅ Done |
| "Edit" on tutorial post page → goes directly to editor | ✅ Done |
| Invite function — fixed `VITE_` env var bug in edge function | ✅ Done |
| Service worker, pull-to-refresh, swipe-back, prefetch | ✅ Done |
| Bundle splitting (radix, date-fns, charts, markdown, sentry chunks) | ✅ Done |
| PWA manifest with shortcuts and maskable icons | ✅ Done |

---

## 🔴 Migrations — What to Run

You said you ran `v0_1_5`. Here's the full status:

| Migration file | What it does | Run it? |
|---|---|---|
| `20260422_v0_1_1_avatar_history_and_username_guardrails.sql` | Adds `profile_avatar_history` table + unique username index | **Yes — run this** if avatar history / username login isn't working |
| `20260422_v0_1_3_comments_and_editor_media.sql` | Creates `post_comments` table | **Yes — run this** if comments table doesn't exist yet |
| `20260422_v0_1_4_tutorial_tags.sql` | Adds `tags` column to tutorials | **Yes — run this** if tutorial tags aren't saving |
| `20260422_v0_1_5_fix_comments_rls.sql` | Fixes RLS so public can read + authenticated can post | ✅ Already run |

**Recommendation:** Run all 4 in order in your Supabase SQL editor. They're all idempotent (`create if not exists`, `drop policy if exists`) so running them twice is safe.

---

## 🟡 Invite — Why It Was Failing

The `invite-user` edge function was using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as env var names. Those are Vite frontend env vars — they don't exist in Deno edge functions. The correct names are `SUPABASE_URL` and `SUPABASE_ANON_KEY`, which Supabase injects automatically. **Fixed.** You need to redeploy the function:

```bash
supabase functions deploy invite-user
```

---

## 🟡 Editor Role — What They Can and Can't Do

Current state (enforced in code + RLS):

| Action | Admin | Editor | Member |
|---|---|---|---|
| Create/edit blog posts | ✅ | ✅ | ❌ |
| Create/edit tutorials | ✅ | ✅ | ❌ |
| Manage music | ✅ | ❌ | ❌ |
| Manage files | ✅ | ❌ | ❌ |
| Manage members | ✅ | ❌ | ❌ |
| Manage quotes | ✅ | ❌ | ❌ |
| Delete comments | ✅ | ❌ | own only |
| Post comments | ✅ | ✅ | ✅ |
| Read comments | ✅ | ✅ | ✅ + public |

Editors see the admin dashboard with only Posts + Tutorials tiles. They can navigate directly to `/admin/posts/new` or `/admin/tutorials/new` without going through the dashboard.

---

## 🔵 Next Up — Priority Order

### Immediate (do these next)

**1. Redeploy edge functions**
```bash
supabase functions deploy invite-user
supabase functions deploy admin-manage-member
supabase functions deploy admin-reset-password
supabase functions deploy admin-update-email
supabase functions deploy resolve-login-identifier
```
The shared `_shared/admin.ts` already handles env vars correctly. The invite fix needs a redeploy to take effect.

**2. Run the 3 remaining migrations** (see table above)

**3. Wire virtual scrolling to music and files lists**
The `use-virtual-list.ts` hook is built. Music and files pages can have 100+ items. Connect the hook to those two list pages. Estimated: 1 hour.

---

### Short term (this week)

**4. Full-text search**
A search bar that queries posts, tutorials, and music simultaneously. Supabase supports `ilike` and `fts` (full-text search with `to_tsvector`). One component, one query, massive UX win. Suggested approach:
- Add a `search` column with `tsvector` to posts and tutorials via migration
- Or use simple `ilike` on title + tags for now (no migration needed)
- Global search bar in the navbar, results grouped by type

**5. Reading progress bar**
A thin bar at the top of blog/tutorial post pages that fills as you scroll. Pure CSS + one scroll listener. 30 minutes of work, feels very premium.

**6. Dynamic `<title>` and OG tags per page**
Every page currently shows `<title>re.Takt</title>`. Each post/tutorial should set its own title and description for sharing. Use a `useDocumentTitle` hook (no extra dependency needed). Also update OG image per post using the cover image URL.

**7. Offline indicator**
The service worker is registered but there's no UI when the user goes offline. Use the `use-service-worker.ts` hook that's already built — show a small toast or banner.

---

### Medium term (this month)

**8. User role badges — visual identity system**
You mentioned wanting to distinguish roles visually. Current state: admin = fuchsia shield, editor = amber pen on comments. Suggestions for expanding this:

- **Option A (simple):** Coloured username + role badge on comments (already done). Add the same badge to the user menu dropdown so users see their own role.
- **Option B (richer):** Custom flair system — admins/editors get a small icon next to their name everywhere. Members can earn badges (e.g. "Early member", "Active commenter") stored in a `user_badges` table.
- **Option C (Telegram-style):** Verified checkmark for admin, star for editor, nothing for member. Clean and recognisable.

Recommendation: Start with Option A (already done), add Option C checkmark/star next to usernames in comments. Save Option B for later when you have more users.

**9. Bookmarks**
Let logged-in users save posts and tutorials. One `bookmarks` table (`user_id`, `post_id`, `type`, `created_at`), a heart/bookmark icon on cards, a bookmarks page at `/account/bookmarks`. High engagement feature, low complexity.

**10. Share buttons**
Native Web Share API on mobile (the OS share sheet), clipboard fallback on desktop. One component, drop it into post pages. Zero dependencies.

**11. Reading time estimate**
Count words in `content`, divide by 200 wpm. Show "5 min read" in the post header. One utility function, one line in the UI.

**12. Content scheduling**
Add `publish_at timestamptz` column to posts and tutorials. The query filters `published = true AND (publish_at IS NULL OR publish_at <= now())`. Write ahead, goes live automatically. One migration + small query change.

---

### Longer term (next month)

**13. Admin analytics dashboard**
A page at `/admin/analytics` showing:
- Post view counts (needs a `post_views` table — increment on page load)
- Comment counts per post
- Most popular content
- New members over time
Recharts is already installed. The hard part is the `post_views` table and making sure it doesn't get spammed.

**14. Push notifications**
Requires VAPID key setup, a `push_subscriptions` table, and a Supabase Edge Function to send. Worth doing once you have regular content and want re-engagement. Not urgent.

**15. JSON-LD structured data**
Add `Article` schema to blog posts and `HowTo`/`Course` schema to tutorials. Improves Google rich results (star ratings, breadcrumbs in search). Pure HTML injection, no dependencies.

**16. Audit logs**
A `admin_audit_log` table that records who created/edited/deleted what. One Supabase trigger per table, no frontend work needed. Useful for accountability when you have editors.

**17. Content CDN**
Move Supabase storage to a CDN-fronted bucket (Cloudflare R2 or similar) for faster global image delivery. Infrastructure change, not code. Only worth doing when you have significant traffic.

---

## 📊 Current Technical Debt

| Item | Severity | Notes |
|---|---|---|
| `use-virtual-list.ts` not wired to any page | Medium | Hook exists, needs connecting to music/files |
| No `<title>` per page | Medium | All pages show "re.Takt" |
| No search | Medium | Users can't find content |
| No offline UI | Low | SW registered but silent |
| `SUMMARY.md` is outdated | Low | Reflects old session state |
| `PLAN.md` roadmap items are stale | Low | Superseded by this file |

---

## 💡 Badge / Role Identity — Recommendation

For distinguishing roles in comments and across the site, here's a clean system that scales:

**Now (already done):**
- Comments show username in a deterministic colour (8 hues, stable per user)
- Admin gets a fuchsia `shield` badge, editor gets an amber `pen` badge

**Next step:**
- Add a small verified-style icon next to admin/editor usernames everywhere (not just comments)
- Keep it subtle — a `✦` or `◆` glyph in the role colour works better than a full badge for inline use

**Future (when you have more users):**
- `user_badges` table: `(user_id, badge_type, awarded_at, awarded_by)`
- Badge types: `early_member`, `active_commenter`, `contributor`, `verified`
- Show as small pill icons on profile and comments
- Admin can award badges from the members page

This gives you a progression system without building a full gamification layer upfront.

---

## 🗂 File Reference

| File | Purpose |
|---|---|
| `src/components/comments/comments-section.tsx` | Comments with usernames, colours, role badges, threads |
| `src/pages/admin/tutorial-editor.tsx` | New dedicated tutorial editor page |
| `src/pages/admin/tutorials.tsx` | Tutorial list (links to editor, no inline form) |
| `src/pages/admin/post-editor.tsx` | Blog post editor (cover image + tags added) |
| `src/hooks/use-pull-to-refresh.ts` | Pull-to-refresh for mobile |
| `src/hooks/use-swipe-back.ts` | Swipe right to go back |
| `src/hooks/use-virtual-list.ts` | Virtual scrolling (not yet wired) |
| `src/hooks/use-service-worker.ts` | SW status hook (not yet used in UI) |
| `src/lib/prefetch.ts` | Route + data prefetching on hover |
| `public/sw.js` | Service worker (stale-while-revalidate) |
| `supabase/functions/invite-user/index.ts` | Fixed env var bug — needs redeploy |
| `supabase/migrations/20260422_v0_1_5_fix_comments_rls.sql` | Public read + auth insert RLS |

---

**Last updated:** 2026-04-22
**Version:** 0.1.5

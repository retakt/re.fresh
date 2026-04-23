create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references public.post_comments(id) on delete cascade,
  anchor_id text,
  anchor_label text,
  body text not null default '',
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists post_comments_post_id_idx on public.post_comments (post_id, created_at desc);
create index if not exists post_comments_parent_id_idx on public.post_comments (parent_id, created_at asc);
create index if not exists post_comments_user_id_idx on public.post_comments (user_id, created_at desc);
create index if not exists post_comments_anchor_id_idx on public.post_comments (post_id, anchor_id);

alter table public.post_comments enable row level security;

drop policy if exists "Anyone can read comments" on public.post_comments;
create policy "Anyone can read comments"
on public.post_comments
for select
to anon, authenticated
using (true);

drop policy if exists "Authenticated users can insert comments" on public.post_comments;
create policy "Authenticated users can insert comments"
on public.post_comments
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Authenticated users can update own comments" on public.post_comments;
create policy "Authenticated users can update own comments"
on public.post_comments
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Authenticated users can delete own comments" on public.post_comments;
create policy "Authenticated users can delete own comments"
on public.post_comments
for delete
to authenticated
using (auth.uid() = user_id);

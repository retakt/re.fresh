-- Comment votes table for upvote/downvote
create table if not exists public.comment_votes (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.post_comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  vote smallint not null check (vote in (1, -1)),
  created_at timestamptz not null default now(),
  unique (comment_id, user_id)
);

create index if not exists comment_votes_comment_id_idx on public.comment_votes (comment_id);
create index if not exists comment_votes_user_id_idx on public.comment_votes (user_id);

alter table public.comment_votes enable row level security;

-- Anyone can read votes (for displaying counts)
create policy "Anyone can read votes"
on public.comment_votes for select
to anon, authenticated
using (true);

-- Authenticated users can insert/update/delete their own votes
create policy "Users can manage own votes"
on public.comment_votes for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own votes"
on public.comment_votes for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own votes"
on public.comment_votes for delete
to authenticated
using (auth.uid() = user_id);

-- Reload schema cache
notify pgrst, 'reload schema';

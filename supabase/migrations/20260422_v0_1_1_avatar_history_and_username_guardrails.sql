create extension if not exists pgcrypto;

create table if not exists public.profile_avatar_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  avatar_url text not null,
  storage_path text not null,
  is_active boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists profile_avatar_history_user_created_idx
  on public.profile_avatar_history (user_id, created_at desc);

create unique index if not exists profile_avatar_history_one_active_idx
  on public.profile_avatar_history (user_id)
  where is_active = true;

create unique index if not exists profiles_username_normalized_unique_idx
  on public.profiles (lower(btrim(username)))
  where username is not null and btrim(username) <> '';

alter table public.profile_avatar_history enable row level security;

drop policy if exists "Users can view their own avatar history" on public.profile_avatar_history;
create policy "Users can view their own avatar history"
  on public.profile_avatar_history
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own avatar history" on public.profile_avatar_history;
create policy "Users can insert their own avatar history"
  on public.profile_avatar_history
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own avatar history" on public.profile_avatar_history;
create policy "Users can update their own avatar history"
  on public.profile_avatar_history
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own avatar history" on public.profile_avatar_history;
create policy "Users can delete their own avatar history"
  on public.profile_avatar_history
  for delete
  using (auth.uid() = user_id);

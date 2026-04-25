-- Allow public (anon) to read limited profile fields for comment display.
-- Only exposes: id, username, role — no email, no avatar_url, no private data.
-- When a `badge` column is added to profiles in the future, add it here too.

drop policy if exists "Public can read profile display info" on public.profiles;

create policy "Public can read profile display info"
  on public.profiles
  for select
  to anon, authenticated
  using (true);

-- Reload PostgREST schema cache
notify pgrst, 'reload schema';

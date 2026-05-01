-- Auto-create a profile row when a user confirms their email (accepts invite / magic link)
-- This ensures profiles always exist after email confirmation, regardless of how the user was created.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    'member'
  )
  on conflict (id) do nothing;  -- don't overwrite if already pre-populated by approve-access-request
  return new;
end;
$$;

-- Fire after a user's email is confirmed (covers invite acceptance + magic link)
drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed
  after update on auth.users
  for each row
  when (
    old.email_confirmed_at is null
    and new.email_confirmed_at is not null
  )
  execute procedure public.handle_new_user();

-- Also fire on insert for users created with email already confirmed (e.g. OAuth, admin-created)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  when (new.email_confirmed_at is not null)
  execute procedure public.handle_new_user();

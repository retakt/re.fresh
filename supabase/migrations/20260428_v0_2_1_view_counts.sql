-- Add view_count to all three content tables
alter table public.posts     add column if not exists view_count integer not null default 0;
alter table public.tutorials add column if not exists view_count integer not null default 0;
alter table public.music     add column if not exists view_count integer not null default 0;

-- Atomic increment RPC — avoids race conditions, callable by anon
create or replace function public.increment_view_count(
  p_table  text,
  p_id     uuid
) returns void
language plpgsql
security definer
as $$
begin
  if p_table = 'posts' then
    update public.posts     set view_count = view_count + 1 where id = p_id;
  elsif p_table = 'tutorials' then
    update public.tutorials set view_count = view_count + 1 where id = p_id;
  elsif p_table = 'music' then
    update public.music     set view_count = view_count + 1 where id = p_id;
  end if;
end;
$$;

-- Allow anon + authenticated to call it
grant execute on function public.increment_view_count(text, uuid) to anon, authenticated;

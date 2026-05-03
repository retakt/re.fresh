alter table public.tutorials
add column if not exists tags text[] not null default '{}';

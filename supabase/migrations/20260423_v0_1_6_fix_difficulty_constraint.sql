-- Remove the check constraint on difficulty so custom values are allowed
-- The constraint only permitted 'Beginner', 'Intermediate', 'Advanced'
alter table public.tutorials
drop constraint if exists tutorials_difficulty_check;

-- Also ensure tags column exists and schema cache is refreshed
alter table public.tutorials
add column if not exists tags text[] not null default '{}';

-- Force PostgREST to reload schema cache
notify pgrst, 'reload schema';

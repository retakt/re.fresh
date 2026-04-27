-- Add cover_image_opacity column to posts table
alter table public.posts
add column if not exists cover_image_opacity numeric default 1;

-- Add comment
comment on column public.posts.cover_image_opacity is 'Opacity value for cover image (0-1)';

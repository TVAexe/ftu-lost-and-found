-- Run once in Supabase SQL Editor.
-- Keeps image_url for existing cards and stores all images in image_urls.

alter table public.items
add column if not exists image_urls jsonb not null default '[]'::jsonb;

update public.items
set image_urls = jsonb_build_array(image_url)
where image_url is not null
  and image_url <> ''
  and (image_urls = '[]'::jsonb or image_urls is null);

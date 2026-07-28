-- Marks a coffee as finished/used up so it stops appearing in the brew picker
-- (it stays in the library and keeps its history).
-- Run this in the Supabase SQL editor if your `coffees` table already exists.
alter table public.coffees
  add column if not exists finished boolean not null default false;

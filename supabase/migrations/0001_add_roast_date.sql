-- Adds roast date to the coffee library.
-- Run this in the Supabase SQL editor if your `coffees` table already exists
-- (a fresh run of schema.sql already includes the column).
alter table public.coffees
  add column if not exists roast_date date;

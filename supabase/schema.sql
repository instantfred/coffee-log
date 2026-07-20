-- Coffee Log — database schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Safe to re-run: uses "if not exists" / "or replace" where possible.

-- ── Coffees: a personal library of beans ─────────────────────────────────────
create table if not exists public.coffees (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  name           text not null,
  roaster        text,
  origin_country text,
  region         text,
  process        text,
  roast_level    text,
  roast_date     date,
  purchase_date  date,
  open_date      date,
  notes          text,
  created_at     timestamptz not null default now()
);

-- ── Brews: each individual preparation (the "lab log") ───────────────────────
create table if not exists public.brews (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users (id) on delete cascade,
  coffee_id          uuid references public.coffees (id) on delete set null,
  method             text not null,                 -- v60 | french_press | moka_pot | ...
  brewed_at          timestamptz not null default now(),
  dose_g             numeric(6, 1),
  water_g            numeric(7, 1),
  -- Ratio is derived automatically: water per gram of coffee (the "16" in 1:16).
  ratio              numeric(6, 2) generated always as (
                       case when dose_g is not null and dose_g > 0 and water_g is not null
                            then water_g / dose_g end
                     ) stored,
  water_temp_c       numeric(4, 1),
  total_time_seconds integer,
  grind_size         text,
  rating             integer check (rating between 1 and 10),
  satisfaction       integer check (satisfaction between 1 and 5),
  flavor_notes       text,
  comments           text,
  created_at         timestamptz not null default now()
);

create index if not exists brews_user_brewed_idx on public.brews (user_id, brewed_at desc);
create index if not exists brews_coffee_idx on public.brews (coffee_id);
create index if not exists coffees_user_idx on public.coffees (user_id, created_at desc);

-- ── Row Level Security: every user sees only their own rows ──────────────────
alter table public.coffees enable row level security;
alter table public.brews   enable row level security;

drop policy if exists "coffees are private" on public.coffees;
create policy "coffees are private" on public.coffees
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "brews are private" on public.brews;
create policy "brews are private" on public.brews
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

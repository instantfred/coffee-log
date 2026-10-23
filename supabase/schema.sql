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
  finished       boolean not null default false,
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

-- Personal grinders and per-brew settings. Existing general grind values are preserved.
create table if not exists public.grinders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 100),
  grind_type text not null check (grind_type in ('clicks', 'general')),
  created_at timestamptz not null default now(),
  unique (id, user_id)
);
create index if not exists grinders_user_idx on public.grinders (user_id, created_at desc);
alter table public.grinders enable row level security;
drop policy if exists "grinders are private" on public.grinders;
create policy "grinders are private" on public.grinders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.brews add column if not exists grinder_id uuid;
alter table public.brews add column if not exists grinder_name text;
alter table public.brews add column if not exists grind_clicks integer;

-- Composite key prevents linking another user's grinder, even through direct API calls.
alter table public.brews drop constraint if exists brews_grinder_owner_fk;
alter table public.brews add constraint brews_grinder_owner_fk
  foreign key (grinder_id, user_id) references public.grinders (id, user_id);
alter table public.brews drop constraint if exists brews_grind_setting_check;
alter table public.brews add constraint brews_grind_setting_check check (
  grind_clicks is null or (grind_clicks >= 0 and grinder_id is not null and grind_size is null)
);
create index if not exists brews_grinder_idx on public.brews (grinder_id);

-- Removing a grinder hides it from new brews while preserving historical references.
alter table public.grinders add column if not exists archived boolean not null default false;

-- Removing a grinder hides it from new brews while preserving historical references.
alter table public.grinders add column if not exists archived boolean not null default false;

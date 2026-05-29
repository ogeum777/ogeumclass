-- Paste this file into Supabase Dashboard > SQL Editor and run it once.
-- The policies below allow public read/write with the anon key because the
-- current app has no login system. Tighten these policies before using private data.

create extension if not exists pgcrypto;

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.periods (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.school_dates (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  school_date date not null references public.school_dates(date) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete restrict,
  period_id uuid not null references public.periods(id) on delete restrict,
  location text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint schedules_one_per_class_period unique (school_date, class_id, period_id)
);

create table if not exists public.app_settings (
  setting_key text primary key,
  setting_value text not null default '',
  updated_at timestamptz not null default now()
);

create index if not exists schedules_school_date_idx on public.schedules(school_date);
create index if not exists schedules_class_id_idx on public.schedules(class_id);
create index if not exists schedules_subject_id_idx on public.schedules(subject_id);
create index if not exists schedules_period_id_idx on public.schedules(period_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists schedules_set_updated_at on public.schedules;
create trigger schedules_set_updated_at
before update on public.schedules
for each row
execute function public.set_updated_at();

alter table public.classes enable row level security;
alter table public.subjects enable row level security;
alter table public.periods enable row level security;
alter table public.school_dates enable row level security;
alter table public.schedules enable row level security;
alter table public.app_settings enable row level security;

drop policy if exists "Public read classes" on public.classes;
create policy "Public read classes"
on public.classes for select
to anon, authenticated
using (true);

drop policy if exists "Public write classes" on public.classes;
create policy "Public write classes"
on public.classes for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Public read subjects" on public.subjects;
create policy "Public read subjects"
on public.subjects for select
to anon, authenticated
using (true);

drop policy if exists "Public write subjects" on public.subjects;
create policy "Public write subjects"
on public.subjects for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Public read periods" on public.periods;
create policy "Public read periods"
on public.periods for select
to anon, authenticated
using (true);

drop policy if exists "Public write periods" on public.periods;
create policy "Public write periods"
on public.periods for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Public read school_dates" on public.school_dates;
create policy "Public read school_dates"
on public.school_dates for select
to anon, authenticated
using (true);

drop policy if exists "Public write school_dates" on public.school_dates;
create policy "Public write school_dates"
on public.school_dates for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Public read schedules" on public.schedules;
create policy "Public read schedules"
on public.schedules for select
to anon, authenticated
using (true);

drop policy if exists "Public write schedules" on public.schedules;
create policy "Public write schedules"
on public.schedules for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Public read app_settings" on public.app_settings;
create policy "Public read app_settings"
on public.app_settings for select
to anon, authenticated
using (true);

drop policy if exists "Public write app_settings" on public.app_settings;
create policy "Public write app_settings"
on public.app_settings for all
to anon, authenticated
using (true)
with check (true);

insert into public.app_settings (setting_key, setting_value)
values ('teacher_password', '')
on conflict (setting_key) do nothing;

insert into public.periods (name, sort_order)
values
  ('1교시', 1),
  ('2교시', 2),
  ('3교시', 3),
  ('4교시', 4),
  ('5교시', 5),
  ('6교시', 6),
  ('7교시', 7)
on conflict (name) do update
set sort_order = excluded.sort_order;

-- Run this once in Supabase SQL Editor if the app_settings table does not exist yet.

create table if not exists public.app_settings (
  setting_key text primary key,
  setting_value text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

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

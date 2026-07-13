-- ============================================================
-- Mother Nature's Sandbox — Database Schema (Phase 2)
-- Paste this entire file into Supabase → SQL Editor → New Query → Run
-- Safe to re-run: uses "if not exists" / "on conflict do nothing" throughout
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 1. PROFILES (one row per auth user)
-- ------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  bio text,
  referral_code text unique not null,
  referred_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 2. ADMIN USERS (who has admin/moderator access)
-- ------------------------------------------------------------
create table if not exists admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('owner','admin','moderator')),
  created_at timestamptz default now()
);

-- Helper function to check admin status without RLS recursion
create or replace function is_admin(check_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(select 1 from admin_users where id = check_user_id);
$$;

-- ------------------------------------------------------------
-- 3. APP SETTINGS (global toggles the admin panel controls)
-- ------------------------------------------------------------
create table if not exists app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 4. SITE CONTENT (About Us, FAQ, homepage news — admin editable)
-- ------------------------------------------------------------
create table if not exists site_content (
  key text primary key,
  content jsonb not null,
  updated_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 5. STORM PARAMETER DEFINITIONS (powers Sandbox + Education glossary)
-- ------------------------------------------------------------
create table if not exists storm_parameter_definitions (
  id uuid primary key default gen_random_uuid(),
  storm_type text not null,
  category text,
  name text not null,
  description text,
  min_value numeric,
  max_value numeric,
  default_value numeric,
  unit text,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 6. STORMS (every storm a user creates)
-- ------------------------------------------------------------
create table if not exists storms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  storm_type text not null,
  region text,
  parameters jsonb not null default '{}',
  outlook_text text,
  stats jsonb,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 7. BADGES (admin-editable catalog)
-- ------------------------------------------------------------
create table if not exists badges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  icon text not null,
  tier text default 'bronze' check (tier in ('bronze','silver','gold','legendary')),
  animation_style text default 'glow',
  criteria jsonb,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 8. USER BADGES (who has earned what)
-- ------------------------------------------------------------
create table if not exists user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  badge_id uuid references badges(id) on delete cascade,
  awarded_at timestamptz default now(),
  awarded_by uuid references profiles(id),
  unique(user_id, badge_id)
);

-- ------------------------------------------------------------
-- 9. REFERRALS
-- ------------------------------------------------------------
create table if not exists referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid references profiles(id) on delete cascade,
  referred_id uuid references profiles(id) on delete cascade unique,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 10. RATINGS (private star + written reviews)
-- ------------------------------------------------------------
create table if not exists ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  stars int not null check (stars between 1 and 5),
  review text,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 11. CONTACT FORM CONFIG (single row admins edit)
-- ------------------------------------------------------------
create table if not exists contact_form_config (
  id int primary key default 1 check (id = 1),
  fields jsonb not null default '[]',
  destination_emails text[] not null default '{}',
  updated_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 12. CONTACT SUBMISSIONS
-- ------------------------------------------------------------
create table if not exists contact_submissions (
  id uuid primary key default gen_random_uuid(),
  form_data jsonb not null,
  status text default 'new',
  created_at timestamptz default now()
);

-- ============================================================
-- TRIGGERS: keep updated_at fresh
-- ============================================================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_app_settings_updated on app_settings;
create trigger trg_app_settings_updated before update on app_settings
  for each row execute function set_updated_at();

drop trigger if exists trg_site_content_updated on site_content;
create trigger trg_site_content_updated before update on site_content
  for each row execute function set_updated_at();

drop trigger if exists trg_contact_form_config_updated on contact_form_config;
create trigger trg_contact_form_config_updated before update on contact_form_config
  for each row execute function set_updated_at();

-- ============================================================
-- REFERRAL CODE GENERATOR + NEW USER HANDLER
-- ============================================================
create or replace function generate_referral_code()
returns text
language plpgsql
as $$
declare
  new_code text;
  code_exists boolean;
begin
  loop
    new_code := lpad(floor(random() * 100000)::text, 5, '0');
    select exists(select 1 from profiles where referral_code = new_code) into code_exists;
    exit when not code_exists;
  end loop;
  return new_code;
end;
$$;

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ref_code text;
  referrer_profile_id uuid;
begin
  insert into public.profiles (id, display_name, referral_code)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    generate_referral_code()
  )
  on conflict (id) do nothing;

  ref_code := new.raw_user_meta_data->>'referral_code';
  if ref_code is not null and ref_code <> '' then
    select id into referrer_profile_id from public.profiles where referral_code = ref_code;
    if referrer_profile_id is not null and referrer_profile_id <> new.id then
      update public.profiles set referred_by = referrer_profile_id where id = new.id;
      insert into public.referrals (referrer_id, referred_id)
      values (referrer_profile_id, new.id)
      on conflict (referred_id) do nothing;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table profiles enable row level security;
alter table admin_users enable row level security;
alter table app_settings enable row level security;
alter table site_content enable row level security;
alter table storm_parameter_definitions enable row level security;
alter table storms enable row level security;
alter table badges enable row level security;
alter table user_badges enable row level security;
alter table referrals enable row level security;
alter table ratings enable row level security;
alter table contact_form_config enable row level security;
alter table contact_submissions enable row level security;

-- profiles: any signed-in user can read profiles; only owner can update their own
drop policy if exists "profiles_select" on profiles;
create policy "profiles_select" on profiles for select to authenticated using (true);
drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles for update to authenticated using (auth.uid() = id);

-- admin_users: readable by the admin themself or any admin; writable only by admins
drop policy if exists "admin_users_select" on admin_users;
create policy "admin_users_select" on admin_users for select to authenticated
  using (auth.uid() = id or is_admin(auth.uid()));
drop policy if exists "admin_users_write" on admin_users;
create policy "admin_users_write" on admin_users for all to authenticated
  using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

-- app_settings: public read, admin write
drop policy if exists "app_settings_select" on app_settings;
create policy "app_settings_select" on app_settings for select using (true);
drop policy if exists "app_settings_write" on app_settings;
create policy "app_settings_write" on app_settings for all to authenticated
  using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

-- site_content: public read, admin write
drop policy if exists "site_content_select" on site_content;
create policy "site_content_select" on site_content for select using (true);
drop policy if exists "site_content_write" on site_content;
create policy "site_content_write" on site_content for all to authenticated
  using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

-- storm_parameter_definitions: public read, admin write
drop policy if exists "spd_select" on storm_parameter_definitions;
create policy "spd_select" on storm_parameter_definitions for select using (true);
drop policy if exists "spd_write" on storm_parameter_definitions;
create policy "spd_write" on storm_parameter_definitions for all to authenticated
  using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

-- storms: private to the owner (+ admin)
drop policy if exists "storms_select" on storms;
create policy "storms_select" on storms for select to authenticated
  using (auth.uid() = user_id or is_admin(auth.uid()));
drop policy if exists "storms_insert" on storms;
create policy "storms_insert" on storms for insert to authenticated
  with check (auth.uid() = user_id);
drop policy if exists "storms_update" on storms;
create policy "storms_update" on storms for update to authenticated
  using (auth.uid() = user_id);
drop policy if exists "storms_delete" on storms;
create policy "storms_delete" on storms for delete to authenticated
  using (auth.uid() = user_id);

-- badges: public read, admin write
drop policy if exists "badges_select" on badges;
create policy "badges_select" on badges for select using (true);
drop policy if exists "badges_write" on badges;
create policy "badges_write" on badges for all to authenticated
  using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

-- user_badges: private to the owner (+ admin); only admin grants/revokes
drop policy if exists "user_badges_select" on user_badges;
create policy "user_badges_select" on user_badges for select to authenticated
  using (auth.uid() = user_id or is_admin(auth.uid()));
drop policy if exists "user_badges_write" on user_badges;
create policy "user_badges_write" on user_badges for all to authenticated
  using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

-- referrals: referrer can see their own referral list; admin sees all
drop policy if exists "referrals_select" on referrals;
create policy "referrals_select" on referrals for select to authenticated
  using (auth.uid() = referrer_id or is_admin(auth.uid()));

-- ratings: user can submit their own; only admin can read (private per spec)
drop policy if exists "ratings_insert" on ratings;
create policy "ratings_insert" on ratings for insert to authenticated
  with check (auth.uid() = user_id);
drop policy if exists "ratings_select" on ratings;
create policy "ratings_select" on ratings for select to authenticated
  using (is_admin(auth.uid()));

-- contact_form_config: public read (to render the form), admin write
drop policy if exists "cfc_select" on contact_form_config;
create policy "cfc_select" on contact_form_config for select using (true);
drop policy if exists "cfc_write" on contact_form_config;
create policy "cfc_write" on contact_form_config for all to authenticated
  using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

-- contact_submissions: anyone (incl. logged-out visitors) can submit; only admin reads
drop policy if exists "cs_insert" on contact_submissions;
create policy "cs_insert" on contact_submissions for insert with check (true);
drop policy if exists "cs_select" on contact_submissions;
create policy "cs_select" on contact_submissions for select to authenticated
  using (is_admin(auth.uid()));

-- ============================================================
-- SEED DATA (safe defaults — edit later from the admin panel)
-- ============================================================
insert into app_settings (key, value) values
  ('email_verification_required', 'true'),
  ('maintenance_mode', 'false')
on conflict (key) do nothing;

insert into contact_form_config (id, fields, destination_emails) values (
  1,
  '[
    {"name":"name","label":"Your Name","type":"text","required":true},
    {"name":"email","label":"Your Email","type":"email","required":true},
    {"name":"subject","label":"Subject","type":"text","required":true},
    {"name":"message","label":"Message","type":"textarea","required":true}
  ]'::jsonb,
  ARRAY['Administration@StormSync.Media']
) on conflict (id) do nothing;

insert into site_content (key, content) values
  ('about_us', '{"title":"About Us","body":"Welcome to Mother Nature''s Sandbox. Content coming soon — edit this from the admin panel."}'),
  ('faq', '[]'),
  ('homepage_news', '[]')
on conflict (key) do nothing;

-- ============================================================
-- DONE. See INSTRUCTIONS.md for how to make yourself the first admin.
-- ============================================================

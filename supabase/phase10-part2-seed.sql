-- ============================================================
-- Phase 10, Part 2 — supports Admin Roles management
-- Paste into Supabase → SQL Editor → New Query → Run
-- ============================================================

-- Safely look up a user's ID by email (needed to add a new admin by email,
-- without ever exposing the service role key to the app). Returns only a
-- UUID - no other account details.
create or replace function get_user_id_by_email(lookup_email text)
returns uuid
language sql
security definer
set search_path = public
as $$
  select id from auth.users where email = lookup_email limit 1;
$$;

revoke all on function get_user_id_by_email(text) from public;
grant execute on function get_user_id_by_email(text) to authenticated;

-- ------------------------------------------------------------
-- Security tightening: only the owner should be able to add or remove
-- admins. The original admin_users_write policy allowed any admin/moderator
-- to modify this table (since is_admin() is true for all three roles) -
-- the app's own UI already restricted this to owners, but the database
-- itself should enforce the same boundary, not just the app code.
-- ------------------------------------------------------------
create or replace function is_owner(check_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(select 1 from admin_users where id = check_user_id and role = 'owner');
$$;

drop policy if exists "admin_users_write" on admin_users;
create policy "admin_users_write" on admin_users for all to authenticated
  using (is_owner(auth.uid())) with check (is_owner(auth.uid()));

-- ============================================================
-- DONE.
-- ============================================================

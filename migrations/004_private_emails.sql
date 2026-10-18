-- Keep people's email addresses private, and add two columns the admin
-- pages already use.
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to re-run. Needs 003 to have been run first.
--
-- Before: "profiles are publicly readable" let anyone (even logged out)
-- read every column of every profile, email included.
-- After: other people can read every profile column EXCEPT email (names and
-- photos still show on listings, reviews and chats). You read your own full
-- profile through my_profile(); admins read everyone's through
-- admin_list_profiles().

-- ---------------------------------------------------------------------
-- 1. Columns the admin pages use but schema.sql never had
-- ---------------------------------------------------------------------
alter table equipment add column if not exists flagged boolean not null default false;
alter table disputes add column if not exists resolution_notes text;

-- ---------------------------------------------------------------------
-- 2. Column-level read access on profiles: everything but email.
--    Built from the live column list. If you add a column to profiles
--    later, run this file again so other people can read it too.
-- ---------------------------------------------------------------------
do $$
declare
  v_cols text;
begin
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
  into v_cols
  from information_schema.columns
  where table_schema = 'public' and table_name = 'profiles' and column_name <> 'email';

  execute 'revoke select on profiles from anon, authenticated';
  execute format('grant select (%s) on profiles to anon, authenticated', v_cols);
end;
$$;

-- ---------------------------------------------------------------------
-- 3. Your own profile, in full
-- ---------------------------------------------------------------------
create or replace function my_profile() returns setof profiles
language plpgsql stable security definer set search_path = public as $$
begin
  return query select * from profiles where id = auth.uid();
end;
$$;

-- ---------------------------------------------------------------------
-- 4. Admins: everyone's profile, emails included
-- ---------------------------------------------------------------------
create or replace function admin_list_profiles(p_limit int default null) returns setof profiles
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then
    raise exception 'Only admins can see this.' using errcode = 'insufficient_privilege';
  end if;
  return query select * from profiles order by created_at desc limit p_limit;
end;
$$;

revoke all on function my_profile(), admin_list_profiles(int) from public, anon;
grant execute on function my_profile(), admin_list_profiles(int) to authenticated;

-- ---------------------------------------------------------------------
-- 5. Nobody can make themselves an admin
--    "users can update their own profile" covers every column, so anyone
--    could set their own role to 'admin' (and unlock everything) or lift
--    their own suspension. Renter <-> owner stays free: the app switches
--    between them (AuthContext, PostListing).
-- ---------------------------------------------------------------------
create or replace function guard_profile_changes() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if is_admin() or auth.uid() is null then
    return new; -- admins, and the dashboard / server (no signed-in user)
  end if;
  if new.role = 'admin' and old.role is distinct from 'admin' then
    raise exception 'Only an admin can make someone an admin.' using errcode = 'insufficient_privilege';
  end if;
  if new.status is distinct from old.status then
    raise exception 'Only an admin can change an account''s status.' using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_changes on profiles;
create trigger profiles_guard_changes
  before update on profiles
  for each row execute function guard_profile_changes();

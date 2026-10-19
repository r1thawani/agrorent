-- Roles become just 'user' and 'admin'.
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to re-run. Needs 007 to have been run first.
--
-- Before: user_role = ('renter', 'owner', 'admin'). That wrongly made renter and
-- owner separate account types, but one person can be both: renter/owner is
-- decided per booking and per listing (renter_id / owner_id), not per account.
--   renter -> user
--   owner  -> user
--   admin  -> admin (unchanged)

-- 1. The sign-up trigger. The copy in a live database may still insert the role
--    'renter', which is about to stop existing. This is the same function as
--    schema.sql section 14b; the role column's default ('user') now supplies it.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- Phone, location and date of birth are copied by the app at first login
  -- (AuthContext fillFromSignup), since those columns come from migration 005.
  insert into profiles (id, name, email)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 2. Swap the role type. Postgres can't drop enum values, so build the new type,
--    convert every profile, and remove the old one. Skipped when the type is
--    already ('user', 'admin') (a fresh install, or a second run).
do $$
begin
  if exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'user_role' and e.enumlabel in ('renter', 'owner')
  ) then
    alter table profiles alter column role drop default;

    alter type user_role rename to user_role_old;
    create type user_role as enum ('user', 'admin');

    alter table profiles
      alter column role type user_role
      using (case when role::text = 'admin' then 'admin' else 'user' end)::user_role;

    alter table profiles alter column role set default 'user';

    drop type user_role_old;
  end if;
end $$;

comment on table profiles is 'Extends auth.users. role is either user (can both rent and list equipment) or admin.';

notify pgrst, 'reload schema';

-- Roles become just 'user' and 'admin'.
--
-- Before: user_role = ('renter', 'owner', 'admin'). That wrongly made renter and
-- owner separate account types, but one person can be both: renter/owner is
-- decided per booking and per listing (renter_id / owner_id), not per account.
--
-- Run once in the Supabase SQL Editor. It runs in a single transaction, so if
-- anything fails nothing is changed.
--   renter -> user
--   owner  -> user
--   admin  -> admin (unchanged)

begin;

-- Safety check: a signup trigger or other function that still hard-codes
-- 'renter' or 'owner' would start failing once those values are gone. If one
-- exists, stop here and list it so it can be edited first.
do $$
declare
  offenders text;
begin
  select string_agg(n.nspname || '.' || p.proname, ', ')
    into offenders
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname not in ('pg_catalog', 'information_schema')
    and n.nspname not in ('auth', 'storage', 'realtime', 'extensions', 'graphql', 'graphql_public', 'vault', 'pgsodium', 'supabase_functions', 'net')
    and p.prosrc ~* '''(renter|owner)''';
  if offenders is not null then
    raise exception 'These functions still mention the roles renter/owner: %. Edit them to use ''user'' first, then re-run this script.', offenders;
  end if;
end $$;

alter table profiles alter column role drop default;

alter type user_role rename to user_role_old;
create type user_role as enum ('user', 'admin');

alter table profiles
  alter column role type user_role
  using (case when role::text = 'admin' then 'admin' else 'user' end)::user_role;

alter table profiles alter column role set default 'user';

drop type user_role_old;

comment on table profiles is 'Extends auth.users. role is either user (can both rent and list equipment) or admin.';

commit;

notify pgrst, 'reload schema';

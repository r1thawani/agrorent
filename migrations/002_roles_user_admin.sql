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

-- The signup trigger used to insert every new account with the role 'renter'.
-- It must hand out 'user' instead, or sign-ups would fail once 'renter' is gone.
-- (booking_events also contains the words 'renter' and 'owner', but only as
-- labels in its email data, never as a role value, so it needs no change.)
create or replace function public.handle_new_user()
  returns trigger
  language plpgsql
  security definer
as $function$
begin
  insert into public.profiles (id, name, email, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''), new.email, 'user');
  return new;
end;
$function$;

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

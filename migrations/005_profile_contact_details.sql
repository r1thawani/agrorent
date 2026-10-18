-- Save phone number, location and date of birth on profiles, and share a
-- phone number with the other party once a booking's deposit is paid.
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to re-run. Needs 004 to have been run first.
--
-- Who sees what:
--   province, district   anyone (shown on public profiles)
--   phone                you, admins, and the other person on a booking
--                        whose deposit has been paid (to arrange pickup)
--   date_of_birth        you and admins

-- ---------------------------------------------------------------------
-- 1. Columns
-- ---------------------------------------------------------------------
alter table profiles add column if not exists phone text;
alter table profiles add column if not exists province text;
alter table profiles add column if not exists district text;
alter table profiles add column if not exists date_of_birth date;

-- Same format the sign-up form uses: +260 then 9 digits.
alter table profiles drop constraint if exists profiles_phone_format;
alter table profiles add constraint profiles_phone_format
  check (phone is null or phone ~ '^\+260[0-9]{9}$') not valid;

-- ---------------------------------------------------------------------
-- 2. Other people may read every column except the private ones.
--    (Same rule as 004, now that the new columns exist.)
-- ---------------------------------------------------------------------
do $$
declare
  v_cols text;
begin
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
  into v_cols
  from information_schema.columns
  where table_schema = 'public' and table_name = 'profiles'
    and column_name not in ('email', 'phone', 'date_of_birth');

  execute 'revoke select on profiles from anon, authenticated';
  execute format('grant select (%s) on profiles to anon, authenticated', v_cols);
end;
$$;

-- ---------------------------------------------------------------------
-- 3. The other person's name and phone on each of your paid bookings
-- ---------------------------------------------------------------------
create or replace function my_booking_contacts()
returns table (booking_id uuid, name text, phone text)
language plpgsql stable security definer set search_path = public as $$
begin
  return query
  select b.id, p.name, p.phone
  from bookings b
  join profiles p on p.id = case when b.renter_id = auth.uid() then b.owner_id else b.renter_id end
  where (b.renter_id = auth.uid() or b.owner_id = auth.uid())
    and b.status in ('confirmed', 'completed');
end;
$$;

revoke all on function my_booking_contacts() from public, anon;
grant execute on function my_booking_contacts() to authenticated;

notify pgrst, 'reload schema';

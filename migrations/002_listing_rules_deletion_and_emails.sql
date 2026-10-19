-- Listing input limits, owner-side listing deletion, booking completion,
-- and the bookkeeping the email notifications need.
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to re-run.
--
-- The limits below must match src/utils/listingRules.js. If you change one,
-- change the other, or the form will accept values the database rejects
-- (or the other way round).

-- ---------------------------------------------------------------------
-- 1. Columns the app uses
-- ---------------------------------------------------------------------
-- is_available already exists on the live project (MyListings toggles it)
-- but was never added to schema.sql; IF NOT EXISTS makes this a no-op there.
alter table equipment add column if not exists is_available boolean not null default true;

-- Set when an owner deletes a listing that still has booking history.
-- The row is kept so past bookings, reviews and earnings still show the
-- equipment name; every browse/owner query filters these rows out.
alter table equipment add column if not exists deleted_at timestamptz;

-- When the "you have a new message" email went out for this message.
-- Used so each message triggers at most one email.
alter table messages add column if not exists email_notified_at timestamptz;

-- ---------------------------------------------------------------------
-- 2. Listing limits (enforced here so they can't be bypassed by calling
--    the API directly). NOT VALID = existing rows aren't checked, only
--    new inserts and edits, so this can't fail on old data.
-- ---------------------------------------------------------------------
alter table equipment drop constraint if exists equipment_price_day_range;
alter table equipment add constraint equipment_price_day_range
  check (price_day between 50 and 50000) not valid;

alter table equipment drop constraint if exists equipment_price_week_range;
alter table equipment add constraint equipment_price_week_range
  check (price_week is null or (price_week >= price_day and price_week <= price_day * 7)) not valid;

alter table equipment drop constraint if exists equipment_text_lengths;
alter table equipment add constraint equipment_text_lengths
  check (
    char_length(trim(name)) between 3 and 80
    and (description is null or char_length(description) <= 1000)
    and char_length(trim(pickup_address)) between 5 and 150
  ) not valid;

alter table equipment drop constraint if exists equipment_available_range;
alter table equipment add constraint equipment_available_range
  check (available_from is null or available_until is null or available_until >= available_from) not valid;

alter table messages drop constraint if exists messages_text_length;
alter table messages add constraint messages_text_length
  check (char_length(trim(text)) between 1 and 1000) not valid;

-- At most 8 photos per listing.
create or replace function enforce_photo_limit() returns trigger
language plpgsql as $$
begin
  if (select count(*) from equipment_photos where equipment_id = new.equipment_id) >= 8 then
    raise exception 'A listing can have at most 8 photos.' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists equipment_photos_limit on equipment_photos;
create trigger equipment_photos_limit
  before insert on equipment_photos
  for each row execute function enforce_photo_limit();

-- Photo files: 2 MB max (the app shrinks photos to well under this before
-- uploading), JPEG/PNG/WebP only.
update storage.buckets
set file_size_limit = 2 * 1024 * 1024,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'equipment-photos';

-- ---------------------------------------------------------------------
-- 3. No new bookings on equipment that is unavailable or deleted
--    (ListingDetail hides Book Now, but a direct link could still try).
-- ---------------------------------------------------------------------
create or replace function reject_booking_on_unavailable_equipment() returns trigger
language plpgsql as $$
begin
  if exists (
    select 1 from equipment
    where id = new.equipment_id and (is_available = false or deleted_at is not null)
  ) then
    raise exception 'This equipment is not available for booking.' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists bookings_equipment_available on bookings;
create trigger bookings_equipment_available
  before insert on bookings
  for each row execute function reject_booking_on_unavailable_equipment();

-- ---------------------------------------------------------------------
-- 4. Owner deletes a listing
--    Blocked if a confirmed booking is happening now or later.
--    Otherwise: pending requests are declined (renters get a notification),
--    then the row is removed outright if it has no booking history at all,
--    or hidden (deleted_at) if past bookings exist, so their history stays.
-- ---------------------------------------------------------------------
create or replace function delete_listing(p_equipment_id uuid)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_name text;
begin
  select name into v_name
  from equipment
  where id = p_equipment_id and owner_id = auth.uid() and deleted_at is null
  for update;

  if v_name is null then
    raise exception 'Listing not found.' using errcode = 'no_data_found';
  end if;

  if exists (
    select 1 from bookings
    where equipment_id = p_equipment_id
      and status = 'confirmed'
      and end_date >= current_date
  ) then
    raise exception 'This listing has a confirmed booking that is current or upcoming, so it cannot be deleted. Mark it unavailable instead.'
      using errcode = 'check_violation';
  end if;

  insert into notifications (user_id, type, text)
  select renter_id, 'request',
         'Your booking request for ' || v_name || ' was declined because the owner removed the listing.'
  from bookings
  where equipment_id = p_equipment_id and status = 'pending';

  update bookings set status = 'declined', updated_at = now()
  where equipment_id = p_equipment_id and status = 'pending';

  if exists (select 1 from bookings where equipment_id = p_equipment_id) then
    update equipment set deleted_at = now(), is_available = false where id = p_equipment_id;
    delete from wishlists where equipment_id = p_equipment_id;
    return 'archived';
  end if;

  delete from equipment where id = p_equipment_id;
  return 'deleted';
end;
$$;

revoke all on function delete_listing(uuid) from public;
grant execute on function delete_listing(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 5. Bookings become 'completed' once their end date has passed.
--    Nothing did this before, so bookings stayed 'confirmed' forever:
--    renters could never leave a review (that needs 'completed') and the
--    Earnings page never showed a completed rental.
-- ---------------------------------------------------------------------
create or replace function complete_finished_bookings()
returns int
language sql security definer set search_path = public as $$
  with done as (
    update bookings set status = 'completed', updated_at = now()
    where status = 'confirmed' and end_date < current_date
    returning 1
  )
  select count(*)::int from done;
$$;

revoke all on function complete_finished_bookings() from public;

select complete_finished_bookings();

-- Runs it every night at 00:05 (Supabase supports pg_cron; if this line
-- errors, enable "pg_cron" under Database -> Extensions and run it again).
create extension if not exists pg_cron;
select cron.unschedule(jobid) from cron.job where jobname = 'complete-finished-bookings';
select cron.schedule('complete-finished-bookings', '5 0 * * *', 'select complete_finished_bookings()');

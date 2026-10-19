-- Listing rules apply to listings that are still on the site, not to ones
-- being deleted.
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to re-run. Needs 010 to have been run first. If you ever re-run 002 or
-- 003 (which add the old versions of these rules), run this one again after.
--
-- Deleting a listing that has booking history hides it: delete_listing() and
-- close_account() set deleted_at with an UPDATE, and Postgres re-checks every
-- rule on an updated row. A listing saved before a rule existed (for example
-- a weekly price above 7x the daily price, from before 002) then couldn't be
-- deleted, and its owner couldn't delete their account. Now a row with
-- deleted_at set is exempt; listings on the site follow the same rules as
-- before, and new or edited listings are checked exactly as before.

alter table equipment drop constraint if exists equipment_price_day_range;
alter table equipment add constraint equipment_price_day_range
  check (deleted_at is not null or price_day between 50 and 5000) not valid;

alter table equipment drop constraint if exists equipment_price_week_range;
alter table equipment add constraint equipment_price_week_range
  check (deleted_at is not null or price_week is null
         or (price_week >= price_day and price_week <= price_day * 7)) not valid;

alter table equipment drop constraint if exists equipment_text_lengths;
alter table equipment add constraint equipment_text_lengths
  check (
    deleted_at is not null or (
      char_length(trim(name)) between 3 and 80
      and (description is null or char_length(description) <= 1000)
      and char_length(trim(pickup_address)) between 5 and 150
    )
  ) not valid;

alter table equipment drop constraint if exists equipment_available_range;
alter table equipment add constraint equipment_available_range
  check (deleted_at is not null or available_from is null or available_until is null
         or available_until >= available_from) not valid;

notify pgrst, 'reload schema';

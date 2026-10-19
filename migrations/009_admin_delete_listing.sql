-- Lets an admin delete (archive) any listing from the admin dashboard.
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to re-run. Needs 008 to have been run first.
--
-- Before: delete_listing() only worked for the listing's own owner, so the
-- Delete button on the admin Listings page did nothing for anyone else's
-- listing (the call failed with "Listing not found").
-- After: owners and admins can both use it. Everything else is unchanged:
-- refused while a confirmed booking is current or upcoming; otherwise open
-- requests are declined (renters are told the listing was removed) and the
-- listing is deleted, or archived if past bookings still point at it.

create or replace function delete_listing(p_equipment_id uuid)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_name text;
begin
  select name into v_name
  from equipment
  where id = p_equipment_id and (owner_id = auth.uid() or is_admin()) and deleted_at is null
  for update;

  if v_name is null then
    raise exception 'Listing not found.' using errcode = 'no_data_found';
  end if;

  if exists (
    select 1 from bookings
    where equipment_id = p_equipment_id and status = 'confirmed' and end_date >= current_date
  ) then
    raise exception 'This listing has a confirmed booking that is current or upcoming, so it cannot be deleted. Mark it unavailable instead.'
      using errcode = 'check_violation';
  end if;

  update bookings set status = 'declined', status_reason = 'listing_removed', updated_at = now()
  where equipment_id = p_equipment_id and status in ('pending', 'accepted');

  if exists (select 1 from bookings where equipment_id = p_equipment_id) then
    update equipment set deleted_at = now(), is_available = false where id = p_equipment_id;
    delete from wishlists where equipment_id = p_equipment_id;
    return 'archived';
  end if;

  delete from equipment where id = p_equipment_id;
  return 'deleted';
end;
$$;

notify pgrst, 'reload schema';

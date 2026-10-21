-- Owners reply to reviews of their equipment from the listing page, and can
-- change only their reply, never the renter's rating or text.
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to re-run.
--
-- The old update rule let an owner change every column of a review on their
-- equipment, so someone calling the database directly could turn a one-star
-- review into five stars. Owners now go through reply_to_review(), which
-- only touches owner_reply. Admins keep full access.

drop policy if exists "owners reply to reviews on their own equipment" on reviews;

alter table reviews drop constraint if exists reviews_owner_reply_length;
alter table reviews add constraint reviews_owner_reply_length
  check (owner_reply is null or char_length(owner_reply) between 1 and 500) not valid;

-- Saves, changes or (with an empty reply) removes the owner's reply.
create or replace function reply_to_review(p_review_id uuid, p_reply text) returns reviews
language plpgsql security definer set search_path = public as $$
declare
  r reviews%rowtype;
  v_reply text := nullif(trim(p_reply), '');
begin
  if char_length(v_reply) > 500 then
    raise exception 'Please keep your reply under 500 characters.' using errcode = 'check_violation';
  end if;

  update reviews rv
  set owner_reply = v_reply
  where rv.id = p_review_id
    and exists (select 1 from equipment e where e.id = rv.equipment_id and e.owner_id = auth.uid())
  returning * into r;

  if not found then
    raise exception 'Review not found.' using errcode = 'no_data_found';
  end if;
  return r;
end;
$$;

revoke all on function reply_to_review(uuid, text) from public, anon;
grant execute on function reply_to_review(uuid, text) to authenticated;

notify pgrst, 'reload schema';

-- Renters and owners can report a problem with a booking; an admin resolves
-- it on /admin/disputes.
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to re-run.
--
-- The old insert rule only checked that you named yourself as the reporter,
-- so anyone could file a dispute about any booking, against anyone. Now a
-- report must be about a confirmed or completed booking you're part of,
-- against the other person on it, and start open with no resolution notes.
-- One open report per person per booking; once an admin resolves it, the
-- same person can report again.

drop policy if exists "users file disputes as the reporter" on disputes;
create policy "users file disputes as the reporter"
  on disputes for insert
  with check (
    auth.uid() = reporter_id
    and status = 'open'
    and resolution_notes is null
    and exists (
      select 1 from bookings b
      where b.id = booking_id
        and b.status in ('confirmed', 'completed')
        and ((b.renter_id = reporter_id and b.owner_id = against_id)
          or (b.owner_id = reporter_id and b.renter_id = against_id))
    )
  );

alter table disputes drop constraint if exists disputes_reason_length;
alter table disputes add constraint disputes_reason_length
  check (char_length(trim(reason)) between 10 and 1000) not valid;

create unique index if not exists disputes_one_open_report
  on disputes (booking_id, reporter_id) where status = 'open';

notify pgrst, 'reload schema';

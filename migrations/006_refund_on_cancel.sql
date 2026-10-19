-- Refunds when a renter cancels a booking they already paid the deposit for.
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to re-run. Needs 005 to have been run first.
--
-- No payment provider is connected (out of scope for the project), so the
-- refund is recorded rather than sent: the payment is marked 'refunded' and
-- the renter is told, in the app and by email, that the deposit will be
-- returned within 5 working days. A paid booking can only be cancelled
-- before its start date; once the equipment is out, the renter contacts
-- the owner or uses Need help.

create or replace function cancel_booking(p_booking_id uuid) returns bookings
language plpgsql security definer set search_path = public as $$
declare
  b bookings%rowtype;
begin
  select * into b from bookings where id = p_booking_id and renter_id = auth.uid() for update;
  if not found or b.status not in ('pending', 'accepted', 'confirmed') then
    raise exception 'This booking can''t be cancelled any more.' using errcode = 'check_violation';
  end if;
  if b.status = 'confirmed' and b.start_date <= current_date then
    raise exception 'This rental has already started, so it can''t be cancelled here. Please contact the owner, or use Need help.'
      using errcode = 'check_violation';
  end if;

  if b.status = 'confirmed' then
    update payments set status = 'refunded' where booking_id = b.id and status = 'paid';
  end if;

  update bookings
  set status = 'cancelled', status_reason = 'renter_cancelled', updated_at = now()
  where id = b.id
  returning * into b;
  return b;
end;
$$;

-- Tells the renter about the refund. (The owner already hears about the
-- cancellation from booking_events() in 003.)
create or replace function booking_refund_events() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_eq text;
begin
  if not (old.status = 'confirmed' and new.status = 'cancelled') then
    return new;
  end if;
  select name into v_eq from equipment where id = new.equipment_id;

  insert into notifications (user_id, type, text, link) values
    (new.renter_id, 'request',
     'Your booking for ' || v_eq || ' is cancelled. Your K' || to_char(new.down_payment, 'FM999,999,990')
       || ' deposit will be refunded within 5 working days.',
     '/my-bookings');

  insert into email_outbox (user_id, kind, booking_id, data) values
    (new.renter_id, 'refund_pending', new.id, jsonb_build_object(
      'equipment', v_eq, 'start_date', new.start_date, 'end_date', new.end_date, 'deposit', new.down_payment));
  return new;
end;
$$;

drop trigger if exists bookings_refund_events on bookings;
create trigger bookings_refund_events
  after update of status on bookings
  for each row execute function booking_refund_events();

notify pgrst, 'reload schema';

-- Charge whole weeks at the owner's weekly price.
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to re-run. Needs 009 to have been run first.
--
-- Before: listings could have a weekly price, but bookings were always
-- charged price_day x days, so the weekly price was only shown.
-- After: whole weeks are charged at the weekly price when the owner set one
-- and it's cheaper than 7 days; leftover days at the daily price. Example:
-- K500/day, K3,000/week, 10 days = K3,000 + 3 x K500 = K4,500 (+ 5% fee).
-- Same sum as calculateBooking() in src/utils/calculateBooking.js.
-- bookings.price_week_snapshot keeps the weekly price used, like
-- price_day_snapshot, so old bookings keep the price they were made at.
-- Existing bookings are not changed.

alter table bookings add column if not exists price_week_snapshot numeric;

create or replace function prepare_booking_request() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  eq equipment%rowtype;
  v_subtotal numeric;
  v_days     int;
  v_weeks    int := 0;
  v_fee numeric;
  v_total numeric;
  v_deposit numeric;
begin
  select * into eq from equipment where id = new.equipment_id;
  if not found or eq.is_available = false or eq.deleted_at is not null then
    raise exception 'This equipment is not available for booking.' using errcode = 'check_violation';
  end if;
  if eq.owner_id = new.renter_id then
    raise exception 'You can''t book your own equipment.' using errcode = 'check_violation';
  end if;
  if new.start_date < current_date then
    raise exception 'Start date can''t be in the past.' using errcode = 'check_violation';
  end if;
  if new.end_date <= new.start_date then
    raise exception 'End date must be after the start date.' using errcode = 'check_violation';
  end if;
  if (eq.available_from is not null and new.start_date < eq.available_from)
     or (eq.available_until is not null and new.end_date > eq.available_until) then
    raise exception 'Those dates are outside the owner''s availability for this equipment.' using errcode = 'check_violation';
  end if;

  if exists (
    select 1 from bookings b
    where b.equipment_id = new.equipment_id and b.status = 'confirmed'
      and b.start_date <= new.end_date and new.start_date <= b.end_date
  ) then
    raise exception 'This equipment is already booked for part of your selected dates. Please choose different dates.'
      using errcode = 'check_violation';
  end if;

  if exists (
    select 1 from bookings b
    where b.equipment_id = new.equipment_id and b.renter_id = new.renter_id
      and b.status in ('pending', 'accepted')
      and b.start_date <= new.end_date and new.start_date <= b.end_date
  ) then
    raise exception 'You already have a request for these dates on this equipment.' using errcode = 'check_violation';
  end if;

  -- Same maths as src/utils/calculateBooking.js
  -- Whole weeks at the weekly price when the owner set one and it's cheaper
  -- than 7 days; leftover days at the daily price.
  v_days := new.end_date - new.start_date;
  if eq.price_week is not null and eq.price_week > 0 and eq.price_week < eq.price_day * 7 then
    v_weeks := v_days / 7;
  end if;
  v_subtotal := v_weeks * coalesce(eq.price_week, 0) + (v_days - v_weeks * 7) * eq.price_day;
  v_fee      := round(v_subtotal * 0.05);
  v_total    := v_subtotal + v_fee;
  v_deposit  := round(v_total * 0.25);

  new.owner_id           := eq.owner_id;
  new.status             := 'pending';
  new.status_reason      := null;
  new.payment_due_at     := null;
  new.paid_at            := null;
  new.total_days         := new.end_date - new.start_date;
  new.price_day_snapshot := eq.price_day;
  new.price_week_snapshot := case when v_weeks > 0 then eq.price_week end;
  new.subtotal           := v_subtotal;
  new.service_fee        := v_fee;
  new.total_price        := v_total;
  new.down_payment       := v_deposit;
  new.balance_due        := v_total - v_deposit;
  return new;
end;
$$;

notify pgrst, 'reload schema';

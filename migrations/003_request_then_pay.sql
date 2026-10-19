-- Request -> accept -> pay deposit booking flow, booking emails, badge counts.
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to re-run. Needs 002 to have been run first.
--
-- How bookings move now:
--   pending   renter sent a request. No money yet, dates NOT held, several
--             renters may request the same dates.
--   accepted  owner said yes. Renter has `payment_grace_minutes` to pay the
--             25% deposit. While this is open the owner can't accept another
--             request for overlapping dates.
--   confirmed renter paid. Dates are now taken; every other pending request
--             for overlapping dates is declined automatically.
--   expired   deposit not paid in time (shown as "Declined" to the owner and
--             "Cancelled" to the renter).
--   declined / cancelled / completed as before.
--
-- Every change of status writes the in-app notification and queues the
-- email (email_outbox) here in the database, so no page can forget to.

-- ---------------------------------------------------------------------
-- 0. New statuses. (Kept to plpgsql below so the new values aren't used
--    before this script commits.)
-- ---------------------------------------------------------------------
alter type booking_status add value if not exists 'accepted';
alter type booking_status add value if not exists 'expired';

-- ---------------------------------------------------------------------
-- 1. Columns and tables
-- ---------------------------------------------------------------------
alter table bookings add column if not exists payment_due_at timestamptz;
alter table bookings add column if not exists paid_at timestamptz;
-- Why a booking ended up declined/cancelled/expired:
-- owner_declined | dates_taken | listing_removed | payment_not_received | renter_cancelled
alter table bookings add column if not exists status_reason text;

-- Where clicking the notification takes you.
alter table notifications add column if not exists link text;

-- Settings the database itself needs. RLS on with no policies: only the
-- dashboard / service role can read or change these.
create table if not exists app_config (
  key   text primary key,
  value text not null
);
alter table app_config enable row level security;

insert into app_config (key, value) values
  ('payment_grace_minutes', '1440'), -- minutes renters get to pay; use e.g. 2 while testing
  ('email_flush_url', ''),          -- e.g. https://agrorent-nine.vercel.app/api/send-emails
  ('vercel_bypass_secret', '')      -- only needed while testing on a protected preview URL
on conflict (key) do nothing;

create or replace function config_value(p_key text) returns text
language sql stable security definer set search_path = public as $$
  select value from app_config where key = p_key;
$$;
revoke all on function config_value(text) from public, anon, authenticated;

-- Emails waiting to go out. /api/send-emails sends them.
create table if not exists email_outbox (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  kind        text not null,
  booking_id  uuid references bookings(id) on delete cascade,
  data        jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  claimed_at  timestamptz,
  sent_at     timestamptz,
  attempts    int not null default 0,
  last_error  text
);
create index if not exists idx_email_outbox_unsent on email_outbox(created_at) where sent_at is null;
alter table email_outbox enable row level security;

-- ---------------------------------------------------------------------
-- 2. Lower the daily price cap to K5,000 (weekly stays <= 7x daily)
-- ---------------------------------------------------------------------
alter table equipment drop constraint if exists equipment_price_day_range;
alter table equipment add constraint equipment_price_day_range
  check (price_day between 50 and 5000) not valid;

-- ---------------------------------------------------------------------
-- 3. Who may change bookings directly
--    Status changes now only happen through the functions below, so a
--    renter can't mark their own booking confirmed or invent a payment.
-- ---------------------------------------------------------------------
drop policy if exists "renters and owners update their own bookings" on bookings;
drop policy if exists "renters create their own bookings" on bookings;
create policy "renters create their own bookings"
  on bookings for insert
  with check (auth.uid() = renter_id);
drop policy if exists "renters create payments for their own bookings" on payments;

-- ---------------------------------------------------------------------
-- 4. New request: checked and priced by the database
-- ---------------------------------------------------------------------
drop trigger if exists bookings_equipment_available on bookings;
drop function if exists reject_booking_on_unavailable_equipment();

create or replace function prepare_booking_request() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  eq equipment%rowtype;
  v_subtotal numeric;
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
  v_subtotal := eq.price_day * (new.end_date - new.start_date);
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
  new.subtotal           := v_subtotal;
  new.service_fee        := v_fee;
  new.total_price        := v_total;
  new.down_payment       := v_deposit;
  new.balance_due        := v_total - v_deposit;
  return new;
end;
$$;

drop trigger if exists bookings_prepare_request on bookings;
create trigger bookings_prepare_request
  before insert on bookings
  for each row execute function prepare_booking_request();

-- ---------------------------------------------------------------------
-- 5. Notifications + emails for every status change
-- ---------------------------------------------------------------------
create or replace function booking_events() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_eq text;
  v_renter text;
  v_owner text;
  v_dates text;
  v_due text;
  v_data jsonb;
begin
  if tg_op = 'UPDATE' and new.status = old.status then
    return new;
  end if;

  select name into v_eq from equipment where id = new.equipment_id;
  select name into v_renter from profiles where id = new.renter_id;
  select name into v_owner from profiles where id = new.owner_id;
  v_dates := to_char(new.start_date, 'DD Mon') || ' – ' || to_char(new.end_date, 'DD Mon YYYY');
  v_due := to_char(new.payment_due_at at time zone 'Africa/Lusaka', 'HH24:MI "on" DD Mon');
  v_data := jsonb_build_object(
    'equipment', v_eq, 'renter', v_renter, 'owner', v_owner,
    'start_date', new.start_date, 'end_date', new.end_date,
    'total', new.total_price, 'deposit', new.down_payment, 'balance', new.balance_due,
    'payment_due_at', new.payment_due_at, 'reason', new.status_reason
  );

  if tg_op = 'INSERT' then
    insert into notifications (user_id, type, text, link) values
      (new.owner_id, 'request', v_renter || ' requested ' || v_eq || ' for ' || v_dates || '.', '/booking-requests');
    insert into email_outbox (user_id, kind, booking_id, data) values (new.owner_id, 'request_received', new.id, v_data);
    return new;
  end if;

  if new.status = 'accepted' then
    insert into notifications (user_id, type, text, link) values
      (new.renter_id, 'confirmed',
       v_owner || ' accepted your request for ' || v_eq || '. Pay the K'
         || to_char(new.down_payment, 'FM999,999,990') || ' deposit by ' || v_due || ' to confirm it.',
       '/booking/' || new.id || '/pay');
    insert into email_outbox (user_id, kind, booking_id, data) values (new.renter_id, 'request_accepted', new.id, v_data);

  elsif new.status = 'confirmed' then
    insert into notifications (user_id, type, text, link) values
      (new.owner_id, 'confirmed', v_renter || ' paid the deposit. ' || v_eq || ' is booked for ' || v_dates || '.', '/booking-requests'),
      (new.renter_id, 'confirmed', 'Booking confirmed: ' || v_eq || ' for ' || v_dates || '.', '/my-bookings');
    insert into email_outbox (user_id, kind, booking_id, data) values (new.owner_id, 'deposit_paid', new.id, v_data);

  elsif new.status = 'declined' then
    insert into notifications (user_id, type, text, link) values
      (new.renter_id, 'request',
       case new.status_reason
         when 'dates_taken' then 'Your request for ' || v_eq || ' was declined: someone else booked those dates first.'
         when 'listing_removed' then 'Your request for ' || v_eq || ' was declined because the owner removed the listing.'
         else v_owner || ' declined your request for ' || v_eq || ' (' || v_dates || ').'
       end,
       '/my-bookings');
    insert into email_outbox (user_id, kind, booking_id, data) values (new.renter_id, 'request_declined', new.id, v_data);

  elsif new.status = 'expired' then
    insert into notifications (user_id, type, text, link) values
      (new.owner_id, 'request', 'The request from ' || v_renter || ' for ' || v_eq || ' was declined automatically: the deposit wasn''t paid in time.', '/booking-requests'),
      (new.renter_id, 'request', 'Your booking for ' || v_eq || ' was cancelled because the deposit wasn''t paid in time.', '/my-bookings');
    insert into email_outbox (user_id, kind, booking_id, data) values
      (new.owner_id, 'expired_owner', new.id, v_data),
      (new.renter_id, 'expired_renter', new.id, v_data);

  elsif new.status = 'cancelled' then
    insert into notifications (user_id, type, text, link) values
      (new.owner_id, 'request', v_renter || ' cancelled their booking for ' || v_eq || ' (' || v_dates || ').', '/booking-requests');
    insert into email_outbox (user_id, kind, booking_id, data) values (new.owner_id, 'renter_cancelled', new.id, v_data);

  elsif new.status = 'completed' then
    insert into notifications (user_id, type, text, link) values
      (new.renter_id, 'completed', 'How was ' || v_eq || '? Leave a review for the owner.', '/review/' || new.id);
  end if;

  return new;
end;
$$;

drop trigger if exists bookings_events on bookings;
create trigger bookings_events
  after insert or update of status on bookings
  for each row execute function booking_events();

-- ---------------------------------------------------------------------
-- 6. Actions (called from the app with supabase.rpc)
-- ---------------------------------------------------------------------
create or replace function accept_booking(p_booking_id uuid) returns bookings
language plpgsql security definer set search_path = public as $$
declare
  b bookings%rowtype;
  v_grace int;
begin
  select * into b from bookings where id = p_booking_id and owner_id = auth.uid() for update;
  if not found then
    raise exception 'Booking request not found.' using errcode = 'no_data_found';
  end if;
  if b.status <> 'pending' then
    raise exception 'This request is no longer waiting for an answer.' using errcode = 'check_violation';
  end if;
  if b.start_date < current_date then
    raise exception 'This request starts in the past, so it can''t be accepted.' using errcode = 'check_violation';
  end if;

  -- One accept at a time per piece of equipment.
  perform 1 from equipment where id = b.equipment_id for update;

  if exists (
    select 1 from bookings o
    where o.equipment_id = b.equipment_id and o.id <> b.id
      and o.start_date <= b.end_date and b.start_date <= o.end_date
      and (o.status = 'confirmed' or (o.status = 'accepted' and o.payment_due_at > now()))
  ) then
    raise exception 'You''ve already accepted or confirmed another booking for these dates. Wait for that renter to pay (or for their time to run out) before accepting this one.'
      using errcode = 'check_violation';
  end if;

  v_grace := coalesce(nullif(config_value('payment_grace_minutes'), '')::int, 1440);
  update bookings
  set status = 'accepted', payment_due_at = now() + make_interval(mins => v_grace), updated_at = now()
  where id = b.id
  returning * into b;
  return b;
end;
$$;

create or replace function decline_booking(p_booking_id uuid) returns bookings
language plpgsql security definer set search_path = public as $$
declare
  b bookings%rowtype;
begin
  update bookings
  set status = 'declined', status_reason = 'owner_declined', updated_at = now()
  where id = p_booking_id and owner_id = auth.uid() and status in ('pending', 'accepted')
  returning * into b;
  if not found then
    raise exception 'This request can''t be declined any more.' using errcode = 'check_violation';
  end if;
  return b;
end;
$$;

create or replace function cancel_booking(p_booking_id uuid) returns bookings
language plpgsql security definer set search_path = public as $$
declare
  b bookings%rowtype;
begin
  update bookings
  set status = 'cancelled', status_reason = 'renter_cancelled', updated_at = now()
  where id = p_booking_id and renter_id = auth.uid() and status in ('pending', 'accepted', 'confirmed')
  returning * into b;
  if not found then
    raise exception 'This booking can''t be cancelled any more.' using errcode = 'check_violation';
  end if;
  return b;
end;
$$;

-- Returns 'confirmed', or 'expired' if the time to pay had already run out.
create or replace function pay_deposit(p_booking_id uuid, p_method text) returns text
language plpgsql security definer set search_path = public as $$
declare
  b bookings%rowtype;
begin
  select * into b from bookings where id = p_booking_id and renter_id = auth.uid() for update;
  if not found then
    raise exception 'Booking not found.' using errcode = 'no_data_found';
  end if;
  if b.status <> 'accepted' then
    raise exception 'This booking isn''t waiting for a deposit.' using errcode = 'check_violation';
  end if;
  if b.payment_due_at <= now() then
    update bookings set status = 'expired', status_reason = 'payment_not_received', updated_at = now()
    where id = b.id;
    return 'expired';
  end if;
  if p_method not in ('mobile-money', 'card') then
    raise exception 'Unknown payment method.' using errcode = 'check_violation';
  end if;

  perform 1 from equipment where id = b.equipment_id for update;
  if exists (
    select 1 from bookings o
    where o.equipment_id = b.equipment_id and o.id <> b.id and o.status = 'confirmed'
      and o.start_date <= b.end_date and b.start_date <= o.end_date
  ) then
    raise exception 'Sorry, these dates were just booked by someone else.' using errcode = 'check_violation';
  end if;

  -- No payment provider is connected yet, so the deposit is recorded as paid.
  insert into payments (booking_id, amount, method, status, reference)
  values (b.id, b.down_payment, p_method, 'paid', 'PAY-' || replace(gen_random_uuid()::text, '-', ''));

  update bookings set status = 'confirmed', paid_at = now(), updated_at = now() where id = b.id;

  -- Now the dates are taken: turn down everyone else who asked for them.
  update bookings
  set status = 'declined', status_reason = 'dates_taken', updated_at = now()
  where equipment_id = b.equipment_id and id <> b.id
    and status in ('pending', 'accepted')
    and start_date <= b.end_date and b.start_date <= end_date;

  return 'confirmed';
end;
$$;

create or replace function expire_unpaid_bookings() returns int
language plpgsql security definer set search_path = public as $$
declare
  n int;
begin
  update bookings set status = 'expired', status_reason = 'payment_not_received', updated_at = now()
  where status = 'accepted' and payment_due_at <= now();
  get diagnostics n = row_count;
  return n;
end;
$$;

-- Listing deletion: same rules as 002, but requests still open (pending or
-- accepted) are declined through the normal path, so renters get the
-- notification and email from booking_events().
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

-- ---------------------------------------------------------------------
-- 7. Read helpers
-- ---------------------------------------------------------------------
-- Dates that are actually taken (paid). Requests don't hold dates.
create or replace function get_equipment_booking_dates(p_equipment_id uuid)
returns table (start_date date, end_date date, status text)
language plpgsql stable security definer set search_path = public as $$
begin
  return query
  select b.start_date, b.end_date, b.status::text
  from bookings b
  where b.equipment_id = p_equipment_id and b.status = 'confirmed' and b.end_date >= current_date;
end;
$$;

-- equipment_id -> end date, for equipment out on a paid booking today.
-- (The browse pages used to read bookings directly, which RLS limits to
-- your own bookings, so this badge never showed for anyone else.)
create or replace function get_currently_booked()
returns table (equipment_id uuid, end_date date)
language plpgsql stable security definer set search_path = public as $$
begin
  return query
  select b.equipment_id, max(b.end_date)
  from bookings b
  where b.status = 'confirmed' and b.start_date <= current_date and b.end_date >= current_date
  group by b.equipment_id;
end;
$$;

-- Numbers for the red badges in the menu.
create or replace function my_badge_counts() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  me uuid := auth.uid();
begin
  return jsonb_build_object(
    'booking_requests', (select count(*) from bookings where owner_id = me and status = 'pending'),
    'my_bookings', (select count(*) from bookings where renter_id = me and status = 'accepted' and payment_due_at > now()),
    'messages', (
      select count(*) from messages m join conversations c on c.id = m.conversation_id
      where m.read = false and m.sender_id <> me and (c.renter_id = me or c.owner_id = me)
    ),
    'notifications', (select count(*) from notifications where user_id = me and read = false)
  );
end;
$$;

revoke all on function accept_booking(uuid), decline_booking(uuid), cancel_booking(uuid),
  pay_deposit(uuid, text), delete_listing(uuid), my_badge_counts() from public, anon;
grant execute on function accept_booking(uuid), decline_booking(uuid), cancel_booking(uuid),
  pay_deposit(uuid, text), delete_listing(uuid), my_badge_counts() to authenticated;
grant execute on function get_equipment_booking_dates(uuid), get_currently_booked() to anon, authenticated;
revoke all on function expire_unpaid_bookings() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 8. Email queue helpers for /api/send-emails (service role only)
-- ---------------------------------------------------------------------
create or replace function claim_email_outbox(p_limit int default 20)
returns setof email_outbox
language plpgsql security definer set search_path = public as $$
begin
  return query
  update email_outbox e set claimed_at = now(), attempts = e.attempts + 1
  where e.id in (
    select id from email_outbox
    where sent_at is null and attempts < 5
      and (claimed_at is null or claimed_at < now() - interval '5 minutes')
    order by created_at
    limit p_limit
    for update skip locked
  )
  returning e.*;
end;
$$;
revoke all on function claim_email_outbox(int) from public, anon, authenticated;

-- Asks the website to send queued emails (used by the every-minute job,
-- so emails for expiries go out even when nobody has the site open).
create or replace function request_email_flush() returns void
language plpgsql security definer set search_path = public as $$
declare
  v_url text := config_value('email_flush_url');
  v_bypass text := config_value('vercel_bypass_secret');
  v_headers jsonb := '{"Content-Type": "application/json"}';
begin
  if coalesce(v_url, '') = '' then return; end if;
  if not exists (select 1 from email_outbox where sent_at is null and attempts < 5) then return; end if;
  if coalesce(v_bypass, '') <> '' then
    v_headers := v_headers || jsonb_build_object('x-vercel-protection-bypass', v_bypass);
  end if;
  perform net.http_post(url := v_url, body := '{}'::jsonb, headers := v_headers);
exception when others then
  raise warning 'request_email_flush failed: %', sqlerrm;
end;
$$;
revoke all on function request_email_flush() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 9. Jobs, live notifications
-- ---------------------------------------------------------------------
do $$
begin
  create extension if not exists pg_net;
exception when others then
  raise warning 'Could not enable pg_net (%). Enable it under Database -> Extensions, then run this file again.', sqlerrm;
end;
$$;

select cron.unschedule(jobid) from cron.job where jobname = 'expire-unpaid-bookings';
select cron.schedule('expire-unpaid-bookings', '* * * * *',
  'select expire_unpaid_bookings(); select request_email_flush();');

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
     ) then
    alter publication supabase_realtime add table notifications;
  end if;
end;
$$;

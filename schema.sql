-- =====================================================================
-- AgroRent — Supabase schema (complete fresh install)
--
-- Builds the whole database the app needs: tables, Row Level Security,
-- sign-up trigger, photo storage, seed data, and (section 16) every file in
-- migrations/, copied in verbatim. An existing project only needs the
-- migrations it hasn't run yet; this file is for setting one up from zero.
-- src/utils/schemaSync.test.js fails if a migration changes without being
-- copied here.
--
-- After running it, set the site address the booking emails use:
--   update app_config set value = 'https://<your-site>/api/send-emails'
--   where key = 'email_flush_url';
-- (needs the pg_cron and pg_net extensions: Database -> Extensions.)
--
-- Seed data below reuses the exact people, equipment, bookings,
-- messages, notifications, and disputes already hardcoded in the
-- frontend's src/data/mockData.js and src/pages/ListingDetail.jsx
-- (MOCK_REVIEWS), so the seeded database matches what the UI already
-- displays.
--
-- Paste the whole thing into Supabase SQL Editor and run it top to
-- bottom. It creates: extensions -> enums -> tables -> indexes ->
-- RLS policies -> sign-up + storage -> seed data -> migrations.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto"; -- gen_random_uuid()


-- ---------------------------------------------------------------------
-- 0b. Cleanup (makes this script safely re-runnable)
-- If a previous run of this script got partway through (e.g. it
-- created the enums/tables but then failed later on), rerunning from
-- the top will collide with what's already there — that's the
-- "type ... already exists" error. This block drops everything the
-- script creates, in dependency order, so you can paste and run the
-- whole file again from scratch. Safe here because this is fresh
-- seed/dev data; do NOT run this against a database with real data
-- you want to keep.
-- ---------------------------------------------------------------------
drop table if exists email_outbox cascade;
drop table if exists app_config cascade;
drop table if exists disputes cascade;
drop table if exists notifications cascade;
drop table if exists messages cascade;
drop table if exists conversations cascade;
drop table if exists wishlists cascade;
drop table if exists reviews cascade;
drop table if exists payments cascade;
drop table if exists bookings cascade;
drop table if exists equipment_photos cascade;
drop table if exists equipment cascade;
drop table if exists profiles cascade;

drop function if exists is_admin() cascade;

drop type if exists notification_type;
drop type if exists dispute_status;
drop type if exists payment_status;
drop type if exists booking_status;
drop type if exists equipment_category;
drop type if exists equipment_condition;
drop type if exists user_status;
drop type if exists user_role;


-- ---------------------------------------------------------------------
-- 1. Enums
-- Matches the string literals actually used in the frontend (mockData.js,
-- AuthContext.jsx, bookingService.js, AdminDisputes.jsx, etc).
-- ---------------------------------------------------------------------
create type user_role as enum ('renter', 'owner', 'admin');
create type user_status as enum ('active', 'suspended');
create type equipment_condition as enum ('New', 'Excellent', 'Good', 'Fair');
create type equipment_category as enum ('Tractors', 'Ploughs', 'Planters', 'Harvesters', 'Irrigation', 'Sprayers', 'Other');
create type booking_status as enum ('pending', 'accepted', 'confirmed', 'declined', 'cancelled', 'completed', 'expired');
create type payment_status as enum ('pending', 'paid', 'failed', 'refunded');
create type dispute_status as enum ('open', 'resolved');
create type notification_type as enum ('confirmed', 'request', 'message', 'completed');


-- ---------------------------------------------------------------------
-- 2. profiles
-- One row per authenticated user, 1:1 with auth.users.
-- AuthContext.jsx: role is not a separate account type for
-- renter/owner — every account can act as both, `role` just tracks
-- which mode the UI is currently in ("Switch to Owner/Renter Mode").
-- `admin` is a genuinely separate account type (Login page, not Signup).
-- ---------------------------------------------------------------------
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  name          text not null,
  email         text not null,
  photo_url     text,
  bio           text check (bio is null or char_length(bio) <= 200),
  role          user_role not null default 'renter',
  status        user_status not null default 'active',
  created_at    timestamptz not null default now()
);

comment on table profiles is 'Extends auth.users. role = which mode (renter/owner/admin) the UI shows, not a fixed account type — see AuthContext.jsx.';


-- ---------------------------------------------------------------------
-- 3. equipment
-- Backed by EQUIPMENT in mockData.js / equipmentService.js /
-- PostListing.jsx / EditListing.jsx.
-- location is kept as free text ("Kabwe, Central") to match the
-- existing matchesLocation() string-matching filter logic, plus
-- structured province/district columns for real filtering/indexing.
-- ---------------------------------------------------------------------
create table equipment (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references profiles(id) on delete cascade,
  name           text not null,
  category       equipment_category not null,
  condition      equipment_condition not null default 'Good',
  description    text,
  price_day      numeric(10,2) not null check (price_day > 0),
  price_week     numeric(10,2) check (price_week > 0),
  province       text not null,
  district       text not null,
  location       text not null,               -- free-text display, e.g. "Chilanga, Lusaka"
  pickup_address text not null,
  available_from date,
  available_until date,
  rating         numeric(2,1) not null default 0 check (rating >= 0 and rating <= 5),
  review_count   int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table equipment is 'Listings. Backed by mockData.EQUIPMENT + PostListing.jsx / EditListing.jsx form fields.';

-- Photos are a separate table (EQUIPMENT.thumbnails is an array in the
-- mock, PhotoUpload.jsx handles multiple uploads) so ordering/captions
-- can be added later without altering the equipment row.
create table equipment_photos (
  id            uuid primary key default gen_random_uuid(),
  equipment_id  uuid not null references equipment(id) on delete cascade,
  url           text not null,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- 4. bookings
-- Backed by BOOKINGS + BOOKING_REQUESTS in mockData.js and
-- bookingService.js. The frontend currently treats "my bookings" (as
-- renter) and "requests for owner" (as owner) as two different mock
-- arrays over the same conceptual entity — one table here, filtered by
-- renter_id vs owner_id.
-- Pricing snapshot columns (price_day_snapshot, subtotal, fee, ...)
-- match utils/calculateBooking.js exactly so historical bookings don't
-- change value if the listing's price changes later.
-- ---------------------------------------------------------------------
create table bookings (
  id                uuid primary key default gen_random_uuid(),
  equipment_id      uuid not null references equipment(id) on delete restrict,
  renter_id         uuid not null references profiles(id) on delete cascade,
  owner_id          uuid not null references profiles(id) on delete cascade,
  start_date        date not null,
  end_date          date not null check (end_date > start_date),
  total_days        int not null check (total_days > 0),
  price_day_snapshot numeric(10,2) not null,
  subtotal          numeric(10,2) not null,
  service_fee       numeric(10,2) not null,     -- 5% of subtotal, utils/calculateBooking.js
  total_price       numeric(10,2) not null,
  down_payment      numeric(10,2) not null,     -- 25% of total, due now
  balance_due       numeric(10,2) not null,     -- due at pickup
  status            booking_status not null default 'pending',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table bookings is 'One row per rental request/booking. status flow: pending -> confirmed|declined -> completed|cancelled. See bookingService.js accept()/decline()/cancel().';


-- ---------------------------------------------------------------------
-- 5. payments
-- Backed by paymentService.js chargeDownPayment(). Kept separate from
-- bookings so a booking can have a down-payment charge now and a
-- balance charge later, each with its own reference/status.
-- ---------------------------------------------------------------------
create table payments (
  id            uuid primary key default gen_random_uuid(),
  booking_id    uuid not null references bookings(id) on delete cascade,
  amount        numeric(10,2) not null check (amount > 0),
  method        text not null default 'mobile-money', -- e.g. mobile-money, card
  status        payment_status not null default 'pending',
  reference     text unique,                            -- e.g. "PAY-1699999999"
  created_at    timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- 6. reviews
-- Backed by ListingDetail.jsx's MOCK_REVIEWS + LeaveReview.jsx +
-- reviewService.js. One review per completed booking, with an optional
-- owner reply (ReviewCard.jsx renders `reply`).
-- ---------------------------------------------------------------------
create table reviews (
  id            uuid primary key default gen_random_uuid(),
  booking_id    uuid not null unique references bookings(id) on delete cascade,
  equipment_id  uuid not null references equipment(id) on delete cascade,
  reviewer_id   uuid not null references profiles(id) on delete cascade,
  rating        int not null check (rating between 1 and 5),
  text          text,
  owner_reply   text,
  created_at    timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- 7. wishlists
-- Backed by WishlistContext.jsx (currently client-only React state —
-- this is the persistence layer for it).
-- ---------------------------------------------------------------------
create table wishlists (
  user_id       uuid not null references profiles(id) on delete cascade,
  equipment_id  uuid not null references equipment(id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (user_id, equipment_id)
);


-- ---------------------------------------------------------------------
-- 8. conversations / messages
-- Backed by MESSAGES in mockData.js, Messages.jsx / Conversation.jsx /
-- messageService.js / useSocket.js. A conversation is scoped to one
-- equipment listing between one renter and one owner (matches the mock
-- shape: { person, equipment, messages: [...] }).
-- ---------------------------------------------------------------------
create table conversations (
  id            uuid primary key default gen_random_uuid(),
  equipment_id  uuid references equipment(id) on delete set null,
  renter_id     uuid not null references profiles(id) on delete cascade,
  owner_id      uuid not null references profiles(id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique (equipment_id, renter_id, owner_id)
);

create table messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references conversations(id) on delete cascade,
  sender_id        uuid not null references profiles(id) on delete cascade,
  text             text not null,
  read             boolean not null default false,
  created_at       timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- 9. notifications
-- Backed by NOTIFICATIONS in mockData.js / NotificationContext.jsx.
-- ---------------------------------------------------------------------
create table notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  type          notification_type not null,
  text          text not null,
  read          boolean not null default false,
  created_at    timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- 10. disputes
-- Backed by DISPUTES in mockData.js / AdminDisputes.jsx. Admin-only
-- surface — reporter/against are both users, optionally tied to a
-- booking.
-- ---------------------------------------------------------------------
create table disputes (
  id            uuid primary key default gen_random_uuid(),
  booking_id    uuid references bookings(id) on delete set null,
  reporter_id   uuid not null references profiles(id) on delete cascade,
  against_id    uuid not null references profiles(id) on delete cascade,
  reason        text not null,
  status        dispute_status not null default 'open',
  created_at    timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- 11. Functions
-- ---------------------------------------------------------------------

-- Returns pending/confirmed booking date ranges for a given piece of
-- equipment. Declared SECURITY DEFINER so it runs as the schema owner
-- and bypasses the RLS policy that would otherwise hide other renters'
-- bookings. Only exposes start_date / end_date / status — no personal
-- data (renter_id, prices, etc.) is returned.
-- Used by bookingService.getForEquipment() for overlap checks.
create or replace function get_equipment_booking_dates(p_equipment_id uuid)
returns table (start_date date, end_date date, status text)
language sql stable security definer as $$
  select start_date, end_date, status::text
  from bookings
  where equipment_id = p_equipment_id
    and status in ('pending', 'confirmed');
$$;


-- ---------------------------------------------------------------------
-- 13. Indexes
-- ---------------------------------------------------------------------
create index idx_equipment_owner       on equipment(owner_id);
create index idx_equipment_category    on equipment(category);
create index idx_equipment_province    on equipment(province);
create index idx_equipment_photos_eq   on equipment_photos(equipment_id);
create index idx_bookings_renter       on bookings(renter_id);
create index idx_bookings_owner        on bookings(owner_id);
create index idx_bookings_equipment    on bookings(equipment_id);
create index idx_payments_booking      on payments(booking_id);
create index idx_reviews_equipment     on reviews(equipment_id);
create index idx_conversations_renter  on conversations(renter_id);
create index idx_conversations_owner   on conversations(owner_id);
create index idx_messages_conversation on messages(conversation_id);
create index idx_notifications_user    on notifications(user_id);
create index idx_disputes_reporter     on disputes(reporter_id);
create index idx_disputes_against      on disputes(against_id);


-- =====================================================================
-- 14. Row Level Security
-- General shape: everyone can read "public" data (listings, photos,
-- reviews); people can only read/write records where they're a party
-- (renter_id/owner_id/user_id/sender_id/reviewer_id = auth.uid()).
-- Admins (profiles.role = 'admin') can read/write everything, matching
-- AdminUsers/AdminBookings/AdminDisputes/AdminListings.
-- =====================================================================

alter table profiles          enable row level security;
alter table equipment         enable row level security;
alter table equipment_photos  enable row level security;
alter table bookings          enable row level security;
alter table payments          enable row level security;
alter table reviews           enable row level security;
alter table wishlists         enable row level security;
alter table conversations     enable row level security;
alter table messages          enable row level security;
alter table notifications     enable row level security;
alter table disputes          enable row level security;

-- Helper: is the current user an admin? Used across several policies
-- below instead of repeating the subquery.
create function is_admin() returns boolean
  language sql stable security definer as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ---- profiles ----
create policy "profiles are publicly readable"
  on profiles for select
  using (true); -- equipment listings show owner name/photo to anyone (EquipmentCard, PublicProfile)

create policy "users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "admins manage all profiles"
  on profiles for all
  using (is_admin());

-- ---- equipment ----
create policy "equipment is publicly readable"
  on equipment for select
  using (true); -- Home/Listings/ListingDetail are open browsing pages

create policy "owners manage their own equipment"
  on equipment for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "admins manage all equipment"
  on equipment for all
  using (is_admin());

-- ---- equipment_photos ----
create policy "equipment photos are publicly readable"
  on equipment_photos for select
  using (true);

create policy "owners manage photos of their own equipment"
  on equipment_photos for all
  using (exists (select 1 from equipment e where e.id = equipment_id and e.owner_id = auth.uid()))
  with check (exists (select 1 from equipment e where e.id = equipment_id and e.owner_id = auth.uid()));

create policy "admins manage all equipment photos"
  on equipment_photos for all
  using (is_admin());

-- ---- bookings ----
create policy "renters and owners see their own bookings"
  on bookings for select
  using (auth.uid() = renter_id or auth.uid() = owner_id);

create policy "renters create their own bookings"
  on bookings for insert
  with check (auth.uid() = renter_id);

create policy "renters and owners update their own bookings"
  on bookings for update
  using (auth.uid() = renter_id or auth.uid() = owner_id);

create policy "admins manage all bookings"
  on bookings for all
  using (is_admin());

-- ---- payments ----
create policy "renters and owners see payments for their bookings"
  on payments for select
  using (exists (
    select 1 from bookings b
    where b.id = booking_id and (b.renter_id = auth.uid() or b.owner_id = auth.uid())
  ));

create policy "renters create payments for their own bookings"
  on payments for insert
  with check (exists (
    select 1 from bookings b where b.id = booking_id and b.renter_id = auth.uid()
  ));

create policy "admins manage all payments"
  on payments for all
  using (is_admin());

-- ---- reviews ----
create policy "reviews are publicly readable"
  on reviews for select
  using (true); -- ListingDetail shows reviews to anyone browsing

create policy "renters create reviews for their own completed bookings"
  on reviews for insert
  with check (exists (
    select 1 from bookings b
    where b.id = booking_id and b.renter_id = auth.uid() and b.status = 'completed'
  ));

create policy "owners reply to reviews on their own equipment"
  on reviews for update
  using (exists (select 1 from equipment e where e.id = equipment_id and e.owner_id = auth.uid()))
  with check (exists (select 1 from equipment e where e.id = equipment_id and e.owner_id = auth.uid()));

create policy "admins manage all reviews"
  on reviews for all
  using (is_admin());

-- ---- wishlists ----
create policy "users manage their own wishlist"
  on wishlists for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---- conversations ----
create policy "participants see their own conversations"
  on conversations for select
  using (auth.uid() = renter_id or auth.uid() = owner_id);

create policy "renters start conversations with an owner"
  on conversations for insert
  with check (auth.uid() = renter_id or auth.uid() = owner_id);

create policy "admins manage all conversations"
  on conversations for all
  using (is_admin());

-- ---- messages ----
create policy "participants see messages in their conversations"
  on messages for select
  using (exists (
    select 1 from conversations c
    where c.id = conversation_id and (c.renter_id = auth.uid() or c.owner_id = auth.uid())
  ));

create policy "participants send messages in their conversations"
  on messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from conversations c
      where c.id = conversation_id and (c.renter_id = auth.uid() or c.owner_id = auth.uid())
    )
  );

create policy "participants mark messages read in their conversations"
  on messages for update
  using (exists (
    select 1 from conversations c
    where c.id = conversation_id and (c.renter_id = auth.uid() or c.owner_id = auth.uid())
  ));

-- ---- notifications ----
create policy "users see their own notifications"
  on notifications for select
  using (auth.uid() = user_id);

create policy "users update their own notifications"
  on notifications for update
  using (auth.uid() = user_id);

create policy "admins manage all notifications"
  on notifications for all
  using (is_admin());

-- ---- disputes ----
create policy "reporters and the accused see their own disputes"
  on disputes for select
  using (auth.uid() = reporter_id or auth.uid() = against_id);

create policy "users file disputes as the reporter"
  on disputes for insert
  with check (auth.uid() = reporter_id);

create policy "admins manage all disputes"
  on disputes for all
  using (is_admin());


-- =====================================================================
-- 14b. Sign-up and photo storage
-- =====================================================================

-- Every new account gets a profile row, named from the sign-up form
-- (AuthContext.signup passes it as user metadata).
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- Phone, location and date of birth are copied by the app at first login
  -- (AuthContext fillFromSignup), since those columns come from migration 005.
  insert into profiles (id, name, email)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Listing photos: public to view; uploaded as "<equipment id>/<file>",
-- and only the owner of that equipment may add or remove files there.
insert into storage.buckets (id, name, public)
values ('equipment-photos', 'equipment-photos', true)
on conflict (id) do nothing;

drop policy if exists "equipment photos are public" on storage.objects;
create policy "equipment photos are public"
  on storage.objects for select
  using (bucket_id = 'equipment-photos');

drop policy if exists "owners upload photos of their equipment" on storage.objects;
create policy "owners upload photos of their equipment"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'equipment-photos'
    and exists (
      select 1 from public.equipment e
      where e.id::text = (storage.foldername(name))[1] and e.owner_id = auth.uid()
    )
  );

drop policy if exists "owners remove photos of their equipment" on storage.objects;
create policy "owners remove photos of their equipment"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'equipment-photos'
    and exists (
      select 1 from public.equipment e
      where e.id::text = (storage.foldername(name))[1] and e.owner_id = auth.uid()
    )
  );


-- =====================================================================
-- 15. Seed data
-- Pulled directly from the frontend's own mock data:
--   - people        <- ADMIN_USERS + equipment owners in mockData.js
--   - equipment     <- EQUIPMENT in mockData.js
--   - bookings      <- BOOKINGS + BOOKING_REQUESTS in mockData.js
--   - messages      <- MESSAGES in mockData.js
--   - notifications <- NOTIFICATIONS in mockData.js
--   - disputes      <- DISPUTES in mockData.js
--   - reviews       <- MOCK_REVIEWS in src/pages/ListingDetail.jsx
--
-- profiles.id references auth.users(id). No auth.users rows are
-- inserted here — create these 12 users first (Supabase Dashboard ->
-- Authentication -> Add user, or supabase.auth.admin.createUser via
-- the admin API) using the exact UUIDs below, THEN run the inserts
-- that follow. If the matching auth.users rows don't exist yet, the
-- profiles insert will fail on the foreign key.
--
--   55555555-5555-5555-5555-555555555501  chanda@example.com
--   55555555-5555-5555-5555-555555555502  mwaka@example.com
--   55555555-5555-5555-5555-555555555503  amos@example.com
--   55555555-5555-5555-5555-555555555504  bupe@example.com
--   55555555-5555-5555-5555-555555555505  grace@example.com
--   55555555-5555-5555-5555-555555555506  kalinda@example.com
--   55555555-5555-5555-5555-555555555507  mutinta@example.com
--   55555555-5555-5555-5555-555555555508  bwalya@example.com
--   55555555-5555-5555-5555-555555555509  darious@example.com
--   55555555-5555-5555-5555-555555555510  mutinta.siwale@example.com
--   55555555-5555-5555-5555-555555555511  admin@agrorent.com
--   55555555-5555-5555-5555-555555555512  bupe.siwale@example.com
-- =====================================================================

-- profiles — names, emails, roles, and statuses match ADMIN_USERS in
-- mockData.js exactly (au1-au10). Mutinta Siwale and Bupe Siwale are
-- extra names that only appear once each, in BOOKING_REQUESTS and
-- MOCK_REVIEWS respectively — added here as their own profiles so the
-- foreign keys on bookings/reviews resolve.
insert into profiles (id, name, email, role, status) values
  ('55555555-5555-5555-5555-555555555501', 'Chanda Mutale',    'chanda@example.com',         'owner',  'active'),    -- au2
  ('55555555-5555-5555-5555-555555555502', 'Mwaka Banda',      'mwaka@example.com',          'owner',  'suspended'), -- au7
  ('55555555-5555-5555-5555-555555555503', 'Amos Phiri',       'amos@example.com',           'owner',  'suspended'), -- au4
  ('55555555-5555-5555-5555-555555555504', 'Bupe Musonda',     'bupe@example.com',           'owner',  'active'),    -- au3
  ('55555555-5555-5555-5555-555555555505', 'Grace Tembo',      'grace@example.com',          'owner',  'active'),    -- au5
  ('55555555-5555-5555-5555-555555555506', 'Kalinda Nkonde',   'kalinda@example.com',        'renter', 'active'),    -- au1
  ('55555555-5555-5555-5555-555555555507', 'Mutinta Mwansa',   'mutinta@example.com',        'renter', 'active'),    -- au8, AuthContext.jsx DEFAULT_USER
  ('55555555-5555-5555-5555-555555555508', 'Bwalya Mwape',     'bwalya@example.com',         'renter', 'active'),    -- au6
  ('55555555-5555-5555-5555-555555555509', 'Darious Phiri',    'darious@example.com',        'renter', 'active'),    -- au9
  ('55555555-5555-5555-5555-555555555510', 'Mutinta Siwale',   'mutinta.siwale@example.com', 'renter', 'active'),    -- BOOKING_REQUESTS r3 only
  ('55555555-5555-5555-5555-555555555511', 'Natasha Chileshe', 'admin@agrorent.com',         'admin',  'active'),    -- au10, AuthContext.jsx ADMIN_USER
  ('55555555-5555-5555-5555-555555555512', 'Bupe Siwale',      'bupe.siwale@example.com',    'renter', 'active')     -- ListingDetail.jsx MOCK_REVIEWS only
-- The sign-up trigger (section 14b) may already have made these rows when
-- the auth users were created; make them match the seed either way.
on conflict (id) do update
  set name = excluded.name, email = excluded.email, role = excluded.role, status = excluded.status;

-- equipment — matches EQUIPMENT in mockData.js: name, category,
-- condition, prices, location, pickup address, availability window,
-- rating, and review count all copied as-is (available dates rolled
-- forward a year since the originals are now in the past).
insert into equipment (id, owner_id, name, category, condition, description, price_day, price_week, province, district, location, pickup_address, available_from, available_until, rating, review_count) values
  ('66666666-6666-6666-6666-666666666601', '55555555-5555-5555-5555-555555555501', 'John Deere 5075E Tractor',       'Tractors',   'Good', 'Well-maintained John Deere 5075E tractor, perfect for ploughing, harrowing, and general farm work. 75 horsepower engine, power steering, and comfortable cab. Comes with a 3-point linkage for implements. Available with or without operator.', 250.00, 1500.00, 'Lusaka Province',     'Chilanga', 'Chilanga, Lusaka',   'Chilanga Road near Total filling station, Lusaka', '2026-01-01', '2026-12-31', 4.8, 23),
  ('66666666-6666-6666-6666-666666666602', '55555555-5555-5555-5555-555555555502', 'Massey Ferguson 7614 Harvester', 'Harvesters', 'Good', 'High-capacity combine harvester suitable for maize, wheat, and soya bean harvesting. Fully serviced and ready for use. Grain tank capacity 9,000 litres.', 480.00, 2800.00, 'Central Province',    'Kabwe',    'Kabwe, Central',     'Kabwe Main Road, near ZNFU offices', '2026-05-01', '2026-11-30', 4.6, 14),
  ('66666666-6666-6666-6666-666666666603', '55555555-5555-5555-5555-555555555503', '3-Disc Plough',                  'Ploughs',    'Good', 'Heavy-duty 3-disc plough suitable for primary tillage. Compatible with tractors from 60HP and above. Adjustable disc angle.', 80.00, 450.00, 'Central Province',    'Chisamba', 'Chisamba, Central',  'Chisamba Trading Centre', '2026-01-01', '2026-12-31', 4.5, 9),
  ('66666666-6666-6666-6666-666666666604', '55555555-5555-5555-5555-555555555504', 'Kubota M7060 Tractor',           'Tractors',   'Good', 'Reliable Kubota M7060 with 70HP. Excellent fuel efficiency. Available for short and long-term rentals across Copperbelt Province.', 200.00, 1200.00, 'Copperbelt Province', 'Ndola',    'Ndola, Copperbelt',  'Ndola, Kanini Road farm', '2026-01-01', '2026-12-31', 4.9, 38),
  ('66666666-6666-6666-6666-666666666605', '55555555-5555-5555-5555-555555555505', 'Centre Pivot Irrigation System', 'Irrigation', 'Good', 'Valley 8000 centre pivot irrigation system covering 50 hectares. Includes pump, panels, and water source connection. Perfect for dry-season production.', 320.00, 1900.00, 'Central Province',    'Mkushi',   'Mkushi, Central',    'Mkushi Farm Block, Plot 22', '2026-04-01', '2026-10-31', 4.4, 7),
  ('66666666-6666-6666-6666-666666666606', '55555555-5555-5555-5555-555555555501', '4-Row Maize Planter',            'Planters',   'Good', 'Precision 4-row maize planter with fertilizer applicator. Maintains consistent row spacing of 75cm.', 120.00, 700.00, 'Southern Province',   'Mazabuka', 'Mazabuka, Southern', 'Mazabuka Town, near Zambia Sugar offices', '2026-01-01', '2026-12-31', 4.7, 16);

insert into equipment_photos (equipment_id, url, sort_order) values
  ('66666666-6666-6666-6666-666666666601', 'https://images.unsplash.com/photo-1606739211185-2c846d734a6d?w=600&h=360&fit=crop&auto=format', 0),
  ('66666666-6666-6666-6666-666666666601', 'https://images.unsplash.com/photo-1564868480822-32f714a0e763?w=600&h=360&fit=crop&auto=format', 1),
  ('66666666-6666-6666-6666-666666666601', 'https://images.unsplash.com/photo-1696441567908-6a04d49e1350?w=600&h=360&fit=crop&auto=format', 2),
  ('66666666-6666-6666-6666-666666666601', 'https://images.unsplash.com/photo-1507662228758-08d030c4820b?w=600&h=360&fit=crop&auto=format', 3),
  ('66666666-6666-6666-6666-666666666602', 'https://images.unsplash.com/photo-1565647952915-9644fcd446a4?w=600&h=360&fit=crop&auto=format', 0),
  ('66666666-6666-6666-6666-666666666602', 'https://images.unsplash.com/photo-1507662228758-08d030c4820b?w=600&h=360&fit=crop&auto=format', 1),
  ('66666666-6666-6666-6666-666666666603', 'https://images.unsplash.com/photo-1696441567908-6a04d49e1350?w=600&h=360&fit=crop&auto=format', 0),
  ('66666666-6666-6666-6666-666666666604', 'https://images.unsplash.com/photo-1564868480822-32f714a0e763?w=600&h=360&fit=crop&auto=format', 0),
  ('66666666-6666-6666-6666-666666666605', 'https://images.unsplash.com/photo-1507662228758-08d030c4820b?w=600&h=360&fit=crop&auto=format', 0),
  ('66666666-6666-6666-6666-666666666606', 'https://images.unsplash.com/photo-1507662228758-08d030c4820b?w=600&h=360&fit=crop&auto=format', 0);

-- bookings — b1/b2/b3 come from BOOKINGS in mockData.js (dates rolled
-- forward a year); r1-r4 come from BOOKING_REQUESTS. totalPrice/
-- downPayment values are copied as-is from the mock (that file's own
-- comment notes they're static display data, not recomputed from
-- calculateBooking.js), so service_fee is backed out to make the
-- numbers agree rather than assumed to be 5%.
insert into bookings (id, equipment_id, renter_id, owner_id, start_date, end_date, total_days, price_day_snapshot, subtotal, service_fee, total_price, down_payment, balance_due, status) values
  -- BOOKINGS b1: John Deere, renter Kalinda Nkonde, owner Chanda Mutale, confirmed
  ('77777777-7777-7777-7777-777777777701', '66666666-6666-6666-6666-666666666601', '55555555-5555-5555-5555-555555555506', '55555555-5555-5555-5555-555555555501', '2026-02-10', '2026-02-17', 7, 250.00, 1750.00, 0.00, 1750.00, 437.50, 1312.50, 'confirmed'),
  -- BOOKINGS b2: 3-Disc Plough, renter Kalinda Nkonde, owner Amos Phiri, pending
  ('77777777-7777-7777-7777-777777777702', '66666666-6666-6666-6666-666666666603', '55555555-5555-5555-5555-555555555506', '55555555-5555-5555-5555-555555555503', '2026-03-01', '2026-03-03', 2, 80.00, 160.00, 80.00, 240.00, 60.00, 180.00, 'pending'),
  -- BOOKINGS b3: Kubota M7060, renter Kalinda Nkonde, owner Bupe Musonda, completed
  ('77777777-7777-7777-7777-777777777703', '66666666-6666-6666-6666-666666666604', '55555555-5555-5555-5555-555555555506', '55555555-5555-5555-5555-555555555504', '2025-11-05', '2025-11-12', 7, 200.00, 1400.00, 0.00, 1400.00, 350.00, 1050.00, 'completed'),
  -- BOOKING_REQUESTS r1: John Deere, renter Kalinda Nkonde, owner Chanda Mutale, pending
  ('77777777-7777-7777-7777-777777777704', '66666666-6666-6666-6666-666666666601', '55555555-5555-5555-5555-555555555506', '55555555-5555-5555-5555-555555555501', '2026-02-15', '2026-02-22', 7, 250.00, 1750.00, 0.00, 1750.00, 437.50, 1312.50, 'pending'),
  -- BOOKING_REQUESTS r2: 4-Row Maize Planter, renter Bwalya Mwape, owner Chanda Mutale, pending
  ('77777777-7777-7777-7777-777777777705', '66666666-6666-6666-6666-666666666606', '55555555-5555-5555-5555-555555555508', '55555555-5555-5555-5555-555555555501', '2026-03-01', '2026-03-05', 4, 120.00, 480.00, 120.00, 600.00, 150.00, 450.00, 'pending'),
  -- BOOKING_REQUESTS r3: 3-Disc Plough, renter Mutinta Siwale, owner Amos Phiri, accepted -> confirmed
  ('77777777-7777-7777-7777-777777777706', '66666666-6666-6666-6666-666666666603', '55555555-5555-5555-5555-555555555510', '55555555-5555-5555-5555-555555555503', '2026-03-10', '2026-03-12', 2, 80.00, 160.00, 80.00, 240.00, 60.00, 180.00, 'confirmed'),
  -- BOOKING_REQUESTS r4: John Deere, renter Darious Phiri, owner Chanda Mutale, declined
  ('77777777-7777-7777-7777-777777777707', '66666666-6666-6666-6666-666666666601', '55555555-5555-5555-5555-555555555509', '55555555-5555-5555-5555-555555555501', '2026-01-05', '2026-01-10', 5, 250.00, 1250.00, 0.00, 1250.00, 312.50, 937.50, 'declined'),
  -- extra completed John Deere booking so MOCK_REVIEWS' second review (Bupe Siwale) has a real booking to attach to
  ('77777777-7777-7777-7777-777777777708', '66666666-6666-6666-6666-666666666601', '55555555-5555-5555-5555-555555555512', '55555555-5555-5555-5555-555555555501', '2025-12-01', '2025-12-05', 4, 250.00, 1000.00, 0.00, 1000.00, 250.00, 750.00, 'completed');

-- payments — down-payment charges for the confirmed/completed bookings
insert into payments (booking_id, amount, method, status, reference) values
  ('77777777-7777-7777-7777-777777777701', 437.50, 'mobile-money', 'paid', 'PAY-1001'),
  ('77777777-7777-7777-7777-777777777703', 350.00, 'mobile-money', 'paid', 'PAY-1002'),
  ('77777777-7777-7777-7777-777777777706', 60.00,  'mobile-money', 'paid', 'PAY-1003'),
  ('77777777-7777-7777-7777-777777777708', 250.00, 'mobile-money', 'paid', 'PAY-1004');

-- reviews — the two hardcoded reviews from ListingDetail.jsx's
-- MOCK_REVIEWS, attached to John Deere bookings.
insert into reviews (booking_id, equipment_id, reviewer_id, rating, text, owner_reply) values
  ('77777777-7777-7777-7777-777777777701', '66666666-6666-6666-6666-666666666601', '55555555-5555-5555-5555-555555555506', 5, 'Excellent tractor, very well maintained. The owner was very helpful and flexible with the pickup time. Would rent again!', 'Thank you so much! It was a pleasure working with you.'),
  ('77777777-7777-7777-7777-777777777708', '66666666-6666-6666-6666-666666666601', '55555555-5555-5555-5555-555555555512', 4, 'Good equipment and fair price. Minor issue but the owner sorted it quickly.', null);

-- wishlists (WishlistContext.jsx has no seeded mock data of its own — a
-- couple of entries added here so the Wishlist page has something to show)
insert into wishlists (user_id, equipment_id) values
  ('55555555-5555-5555-5555-555555555507', '66666666-6666-6666-6666-666666666601'),
  ('55555555-5555-5555-5555-555555555507', '66666666-6666-6666-6666-666666666602');

-- conversations + messages — matches MESSAGES m1/m2 in mockData.js.
-- Current user in that mock is the default renter, Mutinta Mwansa.
insert into conversations (id, equipment_id, renter_id, owner_id) values
  ('99999999-9999-9999-9999-999999999901', '66666666-6666-6666-6666-666666666601', '55555555-5555-5555-5555-555555555507', '55555555-5555-5555-5555-555555555501'),
  ('99999999-9999-9999-9999-999999999902', '66666666-6666-6666-6666-666666666602', '55555555-5555-5555-5555-555555555507', '55555555-5555-5555-5555-555555555502');

insert into messages (conversation_id, sender_id, text, read) values
  -- m1: Mutinta Mwansa <-> Chanda Mutale, about the John Deere tractor
  ('99999999-9999-9999-9999-999999999901', '55555555-5555-5555-5555-555555555507', 'Hello! Is the tractor available from 10th February?', true),
  ('99999999-9999-9999-9999-999999999901', '55555555-5555-5555-5555-555555555501', 'Yes, it is! Feel free to book those dates.', true),
  ('99999999-9999-9999-9999-999999999901', '55555555-5555-5555-5555-555555555507', 'Great, I will go ahead and book. Does it come with an operator?', true),
  ('99999999-9999-9999-9999-999999999901', '55555555-5555-5555-5555-555555555501', 'Yes, I can provide an operator for an additional K50/day.', false),
  -- m2: Mutinta Mwansa <-> Mwaka Banda, about the Massey Ferguson harvester
  ('99999999-9999-9999-9999-999999999902', '55555555-5555-5555-5555-555555555507', 'Hi, is the harvester available in May? I have 120 hectares of maize.', true),
  ('99999999-9999-9999-9999-999999999902', '55555555-5555-5555-5555-555555555502', 'Yes, May is open. Send me your exact dates and we can confirm.', true),
  ('99999999-9999-9999-9999-999999999902', '55555555-5555-5555-5555-555555555507', 'Perfect, I will send the booking request now.', false);

-- notifications — n1-n4 from mockData.js, each addressed to whichever
-- profile the notification text is actually about (n1/n3 -> Mutinta
-- Mwansa as the renter involved; n2 -> Amos Phiri as the plough's
-- owner; n4 -> Kalinda Nkonde as the Kubota renter).
insert into notifications (user_id, type, text, read) values
  ('55555555-5555-5555-5555-555555555507', 'confirmed', 'Your booking for John Deere 5075E Tractor has been confirmed by Chanda Mutale.', false),
  ('55555555-5555-5555-5555-555555555503', 'request',   'New booking request for your 3-Disc Plough from Mutinta Siwale.', false),
  ('55555555-5555-5555-5555-555555555507', 'message',   'Mwaka Banda sent you a message about Massey Ferguson 7614 Harvester.', true),
  ('55555555-5555-5555-5555-555555555506', 'completed', 'Your rental of Kubota M7060 Tractor has been completed. Leave a review!', true);

-- disputes — D001-D003 from mockData.js. D001 maps onto the actual b1
-- booking (matching renter/owner); D002/D003 don't correspond to any
-- single seeded booking in the source data, so booking_id is left null
-- for those two, same as the frontend (DISPUTES has no bookingId field).
insert into disputes (booking_id, reporter_id, against_id, reason, status) values
  ('77777777-7777-7777-7777-777777777701', '55555555-5555-5555-5555-555555555506', '55555555-5555-5555-5555-555555555501', 'Equipment was already damaged when collected. Owner denying responsibility.', 'open'),
  (null, '55555555-5555-5555-5555-555555555508', '55555555-5555-5555-5555-555555555503', 'Owner did not show up at agreed pickup location.', 'open'),
  (null, '55555555-5555-5555-5555-555555555505', '55555555-5555-5555-5555-555555555502', 'Renter returned equipment with damage not disclosed in initial report.', 'resolved');


-- =====================================================================
-- 16. Migrations, copied verbatim from migrations/ (safe to re-run)
-- =====================================================================

-- >>> migrations/001_profiles_bio.sql
-- Adds a per-user bio to profiles.
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to re-run (IF NOT EXISTS).
--
-- Why: EditProfile used to show a hardcoded bio for everyone and never saved
-- it, because profiles had no column to store it in.

alter table profiles
  add column if not exists bio text
  check (bio is null or char_length(bio) <= 200);

-- Make PostgREST pick up the new column immediately.
notify pgrst, 'reload schema';
-- <<< migrations/001_profiles_bio.sql

-- >>> migrations/002_listing_rules_deletion_and_emails.sql
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
-- <<< migrations/002_listing_rules_deletion_and_emails.sql

-- >>> migrations/003_request_then_pay.sql
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
-- <<< migrations/003_request_then_pay.sql

-- >>> migrations/004_private_emails.sql
-- Keep people's email addresses private, and add two columns the admin
-- pages already use.
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to re-run. Needs 003 to have been run first.
--
-- Before: "profiles are publicly readable" let anyone (even logged out)
-- read every column of every profile, email included.
-- After: other people can read every profile column EXCEPT email (names and
-- photos still show on listings, reviews and chats). You read your own full
-- profile through my_profile(); admins read everyone's through
-- admin_list_profiles().

-- ---------------------------------------------------------------------
-- 1. Columns the admin pages use but schema.sql never had
-- ---------------------------------------------------------------------
alter table equipment add column if not exists flagged boolean not null default false;
alter table disputes add column if not exists resolution_notes text;

-- ---------------------------------------------------------------------
-- 2. Column-level read access on profiles: everything but email.
--    Built from the live column list. If you add a column to profiles
--    later, run this file again so other people can read it too.
-- ---------------------------------------------------------------------
do $$
declare
  v_cols text;
begin
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
  into v_cols
  from information_schema.columns
  where table_schema = 'public' and table_name = 'profiles'
    and column_name not in ('email', 'phone', 'date_of_birth'); -- private (phone, dob: see 005)

  execute 'revoke select on profiles from anon, authenticated';
  execute format('grant select (%s) on profiles to anon, authenticated', v_cols);
end;
$$;

-- ---------------------------------------------------------------------
-- 3. Your own profile, in full
-- ---------------------------------------------------------------------
create or replace function my_profile() returns setof profiles
language plpgsql stable security definer set search_path = public as $$
begin
  return query select * from profiles where id = auth.uid();
end;
$$;

-- ---------------------------------------------------------------------
-- 4. Admins: everyone's profile, emails included
-- ---------------------------------------------------------------------
create or replace function admin_list_profiles(p_limit int default null) returns setof profiles
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then
    raise exception 'Only admins can see this.' using errcode = 'insufficient_privilege';
  end if;
  return query select * from profiles order by created_at desc limit p_limit;
end;
$$;

revoke all on function my_profile(), admin_list_profiles(int) from public, anon;
grant execute on function my_profile(), admin_list_profiles(int) to authenticated;

-- ---------------------------------------------------------------------
-- 5. Nobody can make themselves an admin
--    "users can update their own profile" covers every column, so anyone
--    could set their own role to 'admin' (and unlock everything) or lift
--    their own suspension. Renter <-> owner stays free: the app switches
--    between them (AuthContext, PostListing).
-- ---------------------------------------------------------------------
create or replace function guard_profile_changes() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if is_admin() or auth.uid() is null then
    return new; -- admins, and the dashboard / server (no signed-in user)
  end if;
  if new.role = 'admin' and old.role is distinct from 'admin' then
    raise exception 'Only an admin can make someone an admin.' using errcode = 'insufficient_privilege';
  end if;
  if new.status is distinct from old.status then
    raise exception 'Only an admin can change an account''s status.' using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_changes on profiles;
create trigger profiles_guard_changes
  before update on profiles
  for each row execute function guard_profile_changes();
-- <<< migrations/004_private_emails.sql

-- >>> migrations/005_profile_contact_details.sql
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
-- <<< migrations/005_profile_contact_details.sql

-- >>> migrations/006_refund_on_cancel.sql
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
-- <<< migrations/006_refund_on_cancel.sql

-- >>> migrations/007_delete_account.sql
-- "Delete my account" (Edit Profile), done safely.
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to re-run. Needs 006 to have been run first.
--
-- Every table that points at a profile deletes its rows along with it, so
-- removing a profile outright would also wipe the *other* person's bookings,
-- earnings, reviews, chats and disputes. Instead the account is closed:
--   - refused while the person has a paid booking that hasn't finished;
--   - their open requests are withdrawn (as renter) or declined (as owner),
--     and the other person is told as usual;
--   - their listings are removed (kept hidden if they have booking history);
--   - their personal details are wiped and the profile shows "Deleted user";
--   - /api/delete-account then removes the login itself, which frees the
--     email address for a new sign-up.
-- Shared history stays, under "Deleted user".

alter table profiles add column if not exists deleted_at timestamptz;
grant select (deleted_at) on profiles to anon, authenticated;

-- The profile must outlive its login (see above), so it no longer follows
-- auth.users on delete. on_auth_user_deleted below wipes it instead.
do $$
declare
  v_name text;
begin
  for v_name in
    select conname from pg_constraint
    where conrelid = 'public.profiles'::regclass and contype = 'f'
      and confrelid = 'auth.users'::regclass
  loop
    execute format('alter table profiles drop constraint %I', v_name);
  end loop;
end;
$$;

-- Wipes an account. No checks: delete_account() checks first; a login
-- deleted from the Supabase dashboard comes here directly.
create or replace function close_account(p_user_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_eq uuid;
begin
  -- Open requests first, while the names are still there for the
  -- notifications and emails the booking triggers send.
  update bookings set status = 'cancelled', updated_at = now()
  where renter_id = p_user_id and status in ('pending', 'accepted');

  update bookings set status = 'declined', status_reason = 'listing_removed', updated_at = now()
  where owner_id = p_user_id and status in ('pending', 'accepted');

  for v_eq in select id from equipment where owner_id = p_user_id and deleted_at is null loop
    delete from wishlists where equipment_id = v_eq;
    if exists (select 1 from bookings where equipment_id = v_eq) then
      update equipment set deleted_at = now(), is_available = false where id = v_eq;
    else
      delete from equipment where id = v_eq;
    end if;
  end loop;

  delete from wishlists where user_id = p_user_id;
  delete from notifications where user_id = p_user_id;
  delete from email_outbox where user_id = p_user_id and sent_at is null;

  update profiles set
    name = 'Deleted user', email = '', photo_url = null, bio = null,
    phone = null, province = null, district = null, date_of_birth = null,
    deleted_at = now()
  where id = p_user_id;
end;
$$;

-- Called by /api/delete-account (service role only) before it removes the
-- login. Returns 'deleted', or 'already_deleted' when a previous attempt got
-- this far, so the API can simply retry removing the login.
create or replace function delete_account(p_user_id uuid) returns text
language plpgsql security definer set search_path = public as $$
declare
  p profiles;
begin
  select * into p from profiles where id = p_user_id for update;
  if not found then
    raise exception 'Account not found.' using errcode = 'no_data_found';
  end if;
  if p.deleted_at is not null then
    return 'already_deleted';
  end if;
  if p.role = 'admin' then
    raise exception 'Admin accounts can''t be deleted here. Ask another admin to change your role first.'
      using errcode = 'check_violation';
  end if;

  if exists (
    select 1 from bookings
    where renter_id = p_user_id and status = 'confirmed' and end_date >= current_date
  ) then
    raise exception 'You have a paid booking that hasn''t finished yet. Cancel it in My Bookings (if it hasn''t started) or wait until it ends, then try again.'
      using errcode = 'check_violation';
  end if;
  if exists (
    select 1 from bookings
    where owner_id = p_user_id and status = 'confirmed' and end_date >= current_date
  ) then
    raise exception 'Someone has paid to rent your equipment and the rental hasn''t finished yet. You can delete your account once it ends.'
      using errcode = 'check_violation';
  end if;

  perform close_account(p_user_id);
  return 'deleted';
end;
$$;

revoke all on function close_account(uuid), delete_account(uuid) from public, anon, authenticated;
grant execute on function delete_account(uuid) to service_role;

-- A login deleted from the Supabase dashboard closes the account too, so no
-- profile is left behind with a real name and phone number.
create or replace function handle_deleted_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from profiles where id = old.id and deleted_at is null) then
    perform close_account(old.id);
  end if;
  return old;
end;
$$;

drop trigger if exists on_auth_user_deleted on auth.users;
create trigger on_auth_user_deleted
  after delete on auth.users
  for each row execute function handle_deleted_user();

-- Nobody can message a deleted account.
create or replace function block_messages_to_deleted() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (
    select 1 from conversations c
    join profiles p on p.id = case when c.renter_id = new.sender_id then c.owner_id else c.renter_id end
    where c.id = new.conversation_id and p.deleted_at is not null
  ) then
    raise exception 'This person has deleted their account, so they can''t receive messages.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists messages_block_deleted on messages;
create trigger messages_block_deleted
  before insert on messages
  for each row execute function block_messages_to_deleted();

notify pgrst, 'reload schema';
-- <<< migrations/007_delete_account.sql

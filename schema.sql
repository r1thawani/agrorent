-- =====================================================================
-- AgroRent — Supabase schema
-- Generated from the agrorent frontend repo (React/Vite, currently
-- backed entirely by src/data/mockData.js and mock services in
-- src/services/*.js).
--
-- Seed data below reuses the exact people, equipment, bookings,
-- messages, notifications, and disputes already hardcoded in the
-- frontend's src/data/mockData.js and src/pages/ListingDetail.jsx
-- (MOCK_REVIEWS), so the seeded database matches what the UI already
-- displays.
--
-- Paste the whole thing into Supabase SQL Editor and run it top to
-- bottom. It creates: extensions -> enums -> tables -> indexes ->
-- RLS policies -> seed data.
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
create type booking_status as enum ('pending', 'confirmed', 'declined', 'cancelled', 'completed');
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
  ('55555555-5555-5555-5555-555555555512', 'Bupe Siwale',      'bupe.siwale@example.com',    'renter', 'active');    -- ListingDetail.jsx MOCK_REVIEWS only

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
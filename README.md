# AgroRent

AgroRent is a peer-to-peer rental marketplace for farming equipment. Farmers who own equipment (tractors, ploughs, harvesters, irrigation systems, etc.) can list it for rent, and other farmers can browse, book, and pay a down payment to rent it for the dates they need.

This repository is the **frontend** — a React single-page app built with Vite, backed by a real [Supabase](https://supabase.com/) project (Postgres + Auth + Storage). See [Project status](#project-status) below for what's live versus still in progress.

## Features

- **Browse & search** — filterable, searchable listings grid (category, province, price range)
- **Listing detail** — photo gallery, availability calendar, reviews, and a booking sidebar with live price calculation
- **Booking flow** — date selection → price breakdown (subtotal, service fee, down payment, balance) → confirmation
- **Renter dashboard** — active/upcoming bookings, recent messages, recent notifications
- **Owner dashboard** — pending booking requests (accept/decline), confirmed bookings, listing management
- **Messaging** — conversation list and a chat-style thread per conversation
- **Notifications** — read/unread state shared across the app via React Context
- **Reviews** — star ratings and written reviews on completed rentals
- **Auth pages** — login, signup (with email confirmation), forgot/reset password, backed by Supabase Auth
- **Admin section** — users, listings, bookings, and dispute management screens

## Tech stack

- [React 19](https://react.dev/) + [React Router](https://reactrouter.com/)
- [Vite](https://vitejs.dev/) for dev server & build
- [Supabase](https://supabase.com/) (`@supabase/supabase-js`) for the database, auth, and photo storage — see `src/lib/supabaseClient.js` and `schema.sql`
- [Tailwind CSS](https://tailwindcss.com/) v4 — the app is mid-migration from plain inline styles to Tailwind utility classes (see `@theme` in `src/index.css` for the shared color tokens); some pages/components are converted, most are not yet
- [lucide-react](https://lucide.dev/) for icons
- [Vitest](https://vitest.dev/) for unit tests
- [oxlint](https://oxc.rs/) for linting

## Getting started

```bash
npm install
npm run dev        # start the dev server
npm run build      # production build to /dist
npm run preview    # preview the production build locally
npm run lint        # run oxlint
npm test           # run the unit test suite once
npm run test:watch # run tests in watch mode
```

You'll also need a `.env.local` in the project root with your own Supabase project's credentials:

```
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-project's-anon-key>
```

Then run `schema.sql` (SQL Editor in the Supabase dashboard) to create the tables, RLS policies, sign-up trigger, photo storage, seed data and every migration. Its own header comments explain the order — the `auth.users` rows for the seed people need to exist first.

After that, run the files in `migrations/` in order (same SQL Editor). Each is safe to re-run:

- `001_profiles_bio.sql` — per-user bio
- `002_listing_rules_deletion_and_emails.sql` — listing price/text/photo limits, the `delete_listing()` rules, blocking bookings on unavailable listings, nightly marking of finished bookings as `completed` (uses `pg_cron`), and the column the message emails use
- `003_request_then_pay.sql` — the request → accept → pay-deposit booking flow (see below), booking emails, badge counts, live notifications, K5,000/day price cap
- `004_private_emails.sql` — hides email addresses from other users (you see your own via `my_profile()`, admins via `admin_list_profiles()`); adds `equipment.flagged` and `disputes.resolution_notes`
- `005_profile_contact_details.sql` — saves phone, province/district and date of birth on profiles. Location is public; phone is private except to the other person on a booking whose deposit is paid (`my_booking_contacts()`); date of birth is private
- `006_refund_on_cancel.sql` — a renter can cancel a paid booking until it starts; the deposit is marked refunded and they're told it comes back within 5 working days (no payment provider is connected, so the refund itself is outside the app)
- `007_delete_account.sql` — "Delete my account" on Edit Profile (see below). Also stops the profile row being deleted along with its login, and blocks messages to deleted accounts

Setting up a brand-new project? `schema.sql` alone builds everything (it carries every migration in its last section), so you don't need to run the migrations separately.

### Booking flow

1. **Request** — the renter picks dates and sends a request. No payment, and the dates aren't held: several renters can ask for the same dates.
2. **Accept** — the owner accepts one. The renter then has `payment_grace_minutes` (in the `app_config` table) to pay the 25% deposit. Until then the owner can't accept another request for overlapping dates.
3. **Pay** — once the deposit is paid the booking is confirmed, the dates are taken, and every other request for those dates is declined automatically.
4. **Expiry** — if the deposit isn't paid in time, a job that runs every minute declines it for the owner / cancels it for the renter.

Every status change writes an in-app notification and queues an email in `email_outbox`; `POST /api/send-emails` sends the queue. The app calls it right after each action, and the every-minute job calls it too (so expiry emails go out when nobody has the site open). For that, set in the `app_config` table:

```sql
update app_config set value = 'https://<your-site>/api/send-emails' where key = 'email_flush_url';
-- only if that URL is a protected Vercel preview (Settings -> Deployment Protection -> Protection Bypass for Automation):
update app_config set value = '<bypass secret>' where key = 'vercel_bypass_secret';
-- before going live, give renters a realistic time to pay (minutes; 1440 = 24 hours):
update app_config set value = '1440' where key = 'payment_grace_minutes';
```

### Deleting an account

Edit Profile → Delete my account asks for the password, then calls `POST /api/delete-account`:

1. `delete_account()` refuses while the person has a paid booking that hasn't finished (as renter or owner), and refuses admin accounts.
2. Otherwise it withdraws their unpaid requests, declines requests on their equipment (the other person is notified and emailed as usual), removes their listings (hidden rather than deleted if they have booking history), and wipes their name, email, photo, bio, phone, location and date of birth. The profile stays as "Deleted user" so the other side's bookings, earnings, reviews and chats still make sense.
3. The server function then deletes the login (service-role key), which frees the email address for a new sign-up.

Deleting a user from the Supabase dashboard (Authentication → Users) closes the account the same way, but skips the booking check.

### Emails (help requests and new-message alerts)

The `api/` folder holds Vercel serverless functions that send email through the AgroRent Gmail account:

- `POST /api/help` — the Contact / "Need help?" form; the request lands in the AgroRent inbox with Reply-To set to the person who asked
- `POST /api/send-emails` — sends queued booking emails (new request, accepted, declined, deposit paid, payment deadline missed, cancelled)
- `POST /api/notify-message` — called after a message is sent; emails the recipient who it's from plus a short glimpse, never the full text. A sender triggers at most one email until the recipient reads the conversation

Set these in Vercel → Project → Settings → Environment Variables (Production and Preview):

```
GMAIL_USER=<the AgroRent Gmail address>
GMAIL_APP_PASSWORD=<a Google App password for that account>
SUPABASE_SERVICE_ROLE_KEY=<Supabase → Project Settings → API → service_role key; keep secret>
# optional
SUPPORT_INBOX=<where help requests go; defaults to GMAIL_USER>
APP_URL=<site address for links in emails; defaults to the deployment's own address>
VITE_SUPPORT_EMAIL=<address shown on the Contact page; hidden if unset>
```

`npm run dev` only serves the frontend, so the forms can't reach `/api` locally; use `npx vercel dev` for that, or test on a Vercel preview deployment.

## Project structure

```
src/
  components/   Shared, reusable UI pieces (cards, badges, forms)
  pages/        One file per route (see src/App.jsx for the route list)
  context/      React Context providers (auth, notifications, wishlist) — backed by Supabase
  hooks/        Custom hooks (auth, booking pricing, a generic useAsync data-fetch hook)
  services/     Supabase-backed service layer, one file per resource (equipment, bookings, messages, ...)
  lib/          Supabase client singleton
  data/         A handful of still-static reference values (categories, province/district lists) — not live data
  utils/        Formatting/calculation helpers, plus their Vitest unit tests (*.test.js)
```

## Project status

This started as a mock-data class prototype and now runs on a real Supabase backend — data persists, auth is real, and most pages read/write the database through the `src/services/*.js` layer. It's still actively being hardened rather than finished:

- **Mobile-first CSS migration in progress.** Most of the UI is still the original desktop-only inline styles; Navbar, Home, and EquipmentCard have been converted to Tailwind so far (see the `@theme` tokens in `src/index.css`).
- **Test coverage is just starting.** `npm test` currently covers the pure calculation/formatting/mapping helpers; the Supabase-backed services and pages don't have automated tests yet.
- **Known gaps**: payments and refunds are recorded but not connected to a real mobile-money provider (outside the project's scope).

The previous mock-data layer (`src/data/mockData.js`'s equipment/bookings/messages arrays) is no longer used by any page and is a cleanup candidate; a few of its still-relevant static lists (categories, provinces/districts) remain in use.

## License

Class project — no license specified yet.

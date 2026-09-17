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

Then run `schema.sql` (SQL Editor in the Supabase dashboard) to create the tables, RLS policies, and seed data. Its own header comments explain the order — the `auth.users` rows for the seed people need to exist first.

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
- **Known gaps being worked through**: a couple of database columns the UI expects aren't reflected in `schema.sql` yet (it's drifted from what's actually been run against the live project), and Row Level Security policies need tightening in a few places (e.g. role changes). Not blockers for the demo, but noted here so they don't get lost.

The previous mock-data layer (`src/data/mockData.js`'s equipment/bookings/messages arrays) is no longer used by any page and is a cleanup candidate; a few of its still-relevant static lists (categories, provinces/districts) remain in use.

## License

Class project — no license specified yet.

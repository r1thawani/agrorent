# AgroRent

AgroRent is a peer-to-peer rental marketplace for farming equipment. Farmers who own equipment (tractors, ploughs, harvesters, irrigation systems, etc.) can list it for rent, and other farmers can browse, book, and pay a down payment to rent it for the dates they need.

This repository is the **frontend** — a React single-page app built with Vite. It currently runs entirely on mock data (no backend yet); see [Project status](#project-status) below.

## Features

- **Browse & search** — filterable, searchable listings grid (category, province, price range)
- **Listing detail** — photo gallery, availability calendar, reviews, and a booking sidebar with live price calculation
- **Booking flow** — date selection → price breakdown (subtotal, service fee, down payment, balance) → confirmation
- **Renter dashboard** — active/upcoming bookings, recent messages, recent notifications
- **Owner dashboard** — pending booking requests (accept/decline), confirmed bookings, listing management
- **Messaging** — conversation list and a chat-style thread per conversation
- **Notifications** — read/unread state shared across the app via React Context
- **Reviews** — star ratings and written reviews on completed rentals
- **Auth pages** — login, signup, forgot/reset password (mock, no real backend yet)
- **Admin section** — users, listings, bookings, and dispute management screens

## Tech stack

- [React 19](https://react.dev/) + [React Router](https://reactrouter.com/)
- [Vite](https://vitejs.dev/) for dev server & build
- [Tailwind CSS](https://tailwindcss.com/) (available, though most components use plain inline styles + CSS variables defined in `src/index.css`)
- [lucide-react](https://lucide.dev/) for icons
- [oxlint](https://oxc.rs/) for linting

## Getting started

```bash
npm install
npm run dev       # start the dev server
npm run build     # production build to /dist
npm run preview   # preview the production build locally
npm run lint       # run oxlint
```

## Project structure

```
src/
  components/   Shared, reusable UI pieces (cards, badges, forms)
  pages/        One file per route (see src/App.jsx for the route list)
  context/      React Context providers (auth, notifications)
  hooks/        Custom hooks (auth, booking pricing, mock socket)
  services/     Mock service layer — Promise-based, shaped like a real API
  data/         Mock data (equipment, bookings, messages, etc.)
  utils/        Small formatting/calculation helpers
```

## Project status

This is a **frontend-only prototype** built for a class/demo presentation. There is no real backend yet:

- All data comes from `src/data/mockData.js`
- `src/services/*.js` mimic real API calls (they're async and return realistic shapes) but currently just read/write the mock data in memory — nothing persists across a page refresh
- Auth is session-only React state (see `src/context/AuthContext.jsx`)

The service layer was deliberately written so that connecting a real backend later is a small change (point `src/services/api.js` at a real API and update each service to call it) rather than a rewrite of the pages themselves.

## License

Class project — no license specified yet.

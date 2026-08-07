// Shared pricing math for the renter booking flow (BookingPage.jsx,
// BookingConfirmation.jsx). Kept as one util so the three 4D pages never
// duplicate this arithmetic.
//
// Rules (match the reference zip's BookingPage.tsx math exactly):
// - subtotal    = priceDay x days
// - fee         = 5% of subtotal, rounded to the nearest Kwacha
// - total       = subtotal + fee
// - downPayment = 25% of total, rounded to the nearest Kwacha (due now)
// - balance     = total - downPayment (due at pickup)
//
// Note: this util is for pricing a NEW booking being created on BookingPage.
// It does not recompute figures for the 3 historical bookings already seeded
// in mockData.js's BOOKINGS array in sub-phase 4B (those totalPrice/downPayment
// values are static display data for MyBookings.jsx and are left as-is).

const SERVICE_FEE_RATE = 0.05;
const DOWN_PAYMENT_RATE = 0.25;

export function calculateBooking(priceDay, days) {
  const subtotal = priceDay * days;
  const fee = Math.round(subtotal * SERVICE_FEE_RATE);
  const total = subtotal + fee;
  const downPayment = Math.round(total * DOWN_PAYMENT_RATE);
  const balance = total - downPayment;

  return { subtotal, fee, total, downPayment, balance };
}

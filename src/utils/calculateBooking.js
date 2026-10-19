// Shared pricing math for the renter booking flow (BookingPage.jsx,
// BookingConfirmation.jsx). Kept as one util so the three 4D pages never
// duplicate this arithmetic.
//
// Rules (match the reference zip's BookingPage.tsx math exactly):
// - subtotal    = priceDay x days, or whole weeks at the weekly price + leftover days
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

// Whole weeks are charged at the owner's weekly price when they set one and
// it's cheaper than 7 days; leftover days at the daily price. The database
// does the same sum (prepare_booking_request, migrations/010).
export function weeklyRateApplies(priceDay, priceWeek) {
  return Number(priceWeek) > 0 && Number(priceWeek) < Number(priceDay) * 7;
}

export function calculateBooking(priceDay, days, priceWeek = null) {
  const useWeeks = weeklyRateApplies(priceDay, priceWeek);
  const weeks = useWeeks ? Math.floor(days / 7) : 0;
  const extraDays = days - weeks * 7;
  const subtotal = weeks * (useWeeks ? Number(priceWeek) : 0) + extraDays * priceDay;
  const fee = Math.round(subtotal * SERVICE_FEE_RATE);
  const total = subtotal + fee;
  const downPayment = Math.round(total * DOWN_PAYMENT_RATE);
  const balance = total - downPayment;

  return { subtotal, fee, total, downPayment, balance, weeks, extraDays };
}

// "1 week × K3,000 + 3 days × K500", or "3 days × K500" without a weekly rate.
export function priceBreakdown(priceDay, days, priceWeek = null) {
  const { weeks, extraDays } = calculateBooking(priceDay, days, priceWeek);
  const k = (n) => `K${Number(n).toLocaleString("en-US")}`;
  const parts = [];
  if (weeks > 0) parts.push(`${weeks} week${weeks === 1 ? "" : "s"} × ${k(priceWeek)}`);
  if (extraDays > 0 || weeks === 0) parts.push(`${extraDays} day${extraDays === 1 ? "" : "s"} × ${k(priceDay)}`);
  return parts.join(" + ");
}

// Returns the number of days between two "YYYY-MM-DD" date strings.
// Used by BookingPage.jsx to turn a start/end date range into a day count
// before feeding it into calculateBooking.js. Returns 0 if dates are missing
// or invalid so callers can show a "pick valid dates" state.
export function calculateDays(startDate, endDate) {
  if (!startDate || !endDate) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);
  const msPerDay = 1000 * 60 * 60 * 24;
  const diff = Math.round((end.getTime() - start.getTime()) / msPerDay);

  return diff > 0 ? diff : 0;
}

// Owner earnings figures, shared by Earnings.jsx, OwnerDashboard.jsx and
// MyListings.jsx.
//
// What the owner earns from a booking is its subtotal (price per day x days).
// The 5% service fee on top is AgroRent's, so it is not counted. Older code
// used total_price, which included the fee.
//
// A booking counts toward earnings once the owner has confirmed it.
// "Earned" means the rental has ended; "upcoming" means it hasn't yet.
// A confirmed booking whose end date has passed counts as earned even if the
// nightly job hasn't marked it 'completed' yet.

export function ownerEarning(booking) {
  if (booking.subtotal != null) return Number(booking.subtotal);
  return Number(booking.total_price || 0) - Number(booking.service_fee || 0);
}

// 'completed' | 'upcoming' | null (not an earning booking).
// `today` is a YYYY-MM-DD string.
export function earningStatus(booking, today) {
  if (booking.status === "completed") return "completed";
  if (booking.status !== "confirmed") return null;
  return booking.end_date < today ? "completed" : "upcoming";
}

// The month a booking's earning belongs to: the month the rental starts.
function monthKey(dateStr) {
  return dateStr.slice(0, 7); // "YYYY-MM"
}

// `months` is a list of "YYYY-MM" keys to bucket into.
export function summarizeEarnings(bookings, today, months = []) {
  let earned = 0;
  let upcoming = 0;
  let toCollectAtPickup = 0;
  const byMonth = Object.fromEntries(months.map((m) => [m, 0]));
  const earning = [];

  for (const b of bookings) {
    const status = earningStatus(b, today);
    if (!status) continue;
    const amount = ownerEarning(b);
    earning.push({ ...b, earningStatus: status, ownerAmount: amount });

    if (status === "completed") earned += amount;
    else upcoming += amount;

    // Renter pays this balance at pickup, so it's still to come for rentals
    // that haven't started yet.
    if (status === "upcoming" && b.start_date >= today) {
      toCollectAtPickup += Number(b.balance_due || 0);
    }

    const key = monthKey(b.start_date);
    if (key in byMonth) byMonth[key] += amount;
  }

  return {
    earned,
    upcoming,
    toCollectAtPickup,
    thisMonth: byMonth[monthKey(today)] ?? 0,
    byMonth,
    earning,
  };
}

// The last `count` months ending with the month of `today`, oldest first,
// as { key: "YYYY-MM", label: "Jan" }.
export function lastMonths(today, count = 8) {
  const [y, m] = today.split("-").map(Number);
  const months = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.push({ key, label: d.toLocaleString("en-US", { month: "short" }) });
  }
  return months;
}

import { useMemo, useState } from "react";
import { calculateDays } from "../utils/calculateDays";
import { calculateBooking } from "../utils/calculateBooking";

// Bundles the date-range state + pricing math that BookingPage.jsx and
// ListingDetail.jsx's sidebar both need, so a booking widget can be built
// as `const booking = useBooking(priceDay)` instead of wiring up
// calculateDays + calculateBooking by hand on every page that needs it.
export function useBooking(priceDay) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const days = calculateDays(startDate, endDate);

  const pricing = useMemo(
    () => (days > 0 ? calculateBooking(priceDay, days) : { subtotal: 0, fee: 0, total: 0, downPayment: 0, balance: 0 }),
    [priceDay, days]
  );

  function reset() {
    setStartDate("");
    setEndDate("");
  }

  return { startDate, setStartDate, endDate, setEndDate, days, reset, ...pricing };
}

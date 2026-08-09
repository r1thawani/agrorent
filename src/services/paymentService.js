import { mockDelay } from "./api";
import { calculateBooking } from "../utils/calculateBooking";

// Mock service backing BookingPage.jsx's down-payment step. Wraps the same
// calculateBooking() math the page already uses, plus a fake "charge" call
// so the checkout flow has something to await/catch around.
export const paymentService = {
  async quote(priceDay, days) {
    await mockDelay(150);
    return calculateBooking(priceDay, days);
  },

  async chargeDownPayment({ bookingId, amount, method = "mobile-money" }) {
    await mockDelay(600); // simulate a real payment round-trip for the demo
    if (!amount || amount <= 0) throw new Error("Invalid payment amount");
    return { bookingId, amount, method, status: "paid", reference: `PAY-${Date.now()}` };
  },
};

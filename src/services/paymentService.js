// FILE: agrorent/src/services/paymentService.js
import { supabase } from "../lib/supabaseClient";
import { calculateBooking } from "../utils/calculateBooking";

export const paymentService = {
  async quote(priceDay, days) {
    return calculateBooking(priceDay, days);
  },

  async chargeDownPayment({ bookingId, amount, method = "mobile-money" }) {
    if (!amount || amount <= 0) throw new Error("Invalid payment amount");
    const { data, error } = await supabase
      .from("payments")
      .insert({
        booking_id: bookingId,
        amount,
        method,
        status: "paid",
        reference: `PAY-${Date.now()}`,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
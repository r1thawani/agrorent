// FILE: agrorent/src/services/bookingService.js
import { supabase } from "../lib/supabaseClient";
import { calculateBooking } from "../utils/calculateBooking";

export const bookingService = {
  async getMyBookings(renterId) {
    const { data, error } = await supabase
      .from("bookings")
      .select("*, equipment(name, price_day, equipment_photos(url, sort_order))")
      .eq("renter_id", renterId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async getRequestsForOwner(ownerId) {
    const { data, error } = await supabase
      .from("bookings")
      .select("*, equipment(name), renter:profiles!bookings_renter_id_fkey(name, photo_url)")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

   async getById(id) {
    const { data, error } = await supabase
      .from("bookings")
      .select("*, equipment(name, price_day, equipment_photos(url, sort_order))")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  async create({ equipmentId, renterId, ownerId, priceDay, startDate, endDate, totalDays }) {
    const calc = calculateBooking(priceDay, totalDays);
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        equipment_id: equipmentId,
        renter_id: renterId,
        owner_id: ownerId,
        start_date: startDate,
        end_date: endDate,
        total_days: totalDays,
        price_day_snapshot: priceDay,
        subtotal: calc.subtotal,
        service_fee: calc.fee,
        total_price: calc.total,
        down_payment: calc.downPayment,
        balance_due: calc.total - calc.downPayment,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async cancel(id) {
    const { data, error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },

  async accept(id) {
    const { data, error } = await supabase.from("bookings").update({ status: "confirmed" }).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },

  async decline(id) {
    const { data, error } = await supabase.from("bookings").update({ status: "declined" }).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
};
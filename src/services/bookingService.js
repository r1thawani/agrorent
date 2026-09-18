// FILE: agrorent/src/services/bookingService.js
import { supabase } from "../lib/supabaseClient";
import { calculateBooking } from "../utils/calculateBooking";

function rangesOverlap(startA, endA, startB, endB) {
  return startA <= endB && startB <= endA;
}

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

  // Every pending or confirmed booking for a piece of equipment — used both
  // to show taken dates on the booking page and to block overlapping bookings.
  // Uses a security-definer RPC so RLS doesn't hide other renters' bookings.
  async getForEquipment(equipmentId) {
    const { data, error } = await supabase
      .rpc("get_equipment_booking_dates", { p_equipment_id: equipmentId });
    if (error) throw error;
    return data;
  },

  // Maps equipment_id -> end_date for equipment that's CURRENTLY booked
  // (a confirmed booking whose date range includes today). Used to show
  // "Unavailable until <date>" on the browse grid without a per-card fetch.
  async getCurrentlyBookedMap() {
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("bookings")
      .select("equipment_id, end_date")
      .eq("status", "confirmed")
      .lte("start_date", today)
      .gte("end_date", today);
    if (error) throw error;
    const map = {};
    data.forEach((b) => {
      map[b.equipment_id] = b.end_date;
    });
    return map;
  },

  async create({ equipmentId, renterId, ownerId, priceDay, startDate, endDate, totalDays }) {
    const existing = await this.getForEquipment(equipmentId);
    const overlap = existing.some((b) => rangesOverlap(startDate, endDate, b.start_date, b.end_date));
    if (overlap) {
      throw new Error("This equipment is already booked for part of your selected dates. Please choose different dates.");
    }

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
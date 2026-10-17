// FILE: agrorent/src/services/bookingService.js
import { supabase } from "../lib/supabaseClient";
import { emailService } from "./emailService";
import { rangesOverlap } from "../utils/bookingStatus";

// Booking flow (see migrations/003_request_then_pay.sql):
//   pending -> accepted (owner) -> confirmed (renter pays deposit in time)
//   accepted -> expired (time to pay ran out)
// Status changes go through database functions, which also write the
// notifications and queue the emails; we then ask the server to send them.
async function rpc(name, params) {
  const { data, error } = await supabase.rpc(name, params);
  if (error) throw error;
  emailService.flushQueue();
  return data;
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
      .select("*, equipment(name, price_day, pickup_address, equipment_photos(url, sort_order)), owner:profiles!bookings_owner_id_fkey(name, photo_url)")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  // Upcoming paid (confirmed) bookings for a piece of equipment: the dates
  // that are actually taken. Requests don't hold dates. Uses a
  // security-definer RPC so RLS doesn't hide other renters' bookings.
  async getForEquipment(equipmentId) {
    const { data, error } = await supabase
      .rpc("get_equipment_booking_dates", { p_equipment_id: equipmentId });
    if (error) {
      // If the DB function isn't deployed yet, log and return empty so
      // the rest of the app still works (overlap check will be skipped).
      console.warn("get_equipment_booking_dates RPC unavailable:", error.message);
      return [];
    }
    return data;
  },

  // Maps equipment_id -> end_date for equipment out on a paid booking
  // today. Used for the "Booked until" note on the browse grid.
  async getCurrentlyBookedMap() {
    const { data, error } = await supabase.rpc("get_currently_booked");
    if (error) {
      console.warn("get_currently_booked RPC unavailable:", error.message);
      return {};
    }
    return Object.fromEntries(data.map((b) => [b.equipment_id, b.end_date]));
  },

  // Sends a booking request. No payment yet; the database checks the dates
  // and works out the price itself.
  async create({ equipmentId, renterId, startDate, endDate }) {
    const existing = await this.getForEquipment(equipmentId);
    if (existing.some((b) => rangesOverlap(startDate, endDate, b.start_date, b.end_date))) {
      throw new Error("This equipment is already booked for part of your selected dates. Please choose different dates.");
    }
    const { data, error } = await supabase
      .from("bookings")
      .insert({ equipment_id: equipmentId, renter_id: renterId, start_date: startDate, end_date: endDate })
      .select()
      .single();
    if (error) throw error;
    emailService.flushQueue();
    return data;
  },

  accept(id) {
    return rpc("accept_booking", { p_booking_id: id });
  },

  decline(id) {
    return rpc("decline_booking", { p_booking_id: id });
  },

  cancel(id) {
    return rpc("cancel_booking", { p_booking_id: id });
  },

  // Returns "confirmed", or "expired" if the time to pay had run out.
  payDeposit(id, method) {
    return rpc("pay_deposit", { p_booking_id: id, p_method: method });
  },
};

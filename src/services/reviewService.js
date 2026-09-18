// FILE: agrorent/src/services/reviewService.js
import { supabase } from "../lib/supabaseClient";

export const reviewService = {
  async getForEquipment(equipmentId) {
    const { data, error } = await supabase
      .from("reviews")
      .select("*, reviewer:profiles!reviews_reviewer_id_fkey(name, photo_url)")
      .eq("equipment_id", equipmentId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async getByBookingId(bookingId) {
    const { data, error } = await supabase
      .from("reviews")
      .select("id")
      .eq("booking_id", bookingId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create({ bookingId, equipmentId, reviewerId, rating, text }) {
    if (!rating) throw new Error("A rating is required");
    const { data, error } = await supabase
      .from("reviews")
      .insert({ booking_id: bookingId, equipment_id: equipmentId, reviewer_id: reviewerId, rating, text })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
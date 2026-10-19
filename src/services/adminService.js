// FILE: agrorent/src/services/adminService.js
import { supabase } from "../lib/supabaseClient";

// Everyone's profile including email, for admins (migrations/004). If the
// function can't be reached, show the list without emails rather than fail.
async function adminProfiles(limit) {
  const res = await supabase.rpc("admin_list_profiles", limit ? { p_limit: limit } : {});
  if (!res.error) return res;
  let query = supabase
    .from("profiles")
    .select("id, name, photo_url, bio, role, status, created_at")
    .order("created_at", { ascending: false });
  if (limit) query = query.limit(limit);
  return query;
}

export const adminService = {
  async getStats() {
    const [{ count: userCount }, { count: listingCount }, { data: bookings }] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("equipment").select("*", { count: "exact", head: true }).is("deleted_at", null),
      supabase.from("bookings").select("total_price, status"),
    ]);

    const totalBookings = bookings?.length || 0;
    const totalRevenue = (bookings || [])
      .filter((b) => b.status === "confirmed" || b.status === "completed")
      .reduce((sum, b) => sum + Number(b.total_price), 0);

    return {
      totalUsers: userCount || 0,
      totalListings: listingCount || 0,
      totalBookings,
      totalRevenue,
    };
  },

  // Admin-only database function: the only way to see users' emails.
  async getRecentUsers(limit = 5) {
    const { data, error } = await adminProfiles(limit);
    if (error) throw error;
    return data;
  },

  async getOpenDisputes(limit = 5) {
    const { data, error } = await supabase
      .from("disputes")
      .select("*, reporter:profiles!disputes_reporter_id_fkey(name), against:profiles!disputes_against_id_fkey(name)")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data;
  },

  async getAllUsers() {
    const { data, error } = await adminProfiles();
    if (error) throw error;
    return data;
  },

  async toggleUserStatus(id, currentStatus) {
    const nextStatus = currentStatus === "active" ? "suspended" : "active";
    const { data, error } = await supabase
      .from("profiles")
      .update({ status: nextStatus })
      .eq("id", id)
      .select("id, name, role, status") // not email: see migrations/004
      .single();
    if (error) throw error;
    return data;
  },
  
  async getAllListings() {
    const { data, error } = await supabase
      .from("equipment")
      .select("*, equipment_photos(url, sort_order), owner:profiles!equipment_owner_id_fkey(name)")
      .is("deleted_at", null) // archived listings (deleted, but kept for booking history)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async toggleListingFlag(id, currentFlagged) {
    const { data, error } = await supabase
      .from("equipment")
      .update({ flagged: !currentFlagged })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getAllBookings() {
    const { data, error } = await supabase
      .from("bookings")
      .select("*, equipment(name), renter:profiles!bookings_renter_id_fkey(name), owner:profiles!bookings_owner_id_fkey(name)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async getAllDisputes() {
    const { data, error } = await supabase
      .from("disputes")
      .select("*, reporter:profiles!disputes_reporter_id_fkey(name, photo_url), against:profiles!disputes_against_id_fkey(name, photo_url)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async resolveDispute(id, notes) {
    const { data, error } = await supabase
      .from("disputes")
      .update({ status: "resolved", resolution_notes: notes || null })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
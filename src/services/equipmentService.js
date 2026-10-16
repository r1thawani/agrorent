// FILE: agrorent/src/services/equipmentService.js
import { supabase } from "../lib/supabaseClient";

export const equipmentService = {
  async getAll(filters = {}) {
    let query = supabase
      .from("equipment")
      .select("*, equipment_photos(url, sort_order)")
      .is("deleted_at", null);
    if (filters.category) query = query.eq("category", filters.category);
    if (filters.province) query = query.eq("province", filters.province);
    if (filters.district) query = query.eq("district", filters.district);
    if (filters.search) query = query.ilike("name", `%${filters.search}%`);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase
      .from("equipment")
      .select("*, equipment_photos(url, sort_order), owner:profiles!equipment_owner_id_fkey(id, name, photo_url)")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  async getCategories() {
    return ["Tractors", "Ploughs", "Planters", "Harvesters", "Irrigation", "Sprayers", "Other"];
  },

  async create(listing) {
    const { data, error } = await supabase.from("equipment").insert(listing).select().single();
    if (error) throw error;
    return data;
  },

  async update(id, changes) {
    const { data, error } = await supabase.from("equipment").update(changes).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },

  // Deletes a listing under the rules in the delete_listing() database
  // function: refused while a confirmed booking is current or upcoming;
  // otherwise pending requests are declined, and the listing is removed
  // (or hidden, if past bookings must keep pointing at it).
  async remove(id) {
    const { data, error } = await supabase.rpc("delete_listing", { p_equipment_id: id });
    if (error) throw error;
    return { id, result: data };
  },

  // Removes photos the owner took off a listing in EditListing.
  async removePhotos(equipmentId, urls) {
    const { error } = await supabase
      .from("equipment_photos")
      .delete()
      .eq("equipment_id", equipmentId)
      .in("url", urls);
    if (error) throw error;

    // Free the stored files too. Best effort: the listing is already
    // correct once the rows are gone.
    const marker = "/object/public/equipment-photos/";
    const paths = urls
      .filter((url) => url.includes(marker))
      .map((url) => decodeURIComponent(url.split(marker)[1]));
    if (paths.length) {
      const { error: storageError } = await supabase.storage.from("equipment-photos").remove(paths);
      if (storageError) console.warn("Could not remove photo files:", storageError.message);
    }
  },

  async uploadPhoto(equipmentId, fileOrBlob, filename = `photo-${Date.now()}.jpg`) {
    const path = `${equipmentId}/${Date.now()}-${filename}`;
    const { error: uploadError } = await supabase.storage.from("equipment-photos").upload(path, fileOrBlob);
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from("equipment-photos").getPublicUrl(path);

    const { data, error } = await supabase
      .from("equipment_photos")
      .insert({ equipment_id: equipmentId, url: publicUrl })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getMine(ownerId) {
    const { data, error } = await supabase
      .from("equipment")
      .select("*, equipment_photos(url, sort_order)")
      .eq("owner_id", ownerId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
};
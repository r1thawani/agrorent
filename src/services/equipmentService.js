// FILE: agrorent/src/services/equipmentService.js
import { supabase } from "../lib/supabaseClient";

export const equipmentService = {
  async getAll(filters = {}) {
    let query = supabase.from("equipment").select("*, equipment_photos(url, sort_order)");
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

  async remove(id) {
    const { error } = await supabase.from("equipment").delete().eq("id", id);
    if (error) throw error;
    return { id, deleted: true };
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
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
};
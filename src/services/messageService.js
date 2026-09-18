// FILE: agrorent/src/services/messageService.js
import { supabase } from "../lib/supabaseClient";

export const messageService = {
  // Returns one row per conversation the user is part of (as renter or
  // owner), with the other participant's info, the equipment name, and
  // the most recent message for the preview line.
  async getConversations(userId) {
    const { data, error } = await supabase
      .from("conversations")
      .select(`
        id,
        equipment_id,
        renter_id,
        owner_id,
        equipment(name),
        renter:profiles!conversations_renter_id_fkey(id, name, photo_url),
        owner:profiles!conversations_owner_id_fkey(id, name, photo_url),
        messages(id, text, sender_id, read, created_at)
      `)
      .or(`renter_id.eq.${userId},owner_id.eq.${userId}`);
    if (error) throw error;

    return data.map((conv) => {
      const otherPerson = conv.renter_id === userId ? conv.owner : conv.renter;
      const sortedMessages = (conv.messages || []).slice().sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      const last = sortedMessages[0];
      const unread = (conv.messages || []).some((m) => !m.read && m.sender_id !== userId);

      return {
        id: conv.id,
        person: otherPerson?.name || "Unknown",
        photo: otherPerson?.photo_url || "",
        equipment: conv.equipment?.name || "",
        lastMessage: last?.text || "",
        time: last ? new Date(last.created_at).toLocaleDateString() : "",
        unread,
      };
    });
  },

  // One conversation's info + its full message thread, in order.
  async getConversation(conversationId, userId) {
    const { data: conv, error: convError } = await supabase
      .from("conversations")
      .select(`
        id,
        equipment_id,
        renter_id,
        owner_id,
        equipment(name),
        renter:profiles!conversations_renter_id_fkey(id, name, photo_url),
        owner:profiles!conversations_owner_id_fkey(id, name, photo_url)
      `)
      .eq("id", conversationId)
      .single();
    if (convError) throw convError;

    const { data: messages, error: msgError } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (msgError) throw msgError;

    const otherPerson = conv.renter_id === userId ? conv.owner : conv.renter;

    return {
      id: conv.id,
      person: otherPerson?.name || "Unknown",
      photo: otherPerson?.photo_url || "",
      equipment: conv.equipment?.name || "",
      messages: messages.map((m) => ({
        id: m.id,
        from: m.sender_id === userId ? "me" : "them",
        text: m.text,
        time: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      })),
    };
  },

  // Finds the conversation between renter and owner about a piece of equipment,
  // or creates it if one doesn't exist yet. Returns the conversation id.
  async getOrCreate(renterId, ownerId, equipmentId) {
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("equipment_id", equipmentId)
      .eq("renter_id", renterId)
      .eq("owner_id", ownerId)
      .maybeSingle();
    if (existing) return existing.id;

    const { data: created, error } = await supabase
      .from("conversations")
      .insert({ equipment_id: equipmentId, renter_id: renterId, owner_id: ownerId })
      .select("id")
      .single();
    if (error) throw error;
    return created.id;
  },

  async markMessagesRead(conversationId, userId) {
    const { error } = await supabase
      .from("messages")
      .update({ read: true })
      .eq("conversation_id", conversationId)
      .neq("sender_id", userId)
      .eq("read", false);
    if (error) throw error;
  },

  async sendMessage(conversationId, senderId, text) {
    const { data, error } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, sender_id: senderId, text })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
// FILE: agrorent/src/context/WishlistContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState([]);

  // Load this user's real saved items from Supabase whenever they log in
  // (or clear the list when they log out).
  useEffect(() => {
    if (!user) {
      setWishlistIds([]);
      return;
    }
    supabase
      .from("wishlists")
      .select("equipment_id")
      .eq("user_id", user.id)
      .then(({ data, error }) => {
        if (!error && data) setWishlistIds(data.map((row) => row.equipment_id));
      });
  }, [user]);

  function isWishlisted(id) {
    return wishlistIds.includes(id);
  }

  async function toggleWishlist(id) {
    if (!user) return;
    const alreadySaved = wishlistIds.includes(id);

    // Optimistic UI update, rolled back if the Supabase call fails.
    setWishlistIds((prev) => (alreadySaved ? prev.filter((x) => x !== id) : [...prev, id]));

    try {
      if (alreadySaved) {
        const { error } = await supabase
          .from("wishlists")
          .delete()
          .eq("user_id", user.id)
          .eq("equipment_id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("wishlists")
          .insert({ user_id: user.id, equipment_id: id });
        if (error) throw error;
      }
    } catch {
      setWishlistIds((prev) => (alreadySaved ? [...prev, id] : prev.filter((x) => x !== id)));
    }
  }

  async function removeFromWishlist(id) {
    if (!user) return;
    setWishlistIds((prev) => prev.filter((existing) => existing !== id));
    try {
      const { error } = await supabase
        .from("wishlists")
        .delete()
        .eq("user_id", user.id)
        .eq("equipment_id", id);
      if (error) throw error;
    } catch {
      setWishlistIds((prev) => [...prev, id]);
    }
  }

  const value = { wishlistIds, isWishlisted, toggleWishlist, removeFromWishlist };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error("useWishlist() must be used inside <WishlistProvider>. Check main.jsx.");
  }
  return ctx;
}
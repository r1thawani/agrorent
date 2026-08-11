import { createContext, useContext, useState } from "react";

// Same pattern as AuthContext.jsx / NotificationContext.jsx: lifted to
// context so "is this equipment saved?" is shared across every place a
// heart icon can appear (EquipmentCard on Home/Listings/PublicProfile,
// ListingDetail, and the Wishlist page itself) instead of each page
// keeping its own local copy that disagrees with the others.
//
// Previously the heart button on EquipmentCard called e.preventDefault()
// and nothing else — it never actually saved anything — and the Wishlist
// page just hardcoded EQUIPMENT.slice(0, 4) instead of showing what was
// really saved. This context is the actual source of truth for that.
//
// No backend yet, so (like AuthContext) this doesn't persist across a full
// page reload — it's just React state. Swap setWishlist for real API calls
// when the backend exists; the shape of wishlistIds/toggleWishlist is
// designed to stay the same so callers won't need to change.

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [wishlistIds, setWishlistIds] = useState([]);

  function isWishlisted(id) {
    return wishlistIds.includes(id);
  }

  function toggleWishlist(id) {
    setWishlistIds((prev) =>
      prev.includes(id) ? prev.filter((existing) => existing !== id) : [...prev, id]
    );
  }

  function removeFromWishlist(id) {
    setWishlistIds((prev) => prev.filter((existing) => existing !== id));
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

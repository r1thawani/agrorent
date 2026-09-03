// Turns a raw Supabase `equipment` row into the flat, camelCase shape the UI
// components expect.
//
// Several pages (Listings, Wishlist, PublicProfile, MyListings, admin pages)
// each had their own copy of this exact mapping inline — including the
// easy-to-forget "sort photos by sort_order before taking the first one"
// step, which a couple of call sites had already dropped. Keeping it here
// means one place to change when the row shape or EquipmentCard props change,
// instead of hunting down every copy (the class of miss that left BookingCard
// broken).

// Primary (first) photo URL for an equipment row, honouring sort_order.
// Returns "" when the row has no photos, so callers can pass it straight to
// an <img src>.
export function primaryPhotoUrl(equipmentRow) {
  const photos = equipmentRow?.equipment_photos ?? [];
  const sorted = [...photos].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  return sorted[0]?.url || "";
}

// All photo URLs for an equipment row, in sort_order.
export function photoUrls(equipmentRow) {
  const photos = equipmentRow?.equipment_photos ?? [];
  return [...photos]
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((p) => p.url);
}

// The prop object <EquipmentCard {...} /> expects. Identical to the block
// that was previously copy-pasted into Listings.jsx / Wishlist.jsx /
// PublicProfile.jsx.
export function toEquipmentCardProps(equipmentRow) {
  return {
    id: equipmentRow.id,
    name: equipmentRow.name,
    category: equipmentRow.category,
    priceDay: equipmentRow.price_day,
    location: equipmentRow.location,
    rating: equipmentRow.rating,
    reviews: equipmentRow.review_count,
    image: primaryPhotoUrl(equipmentRow),
  };
}

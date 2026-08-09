import { Star } from "lucide-react";

// Extracted from ListingDetail.jsx so ReviewCard and any future page (owner
// profile, admin) can render the same 5-star display without duplicating it.
// Read-only display component — for an editable star picker see LeaveReview.jsx,
// which needs hover/click state and stays local to that page.
export default function StarRating({ rating = 0, size = 14 }) {
  return (
    <div style={{ display: "flex", gap: "2px" }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          fill={s <= Math.round(rating) ? "#FF5C00" : "none"}
          stroke={s <= Math.round(rating) ? "#FF5C00" : "#ccc"}
        />
      ))}
    </div>
  );
}

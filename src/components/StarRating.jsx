import { Star } from "lucide-react";

export default function StarRating({ rating = 0, size = 14 }) {
  return (
    <div className="flex gap-0.5">
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

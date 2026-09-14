// FILE: agrorent/src/components/EquipmentCard.jsx
import { MapPin, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";

export default function EquipmentCard({
  id,
  name,
  category,
  priceDay,
  location,
  rating,
  reviews,
  image,
  unavailableUntil,
}) {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const saved = isWishlisted(id);

  return (
    <Link
      to={`/listings/${id}`}
      className="block bg-white rounded-xl overflow-hidden hover:shadow-md transition-shadow border-[0.5px] border-border"
    >
      {/* Image area */}
      <div className="relative h-[180px] bg-peach">
        <img
          src={image}
          alt={name}
          className={`w-full h-full object-cover ${unavailableUntil ? "opacity-60" : "opacity-100"}`}
        />
        <button
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm"
          aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={saved}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(id);
          }}
        >
          <span className={saved ? "text-red-500 text-sm" : "text-ink-faint text-sm"}>
            {saved ? "♥" : "♡"}
          </span>
        </button>
        {unavailableUntil && (
          <span className="absolute top-2 left-2 text-xs px-2.5 py-1 rounded-full font-medium bg-red-tint text-red">
            Unavailable
          </span>
        )}
      </div>

      {/* Card body */}
      <div className="p-3.5">
        {/* Category badge */}
        <span className="inline-block text-xs px-2.5 py-1 rounded-full font-medium bg-green-tint text-green-dark">
          {category}
        </span>

        {/* Equipment name */}
        <div className="text-[15px] font-medium text-ink mt-1.5 leading-snug">
          {name}
        </div>

        {/* Price */}
        <div className="text-[16px] font-medium mt-1 text-orange">
          K{priceDay.toLocaleString()} / day
        </div>

        {unavailableUntil ? (
          <div className="text-[12px] mt-1 text-red">
            Unavailable until {new Date(unavailableUntil).toLocaleDateString()}
          </div>
        ) : (
          <div className="flex items-center gap-1 mt-1">
            <MapPin size={12} className="flex-shrink-0 text-ink-muted" />
            <span className="text-[12px] truncate text-ink-muted">
              {location}
            </span>
          </div>
        )}

        {/* Star rating */}
        <div className="flex items-center gap-1 mt-1">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={12}
                fill={s <= Math.round(rating) ? "#FF5C00" : "none"}
                stroke={s <= Math.round(rating) ? "#FF5C00" : "#ccc"}
              />
            ))}
          </div>
          <span className="text-[12px] text-ink-muted">
            ({reviews})
          </span>
        </div>
      </div>
    </Link>
  );
}
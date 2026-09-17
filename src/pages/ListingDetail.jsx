import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { MapPin, ChevronLeft, Heart } from "lucide-react";
import { equipmentService } from "../services/equipmentService";
import { bookingService } from "../services/bookingService";
import { reviewService } from "../services/reviewService";
import StarRating from "../components/StarRating";
import ReviewCard from "../components/ReviewCard";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../hooks/useAuth";

function isDateBooked(dateObj, bookedRanges) {
  const dateStr = dateObj.toISOString().split("T")[0];
  return bookedRanges.some((r) => dateStr >= r.start_date && dateStr <= r.end_date);
}

function AvailabilityCalendar({ bookedRanges }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const monthName = today.toLocaleString("default", { month: "long" });

  return (
    <div className="mt-3">
      <div className="text-[13px] font-medium text-ink-muted mb-3 text-center">{monthName} {year}</div>
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
          <div key={d} className="text-xs text-ink-muted font-medium">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
          const dateObj = new Date(year, month, d);
          const isBooked = isDateBooked(dateObj, bookedRanges);
          const isToday = d === today.getDate();
          return (
            <div key={d}
              className={`w-7 h-7 mx-auto flex items-center justify-center rounded-full text-xs ${
                isBooked
                  ? "bg-divider text-ink-faint line-through"
                  : isToday
                  ? "border-2 border-orange text-ink"
                  : "text-ink"
              }`}>
              {d}
            </div>
          );
        })}
      </div>
      <div className="flex gap-4 mt-3">
        <div className="flex items-center gap-1.5 text-[11px] text-ink-muted">
          <div className="w-3 h-3 rounded-[3px] bg-white border border-border" /> Available
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-ink-muted">
          <div className="w-3 h-3 rounded-[3px] bg-divider" /> Booked
        </div>
      </div>
    </div>
  );
}

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [eq, setEq] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [mainPhoto, setMainPhoto] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reviews, setReviews] = useState([]);
  const [bookedRanges, setBookedRanges] = useState([]);
  const { isWishlisted, toggleWishlist } = useWishlist();

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    equipmentService.getById(id).then(setEq).catch(() => setLoadError("Could not load this listing."));
    reviewService.getForEquipment(id).then(setReviews).catch(() => setReviews([]));
    bookingService.getForEquipment(id).then(setBookedRanges).catch(() => setBookedRanges([]));
  }, [id]);

  if (loadError) {
    return <div className="pt-[88px] px-6 text-center text-ink-muted">{loadError}</div>;
  }
  if (!eq) {
    return <div className="pt-[88px] px-6 text-center text-ink-muted">Loading…</div>;
  }

  const saved = isWishlisted(eq.id);
  const isOwnEquipment = user && eq.owner_id === user.id;
  const photos = (eq.equipment_photos || []).slice().sort((a, b) => a.sort_order - b.sort_order);
  const photoUrls = photos.map((p) => p.url);

  const activeBooking = bookedRanges.find(
    (r) => r.status === "confirmed" && r.start_date <= today && today <= r.end_date
  );

  const days = startDate && endDate
    ? Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000))
    : 0;
  const subtotal = days * eq.price_day;
  const downpayment = Math.round(subtotal * 0.25);
  const remaining = subtotal - downpayment;

  const listedDate = eq.created_at
    ? new Date(eq.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : "";

  return (
    <div className="min-h-screen bg-page pt-20 pb-8 px-4 sm:px-6">
      <div className="max-w-[1100px] mx-auto">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-ink-muted bg-transparent border-none cursor-pointer mb-5">
          <ChevronLeft size={16} /> Back to listings
        </button>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="flex-1 min-w-0">
            <div className="rounded-xl overflow-hidden h-[320px] sm:h-[380px] bg-peach">
              {photoUrls[mainPhoto] && (
                <img src={photoUrls[mainPhoto]} alt={eq.name} className="w-full h-full object-cover" />
              )}
            </div>
            {photoUrls.length > 1 && (
              <div className="flex gap-2 mt-2">
                {photoUrls.map((t, i) => (
                  <button key={i} onClick={() => setMainPhoto(i)}
                    className={`w-20 h-[60px] rounded-lg overflow-hidden shrink-0 p-0 cursor-pointer border-2 ${
                      i === mainPhoto ? "border-orange" : "border-transparent"
                    }`}>
                    <img src={t} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="mt-5">
              <div className="flex gap-2">
                <span className="text-[11px] font-medium px-2.5 py-[3px] rounded-full bg-green-tint text-green-dark">
                  {eq.category}
                </span>
                <span className="text-[11px] px-2.5 py-[3px] rounded-full bg-page text-ink-muted">
                  {eq.condition} condition
                </span>
                {activeBooking && (
                  <span className="text-[11px] font-medium px-2.5 py-[3px] rounded-full bg-red-tint text-red">
                    Unavailable
                  </span>
                )}
              </div>
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-[24px] font-medium text-ink mt-3">{eq.name}</h1>
                <button onClick={() => toggleWishlist(eq.id)}
                  aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
                  aria-pressed={saved}
                  className={`flex items-center gap-1.5 mt-3 px-3.5 py-2 rounded-lg border bg-white text-[13px] font-medium shrink-0 cursor-pointer ${
                    saved ? "text-red border-border/50" : "text-ink-muted border-border/50"
                  }`}>
                  <Heart size={16} fill={saved ? "#EF4444" : "none"} stroke={saved ? "#EF4444" : "#555555"} />
                  {saved ? "Saved" : "Save"}
                </button>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <MapPin size={14} className="text-ink-muted" />
                <span className="text-sm text-ink-muted">{eq.location}</span>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-base font-medium text-ink mb-2">About this equipment</h3>
              <p className="text-sm text-ink leading-relaxed">{eq.description}</p>
            </div>

            <div className="mt-6">
              <h3 className="text-base font-medium text-ink mb-3">Details</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Price per day", value: `K${eq.price_day.toLocaleString()}` },
                  { label: "Price per week", value: eq.price_week ? `K${eq.price_week.toLocaleString()}` : "—" },
                  { label: "Condition", value: eq.condition },
                  { label: "Category", value: eq.category },
                  { label: "Pickup location", value: eq.pickup_address },
                  { label: "Listed since", value: listedDate },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="text-xs font-medium text-ink-muted uppercase tracking-[0.05em]">{label}</div>
                    <div className="text-sm font-medium text-ink mt-0.5">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-base font-medium text-ink mb-2">Availability</h3>
              <AvailabilityCalendar bookedRanges={bookedRanges} />
            </div>

            <div className="mt-6">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-base font-medium text-ink">Reviews</h3>
                <StarRating rating={eq.rating} />
                <span className="text-sm font-medium text-ink">{eq.rating}</span>
                <span className="text-[13px] text-ink-muted">({eq.review_count} reviews)</span>
              </div>
              {reviews.length === 0 ? (
                <p className="text-sm text-ink-muted">No reviews yet.</p>
              ) : (
                reviews.map((r) => (
                  <ReviewCard key={r.id} review={{
                    id: r.id,
                    name: r.reviewer?.name,
                    photo: r.reviewer?.photo_url,
                    date: new Date(r.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" }),
                    rating: r.rating,
                    text: r.text,
                    reply: r.owner_reply,
                  }} />
                ))
              )}
            </div>
          </div>

          <div className="w-full lg:w-[340px] shrink-0 lg:sticky lg:top-20">
            <div className="bg-white border border-border/50 rounded-xl p-5">
              <div className="flex items-baseline gap-1">
                <span className="text-[24px] font-medium text-orange">K{eq.price_day.toLocaleString()}</span>
                <span className="text-sm text-ink-muted">/ day</span>
              </div>
              {eq.price_week && (
                <div className="text-[13px] text-ink-muted mt-1">K{eq.price_week.toLocaleString()} / week</div>
              )}

              {isOwnEquipment && (
                <div className="mt-3 bg-red-tint rounded-lg px-3 py-2.5 text-xs text-red">
                  This is your own listing.
                </div>
              )}

              <div className="border-t border-border my-4" />

              <label className="text-[13px] font-medium text-ink">Select dates</label>
              <div className="flex items-center gap-2 mt-2">
                <input type="date" value={startDate} min={today}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex-1 h-10 px-2 text-[13px] border border-border/50 rounded-lg outline-none" />
                <span className="text-ink-muted">→</span>
                <input type="date" value={endDate} min={startDate || today}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1 h-10 px-2 text-[13px] border border-border/50 rounded-lg outline-none" />
              </div>

              {days > 0 && (
                <div className="mt-3 bg-page rounded-lg p-3 text-[13px] text-ink flex flex-col gap-1">
                  <div>{days} days × K{eq.price_day.toLocaleString()} = K{subtotal.toLocaleString()}</div>
                  <div>Down payment due now: <strong>K{downpayment.toLocaleString()}</strong></div>
                  <div className="text-xs text-ink-muted">Remaining balance at pickup: K{remaining.toLocaleString()}</div>
                </div>
              )}

              {!isOwnEquipment && !activeBooking && (
                <Link to={`/listings/${eq.id}/book`}
                  className="block w-full h-12 rounded-lg bg-orange text-white text-[15px] font-medium text-center leading-[48px] no-underline mt-4">
                  Book Now
                </Link>
              )}
              {activeBooking && (
                <div className="mt-4 bg-red-tint rounded-lg px-3 py-3 text-[13px] text-red text-center">
                  Currently unavailable — booked until {new Date(activeBooking.end_date).toLocaleDateString()}
                </div>
              )}
              <p className="text-center text-xs text-ink-muted mt-2">You won't be charged yet</p>

              <div className="border-t border-border my-4" />

              <div className="flex items-start gap-3">
                <img src={eq.owner?.photo_url} alt={eq.owner?.name}
                  className="w-11 h-11 rounded-full object-cover shrink-0" />
                <div>
                  <div className="text-sm font-medium text-ink">{eq.owner?.name}</div>
                </div>
              </div>

              <Link to="/messages"
                className="block w-full h-10 rounded-lg border border-orange text-orange text-sm font-medium text-center leading-[40px] no-underline mt-3">
                Message Owner
              </Link>
              {eq.owner?.id && (
                <Link to={`/profile/${eq.owner.id}`}
                  className="block text-center text-[13px] text-green no-underline mt-2">
                  View Owner Profile
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

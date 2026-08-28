// FILE: agrorent/src/pages/ListingDetail.jsx
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { MapPin, ChevronLeft, Heart } from "lucide-react";
import { equipmentService } from "../services/equipmentService";
import StarRating from "../components/StarRating";
import ReviewCard from "../components/ReviewCard";
import { useWishlist } from "../context/WishlistContext";

function AvailabilityCalendar() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const booked = [5, 6, 7, 12, 13, 14, 22, 23];
  const monthName = today.toLocaleString("default", { month: "long" });

  return (
    <div style={{ marginTop: "12px" }}>
      <div style={{ fontSize: "13px", fontWeight: 500, color: "#555555", marginBottom: "12px", textAlign: "center" }}>{monthName} {year}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", textAlign: "center", marginBottom: "6px" }}>
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
          <div key={d} style={{ fontSize: "12px", color: "#555555", fontWeight: 500 }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", textAlign: "center" }}>
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
          const isBooked = booked.includes(d);
          const isToday = d === today.getDate();
          return (
            <div key={d} style={{ width: "28px", height: "28px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", fontSize: "12px", backgroundColor: isBooked ? "#E5E5E5" : "transparent", color: isBooked ? "#999999" : "#111111", textDecoration: isBooked ? "line-through" : "none", border: isToday ? "2px solid #FF5C00" : "none" }}>
              {d}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: "16px", marginTop: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#555555" }}>
          <div style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "#FFFFFF", border: "1px solid #E0E8E3" }} /> Available
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#555555" }}>
          <div style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "#E5E5E5" }} /> Booked
        </div>
      </div>
    </div>
  );
}

// TODO: still static — wire up reviewService.getForEquipment(eq.id) in a later step
const MOCK_REVIEWS = [
  { id: 1, name: "Kalinda Mutale", photo: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64&h=64&fit=crop", date: "January 2025", rating: 5, text: "Excellent tractor, very well maintained. The owner was very helpful and flexible with the pickup time. Would rent again!", reply: "Thank you so much! It was a pleasure working with you." },
  { id: 2, name: "Bupe Siwale", photo: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=64&h=64&fit=crop", date: "December 2024", rating: 4, text: "Good equipment and fair price. Minor issue but the owner sorted it quickly.", reply: null },
];

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [eq, setEq] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [mainPhoto, setMainPhoto] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { isWishlisted, toggleWishlist } = useWishlist();

  useEffect(() => {
    equipmentService
      .getById(id)
      .then(setEq)
      .catch(() => setLoadError("Could not load this listing."));
  }, [id]);

  if (loadError) {
    return <div style={{ padding: "88px 24px", textAlign: "center" }}>{loadError}</div>;
  }
  if (!eq) {
    return <div style={{ padding: "88px 24px", textAlign: "center" }}>Loading…</div>;
  }

  const saved = isWishlisted(eq.id);
  const photos = (eq.equipment_photos || []).slice().sort((a, b) => a.sort_order - b.sort_order);
  const photoUrls = photos.map((p) => p.url);

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
    <div style={{ backgroundColor: "#F5F5F0", minHeight: "100vh", padding: "80px 24px 32px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

        <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "14px", color: "#555555", background: "none", border: "none", cursor: "pointer", marginBottom: "20px" }}>
          <ChevronLeft size={16} /> Back to listings
        </button>

        <div style={{ display: "flex", gap: "32px", alignItems: "flex-start" }}>

          {/* LEFT COLUMN */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Gallery */}
            <div style={{ borderRadius: "12px", overflow: "hidden", height: "380px", backgroundColor: "#FFF0E6" }}>
              {photoUrls[mainPhoto] && (
                <img src={photoUrls[mainPhoto]} alt={eq.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              )}
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
              {photoUrls.map((t, i) => (
                <button key={i} onClick={() => setMainPhoto(i)} style={{ width: "80px", height: "60px", borderRadius: "8px", overflow: "hidden", border: i === mainPhoto ? "2px solid #FF5C00" : "2px solid transparent", flexShrink: 0, padding: 0, cursor: "pointer" }}>
                  <img src={t} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </button>
              ))}
            </div>

            {/* Info */}
            <div style={{ marginTop: "20px" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: 500, padding: "3px 10px", borderRadius: "20px", backgroundColor: "#D4EDDA", color: "#0F3D1E" }}>{eq.category}</span>
                <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "20px", backgroundColor: "#F5F5F0", color: "#555555" }}>{eq.condition} condition</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                <h1 style={{ fontSize: "24px", fontWeight: 500, color: "#111111", marginTop: "12px" }}>{eq.name}</h1>
                <button
                  onClick={() => toggleWishlist(eq.id)}
                  aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
                  aria-pressed={saved}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginTop: "12px",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    border: "0.5px solid #E0E8E3",
                    backgroundColor: "#FFFFFF",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: saved ? "#EF4444" : "#555555",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  <Heart size={16} fill={saved ? "#EF4444" : "none"} stroke={saved ? "#EF4444" : "#555555"} />
                  {saved ? "Saved" : "Save"}
                </button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px" }}>
                <MapPin size={14} style={{ color: "#555555" }} />
                <span style={{ fontSize: "14px", color: "#555555" }}>{eq.location}</span>
              </div>
            </div>

            {/* Description */}
            <div style={{ marginTop: "24px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 500, color: "#111111", marginBottom: "8px" }}>About this equipment</h3>
              <p style={{ fontSize: "14px", color: "#111111", lineHeight: 1.6 }}>{eq.description}</p>
            </div>

            {/* Details grid */}
            <div style={{ marginTop: "24px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 500, color: "#111111", marginBottom: "12px" }}>Details</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {[
                  { label: "Price per day", value: `K${eq.price_day.toLocaleString()}` },
                  { label: "Price per week", value: eq.price_week ? `K${eq.price_week.toLocaleString()}` : "—" },
                  { label: "Condition", value: eq.condition },
                  { label: "Category", value: eq.category },
                  { label: "Pickup location", value: eq.pickup_address },
                  { label: "Listed since", value: listedDate },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div style={{ fontSize: "12px", fontWeight: 500, color: "#555555", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                    <div style={{ fontSize: "14px", fontWeight: 500, color: "#111111", marginTop: "2px" }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div style={{ marginTop: "24px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 500, color: "#111111", marginBottom: "8px" }}>Availability</h3>
              <AvailabilityCalendar />
            </div>

            {/* Reviews */}
            <div style={{ marginTop: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 500, color: "#111111" }}>Reviews</h3>
                <StarRating rating={eq.rating} />
                <span style={{ fontSize: "14px", fontWeight: 500, color: "#111111" }}>{eq.rating}</span>
                <span style={{ fontSize: "13px", color: "#555555" }}>({eq.review_count} reviews)</span>
              </div>
              {MOCK_REVIEWS.map(r => (
                <ReviewCard key={r.id} review={r} />
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN — Booking card */}
          <div style={{ width: "340px", flexShrink: 0, position: "sticky", top: "80px" }}>
            <div style={{ backgroundColor: "#FFFFFF", border: "0.5px solid #E0E8E3", borderRadius: "12px", padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                <span style={{ fontSize: "24px", fontWeight: 500, color: "#FF5C00" }}>K{eq.price_day.toLocaleString()}</span>
                <span style={{ fontSize: "14px", color: "#555555" }}>/ day</span>
              </div>
              {eq.price_week && (
                <div style={{ fontSize: "13px", color: "#555555", marginTop: "4px" }}>K{eq.price_week.toLocaleString()} / week</div>
              )}

              <div style={{ borderTop: "1px solid #E0E8E3", margin: "16px 0" }} />

              <label style={{ fontSize: "13px", fontWeight: 500, color: "#111111" }}>Select dates</label>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ flex: 1, height: "40px", padding: "0 8px", fontSize: "13px", border: "1.5px solid #E0E8E3", borderRadius: "8px", outline: "none" }} />
                <span style={{ color: "#555555" }}>→</span>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ flex: 1, height: "40px", padding: "0 8px", fontSize: "13px", border: "1.5px solid #E0E8E3", borderRadius: "8px", outline: "none" }} />
              </div>

              {days > 0 && (
                <div style={{ marginTop: "12px", backgroundColor: "#F5F5F0", borderRadius: "8px", padding: "12px", fontSize: "13px", color: "#111111", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div>{days} days × K{eq.price_day.toLocaleString()} = K{subtotal.toLocaleString()}</div>
                  <div>Down payment due now: <strong>K{downpayment.toLocaleString()}</strong></div>
                  <div style={{ fontSize: "12px", color: "#555555" }}>Remaining balance at pickup: K{remaining.toLocaleString()}</div>
                </div>
              )}

              <Link to={`/listings/${eq.id}/book`} style={{ display: "block", width: "100%", height: "48px", borderRadius: "8px", backgroundColor: "#FF5C00", color: "#FFFFFF", fontSize: "15px", fontWeight: 500, textAlign: "center", lineHeight: "48px", textDecoration: "none", marginTop: "16px" }}>
                Book Now
              </Link>
              <p style={{ textAlign: "center", fontSize: "12px", color: "#555555", marginTop: "8px" }}>You won't be charged yet</p>

              <div style={{ borderTop: "1px solid #E0E8E3", margin: "16px 0" }} />

              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <img src={eq.owner?.photo_url} alt={eq.owner?.name} style={{ width: "44px", height: "44px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 500, color: "#111111" }}>{eq.owner?.name}</div>
                </div>
              </div>

              <Link to="/messages" style={{ display: "block", width: "100%", height: "40px", borderRadius: "8px", border: "1.5px solid #FF5C00", color: "#FF5C00", fontSize: "14px", fontWeight: 500, textAlign: "center", lineHeight: "40px", textDecoration: "none", marginTop: "12px" }}>
                Message Owner
              </Link>
              {eq.owner?.id && (
                <Link to={`/profile/${eq.owner.id}`} style={{ display: "block", textAlign: "center", fontSize: "13px", color: "#1A5C2E", textDecoration: "none", marginTop: "8px" }}>
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
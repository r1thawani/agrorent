import { useParams, Link } from "react-router-dom";
import { MapPin, Star } from "lucide-react";
import EquipmentCard from "../components/EquipmentCard";
import { EQUIPMENT } from "../data/mockData";

// Local sample data - reviews aren't modeled per-owner in mockData.js yet (only
// aggregate rating/reviews count on the owner object). Kept local to this file,
// same "local until a second consumer needs it" convention as PENDING_REQUESTS
// was before 4E promoted it. Flag to the person if a shared REVIEWS export is
// wanted later.
const SAMPLE_REVIEWS = [
  {
    id: 1,
    name: "Bupe Siwale",
    photo: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=64&h=64&fit=crop",
    date: "January 2025",
    rating: 5,
    text: "Excellent service. Equipment was exactly as described.",
    reply: null,
  },
  {
    id: 2,
    name: "Kalinda Nkonde",
    photo: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64&h=64&fit=crop",
    date: "December 2024",
    rating: 4,
    text: "Good experience overall. Would rent again.",
    reply: "Thank you, Kalinda!",
  },
];

export default function PublicProfile() {
  const { id } = useParams();
  const listings = EQUIPMENT.filter((eq) => eq.owner.id === id);
  const owner = listings.length > 0 ? listings[0].owner : null;

  if (!owner) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#F5F5F0",
          paddingTop: "56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "18px", fontWeight: 500, color: "#111111", marginBottom: "8px" }}>
            Profile not found
          </div>
          <p style={{ fontSize: "14px", color: "#555555", marginBottom: "16px" }}>
            We couldn't find an owner matching this profile.
          </p>
          <Link
            to="/listings"
            style={{
              display: "inline-block",
              padding: "10px 24px",
              borderRadius: "8px",
              backgroundColor: "#FF5C00",
              color: "#FFFFFF",
              fontSize: "14px",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Browse Equipment
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#F5F5F0", minHeight: "100vh", paddingTop: "56px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 16px" }}>
        {/* Profile header */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            padding: "28px",
            marginBottom: "28px",
            border: "0.5px solid #E0E8E3",
          }}
        >
          <div style={{ display: "flex", gap: "24px" }}>
            <img
              src={owner.photo}
              alt={owner.name}
              style={{ width: "96px", height: "96px", borderRadius: "9999px", objectFit: "cover", flexShrink: 0 }}
            />
            <div>
              <h1 style={{ fontSize: "22px", fontWeight: 500, color: "#111111" }}>{owner.name}</h1>
              <div style={{ fontSize: "13px", color: "#555555", marginTop: "2px" }}>
                Member since {owner.since}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", color: "#555555", marginTop: "2px" }}>
                <MapPin size={12} /> {listings[0].location}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px" }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={14}
                    fill={s <= Math.round(owner.rating) ? "#FF5C00" : "none"}
                    stroke={s <= Math.round(owner.rating) ? "#FF5C00" : "#cccccc"}
                  />
                ))}
                <span style={{ fontSize: "15px", fontWeight: 500, color: "#111111" }}>{owner.rating}</span>
                <span style={{ fontSize: "13px", color: "#555555" }}>({owner.reviews} reviews)</span>
              </div>
              <p style={{ fontSize: "14px", color: "#111111", marginTop: "12px", lineHeight: 1.6, maxWidth: "480px" }}>
                {owner.name} is an experienced equipment owner on AgroRent, listing{" "}
                {listings.length} {listings.length === 1 ? "piece" : "pieces"} of equipment for
                rent to farmers across Zambia.
              </p>
            </div>
          </div>
        </div>

        {/* Listings */}
        <h2 style={{ fontSize: "18px", fontWeight: 500, color: "#111111", marginBottom: "16px" }}>
          Equipment by {owner.name}
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "20px",
            marginBottom: "28px",
          }}
        >
          {listings.map((eq) => (
            <EquipmentCard key={eq.id} {...eq} />
          ))}
        </div>

        {/* Reviews */}
        <h2 style={{ fontSize: "18px", fontWeight: 500, color: "#111111", marginBottom: "16px" }}>
          Reviews{" "}
          <span style={{ fontSize: "14px", fontWeight: 400, color: "#555555" }}>
            — avg {owner.rating} ({owner.reviews})
          </span>
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {SAMPLE_REVIEWS.map((r) => (
            <div
              key={r.id}
              style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", padding: "16px", border: "0.5px solid #E0E8E3" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <img src={r.photo} alt={r.name} style={{ width: "32px", height: "32px", borderRadius: "9999px", objectFit: "cover" }} />
                  <span style={{ fontSize: "14px", fontWeight: 500, color: "#111111" }}>{r.name}</span>
                </div>
                <span style={{ fontSize: "12px", color: "#555555" }}>{r.date}</span>
              </div>
              <div style={{ display: "flex", gap: "2px", marginBottom: "8px" }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={13}
                    fill={s <= r.rating ? "#FF5C00" : "none"}
                    stroke={s <= r.rating ? "#FF5C00" : "#cccccc"}
                  />
                ))}
              </div>
              <p style={{ fontSize: "14px", color: "#111111", lineHeight: 1.6 }}>{r.text}</p>
              {r.reply && (
                <div style={{ marginTop: "12px", paddingLeft: "12px", borderLeft: "3px solid #1A5C2E" }}>
                  <div style={{ fontSize: "12px", fontWeight: 500, color: "#1A5C2E" }}>Owner reply:</div>
                  <p style={{ fontSize: "14px", color: "#111111", marginTop: "2px" }}>{r.reply}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

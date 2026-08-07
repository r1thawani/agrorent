import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { MapPin, Star, ChevronLeft } from "lucide-react";
import { EQUIPMENT } from "../data/mockData";

function StarRating({ rating }) {
  return (
    <div style={{ display: "flex", gap: "2px" }}>
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} size={14} fill={s <= Math.round(rating) ? "#FF5C00" : "none"} stroke={s <= Math.round(rating) ? "#FF5C00" : "#ccc"} />
      ))}
    </div>
  );
}

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

const MOCK_REVIEWS = [
  { id: 1, name: "Kalinda Mutale", photo: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64&h=64&fit=crop", date: "January 2025", rating: 5, text: "Excellent tractor, very well maintained. The owner was very helpful and flexible with the pickup time. Would rent again!", reply: "Thank you so much! It was a pleasure working with you." },
  { id: 2, name: "Bupe Siwale", photo: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=64&h=64&fit=crop", date: "December 2024", rating: 4, text: "Good equipment and fair price. Minor issue but the owner sorted it quickly.", reply: null },
];

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const eq = EQUIPMENT.find(e => e.id === id) || EQUIPMENT[0];
  const [mainPhoto, setMainPhoto] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const days = startDate && endDate
    ? Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000))
    : 0;
  const subtotal = days * eq.priceDay;
  const downpayment = Math.round(subtotal * 0.25);
  const remaining = subtotal - downpayment;

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
              <img src={eq.thumbnails[mainPhoto]} alt={eq.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
              {eq.thumbnails.map((t, i) => (
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
              <h1 style={{ fontSize: "24px", fontWeight: 500, color: "#111111", marginTop: "12px" }}>{eq.name}</h1>
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
                  { label: "Price per day", value: `K${eq.priceDay.toLocaleString()}` },
                  { label: "Price per week", value: `K${eq.priceWeek.toLocaleString()}` },
                  { label: "Condition", value: eq.condition },
                  { label: "Category", value: eq.category },
                  { label: "Pickup location", value: eq.pickup },
                  { label: "Listed since", value: eq.listed },
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
                <span style={{ fontSize: "13px", color: "#555555" }}>({eq.reviews} reviews)</span>
              </div>
              {MOCK_REVIEWS.map(r => (
                <div key={r.id} style={{ backgroundColor: "#FFFFFF", border: "0.5px solid #E0E8E3", borderRadius: "12px", padding: "16px", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <img src={r.photo} alt={r.name} style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }} />
                      <span style={{ fontSize: "14px", fontWeight: 500, color: "#111111" }}>{r.name}</span>
                    </div>
                    <span style={{ fontSize: "12px", color: "#555555" }}>{r.date}</span>
                  </div>
                  <StarRating rating={r.rating} />
                  <p style={{ fontSize: "14px", color: "#111111", marginTop: "8px", lineHeight: 1.6 }}>{r.text}</p>
                  {r.reply && (
                    <div style={{ marginTop: "12px", paddingLeft: "12px", borderLeft: "3px solid #1A5C2E" }}>
                      <div style={{ fontSize: "12px", fontWeight: 500, color: "#1A5C2E" }}>Owner reply:</div>
                      <p style={{ fontSize: "14px", color: "#111111", marginTop: "4px" }}>{r.reply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN — Booking card */}
          <div style={{ width: "340px", flexShrink: 0, position: "sticky", top: "80px" }}>
            <div style={{ backgroundColor: "#FFFFFF", border: "0.5px solid #E0E8E3", borderRadius: "12px", padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                <span style={{ fontSize: "24px", fontWeight: 500, color: "#FF5C00" }}>K{eq.priceDay.toLocaleString()}</span>
                <span style={{ fontSize: "14px", color: "#555555" }}>/ day</span>
              </div>
              <div style={{ fontSize: "13px", color: "#555555", marginTop: "4px" }}>K{eq.priceWeek.toLocaleString()} / week</div>

              <div style={{ borderTop: "1px solid #E0E8E3", margin: "16px 0" }} />

              <label style={{ fontSize: "13px", fontWeight: 500, color: "#111111" }}>Select dates</label>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ flex: 1, height: "40px", padding: "0 8px", fontSize: "13px", border: "1.5px solid #E0E8E3", borderRadius: "8px", outline: "none" }} />
                <span style={{ color: "#555555" }}>→</span>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ flex: 1, height: "40px", padding: "0 8px", fontSize: "13px", border: "1.5px solid #E0E8E3", borderRadius: "8px", outline: "none" }} />
              </div>

              {days > 0 && (
                <div style={{ marginTop: "12px", backgroundColor: "#F5F5F0", borderRadius: "8px", padding: "12px", fontSize: "13px", color: "#111111", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div>{days} days × K{eq.priceDay.toLocaleString()} = K{subtotal.toLocaleString()}</div>
                  <div>Down payment due now: <strong>K{downpayment.toLocaleString()}</strong></div>
                  <div style={{ fontSize: "12px", color: "#555555" }}>Remaining balance at pickup: K{remaining.toLocaleString()}</div>
                </div>
              )}

              <Link to={`/book/${eq.id}`} style={{ display: "block", width: "100%", height: "48px", borderRadius: "8px", backgroundColor: "#FF5C00", color: "#FFFFFF", fontSize: "15px", fontWeight: 500, textAlign: "center", lineHeight: "48px", textDecoration: "none", marginTop: "16px" }}>
                Book Now
              </Link>
              <p style={{ textAlign: "center", fontSize: "12px", color: "#555555", marginTop: "8px" }}>You won't be charged yet</p>

              <div style={{ borderTop: "1px solid #E0E8E3", margin: "16px 0" }} />

              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <img src={eq.owner.photo} alt={eq.owner.name} style={{ width: "44px", height: "44px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 500, color: "#111111" }}>{eq.owner.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                    <StarRating rating={eq.owner.rating} />
                    <span style={{ fontSize: "12px", color: "#555555" }}>({eq.owner.reviews})</span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#555555", marginTop: "2px" }}>Member since {eq.owner.since}</div>
                </div>
              </div>

              <Link to="/messages" style={{ display: "block", width: "100%", height: "40px", borderRadius: "8px", border: "1.5px solid #FF5C00", color: "#FF5C00", fontSize: "14px", fontWeight: 500, textAlign: "center", lineHeight: "40px", textDecoration: "none", marginTop: "12px" }}>
                Message Owner
              </Link>
              <Link to={`/profile/${eq.owner.id}`} style={{ display: "block", textAlign: "center", fontSize: "13px", color: "#1A5C2E", textDecoration: "none", marginTop: "8px" }}>
                View Owner Profile
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
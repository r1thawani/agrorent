import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Star } from "lucide-react";
import { BOOKINGS } from "../data/mockData";

const LABELS = { 1: "Poor", 2: "Fair", 3: "Good", 4: "Very good", 5: "Excellent" };

export default function LeaveReview() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const booking = BOOKINGS.find((b) => b.id === bookingId);

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    // No backend yet — nothing to persist, just return the renter to their bookings.
    navigate("/my-bookings");
  }

  if (!booking) {
    return (
      <div
        style={{
          backgroundColor: "#F5F5F0",
          minHeight: "100vh",
          padding: "48px 16px",
        }}
      >
        <div
          style={{
            maxWidth: "560px",
            margin: "0 auto",
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            padding: "40px",
            textAlign: "center",
            border: "0.5px solid #E0E8E3",
          }}
        >
          <p style={{ fontSize: "14px", color: "#555555", marginBottom: "16px" }}>
            We couldn't find that booking.
          </p>
          <Link
            to="/my-bookings"
            style={{ fontSize: "14px", fontWeight: 500, color: "#FF5C00", textDecoration: "none" }}
          >
            Back to My Bookings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#F5F5F0", minHeight: "100vh", padding: "48px 16px" }}>
      <div style={{ maxWidth: "560px", margin: "0 auto" }}>
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            padding: "32px",
            border: "0.5px solid #E0E8E3",
          }}
        >
          <img
            src={booking.equipmentImage}
            alt={booking.equipment}
            style={{
              width: "100%",
              height: "160px",
              borderRadius: "8px",
              objectFit: "cover",
              marginBottom: "16px",
            }}
          />
          <h2 style={{ fontSize: "18px", fontWeight: 500, color: "#111111" }}>
            {booking.equipment}
          </h2>
          <p style={{ fontSize: "13px", color: "#555555", marginTop: "2px" }}>
            Rented {booking.startDate} – {booking.endDate}
          </p>

          <div style={{ margin: "20px 0", borderTop: "1px solid #E0E8E3" }} />

          <form onSubmit={handleSubmit}>
            <div style={{ fontSize: "15px", fontWeight: 500, color: "#111111", marginBottom: "12px" }}>
              How would you rate this equipment?
            </div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  onMouseEnter={() => setHover(s)}
                  onMouseLeave={() => setHover(0)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  <Star
                    size={36}
                    fill={s <= (hover || rating) ? "#FF5C00" : "none"}
                    stroke={s <= (hover || rating) ? "#FF5C00" : "#E0E8E3"}
                  />
                </button>
              ))}
            </div>
            {(hover || rating) > 0 && (
              <p style={{ fontSize: "13px", color: "#555555", marginBottom: "16px" }}>
                {LABELS[hover || rating]}
              </p>
            )}

            <div style={{ marginTop: "24px" }}>
              <div style={{ fontSize: "15px", fontWeight: 500, color: "#111111", marginBottom: "8px" }}>
                Write your review
              </div>
              <div style={{ position: "relative" }}>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, 500))}
                  rows={6}
                  placeholder="Describe your experience — was the equipment in good condition? Was the owner helpful? Would you recommend this to others?"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    fontSize: "14px",
                    border: "0.5px solid #E0E8E3",
                    borderRadius: "8px",
                    outline: "none",
                    resize: "none",
                    minHeight: "140px",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
                <span
                  style={{
                    fontSize: "11px",
                    color: "#555555",
                    position: "absolute",
                    bottom: "8px",
                    right: "8px",
                  }}
                >
                  {text.length} / 500
                </span>
              </div>
            </div>

            <button
              type="submit"
              style={{
                width: "100%",
                height: "48px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#FF5C00",
                color: "#FFFFFF",
                fontSize: "15px",
                fontWeight: 500,
                marginTop: "32px",
                cursor: "pointer",
              }}
            >
              Submit review
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                width: "100%",
                textAlign: "center",
                background: "none",
                border: "none",
                fontSize: "13px",
                color: "#555555",
                marginTop: "10px",
                cursor: "pointer",
              }}
            >
              Skip for now
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

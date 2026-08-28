// FILE: agrorent/src/pages/LeaveReview.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Star } from "lucide-react";
import { bookingService } from "../services/bookingService";
import { reviewService } from "../services/reviewService";
import { useAuth } from "../hooks/useAuth";

const LABELS = { 1: "Poor", 2: "Fair", 3: "Good", 4: "Very good", 5: "Excellent" };

export default function LeaveReview() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [booking, setBooking] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    bookingService
      .getById(bookingId)
      .then(setBooking)
      .catch(() => setLoadError("We couldn't find that booking."));
  }, [bookingId]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!rating) {
      setSubmitError("Please select a star rating.");
      return;
    }
    setSubmitError("");
    setSubmitting(true);
    try {
      await reviewService.create({
        bookingId: booking.id,
        equipmentId: booking.equipment_id,
        reviewerId: user.id,
        rating,
        text,
      });
      navigate("/my-bookings");
    } catch (err) {
      setSubmitError(err.message || "Could not submit your review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <div style={{ backgroundColor: "#F5F5F0", minHeight: "100vh", padding: "48px 16px" }}>
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
            {loadError}
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

  if (!booking) {
    return (
      <div style={{ backgroundColor: "#F5F5F0", minHeight: "100vh", padding: "88px 16px", textAlign: "center", color: "#555555" }}>
        Loading…
      </div>
    );
  }

  const photoUrl = booking.equipment?.equipment_photos?.[0]?.url || "";

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
          {photoUrl && (
            <img
              src={photoUrl}
              alt={booking.equipment?.name}
              style={{
                width: "100%",
                height: "160px",
                borderRadius: "8px",
                objectFit: "cover",
                marginBottom: "16px",
              }}
            />
          )}
          <h2 style={{ fontSize: "18px", fontWeight: 500, color: "#111111" }}>
            {booking.equipment?.name}
          </h2>
          <p style={{ fontSize: "13px", color: "#555555", marginTop: "2px" }}>
            Rented {booking.start_date} – {booking.end_date}
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

            {submitError && (
              <p style={{ fontSize: "13px", color: "#A02020", marginTop: "16px" }}>{submitError}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
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
                cursor: submitting ? "default" : "pointer",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? "Submitting…" : "Submit review"}
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
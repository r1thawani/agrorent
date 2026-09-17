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
    bookingService.getById(bookingId)
      .then(setBooking)
      .catch(() => setLoadError("We couldn't find that booking."));
  }, [bookingId]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!rating) { setSubmitError("Please select a star rating."); return; }
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
      <div className="min-h-screen bg-page pt-12 px-4">
        <div className="max-w-[560px] mx-auto bg-white rounded-xl p-10 text-center border border-border/50">
          <p className="text-sm text-ink-muted mb-4">{loadError}</p>
          <Link to="/my-bookings" className="text-sm font-medium text-orange no-underline">
            Back to My Bookings
          </Link>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-page pt-[88px] text-center text-ink-muted">Loading…</div>
    );
  }

  const photoUrl = booking.equipment?.equipment_photos?.[0]?.url || "";

  return (
    <div className="min-h-screen bg-page px-4 py-12">
      <div className="max-w-[560px] mx-auto">
        <div className="bg-white rounded-xl p-8 border border-border/50">
          {photoUrl && (
            <img src={photoUrl} alt={booking.equipment?.name}
              className="w-full h-40 rounded-lg object-cover mb-4" />
          )}
          <h2 className="text-[18px] font-medium text-ink">{booking.equipment?.name}</h2>
          <p className="text-[13px] text-ink-muted mt-0.5">
            Rented {booking.start_date} – {booking.end_date}
          </p>

          <div className="my-5 border-t border-border" />

          <form onSubmit={handleSubmit}>
            <div className="text-[15px] font-medium text-ink mb-3">How would you rate this equipment?</div>
            <div className="flex gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} type="button"
                  onClick={() => setRating(s)}
                  onMouseEnter={() => setHover(s)}
                  onMouseLeave={() => setHover(0)}
                  className="bg-transparent border-none cursor-pointer p-0">
                  <Star size={36}
                    fill={s <= (hover || rating) ? "#FF5C00" : "none"}
                    stroke={s <= (hover || rating) ? "#FF5C00" : "#E0E8E3"} />
                </button>
              ))}
            </div>
            {(hover || rating) > 0 && (
              <p className="text-[13px] text-ink-muted mb-4">{LABELS[hover || rating]}</p>
            )}

            <div className="mt-6">
              <div className="text-[15px] font-medium text-ink mb-2">Write your review</div>
              <div className="relative">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, 500))}
                  rows={6}
                  placeholder="Describe your experience — was the equipment in good condition? Was the owner helpful? Would you recommend this to others?"
                  className="w-full px-3 py-2.5 text-sm text-ink border border-border/50 rounded-lg outline-none resize-none min-h-[140px] font-inherit box-border"
                />
                <span className="absolute bottom-2 right-2 text-[11px] text-ink-muted">
                  {text.length} / 500
                </span>
              </div>
            </div>

            {submitError && <p className="text-[13px] text-red mt-4">{submitError}</p>}

            <button type="submit" disabled={submitting}
              className={`w-full h-12 rounded-lg border-none bg-orange text-white text-[15px] font-medium mt-8 ${
                submitting ? "opacity-70 cursor-default" : "cursor-pointer"
              }`}>
              {submitting ? "Submitting…" : "Submit review"}
            </button>
            <button type="button" onClick={() => navigate(-1)}
              className="w-full text-center bg-transparent border-none text-[13px] text-ink-muted mt-2.5 cursor-pointer">
              Skip for now
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

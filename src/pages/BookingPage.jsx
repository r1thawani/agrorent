import { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { ChevronLeft, Send } from "lucide-react";
import { equipmentService } from "../services/equipmentService";
import { bookingService } from "../services/bookingService";
import { useAuth } from "../hooks/useAuth";
import Avatar from "../components/Avatar";
import { calculateDays } from "../utils/calculateDays";
import { calculateBooking } from "../utils/calculateBooking";
import { friendlyError } from "../utils/friendlyError";
import { formatDateRange } from "../utils/formatDate";

export default function BookingPage() {
  const { id } = useParams();
  // Dates already picked on the listing page arrive as ?start=…&end=…
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [eq, setEq] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [bookedRanges, setBookedRanges] = useState([]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    equipmentService.getById(id)
      .then((data) => {
        setEq(data);
        const defaultFrom = data.available_from && data.available_from > today ? data.available_from : today;
        const pickedStart = searchParams.get("start") || "";
        const pickedEnd = searchParams.get("end") || "";
        const validPick = pickedStart >= defaultFrom && pickedEnd > pickedStart;
        setStartDate(validPick ? pickedStart : defaultFrom);
        setEndDate(validPick ? pickedEnd : ""); // otherwise the renter picks their own end date
      })
      .catch(() => setLoadError("Could not load this listing."));
    bookingService.getForEquipment(id).then(setBookedRanges).catch(() => setBookedRanges([]));
  }, [id]);

  if (loadError) {
    return <div className="pt-[88px] px-4 text-center text-ink-muted">{loadError}</div>;
  }
  if (!eq) {
    return <div className="pt-[88px] px-4 text-center text-ink-muted">Loading…</div>;
  }

  const isOwnEquipment = user && eq.owner_id === user.id;
  const canBook = eq.is_available !== false && !eq.deleted_at;
  const photoUrl = eq.equipment_photos?.[0]?.url ?? "";
  const rawDays = calculateDays(startDate, endDate);
  const days = rawDays > 0 ? rawDays : 0;
  const { subtotal, fee, total, downPayment, balance } = calculateBooking(eq.price_day, days || 1);
  const minStartDate = eq.available_from && eq.available_from > today ? eq.available_from : today;

  function inputCls(field) {
    return `w-full h-11 px-3 text-sm text-ink rounded-lg outline-none box-border ${
      focusedField === field ? "border border-orange" : "border border-border/50"
    }`;
  }

  async function handleConfirm(e) {
    e.preventDefault();
    if (isOwnEquipment) { setError("You can't book your own equipment."); return; }
    if (!canBook) { setError("This equipment is not available for booking right now."); return; }
    if (!startDate || !endDate || rawDays < 1) { setError("Please choose a valid date range."); return; }
    if (startDate < today) { setError("Start date can't be in the past."); return; }
    const hasOverlap = bookedRanges.some((b) => startDate <= b.end_date && b.start_date <= endDate);
    if (hasOverlap) {
      setError("This equipment is already booked for part of your selected dates. Please choose different dates.");
      return;
    }
    if (!agreed) { setError("Please agree to the Terms of Service to continue."); return; }
    setError("");
    setSubmitting(true);
    try {
      await bookingService.create({
        equipmentId: eq.id,
        renterId: user.id,
        startDate,
        endDate,
      });
      navigate("/my-bookings", {
        state: { flash: `Request sent! We'll email you as soon as ${eq.owner?.name || "the owner"} responds.` },
      });
    } catch (err) {
      setError(friendlyError(err, "Something went wrong sending your request. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-page pt-[88px] pb-12 px-4">
      <div className="max-w-[900px] mx-auto">
        <Link to={`/listings/${eq.id}`}
          className="inline-flex items-center gap-1 text-[13px] text-ink-muted no-underline mb-4">
          <ChevronLeft size={14} /> Back to listing
        </Link>

        <h1 className="text-[26px] font-medium text-ink mb-4">Request to book</h1>

        {isOwnEquipment && (
          <div className="bg-red-tint border border-red rounded-lg px-4 py-4 mb-5 text-sm text-red">
            This is your own listing — you can't book it as a renter.
          </div>
        )}
        {!isOwnEquipment && !canBook && (
          <div className="bg-red-tint border border-red rounded-lg px-4 py-4 mb-5 text-sm text-red">
            This equipment is not available for booking right now.
          </div>
        )}

        <div className="flex flex-wrap gap-6">
          {/* Summary */}
          <div className="flex-[1_1_340px]">
            <div className="bg-white rounded-xl p-5 border border-border/50">
              <h2 className="text-base font-medium text-ink mb-4">Booking summary</h2>
              <img src={photoUrl} alt={eq.name}
                className="w-full h-40 rounded-lg object-cover mb-3" />
              <div className="text-base font-medium text-ink">{eq.name}</div>
              <div className="flex items-center gap-2 mt-1">
                <Avatar src={eq.owner?.photo_url} name={eq.owner?.name} className="w-6 h-6 text-[8px]" />
                <span className="text-[13px] text-ink-muted">by {eq.owner?.name}</span>
              </div>

              <div className="border-t border-border my-4" />

              <div className="flex flex-col gap-2.5">
                <div>
                  <label className="block text-xs text-ink-muted mb-1">Start date</label>
                  <input type="date" value={startDate} min={minStartDate} max={eq.available_until}
                    onChange={(e) => setStartDate(e.target.value)}
                    onFocus={() => setFocusedField("start")} onBlur={() => setFocusedField(null)}
                    className={inputCls("start")} />
                </div>
                <div>
                  <label className="block text-xs text-ink-muted mb-1">End date</label>
                  <input type="date" value={endDate} min={startDate || minStartDate} max={eq.available_until}
                    onChange={(e) => setEndDate(e.target.value)}
                    onFocus={() => setFocusedField("end")} onBlur={() => setFocusedField(null)}
                    className={inputCls("end")} />
                </div>
                {days > 0 ? (
                  <div className="text-sm text-ink">{days} day{days === 1 ? "" : "s"}</div>
                ) : (
                  <div className="text-sm text-ink-muted">Select an end date</div>
                )}
                {bookedRanges.length > 0 && (
                  <div className="text-xs text-ink-muted">
                    Already booked:{" "}
                    {bookedRanges.map((b) => formatDateRange(b.start_date, b.end_date)).join(", ")}
                  </div>
                )}
              </div>

              <div className="border-t border-border my-4" />

              {days > 0 ? (
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-ink">{days} day{days === 1 ? "" : "s"} × K{eq.price_day.toLocaleString()}</span>
                    <span>K{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-muted">Service fee (5%)</span>
                    <span className="text-ink-muted">K{fee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-base font-medium pt-2 border-t border-border">
                    <span>Total</span>
                    <span className="text-orange">K{total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-ink-muted">Deposit, paid after the owner accepts (25%)</span>
                    <span className="font-medium text-ink">K{downPayment.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-ink-muted">Balance due at pickup</span>
                    <span className="text-ink-muted">K{balance.toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-ink-muted text-center py-2">
                  Select your dates above to see pricing
                </div>
              )}
            </div>
          </div>

          {/* Request */}
          <div className="flex-[1_1_380px]">
            <form onSubmit={handleConfirm}>
              <div className={`bg-white rounded-xl p-5 border border-border/50 ${
                isOwnEquipment ? "opacity-50 pointer-events-none" : ""
              }`}>
                <h2 className="text-base font-medium text-ink mb-4">How booking works</h2>
                <ol className="flex flex-col gap-3 text-sm text-ink list-none p-0 m-0">
                  {[
                    ["Send a request", "No payment now. Other renters may ask for the same dates too."],
                    ["The owner accepts", "We'll email you and notify you here."],
                    ["Pay the 25% deposit", "Pay it within the time shown to confirm. The dates are only yours once it's paid."],
                    ["Pick up", "Pay the balance to the owner when you collect the equipment."],
                  ].map(([title, desc], i) => (
                    <li key={title} className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-orange-tint text-orange-dark text-xs font-medium flex items-center justify-center shrink-0">{i + 1}</span>
                      <span><span className="font-medium">{title}.</span> <span className="text-ink-muted">{desc}</span></span>
                    </li>
                  ))}
                </ol>

                <label className="flex items-start gap-2 mt-5 cursor-pointer">
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5" />
                  <span className="text-[13px] text-ink">
                    I agree to AgroRent's{" "}
                    <Link to="/terms" target="_blank" rel="noopener noreferrer"
                      className="text-green underline">Terms of Service</Link>{" "}
                    and rental agreement
                  </span>
                </label>

                {error && <div className="mt-3 text-[13px] text-red">{error}</div>}

                <button type="submit" disabled={submitting || isOwnEquipment || !canBook}
                  className={`w-full h-[52px] rounded-lg border-none bg-orange text-white text-[15px] font-medium mt-5 ${
                    submitting || isOwnEquipment || !canBook ? "opacity-70 cursor-default" : "cursor-pointer"
                  }`}>
                  {submitting ? "Sending..." : days > 0 ? (
                    <span className="inline-flex items-center gap-2"><Send size={16} /> Send booking request</span>
                  ) : "Select dates to continue"}
                </button>
                <p className="text-center text-xs text-ink-muted mt-2">You won't be charged yet</p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

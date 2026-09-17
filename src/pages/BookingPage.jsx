import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Lock, ChevronLeft } from "lucide-react";
import { equipmentService } from "../services/equipmentService";
import { bookingService } from "../services/bookingService";
import { paymentService } from "../services/paymentService";
import { useAuth } from "../hooks/useAuth";
import Avatar from "../components/Avatar";
import { calculateDays } from "../utils/calculateDays";
import { calculateBooking } from "../utils/calculateBooking";

const PAY_OPTIONS = [
  { id: "airtel", label: "Airtel Money", desc: "Pay with your Airtel Money number" },
  { id: "mtn", label: "MTN Mobile Money", desc: "Pay with your MTN Mobile Money number" },
  { id: "card", label: "Bank card", desc: "Visa or Mastercard" },
];

export default function BookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [eq, setEq] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [bookedRanges, setBookedRanges] = useState([]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [payMethod, setPayMethod] = useState("airtel");
  const [phone, setPhone] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
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
        setStartDate(defaultFrom);
        setEndDate(data.available_until ?? "");
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
  const photoUrl = eq.equipment_photos?.[0]?.url ?? "";
  const rawDays = calculateDays(startDate, endDate);
  const days = rawDays > 0 ? rawDays : 1;
  const { subtotal, fee, total, downPayment, balance } = calculateBooking(eq.price_day, days);
  const minStartDate = eq.available_from && eq.available_from > today ? eq.available_from : today;

  function inputCls(field) {
    return `w-full h-11 px-3 text-sm text-ink rounded-lg outline-none box-border ${
      focusedField === field ? "border border-orange" : "border border-border/50"
    }`;
  }

  async function handleConfirm(e) {
    e.preventDefault();
    if (isOwnEquipment) { setError("You can't book your own equipment."); return; }
    if (!startDate || !endDate || rawDays < 1) { setError("Please choose a valid date range."); return; }
    if (startDate < today) { setError("Start date can't be in the past."); return; }
    const hasOverlap = bookedRanges.some((b) => startDate <= b.end_date && b.start_date <= endDate);
    if (hasOverlap) {
      setError("This equipment is already booked for part of your selected dates. Please choose different dates.");
      return;
    }
    if ((payMethod === "airtel" || payMethod === "mtn") && !phone) {
      setError("Please enter your mobile money number.");
      return;
    }
    if (payMethod === "card") {
      if (!cardNumber || cardNumber.replace(/\s/g, "").length < 16) {
        setError("Please enter a valid 16-digit card number.");
        return;
      }
      if (!expiry || !/^\d{2}\/\d{2}$/.test(expiry)) {
        setError("Please enter a valid expiry date in MM/YY format.");
        return;
      }
      if (!cvv || cvv.length < 3) {
        setError("Please enter a valid CVV (3–4 digits).");
        return;
      }
    }
    if (!agreed) { setError("Please agree to the Terms of Service to continue."); return; }
    setError("");
    setSubmitting(true);
    try {
      const booking = await bookingService.create({
        equipmentId: eq.id,
        renterId: user.id,
        ownerId: eq.owner_id,
        priceDay: eq.price_day,
        startDate,
        endDate,
        totalDays: days,
      });
      await paymentService.chargeDownPayment({
        bookingId: booking.id,
        amount: downPayment,
        method: payMethod === "card" ? "card" : "mobile-money",
      });
      navigate(`/booking/${booking.id}/confirmation`, {
        state: {
          bookingRef: booking.id,
          equipment: eq.name,
          equipmentImage: photoUrl,
          ownerName: eq.owner?.name,
          ownerPhoto: eq.owner?.photo_url,
          pickup: eq.pickup_address,
          startDate,
          endDate,
          days,
          total,
          downPayment,
          balance,
        },
      });
    } catch (err) {
      setError(err.message || "Something went wrong confirming your booking. Please try again.");
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

        <h1 className="text-[26px] font-medium text-ink mb-4">Complete your booking</h1>

        {isOwnEquipment && (
          <div className="bg-red-tint border border-red rounded-lg px-4 py-4 mb-5 text-sm text-red">
            This is your own listing — you can't book it as a renter.
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
                <div className="text-sm text-ink">{days} day{days === 1 ? "" : "s"}</div>
              </div>

              <div className="border-t border-border my-4" />

              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink">{days} days × K{eq.price_day.toLocaleString()}</span>
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
                  <span className="text-ink-muted">Down payment due now (25%)</span>
                  <span className="font-medium text-ink">K{downPayment.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-ink-muted">Balance due at pickup</span>
                  <span className="text-ink-muted">K{balance.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="flex-[1_1_380px]">
            <form onSubmit={handleConfirm}>
              <div className={`bg-white rounded-xl p-5 border border-border/50 ${
                isOwnEquipment ? "opacity-50 pointer-events-none" : ""
              }`}>
                <h2 className="text-base font-medium text-ink mb-4">Payment method</h2>

                <div className="flex flex-col gap-3">
                  {PAY_OPTIONS.map((opt) => (
                    <label key={opt.id}
                      className={`flex items-center gap-3 p-3.5 rounded-xl cursor-pointer border-[1.5px] ${
                        payMethod === opt.id
                          ? "border-orange bg-page-warm"
                          : "border-border bg-white"
                      }`}>
                      <div className={`w-4 h-4 rounded-full shrink-0 border-2 flex items-center justify-center ${
                        payMethod === opt.id ? "border-orange" : "border-border"
                      }`}>
                        {payMethod === opt.id && (
                          <div className="w-2 h-2 rounded-full bg-orange" />
                        )}
                      </div>
                      <input type="radio" value={opt.id} checked={payMethod === opt.id}
                        onChange={() => setPayMethod(opt.id)} className="hidden" />
                      <div>
                        <div className="text-sm font-medium text-ink">{opt.label}</div>
                        <div className="text-xs text-ink-muted">{opt.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>

                {(payMethod === "airtel" || payMethod === "mtn") && (
                  <div className="mt-3">
                    <label className="block text-[13px] font-medium text-ink mb-2">Your mobile money number</label>
                    <input type="tel" value={phone} placeholder="+260…"
                      onChange={(e) => setPhone(e.target.value)}
                      onFocus={() => setFocusedField("phone")} onBlur={() => setFocusedField(null)}
                      className={inputCls("phone")} />
                  </div>
                )}

                {payMethod === "card" && (
                  <div className="mt-3 flex flex-col gap-3">
                    <div>
                      <label className="block text-[13px] font-medium text-ink mb-2">Card number</label>
                      <input type="text" value={cardNumber} placeholder="1234 5678 9012 3456"
                        onChange={(e) => setCardNumber(e.target.value)}
                        onFocus={() => setFocusedField("cardNumber")} onBlur={() => setFocusedField(null)}
                        className={inputCls("cardNumber")} />
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-[13px] font-medium text-ink mb-2">Expiry</label>
                        <input type="text" value={expiry} placeholder="MM/YY"
                          onChange={(e) => setExpiry(e.target.value)}
                          onFocus={() => setFocusedField("expiry")} onBlur={() => setFocusedField(null)}
                          className={inputCls("expiry")} />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[13px] font-medium text-ink mb-2">CVV</label>
                        <input type="password" value={cvv} placeholder="•••"
                          onChange={(e) => setCvv(e.target.value)}
                          onFocus={() => setFocusedField("cvv")} onBlur={() => setFocusedField(null)}
                          className={inputCls("cvv")} />
                      </div>
                    </div>
                  </div>
                )}

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

                <button type="submit" disabled={submitting || isOwnEquipment}
                  className={`w-full h-[52px] rounded-lg border-none bg-orange text-white text-[15px] font-medium mt-5 ${
                    submitting || isOwnEquipment ? "opacity-70 cursor-default" : "cursor-pointer"
                  }`}>
                  {submitting ? "Confirming..." : `Confirm Booking & Pay K${downPayment.toLocaleString()}`}
                </button>

                <div className="flex items-center justify-center gap-1.5 mt-3">
                  <Lock size={13} className="text-ink-muted" />
                  <span className="text-xs text-ink-muted">Your payment is secure and encrypted</span>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

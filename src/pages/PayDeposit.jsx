import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Lock, ChevronLeft, Clock } from "lucide-react";
import { bookingService } from "../services/bookingService";
import { useAuth } from "../hooks/useAuth";
import { useNow } from "../hooks/useNow";
import Avatar from "../components/Avatar";
import { effectiveStatus, timeLeft } from "../utils/bookingStatus";
import { formatDateRange } from "../utils/formatDate";
import { friendlyError } from "../utils/friendlyError";
import { priceBreakdown } from "../utils/calculateBooking";
import { detectCardType, luhn } from "../utils/cardNumber";

// Step 2 of booking: the owner accepted the request, and the renter pays
// the 25% deposit before the deadline to confirm it.

const PAY_OPTIONS = [
  { id: "airtel", label: "Airtel Money", desc: "Pay with your Airtel Money number" },
  { id: "mtn", label: "MTN Mobile Money", desc: "Pay with your MTN Mobile Money number" },
  { id: "card", label: "Bank card", desc: "Visa or Mastercard" },
];

const NAV_KEYS = ["Backspace","Delete","Tab","Escape","Enter","ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End"];

function blockNonDigit(e) {
  if (NAV_KEYS.includes(e.key) || e.ctrlKey || e.metaKey) return;
  if (!/^\d$/.test(e.key)) e.preventDefault();
}

function CardIcon({ type }) {
  if (type === "visa") return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold tracking-wider bg-[#1A1F71] text-white">VISA</span>
  );
  if (type === "mastercard") return (
    <span className="inline-flex items-center gap-0.5">
      <span className="w-5 h-5 rounded-full bg-[#EB001B] opacity-90 -mr-2.5 inline-block" />
      <span className="w-5 h-5 rounded-full bg-[#F79E1B] opacity-90 inline-block" />
    </span>
  );
  return null;
}

export default function PayDeposit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const now = useNow(1000);

  const [booking, setBooking] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [payMethod, setPayMethod] = useState("airtel");
  const [phone, setPhone] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const cardDigits = cardNumber.replace(/\s/g, "");
  const cardType = detectCardType(cardDigits);
  const [fieldErrors, setFieldErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    bookingService.getById(id)
      .then(setBooking)
      .catch(() => setLoadError("Could not load this booking."));
  }, [id]);

  if (loadError) {
    return <div className="pt-[88px] px-4 text-center text-ink-muted">{loadError}</div>;
  }
  if (!booking) {
    return <div className="pt-[88px] px-4 text-center text-ink-muted">Loading…</div>;
  }

  const status = effectiveStatus(booking, now);
  const isMine = user && booking.renter_id === user.id;
  const photos = (booking.equipment?.equipment_photos || []).slice().sort((a, b) => a.sort_order - b.sort_order);
  const photoUrl = photos[0]?.url || "";
  const deposit = Number(booking.down_payment);
  const balance = Number(booking.balance_due);
  const total = Number(booking.total_price);

  function setFieldError(field, msg) {
    setFieldErrors((prev) => msg ? { ...prev, [field]: msg } : Object.fromEntries(Object.entries(prev).filter(([k]) => k !== field)));
  }

  function validateCardNumberBlur() {
    if (!cardNumber) return;
    if (cardDigits.length !== 16) { setFieldError("cardNumber", "Must be exactly 16 digits."); return; }
    if (!luhn(cardDigits)) { setFieldError("cardNumber", "Invalid card number — please check and re-enter."); return; }
    if (!cardType) { setFieldError("cardNumber", "Only Visa and Mastercard are accepted."); return; }
    setFieldError("cardNumber", null);
  }

  function validateExpiryBlur() {
    if (!expiry) return;
    if (!/^\d{2}\/\d{2}$/.test(expiry)) { setFieldError("expiry", "Use MM/YY format."); return; }
    const [mm, yy] = expiry.split("/").map(Number);
    if (mm < 1 || mm > 12) { setFieldError("expiry", "Month must be 01–12."); return; }
    const now = new Date();
    const expYear = 2000 + yy;
    if (expYear < now.getFullYear() || (expYear === now.getFullYear() && mm < now.getMonth() + 1)) {
      setFieldError("expiry", "This card has expired."); return;
    }
    setFieldError("expiry", null);
  }

  function validateCvvBlur() {
    if (!cvv) return;
    if (cvv.length !== 3) { setFieldError("cvv", "CVV must be 3 digits."); return; }
    setFieldError("cvv", null);
  }

  function inputCls(field) {
    if (fieldErrors[field]) return "w-full h-11 px-3 text-sm text-ink rounded-lg outline-none box-border border border-red";
    return `w-full h-11 px-3 text-sm text-ink rounded-lg outline-none box-border ${
      focusedField === field ? "border border-orange" : "border border-border/50"
    }`;
  }

  async function handlePay(e) {
    e.preventDefault();
    if (status !== "accepted") return;
    if ((payMethod === "airtel" || payMethod === "mtn") && !phone) {
      setError("Please enter your mobile money number.");
      return;
    }
    if (payMethod === "card") {
      if (cardDigits.length !== 16) {
        setError("Card number must be exactly 16 digits.");
        return;
      }
      if (!luhn(cardDigits)) {
        setError("Card number is invalid. Please check and re-enter.");
        return;
      }
      if (!cardType) {
        setError("Only Visa and Mastercard are accepted.");
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(expiry)) {
        setError("Please enter a valid expiry date (MM/YY).");
        return;
      }
      const [mm, yy] = expiry.split("/").map(Number);
      if (mm < 1 || mm > 12) {
        setError("Expiry month must be between 01 and 12.");
        return;
      }
      const now = new Date();
      const expYear = 2000 + yy;
      if (expYear < now.getFullYear() || (expYear === now.getFullYear() && mm < now.getMonth() + 1)) {
        setError("Your card has expired. Please use a valid card.");
        return;
      }
      if (cvv.length !== 3) {
        setError("CVV must be exactly 3 digits.");
        return;
      }
    }
    setError("");
    setSubmitting(true);
    try {
      const result = await bookingService.payDeposit(booking.id, payMethod === "card" ? "card" : "mobile-money");
      if (result === "expired") {
        setBooking((b) => ({ ...b, status: "expired" }));
        return;
      }
      // Paid: the owner's phone number is now shared with this renter.
      const contacts = await bookingService.getContacts();
      navigate(`/booking/${booking.id}/confirmation`, {
        state: {
          bookingRef: booking.id,
          equipment: booking.equipment?.name,
          equipmentImage: photoUrl,
          ownerName: booking.owner?.name,
          ownerPhoto: booking.owner?.photo_url,
          ownerPhone: contacts[booking.id]?.phone,
          pickup: booking.equipment?.pickup_address,
          startDate: booking.start_date,
          endDate: booking.end_date,
          days: booking.total_days,
          total,
          downPayment: deposit,
          balance,
        },
      });
    } catch (err) {
      setError(friendlyError(err, "Payment didn't go through. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-page pt-[88px] pb-12 px-4">
      <div className="max-w-[900px] mx-auto">
        <Link to="/my-bookings"
          className="inline-flex items-center gap-1 text-[13px] text-ink-muted no-underline mb-4">
          <ChevronLeft size={14} /> Back to my bookings
        </Link>

        <h1 className="text-[26px] font-medium text-ink mb-4">Pay your deposit</h1>

        {!isMine && (
          <div className="bg-red-tint border border-red rounded-lg px-4 py-4 mb-5 text-sm text-red">
            This booking belongs to someone else.
          </div>
        )}
        {isMine && status === "accepted" && (
          <div className="bg-orange-tint rounded-lg px-4 py-3 mb-5 text-sm text-orange-dark flex items-center gap-2">
            <Clock size={16} className="shrink-0" />
            <span>
              {booking.owner?.name} accepted your request. Pay within <strong>{timeLeft(booking.payment_due_at, now)}</strong> to
              confirm it, or the booking is cancelled.
            </span>
          </div>
        )}
        {isMine && status === "expired" && (
          <div className="bg-red-tint border border-red rounded-lg px-4 py-4 mb-5 text-sm text-red">
            Time ran out: the deposit wasn't paid in time, so this booking was cancelled. No money was taken.{" "}
            <Link to={`/listings/${booking.equipment_id}`} className="text-red underline">Request it again</Link>
          </div>
        )}
        {isMine && status === "pending" && (
          <div className="bg-page border border-border rounded-lg px-4 py-4 mb-5 text-sm text-ink-muted">
            The owner hasn't accepted this request yet. We'll email you when they do.
          </div>
        )}
        {isMine && (status === "confirmed" || status === "completed") && (
          <div className="bg-green-tint rounded-lg px-4 py-4 mb-5 text-sm text-green-dark">
            The deposit for this booking has already been paid.
          </div>
        )}
        {isMine && (status === "declined" || status === "cancelled") && (
          <div className="bg-red-tint border border-red rounded-lg px-4 py-4 mb-5 text-sm text-red">
            This booking is no longer active.
          </div>
        )}

        <div className="flex flex-wrap gap-6">
          <div className="flex-[1_1_340px]">
            <div className="bg-white rounded-xl p-5 border border-border/50">
              <h2 className="text-base font-medium text-ink mb-4">Booking summary</h2>
              <img src={photoUrl} alt={booking.equipment?.name}
                className="w-full h-40 rounded-lg object-cover mb-3" />
              <div className="text-base font-medium text-ink">{booking.equipment?.name}</div>
              <div className="flex items-center gap-2 mt-1">
                <Avatar src={booking.owner?.photo_url} name={booking.owner?.name} className="w-6 h-6 text-[8px]" />
                <span className="text-[13px] text-ink-muted">by {booking.owner?.name}</span>
              </div>
              <div className="text-sm text-ink mt-3">
                {formatDateRange(booking.start_date, booking.end_date)} · {booking.total_days} day{booking.total_days === 1 ? "" : "s"}
              </div>

              <div className="border-t border-border my-4" />

              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink">{priceBreakdown(Number(booking.price_day_snapshot), booking.total_days, booking.price_week_snapshot)}</span>
                  <span>K{Number(booking.subtotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">Service fee (5%)</span>
                  <span className="text-ink-muted">K{Number(booking.service_fee).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-base font-medium pt-2 border-t border-border">
                  <span>Total</span>
                  <span className="text-orange">K{total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-ink-muted">Deposit due now (25%)</span>
                  <span className="font-medium text-ink">K{deposit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-ink-muted">Balance due at pickup</span>
                  <span className="text-ink-muted">K{balance.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-[1_1_380px]">
            <form onSubmit={handlePay}>
              <div className={`bg-white rounded-xl p-5 border border-border/50 ${
                isMine && status === "accepted" ? "" : "opacity-50 pointer-events-none"
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
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[13px] font-medium text-ink">Card number</label>
                        <CardIcon type={cardType} />
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={cardNumber}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        autoComplete="off"
                        onKeyDown={(e) => {
                          if (NAV_KEYS.includes(e.key) || e.ctrlKey || e.metaKey) return;
                          if (!/^\d$/.test(e.key)) { e.preventDefault(); return; }
                          if (cardDigits.length >= 16) e.preventDefault();
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 16);
                          setCardNumber(digits.replace(/(.{4})/g, "$1 ").trim());
                          setFieldError("cardNumber", null);
                        }}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "").slice(0, 16);
                          setCardNumber(digits.replace(/(.{4})/g, "$1 ").trim());
                          setFieldError("cardNumber", null);
                        }}
                        onFocus={() => setFocusedField("cardNumber")}
                        onBlur={() => { setFocusedField(null); validateCardNumberBlur(); }}
                        className={inputCls("cardNumber")}
                      />
                      {fieldErrors.cardNumber
                        ? <p className="text-[11px] text-red mt-1">{fieldErrors.cardNumber}</p>
                        : <p className="text-[11px] text-ink-muted mt-1">16 digits — Visa or Mastercard only</p>
                      }
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-[13px] font-medium text-ink mb-2">Expiry</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={expiry}
                          placeholder="MM/YY"
                          maxLength={5}
                          autoComplete="off"
                          onKeyDown={blockNonDigit}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                            // Block invalid month at input time (01–12 only)
                            if (digits.length >= 2) {
                              const mm = parseInt(digits.slice(0, 2), 10);
                              if (mm < 1 || mm > 12) return;
                            }
                            setExpiry(digits.length > 2 ? digits.slice(0, 2) + "/" + digits.slice(2) : digits);
                            setFieldError("expiry", null);
                          }}
                          onFocus={() => setFocusedField("expiry")}
                          onBlur={() => { setFocusedField(null); validateExpiryBlur(); }}
                          className={inputCls("expiry")}
                        />
                        {fieldErrors.expiry && <p className="text-[11px] text-red mt-1">{fieldErrors.expiry}</p>}
                      </div>
                      <div className="flex-1">
                        <label className="block text-[13px] font-medium text-ink mb-2">CVV</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={cvv}
                          placeholder="123"
                          maxLength={3}
                          autoComplete="off"
                          onKeyDown={(e) => {
                            if (NAV_KEYS.includes(e.key) || e.ctrlKey || e.metaKey) return;
                            if (!/^\d$/.test(e.key)) { e.preventDefault(); return; }
                            if (cvv.length >= 3) e.preventDefault();
                          }}
                          onPaste={(e) => {
                            e.preventDefault();
                            const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 3);
                            setCvv(digits);
                            setFieldError("cvv", null);
                          }}
                          onChange={(e) => {
                            setCvv(e.target.value.replace(/\D/g, "").slice(0, 3));
                            setFieldError("cvv", null);
                          }}
                          onFocus={() => setFocusedField("cvv")}
                          onBlur={() => { setFocusedField(null); validateCvvBlur(); }}
                          className={inputCls("cvv")}
                        />
                        {fieldErrors.cvv && <p className="text-[11px] text-red mt-1">{fieldErrors.cvv}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {error && <div className="mt-3 text-[13px] text-red">{error}</div>}

                <button type="submit" disabled={submitting || status !== "accepted"}
                  className={`w-full h-[52px] rounded-lg border-none bg-orange text-white text-[15px] font-medium mt-5 ${
                    submitting || status !== "accepted" ? "opacity-70 cursor-default" : "cursor-pointer"
                  }`}>
                  {submitting ? "Paying..." : `Pay deposit K${deposit.toLocaleString()}`}
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

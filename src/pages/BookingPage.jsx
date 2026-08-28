// FILE: agrorent/src/pages/BookingPage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Lock, ChevronLeft } from "lucide-react";
import { equipmentService } from "../services/equipmentService";
import { bookingService } from "../services/bookingService";
import { paymentService } from "../services/paymentService";
import { useAuth } from "../hooks/useAuth";
import { calculateDays } from "../utils/calculateDays";
import { calculateBooking } from "../utils/calculateBooking";

const PAY_OPTIONS = [
  { id: "airtel", label: "Airtel Money", desc: "Pay with your Airtel Money number" },
  { id: "mtn", label: "MTN Mobile Money", desc: "Pay with your MTN Mobile Money number" },
  { id: "card", label: "Bank card", desc: "Visa or Mastercard" },
];

function getFocusStyle(field, focusedField) {
  return {
    width: "100%",
    height: "44px",
    padding: "0 12px",
    fontSize: "14px",
    borderRadius: "8px",
    outline: "none",
    boxSizing: "border-box",
    border: focusedField === field ? "1.5px solid #FF5C00" : "1px solid #E0E8E3",
  };
}

export default function BookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [eq, setEq] = useState(null);
  const [loadError, setLoadError] = useState("");

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

  useEffect(() => {
    equipmentService
      .getById(id)
      .then((data) => {
        setEq(data);
        setStartDate(data.available_from ?? "");
        setEndDate(data.available_until ?? "");
      })
      .catch(() => setLoadError("Could not load this listing."));
  }, [id]);

  if (loadError) {
    return <div style={{ padding: "88px 16px", textAlign: "center" }}>{loadError}</div>;
  }
  if (!eq) {
    return <div style={{ padding: "88px 16px", textAlign: "center" }}>Loading…</div>;
  }

  const photoUrl = eq.equipment_photos?.[0]?.url ?? "";
  const rawDays = calculateDays(startDate, endDate);
  const days = rawDays > 0 ? rawDays : 1;
  const { subtotal, fee, total, downPayment, balance } = calculateBooking(eq.price_day, days);

  async function handleConfirm(e) {
    e.preventDefault();

    if (!startDate || !endDate || rawDays < 1) {
      setError("Please choose a valid date range.");
      return;
    }
    if ((payMethod === "airtel" || payMethod === "mtn") && !phone) {
      setError("Please enter your mobile money number.");
      return;
    }
    if (!agreed) {
      setError("Please agree to the Terms of Service to continue.");
      return;
    }
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
      console.error(err);
      setError("Something went wrong confirming your booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        backgroundColor: "#F5F5F0",
        minHeight: "100vh",
        paddingTop: "88px",
        paddingBottom: "48px",
        paddingLeft: "16px",
        paddingRight: "16px",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <Link
          to={`/listings/${eq.id}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "13px",
            color: "#555555",
            textDecoration: "none",
            marginBottom: "16px",
          }}
        >
          <ChevronLeft size={14} /> Back to listing
        </Link>

        <h1 style={{ fontSize: "26px", fontWeight: 500, color: "#111111", marginBottom: "24px" }}>
          Complete your booking
        </h1>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "24px" }}>
          {/* Summary */}
          <div style={{ flex: "1 1 340px" }}>
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "12px",
                padding: "20px",
                border: "0.5px solid #E0E8E3",
              }}
            >
              <h2 style={{ fontSize: "16px", fontWeight: 500, color: "#111111", marginBottom: "16px" }}>
                Booking summary
              </h2>
              <img
                src={photoUrl}
                alt={eq.name}
                style={{ width: "100%", height: "160px", borderRadius: "8px", objectFit: "cover", marginBottom: "12px" }}
              />
              <div style={{ fontSize: "16px", fontWeight: 500, color: "#111111" }}>{eq.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                <img
                  src={eq.owner?.photo_url}
                  alt=""
                  style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover" }}
                />
                <span style={{ fontSize: "13px", color: "#555555" }}>by {eq.owner?.name}</span>
              </div>

              <div style={{ borderTop: "1px solid #E0E8E3", margin: "16px 0" }} />

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "#555555", marginBottom: "4px" }}>
                    Start date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    min={eq.available_from}
                    max={eq.available_until}
                    onChange={(e) => setStartDate(e.target.value)}
                    onFocus={() => setFocusedField("start")}
                    onBlur={() => setFocusedField(null)}
                    style={getFocusStyle("start", focusedField)}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "#555555", marginBottom: "4px" }}>
                    End date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || eq.available_from}
                    max={eq.available_until}
                    onChange={(e) => setEndDate(e.target.value)}
                    onFocus={() => setFocusedField("end")}
                    onBlur={() => setFocusedField(null)}
                    style={getFocusStyle("end", focusedField)}
                  />
                </div>
                <div style={{ fontSize: "14px", color: "#111111" }}>
                  {days} day{days === 1 ? "" : "s"}
                </div>
              </div>

              <div style={{ borderTop: "1px solid #E0E8E3", margin: "16px 0" }} />

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#111111" }}>
                    {days} days × K{eq.price_day.toLocaleString()}
                  </span>
                  <span>K{subtotal.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#555555" }}>Service fee (5%)</span>
                  <span style={{ color: "#555555" }}>K{fee.toLocaleString()}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: 500,
                    fontSize: "16px",
                    paddingTop: "8px",
                    borderTop: "1px solid #E0E8E3",
                  }}
                >
                  <span>Total</span>
                  <span style={{ color: "#FF5C00" }}>K{total.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: "#555555" }}>Down payment due now (25%)</span>
                  <span style={{ fontWeight: 500, color: "#111111" }}>K{downPayment.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                  <span style={{ color: "#555555" }}>Balance due at pickup</span>
                  <span style={{ color: "#555555" }}>K{balance.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div style={{ flex: "1 1 380px" }}>
            <form onSubmit={handleConfirm}>
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "12px",
                  padding: "20px",
                  border: "0.5px solid #E0E8E3",
                }}
              >
                <h2 style={{ fontSize: "16px", fontWeight: 500, color: "#111111", marginBottom: "16px" }}>
                  Payment method
                </h2>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {PAY_OPTIONS.map((opt) => (
                    <label
                      key={opt.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "14px",
                        borderRadius: "10px",
                        cursor: "pointer",
                        border: payMethod === opt.id ? "1.5px solid #FF5C00" : "1.5px solid #E0E8E3",
                        backgroundColor: payMethod === opt.id ? "#FFF8F5" : "#FFFFFF",
                      }}
                    >
                      <div
                        style={{
                          width: "16px",
                          height: "16px",
                          borderRadius: "50%",
                          flexShrink: 0,
                          border: `2px solid ${payMethod === opt.id ? "#FF5C00" : "#E0E8E3"}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {payMethod === opt.id && (
                          <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#FF5C00" }} />
                        )}
                      </div>
                      <input
                        type="radio"
                        value={opt.id}
                        checked={payMethod === opt.id}
                        onChange={() => setPayMethod(opt.id)}
                        style={{ display: "none" }}
                      />
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: 500, color: "#111111" }}>{opt.label}</div>
                        <div style={{ fontSize: "12px", color: "#555555" }}>{opt.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>

                {(payMethod === "airtel" || payMethod === "mtn") && (
                  <div style={{ marginTop: "12px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>
                      Your mobile money number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      placeholder="+260…"
                      onChange={(e) => setPhone(e.target.value)}
                      onFocus={() => setFocusedField("phone")}
                      onBlur={() => setFocusedField(null)}
                      style={getFocusStyle("phone", focusedField)}
                    />
                  </div>
                )}

                {payMethod === "card" && (
                  <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>
                        Card number
                      </label>
                      <input
                        type="text"
                        value={cardNumber}
                        placeholder="1234 5678 9012 3456"
                        onChange={(e) => setCardNumber(e.target.value)}
                        onFocus={() => setFocusedField("cardNumber")}
                        onBlur={() => setFocusedField(null)}
                        style={getFocusStyle("cardNumber", focusedField)}
                      />
                    </div>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>
                          Expiry
                        </label>
                        <input
                          type="text"
                          value={expiry}
                          placeholder="MM/YY"
                          onChange={(e) => setExpiry(e.target.value)}
                          onFocus={() => setFocusedField("expiry")}
                          onBlur={() => setFocusedField(null)}
                          style={getFocusStyle("expiry", focusedField)}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>
                          CVV
                        </label>
                        <input
                          type="text"
                          value={cvv}
                          placeholder="123"
                          onChange={(e) => setCvv(e.target.value)}
                          onFocus={() => setFocusedField("cvv")}
                          onBlur={() => setFocusedField(null)}
                          style={getFocusStyle("cvv", focusedField)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginTop: "20px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    style={{ marginTop: "2px" }}
                  />
                  <span style={{ fontSize: "13px", color: "#111111" }}>
                    I agree to AgroRent's{" "}
                    <Link to="/terms" target="_blank" rel="noopener noreferrer" style={{ color: "#1A5C2E", textDecoration: "underline" }}>
                      Terms of Service
                    </Link>{" "}
                    and rental agreement
                  </span>
                </label>

                {error && <div style={{ marginTop: "12px", fontSize: "13px", color: "#A02020" }}>{error}</div>}

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: "100%",
                    height: "52px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "#FF5C00",
                    color: "#FFFFFF",
                    fontSize: "15px",
                    fontWeight: 500,
                    marginTop: "20px",
                    cursor: submitting ? "default" : "pointer",
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? "Confirming..." : `Confirm Booking & Pay K${downPayment.toLocaleString()}`}
                </button>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginTop: "12px" }}>
                  <Lock size={13} color="#555555" />
                  <span style={{ fontSize: "12px", color: "#555555" }}>Your payment is secure and encrypted</span>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
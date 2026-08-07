import { Link, useLocation, useParams } from "react-router-dom";
import { Check } from "lucide-react";

export default function BookingConfirmation() {
  const { id } = useParams();
  const location = useLocation();
  const booking = location.state;

  // No backend yet, so booking details are passed via navigate(..., { state }) from
  // BookingPage.jsx rather than fetched. If this page is reloaded directly (state
  // lost), fall back to a simple pointer toward My Bookings instead of crashing.
  if (!booking) {
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
        <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 500, color: "#111111", marginBottom: "8px" }}>
            Booking reference {id}
          </h1>
          <p style={{ fontSize: "14px", color: "#555555", marginBottom: "20px" }}>
            We couldn't find the details for this confirmation — this can happen if the
            page was reloaded. You can check the status of this booking from My Bookings.
          </p>
          <Link
            to="/my-bookings"
            style={{
              display: "inline-block",
              padding: "10px 20px",
              borderRadius: "8px",
              backgroundColor: "#FF5C00",
              color: "#FFFFFF",
              fontSize: "14px",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            View my bookings
          </Link>
        </div>
      </div>
    );
  }

  const dateRange = `${booking.startDate} → ${booking.endDate}`;

  const rows = [
    { label: "Equipment", value: booking.equipment },
    { label: "Dates", value: dateRange },
    { label: "Duration", value: `${booking.days} day${booking.days === 1 ? "" : "s"}` },
    { label: "Total", value: `K${booking.total.toLocaleString()}` },
    { label: "Down payment paid", value: `K${booking.downPayment.toLocaleString()}` },
    { label: "Balance at pickup", value: `K${booking.balance.toLocaleString()}` },
    { label: "Owner name", value: booking.ownerName },
    { label: "Owner phone", value: booking.ownerPhone },
    { label: "Pickup location", value: booking.pickup },
  ];

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
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              backgroundColor: "#D4EDDA",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto",
            }}
          >
            <Check size={32} color="#0F3D1E" />
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 500, color: "#111111", marginTop: "16px" }}>
            Booking confirmed!
          </h1>
          <p style={{ fontSize: "14px", color: "#555555", marginTop: "8px" }}>Your booking reference is</p>
          <div
            style={{
              display: "inline-block",
              marginTop: "8px",
              padding: "6px 16px",
              backgroundColor: "#E5E5E5",
              borderRadius: "20px",
              fontSize: "16px",
              fontWeight: 500,
              color: "#111111",
            }}
          >
            #{booking.bookingRef}
          </div>
        </div>

        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", padding: "24px", border: "0.5px solid #E0E8E3" }}>
          <h2 style={{ fontSize: "15px", fontWeight: 500, color: "#111111", marginBottom: "16px" }}>Booking details</h2>
          <img
            src={booking.equipmentImage}
            alt={booking.equipment}
            style={{ width: "100%", height: "160px", borderRadius: "8px", objectFit: "cover", marginBottom: "16px" }}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {rows.map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "13px", color: "#555555" }}>{label}</span>
                <span style={{ fontSize: "13px", fontWeight: 500, color: "#111111" }}>{value}</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px solid #E0E8E3", margin: "16px 0" }} />

          <div style={{ fontSize: "14px", fontWeight: 500, color: "#111111", marginBottom: "8px" }}>
            What happens next?
          </div>
          <p style={{ fontSize: "13px", color: "#555555", lineHeight: 1.6 }}>
            The owner has received your booking request. They will confirm within 24
            hours. You'll get a notification when they accept.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "24px" }}>
          <Link
            to="/messages"
            style={{
              padding: "10px 20px",
              fontSize: "14px",
              borderRadius: "8px",
              fontWeight: 500,
              border: "1.5px solid #FF5C00",
              color: "#FF5C00",
              textDecoration: "none",
            }}
          >
            Chat with owner
          </Link>
          <Link
            to="/my-bookings"
            style={{
              padding: "10px 20px",
              fontSize: "14px",
              borderRadius: "8px",
              fontWeight: 500,
              backgroundColor: "#FF5C00",
              color: "#FFFFFF",
              textDecoration: "none",
            }}
          >
            View my bookings
          </Link>
        </div>
      </div>
    </div>
  );
}

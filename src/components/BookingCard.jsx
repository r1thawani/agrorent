import { Link } from "react-router-dom";
import { formatDateRange } from "../utils/formatDate";
import { formatCurrency } from "../utils/formatCurrency";

// Compact booking row: equipment photo + name + date range + status badge.
// Dashboard.jsx's "Upcoming bookings" and OwnerDashboard.jsx's "Upcoming
// confirmed bookings" sections had this exact same markup duplicated —
// extracted here so both (and any future summary widget) share one card.
//
// This is deliberately NOT used on MyBookings.jsx / BookingRequests.jsx —
// those rows need extra per-page actions (cancel, leave a review, accept/
// decline) that don't belong on a shared summary card, so they keep their
// own local row components.

const STATUS_STYLES = {
  confirmed: { bg: "#D4EDDA", color: "#0F3D1E", label: "Confirmed" },
  pending: { bg: "#FFE8D6", color: "#CC4A00", label: "Pending" },
  active: { bg: "#FFE8D6", color: "#CC4A00", label: "Active" },
  completed: { bg: "#F5F5F0", color: "#555555", label: "Completed" },
  cancelled: { bg: "#FDECEA", color: "#A02020", label: "Cancelled" },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.pending;
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: "11px",
        fontWeight: 500,
        padding: "3px 10px",
        borderRadius: "20px",
        backgroundColor: s.bg,
        color: s.color,
      }}
    >
      {s.label}
    </span>
  );
}

export default function BookingCard({ booking, linkTo, showPrice = false }) {
  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "12px",
        padding: "16px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        border: "0.5px solid #E0E8E3",
      }}
    >
      <img
        src={booking.equipmentImage}
        alt={booking.equipment}
        style={{ width: "60px", height: "48px", borderRadius: "8px", objectFit: "cover", flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "14px",
            fontWeight: 500,
            color: "#111111",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {booking.equipment}
        </div>
        <div style={{ fontSize: "13px", color: "#555555" }}>
          {formatDateRange(booking.startDate, booking.endDate)}
        </div>
        <div style={{ marginTop: "4px" }}>
          <StatusBadge status={booking.status} />
        </div>
      </div>
      {showPrice && (
        <div style={{ fontSize: "14px", fontWeight: 500, color: "#FF5C00", flexShrink: 0 }}>
          {formatCurrency(booking.totalPrice)}
        </div>
      )}
      <Link
        to={linkTo || "/my-bookings"}
        style={{ fontSize: "13px", color: "#1A5C2E", flexShrink: 0, textDecoration: "none" }}
      >
        View details
      </Link>
    </div>
  );
}

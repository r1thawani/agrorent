import { Link } from "react-router-dom";
import { formatDateRange } from "../utils/formatDate";
import { formatCurrency } from "../utils/formatCurrency";

const STATUS_CLASSES = {
  confirmed: "bg-green-tint text-green-dark",
  pending:   "bg-orange-tint text-orange-dark",
  active:    "bg-orange-tint text-orange-dark",
  completed: "bg-page text-ink-muted",
  cancelled: "bg-red-tint text-red",
};

const STATUS_LABELS = {
  confirmed: "Confirmed",
  pending:   "Pending",
  active:    "Active",
  completed: "Completed",
  cancelled: "Cancelled",
};

function StatusBadge({ status }) {
  const cls = STATUS_CLASSES[status] || STATUS_CLASSES.pending;
  return (
    <span className={`inline-block text-[11px] font-medium px-2.5 py-[3px] rounded-full ${cls}`}>
      {STATUS_LABELS[status] || "Pending"}
    </span>
  );
}

export default function BookingCard({ booking, linkTo, showPrice = false }) {
  return (
    <div className="bg-white rounded-xl p-4 flex items-center gap-3 border border-border/50">
      <img
        src={booking.equipmentImage}
        alt={booking.equipment}
        className="w-[60px] h-12 rounded-lg object-cover shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-ink truncate">
          {booking.equipment}
        </div>
        <div className="text-[13px] text-ink-muted">
          {formatDateRange(booking.startDate, booking.endDate)}
        </div>
        <div className="mt-1">
          <StatusBadge status={booking.status} />
        </div>
      </div>
      {showPrice && (
        <div className="text-sm font-medium text-orange shrink-0">
          {formatCurrency(booking.totalPrice)}
        </div>
      )}
      <Link
        to={linkTo || "/my-bookings"}
        className="text-[13px] text-green shrink-0 no-underline"
      >
        View details
      </Link>
    </div>
  );
}

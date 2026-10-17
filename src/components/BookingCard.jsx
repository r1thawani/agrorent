import { Link } from "react-router-dom";
import { formatDateRange } from "../utils/formatDate";
import { formatCurrency } from "../utils/formatCurrency";
import { describeStatus, effectiveStatus, TONE_CLASSES } from "../utils/bookingStatus";

export default function BookingCard({ booking, linkTo, showPrice = false, role = "renter" }) {
  // Accept both camelCase (legacy) and snake_case (Supabase rows)
  const photos = (booking.equipment?.equipment_photos || []).slice().sort((a, b) => a.sort_order - b.sort_order);
  const image = booking.equipmentImage || photos[0]?.url || "";
  const name = booking.equipment?.name || booking.equipment || "";
  const startDate = booking.start_date || booking.startDate || "";
  const endDate = booking.end_date || booking.endDate || "";
  const totalPrice = booking.total_price ?? booking.totalPrice;
  const { label, tone } = describeStatus(booking, role);
  const payLink = role === "renter" && effectiveStatus(booking) === "accepted" ? `/booking/${booking.id}/pay` : null;

  return (
    <div className="bg-white rounded-xl p-4 flex items-center gap-3 border border-border/50">
      <img
        src={image}
        alt={name}
        className="w-[60px] h-12 rounded-lg object-cover shrink-0 bg-page"
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-ink truncate">{name}</div>
        <div className="text-[13px] text-ink-muted">
          {formatDateRange(startDate, endDate)}
        </div>
        <div className="mt-1">
          <span className={`inline-block text-[11px] font-medium px-2.5 py-[3px] rounded-full ${TONE_CLASSES[tone]}`}>
            {label}
          </span>
        </div>
      </div>
      {showPrice && (
        <div className="text-sm font-medium text-orange shrink-0">
          {formatCurrency(totalPrice)}
        </div>
      )}
      <Link
        to={payLink || linkTo || "/my-bookings"}
        className={`text-[13px] shrink-0 no-underline ${payLink ? "text-orange font-medium" : "text-green"}`}
      >
        {payLink ? "Pay deposit" : "View details"}
      </Link>
    </div>
  );
}

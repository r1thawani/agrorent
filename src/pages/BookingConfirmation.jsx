import { Link, useLocation, useParams } from "react-router-dom";
import { Check } from "lucide-react";

export default function BookingConfirmation() {
  const { id } = useParams();
  const location = useLocation();
  const booking = location.state;

  if (!booking) {
    return (
      <div className="min-h-screen bg-page pt-[88px] pb-12 px-4">
        <div className="max-w-[600px] mx-auto text-center">
          <h1 className="text-[22px] font-medium text-ink mb-2">Booking reference {id}</h1>
          <p className="text-sm text-ink-muted mb-5">
            We couldn't find the details for this confirmation — this can happen if the page was
            reloaded. You can check the status of this booking from My Bookings.
          </p>
          <Link to="/my-bookings"
            className="inline-block px-5 py-2.5 rounded-lg bg-orange text-white text-sm font-medium no-underline">
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
    <div className="min-h-screen bg-page pt-[88px] pb-12 px-4">
      <div className="max-w-[600px] mx-auto">
        <div className="text-center mb-7">
          <div className="w-16 h-16 rounded-full bg-green-tint flex items-center justify-center mx-auto">
            <Check size={32} color="#0F3D1E" />
          </div>
          <h1 className="text-[24px] font-medium text-ink mt-4">Booking confirmed!</h1>
          <p className="text-sm text-ink-muted mt-2">Your booking reference is</p>
          <div className="inline-block mt-2 px-4 py-1.5 bg-divider rounded-full text-base font-medium text-ink">
            #{booking.bookingRef}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-border/50">
          <h2 className="text-[15px] font-medium text-ink mb-4">Booking details</h2>
          <img src={booking.equipmentImage} alt={booking.equipment}
            className="w-full h-40 rounded-lg object-cover mb-4" />

          <div className="flex flex-col gap-2.5">
            {rows.map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-[13px] text-ink-muted">{label}</span>
                <span className="text-[13px] font-medium text-ink">{value}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-border my-4" />

          <div className="text-sm font-medium text-ink mb-2">What happens next?</div>
          <p className="text-[13px] text-ink-muted leading-relaxed">
            The owner has received your booking request. They will confirm within 24 hours.
            You'll get a notification when they accept.
          </p>
        </div>

        <div className="flex justify-center gap-3 mt-6">
          <Link to="/messages"
            className="px-5 py-2.5 text-sm font-medium rounded-lg border border-orange text-orange no-underline">
            Chat with owner
          </Link>
          <Link to="/my-bookings"
            className="px-5 py-2.5 text-sm font-medium rounded-lg bg-orange text-white no-underline">
            View my bookings
          </Link>
        </div>
      </div>
    </div>
  );
}

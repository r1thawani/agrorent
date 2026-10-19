import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Check } from "lucide-react";
import { bookingService } from "../services/bookingService";

// Turns a bookings row (plus the owner's contact) into what this page shows.
function fromRow(b, contact) {
  const photos = (b.equipment?.equipment_photos || []).slice().sort((x, y) => x.sort_order - y.sort_order);
  return {
    bookingRef: b.id,
    equipment: b.equipment?.name,
    equipmentImage: photos[0]?.url || "",
    ownerName: contact?.name || b.owner?.name,
    ownerPhone: contact?.phone,
    pickup: b.equipment?.pickup_address,
    startDate: b.start_date,
    endDate: b.end_date,
    days: b.total_days,
    total: Number(b.total_price),
    downPayment: Number(b.down_payment),
    balance: Number(b.balance_due),
  };
}

export default function BookingConfirmation() {
  const { id } = useParams();
  const location = useLocation();
  // Straight after paying, the pay page hands the details over. On a refresh
  // or a visit from My Bookings, load them from the database instead.
  const [booking, setBooking] = useState(location.state || null);
  const [problem, setProblem] = useState("");

  useEffect(() => {
    if (location.state) return;
    Promise.all([bookingService.getById(id), bookingService.getContacts()])
      .then(([row, contacts]) => {
        if (row.status !== "confirmed" && row.status !== "completed") {
          setProblem("This booking isn't confirmed yet. Its current status is in My Bookings.");
          return;
        }
        setBooking(fromRow(row, contacts[row.id]));
      })
      .catch(() => setProblem("We couldn't load this booking. You can find it in My Bookings."));
  }, [id, location.state]);

  if (!booking && !problem) {
    return <div className="pt-[88px] px-4 text-center text-ink-muted">Loading…</div>;
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-page pt-[88px] pb-12 px-4">
        <div className="max-w-[600px] mx-auto text-center">
          <h1 className="text-[22px] font-medium text-ink mb-2">Booking reference {id}</h1>
          <p className="text-sm text-ink-muted mb-5">{problem}</p>
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
    { label: "Owner phone", value: booking.ownerPhone || "Not added yet: use Messages" },
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
              <div key={label} className="flex justify-between gap-4">
                <span className="text-[13px] text-ink-muted shrink-0">{label}</span>
                <span className="text-[13px] font-medium text-ink text-right">{value}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-border my-4" />

          <div className="text-sm font-medium text-ink mb-2">What happens next?</div>
          <p className="text-[13px] text-ink-muted leading-relaxed">
            Your deposit is paid and these dates are yours. Contact the owner to arrange pickup,
            and pay the remaining balance when you collect the equipment. You'll find the
            owner's details in My Bookings at any time.
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

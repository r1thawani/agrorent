import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminTopNav from "../../components/AdminTopNav";
import AdminTable from "../../components/AdminTable";
import { adminService } from "../../services/adminService";

const STATUS_CLS = {
  confirmed: "bg-green-tint text-green-dark",
  pending: "bg-peach text-orange-dark",
  completed: "bg-page text-ink-muted",
  cancelled: "bg-red-tint text-red",
  declined: "bg-red-tint text-red",
};
const STATUS_LABELS = {
  confirmed: "Confirmed",
  pending: "Pending",
  completed: "Completed",
  cancelled: "Cancelled",
  declined: "Declined",
};

function StatusBadge({ status }) {
  return (
    <span className={`inline-block text-[11px] font-medium px-2.5 py-[3px] rounded-full capitalize ${STATUS_CLS[status] || STATUS_CLS.pending}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function formatDateRange(startDate, endDate) {
  const start = new Date(startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const end = new Date(endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return `${start} – ${end}`;
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getAllBookings().then(setBookings).finally(() => setLoading(false));
  }, []);

  const rows = bookings.map((b) => ({
    ...b,
    renterName: b.renter?.name || "",
    ownerName: b.owner?.name || "",
    equipmentName: b.equipment?.name || "",
  }));

  const columns = [
    {
      key: "id",
      label: "Booking ID",
      render: (row) => <span className="text-[13px] font-medium text-ink">#{row.id.slice(0, 8)}</span>,
    },
    {
      key: "renterName",
      label: "Renter",
      render: (row) => <span className="text-[13px] text-ink">{row.renterName}</span>,
    },
    {
      key: "ownerName",
      label: "Owner",
      render: (row) => <span className="text-[13px] text-ink-muted">{row.ownerName}</span>,
    },
    {
      key: "equipmentName",
      label: "Equipment",
      render: (row) => <span className="text-[13px] text-ink">{row.equipmentName}</span>,
    },
    {
      key: "dates",
      label: "Dates",
      render: (row) => <span className="text-[13px] text-ink-muted">{formatDateRange(row.start_date, row.end_date)}</span>,
    },
    {
      key: "total_price",
      label: "Amount",
      render: (row) => <span className="text-[13px] font-medium text-ink">K{Number(row.total_price).toLocaleString()}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <Link to={`/listings/${row.equipment_id}`} className="text-[13px] text-green no-underline">
          View details
        </Link>
      ),
    },
  ];

  return (
    <div>
      <AdminTopNav />
      <div className="min-h-[calc(100vh-56px)] bg-page px-4 sm:px-8 py-8">
        <h1 className="text-[22px] font-medium text-ink mb-5">All bookings</h1>
        {loading ? (
          <div className="text-center py-20 text-ink-muted">Loading…</div>
        ) : (
          <AdminTable
            columns={columns}
            rows={rows}
            searchKeys={["renterName", "equipmentName"]}
            searchPlaceholder="Search bookings…"
            filters={[
              { key: "status", label: "Status", options: ["All status", "pending", "confirmed", "completed", "cancelled", "declined"] },
            ]}
            emptyMessage="No bookings match your filters"
          />
        )}
      </div>
    </div>
  );
}

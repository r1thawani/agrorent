import { Link } from "react-router-dom";
import AdminTopNav from "../../components/AdminTopNav";
import AdminTable from "../../components/AdminTable";
import { BOOKINGS } from "../../data/mockData";

// Reuses the exact Section 5 status badge palette — no new colors.
const STATUS_BADGE = {
  confirmed: { bg: "#D4EDDA", color: "#0F3D1E", label: "Confirmed" },
  pending: { bg: "#FFE8D6", color: "#CC4A00", label: "Pending" },
  completed: { bg: "#F5F5F0", color: "#555555", label: "Completed" },
  cancelled: { bg: "#FDECEA", color: "#A02020", label: "Cancelled" },
};

function StatusBadge({ status }) {
  const s = STATUS_BADGE[status] || STATUS_BADGE.pending;
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

// Local formatting helper — one consumer so far, kept inline per the
// "local until a second consumer needs it" convention (BookingRow/ListingRow/etc).
function formatDateRange(startDate, endDate) {
  const opts = { day: "numeric", month: "short", year: "numeric" };
  const start = new Date(startDate);
  const end = new Date(endDate);
  const startStr = start.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const endStr = end.toLocaleDateString("en-GB", opts);
  return `${startStr} – ${endStr}`;
}

export default function AdminBookings() {
  const columns = [
    {
      key: "id",
      label: "Booking ID",
      render: (row) => (
        <span style={{ fontSize: "13px", fontWeight: 500, color: "#111111" }}>
          #{row.id}
        </span>
      ),
    },
    {
      key: "renter",
      label: "Renter",
      render: (row) => (
        <span style={{ fontSize: "13px", color: "#111111" }}>
          {row.renter || row.renterId}
        </span>
      ),
    },
    {
      key: "owner",
      label: "Owner",
      render: (row) => (
        <span style={{ fontSize: "13px", color: "#555555" }}>{row.owner}</span>
      ),
    },
    {
      key: "equipment",
      label: "Equipment",
      render: (row) => (
        <span style={{ fontSize: "13px", color: "#111111" }}>{row.equipment}</span>
      ),
    },
    {
      key: "dates",
      label: "Dates",
      render: (row) => (
        <span style={{ fontSize: "13px", color: "#555555" }}>
          {formatDateRange(row.startDate, row.endDate)}
        </span>
      ),
    },
    {
      key: "totalPrice",
      label: "Amount",
      render: (row) => (
        <span style={{ fontSize: "13px", fontWeight: 500, color: "#111111" }}>
          K{row.totalPrice.toLocaleString()}
        </span>
      ),
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
        <Link
          to={`/listings/${row.equipmentId}`}
          style={{ fontSize: "13px", color: "#1A5C2E", textDecoration: "none" }}
        >
          View details
        </Link>
      ),
    },
  ];

  const filters = [
    {
      key: "status",
      label: "Status",
      options: ["All status", "pending", "confirmed", "completed", "cancelled"],
    },
  ];

  return (
    <div>
      <AdminTopNav />
      <div style={{ padding: "32px", backgroundColor: "#F5F5F0", minHeight: "calc(100vh - 56px)" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 500, color: "#111111", marginBottom: "20px" }}>
          All bookings
        </h1>
        <AdminTable
          columns={columns}
          rows={BOOKINGS}
          searchKeys={["renter", "equipment"]}
          searchPlaceholder="Search bookings…"
          filters={filters}
          emptyMessage="No bookings match your filters"
        />
      </div>
    </div>
  );
}

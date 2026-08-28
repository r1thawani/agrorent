// FILE: agrorent/src/pages/admin/AdminBookings.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminTopNav from "../../components/AdminTopNav";
import AdminTable from "../../components/AdminTable";
import { adminService } from "../../services/adminService";

const STATUS_BADGE = {
  confirmed: { bg: "#D4EDDA", color: "#0F3D1E", label: "Confirmed" },
  pending: { bg: "#FFE8D6", color: "#CC4A00", label: "Pending" },
  completed: { bg: "#F5F5F0", color: "#555555", label: "Completed" },
  cancelled: { bg: "#FDECEA", color: "#A02020", label: "Cancelled" },
  declined: { bg: "#FDECEA", color: "#A02020", label: "Declined" },
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

function formatDateRange(startDate, endDate) {
  const opts = { day: "numeric", month: "short", year: "numeric" };
  const start = new Date(startDate);
  const end = new Date(endDate);
  const startStr = start.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const endStr = end.toLocaleDateString("en-GB", opts);
  return `${startStr} – ${endStr}`;
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService
      .getAllBookings()
      .then(setBookings)
      .finally(() => setLoading(false));
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
      render: (row) => (
        <span style={{ fontSize: "13px", fontWeight: 500, color: "#111111" }}>
          #{row.id.slice(0, 8)}
        </span>
      ),
    },
    {
      key: "renterName",
      label: "Renter",
      render: (row) => (
        <span style={{ fontSize: "13px", color: "#111111" }}>
          {row.renterName}
        </span>
      ),
    },
    {
      key: "ownerName",
      label: "Owner",
      render: (row) => (
        <span style={{ fontSize: "13px", color: "#555555" }}>{row.ownerName}</span>
      ),
    },
    {
      key: "equipmentName",
      label: "Equipment",
      render: (row) => (
        <span style={{ fontSize: "13px", color: "#111111" }}>{row.equipmentName}</span>
      ),
    },
    {
      key: "dates",
      label: "Dates",
      render: (row) => (
        <span style={{ fontSize: "13px", color: "#555555" }}>
          {formatDateRange(row.start_date, row.end_date)}
        </span>
      ),
    },
    {
      key: "total_price",
      label: "Amount",
      render: (row) => (
        <span style={{ fontSize: "13px", fontWeight: 500, color: "#111111" }}>
          K{Number(row.total_price).toLocaleString()}
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
          to={`/listings/${row.equipment_id}`}
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
      options: ["All status", "pending", "confirmed", "completed", "cancelled", "declined"],
    },
  ];

  return (
    <div>
      <AdminTopNav />
      <div style={{ padding: "32px", backgroundColor: "#F5F5F0", minHeight: "calc(100vh - 56px)" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 500, color: "#111111", marginBottom: "20px" }}>
          All bookings
        </h1>
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#555555" }}>Loading…</div>
        ) : (
          <AdminTable
            columns={columns}
            rows={rows}
            searchKeys={["renterName", "equipmentName"]}
            searchPlaceholder="Search bookings…"
            filters={filters}
            emptyMessage="No bookings match your filters"
          />
        )}
      </div>
    </div>
  );
}
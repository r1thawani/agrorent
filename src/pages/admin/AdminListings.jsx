import { useState } from "react";
import { Link } from "react-router-dom";
import AdminTopNav from "../../components/AdminTopNav";
import AdminTable from "../../components/AdminTable";
import { EQUIPMENT, CATEGORIES } from "../../data/mockData";

// Badge styling — reuses the exact Section 5 badge palette + the green category
// tint already established on EquipmentCard.jsx. No new colors invented.
function Badge({ bg, color, children }) {
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: "11px",
        fontWeight: 500,
        padding: "3px 10px",
        borderRadius: "20px",
        backgroundColor: bg,
        color: color,
      }}
    >
      {children}
    </span>
  );
}

export default function AdminListings() {
  // No "status" field exists on EQUIPMENT in mockData.js yet, so — same
  // convention as MyListings.jsx (4C) seeding isAvailable/mockBookings locally —
  // admin status is kept as local component state, not written back to
  // mockData.js. Defaults every listing to "active".
  const [statusById, setStatusById] = useState(() =>
    Object.fromEntries(EQUIPMENT.map((eq) => [eq.id, "active"]))
  );
  const [deletedIds, setDeletedIds] = useState([]);

  function toggleFlag(id) {
    setStatusById((prev) => ({
      ...prev,
      [id]: prev[id] === "flagged" ? "active" : "flagged",
    }));
  }

  function removeListing(id) {
    setDeletedIds((prev) => [...prev, id]);
  }

  const rows = EQUIPMENT.filter((eq) => !deletedIds.includes(eq.id)).map(
    (eq) => ({ ...eq, status: statusById[eq.id] })
  );

  const columns = [
    {
      key: "name",
      label: "Equipment",
      render: (row) => (
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img
            src={row.image}
            alt={row.name}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              objectFit: "cover",
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: "14px", fontWeight: 500, color: "#111111" }}>
            {row.name}
          </span>
        </div>
      ),
    },
    {
      key: "owner",
      label: "Owner",
      render: (row) => (
        <span style={{ fontSize: "13px", color: "#555555" }}>{row.owner.name}</span>
      ),
    },
    {
      key: "category",
      label: "Category",
      render: (row) => <Badge bg="#D4EDDA" color="#0F3D1E">{row.category}</Badge>,
    },
    {
      key: "priceDay",
      label: "Price/day",
      render: (row) => (
        <span style={{ fontSize: "13px", color: "#111111" }}>K{row.priceDay}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) =>
        row.status === "flagged" ? (
          <Badge bg="#FDECEA" color="#A02020">Flagged</Badge>
        ) : (
          <Badge bg="#D4EDDA" color="#0F3D1E">Active</Badge>
        ),
    },
    {
      key: "listed",
      label: "Posted",
      render: (row) => (
        <span style={{ fontSize: "13px", color: "#555555" }}>{row.listed}</span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link
            to={`/listings/${row.id}`}
            style={{ fontSize: "13px", color: "#1A5C2E", textDecoration: "none" }}
          >
            View
          </Link>
          <button
            onClick={() => toggleFlag(row.id)}
            style={{
              fontSize: "13px",
              color: "#CC4A00",
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
            }}
          >
            {row.status === "flagged" ? "Unflag" : "Flag"}
          </button>
          <button
            onClick={() => removeListing(row.id)}
            style={{
              fontSize: "13px",
              color: "#A02020",
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
            }}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  const filters = [
    {
      key: "category",
      label: "Category",
      options: ["All categories", ...CATEGORIES],
    },
    {
      key: "status",
      label: "Status",
      options: ["All status", "active", "flagged"],
    },
  ];

  return (
    <div>
      <AdminTopNav />
      <div style={{ padding: "32px", backgroundColor: "#F5F5F0", minHeight: "calc(100vh - 56px)" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 500, color: "#111111", marginBottom: "20px" }}>
          All listings
        </h1>
        <AdminTable
          columns={columns}
          rows={rows}
          searchKeys={["name"]}
          searchPlaceholder="Search listings…"
          filters={filters}
          emptyMessage="No listings match your filters"
        />
      </div>
    </div>
  );
}

// FILE: agrorent/src/pages/admin/AdminListings.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminTopNav from "../../components/AdminTopNav";
import AdminTable from "../../components/AdminTable";
import { adminService } from "../../services/adminService";
import { equipmentService } from "../../services/equipmentService";

const CATEGORIES = ["Tractors", "Ploughs", "Planters", "Harvesters", "Irrigation", "Sprayers", "Other"];

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
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService
      .getAllListings()
      .then(setListings)
      .finally(() => setLoading(false));
  }, []);

  async function toggleFlag(id) {
    const target = listings.find((eq) => eq.id === id);
    const prevFlagged = target.flagged;
    setListings((prev) => prev.map((eq) => (eq.id === id ? { ...eq, flagged: !prevFlagged } : eq)));
    try {
      await adminService.toggleListingFlag(id, prevFlagged);
    } catch {
      setListings((prev) => prev.map((eq) => (eq.id === id ? { ...eq, flagged: prevFlagged } : eq)));
    }
  }

  async function removeListing(id) {
    setListings((prev) => prev.filter((eq) => eq.id !== id));
    try {
      await equipmentService.remove(id);
    } catch {
      // If deletion fails, the row simply won't come back until refresh.
    }
  }

  const rows = listings.map((eq) => {
    const photos = (eq.equipment_photos || []).slice().sort((a, b) => a.sort_order - b.sort_order);
    return {
      ...eq,
      image: photos[0]?.url || "",
      ownerName: eq.owner?.name || "",
      status: eq.flagged ? "flagged" : "active",
      posted: eq.created_at ? new Date(eq.created_at).toLocaleDateString() : "",
    };
  });

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
              backgroundColor: "#F5F5F0",
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
        <span style={{ fontSize: "13px", color: "#555555" }}>{row.ownerName}</span>
      ),
    },
    {
      key: "category",
      label: "Category",
      render: (row) => <Badge bg="#D4EDDA" color="#0F3D1E">{row.category}</Badge>,
    },
    {
      key: "price_day",
      label: "Price/day",
      render: (row) => (
        <span style={{ fontSize: "13px", color: "#111111" }}>K{row.price_day}</span>
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
      key: "posted",
      label: "Posted",
      render: (row) => (
        <span style={{ fontSize: "13px", color: "#555555" }}>{row.posted}</span>
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
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#555555" }}>Loading…</div>
        ) : (
          <AdminTable
            columns={columns}
            rows={rows}
            searchKeys={["name"]}
            searchPlaceholder="Search listings…"
            filters={filters}
            emptyMessage="No listings match your filters"
          />
        )}
      </div>
    </div>
  );
}
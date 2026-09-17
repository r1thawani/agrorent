import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminTopNav from "../../components/AdminTopNav";
import AdminTable from "../../components/AdminTable";
import { adminService } from "../../services/adminService";
import { equipmentService } from "../../services/equipmentService";

const CATEGORIES = ["Tractors", "Ploughs", "Planters", "Harvesters", "Irrigation", "Sprayers", "Other"];

function Badge({ cls, children }) {
  return (
    <span className={`inline-block text-[11px] font-medium px-2.5 py-[3px] rounded-full ${cls}`}>
      {children}
    </span>
  );
}

export default function AdminListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getAllListings().then(setListings).finally(() => setLoading(false));
  }, []);

  async function toggleFlag(id) {
    const target = listings.find((eq) => eq.id === id);
    const prevFlagged = target.flagged;
    setListings((prev) => prev.map((eq) => (eq.id === id ? { ...eq, flagged: !prevFlagged } : eq)));
    try { await adminService.toggleListingFlag(id, prevFlagged); }
    catch { setListings((prev) => prev.map((eq) => (eq.id === id ? { ...eq, flagged: prevFlagged } : eq))); }
  }

  async function removeListing(id) {
    setListings((prev) => prev.filter((eq) => eq.id !== id));
    try { await equipmentService.remove(id); } catch { /* stale optimistic remove is acceptable */ }
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
        <div className="flex items-center gap-3">
          <img src={row.image} alt={row.name}
            className="w-10 h-10 rounded-lg object-cover shrink-0 bg-page" />
          <span className="text-sm font-medium text-ink">{row.name}</span>
        </div>
      ),
    },
    { key: "owner", label: "Owner", render: (row) => <span className="text-[13px] text-ink-muted">{row.ownerName}</span> },
    { key: "category", label: "Category", render: (row) => <Badge cls="bg-green-tint text-green-dark">{row.category}</Badge> },
    { key: "price_day", label: "Price/day", render: (row) => <span className="text-[13px] text-ink">K{row.price_day}</span> },
    {
      key: "status",
      label: "Status",
      render: (row) => row.status === "flagged"
        ? <Badge cls="bg-red-tint text-red">Flagged</Badge>
        : <Badge cls="bg-green-tint text-green-dark">Active</Badge>,
    },
    { key: "posted", label: "Posted", render: (row) => <span className="text-[13px] text-ink-muted">{row.posted}</span> },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex items-center gap-3">
          <Link to={`/listings/${row.id}`} className="text-[13px] text-green no-underline">View</Link>
          <button onClick={() => toggleFlag(row.id)}
            className="text-[13px] text-orange-dark bg-transparent border-none p-0 cursor-pointer">
            {row.status === "flagged" ? "Unflag" : "Flag"}
          </button>
          <button onClick={() => removeListing(row.id)}
            className="text-[13px] text-red bg-transparent border-none p-0 cursor-pointer">
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminTopNav />
      <div className="min-h-[calc(100vh-56px)] bg-page px-4 sm:px-8 py-8">
        <h1 className="text-[22px] font-medium text-ink mb-5">All listings</h1>
        {loading ? (
          <div className="text-center py-20 text-ink-muted">Loading…</div>
        ) : (
          <AdminTable
            columns={columns}
            rows={rows}
            searchKeys={["name"]}
            searchPlaceholder="Search listings…"
            filters={[
              { key: "category", label: "Category", options: ["All categories", ...CATEGORIES] },
              { key: "status", label: "Status", options: ["All status", "active", "flagged"] },
            ]}
            emptyMessage="No listings match your filters"
          />
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import AdminTopNav from "../../components/AdminTopNav";
import AdminTable from "../../components/AdminTable";
import { ADMIN_USERS } from "../../data/mockData";

// Page-level file → 100% inline style (Pattern A), per Section 4.
// Status/Role badge colors are NOT in Section 5's official badge table
// (that table only covers booking/listing statuses), so this page reuses
// the closest existing semantics rather than inventing new hexes:
//   - "active"    → same green as Available/Confirmed (#D4EDDA / #0F3D1E)
//   - "suspended" → same red as Cancelled (#FDECEA / #A02020)
//   - "owner"     → same green tint used for Owner elsewhere in the app
//   - "renter"    → neutral tint (#F5F5F0 / #555555), same as Completed
//   - "admin"     → solid green-dark pill (#0F3D1E bg / white text), to
//                   read as a distinct, higher-authority role
// Flagging this mapping — not pre-specified in the handoff, chosen to stay
// inside the existing palette rather than pull in Tailwind defaults (the
// reference zip uses blue-100/purple-100, which aren't in our design system).

function RoleBadge({ role }) {
  const styles = {
    owner: { backgroundColor: "#D4EDDA", color: "#0F3D1E" },
    renter: { backgroundColor: "#F5F5F0", color: "#555555" },
    admin: { backgroundColor: "#0F3D1E", color: "#FFFFFF" },
  };
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: "11px",
        fontWeight: 500,
        padding: "3px 10px",
        borderRadius: "20px",
        textTransform: "capitalize",
        ...(styles[role] || styles.renter),
      }}
    >
      {role}
    </span>
  );
}

function StatusBadge({ status }) {
  const styles = {
    active: { backgroundColor: "#D4EDDA", color: "#0F3D1E" },
    suspended: { backgroundColor: "#FDECEA", color: "#A02020" },
  };
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: "11px",
        fontWeight: 500,
        padding: "3px 10px",
        borderRadius: "20px",
        textTransform: "capitalize",
        ...(styles[status] || styles.active),
      }}
    >
      {status}
    </span>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState(ADMIN_USERS);

  function toggleStatus(id) {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, status: u.status === "active" ? "suspended" : "active" } : u
      )
    );
  }

  const columns = [
    {
      key: "name",
      label: "Name",
      render: (u) => (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img
            src={u.photo}
            alt={u.name}
            style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }}
          />
          <span style={{ fontSize: "14px", fontWeight: 500, color: "#111111" }}>{u.name}</span>
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
      render: (u) => <span style={{ fontSize: "13px", color: "#555555" }}>{u.email}</span>,
    },
    { key: "role", label: "Role", render: (u) => <RoleBadge role={u.role} /> },
    {
      key: "joined",
      label: "Joined",
      render: (u) => <span style={{ fontSize: "13px", color: "#555555" }}>{u.joined}</span>,
    },
    { key: "status", label: "Status", render: (u) => <StatusBadge status={u.status} /> },
    {
      key: "actions",
      label: "Actions",
      render: (u) => (
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => toggleStatus(u.id)}
            style={{
              fontSize: "13px",
              padding: "6px 14px",
              border: "1px solid #E0E8E3",
              borderRadius: "8px",
              backgroundColor: "#FFFFFF",
              color: "#555555",
              cursor: "pointer",
            }}
          >
            {u.status === "active" ? "Suspend" : "Unsuspend"}
          </button>
          <Link
            to={`/profile/${u.id}`}
            style={{ fontSize: "13px", fontWeight: 500, color: "#1A5C2E", textDecoration: "none" }}
          >
            View profile
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminTopNav />
      <main style={{ backgroundColor: "#F5F5F0", minHeight: "calc(100vh - 104px)", padding: "32px" }}>
        <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 500, color: "#111111", marginBottom: "20px" }}>
            All users
          </h1>
          <AdminTable
            columns={columns}
            rows={users}
            searchKeys={["name", "email"]}
            searchPlaceholder="Search by name or email…"
            filters={[
              { key: "role", label: "Role", options: ["All roles", "renter", "owner", "admin"] },
            ]}
            pageSize={5}
            emptyMessage="No users match your search."
          />
        </div>
      </main>
    </div>
  );
}

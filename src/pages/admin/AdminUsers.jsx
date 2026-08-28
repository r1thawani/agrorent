// FILE: agrorent/src/pages/admin/AdminUsers.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminTopNav from "../../components/AdminTopNav";
import AdminTable from "../../components/AdminTable";
import { adminService } from "../../services/adminService";

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
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService
      .getAllUsers()
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  async function toggleStatus(id) {
    const target = users.find((u) => u.id === id);
    const prevStatus = target.status;
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: u.status === "active" ? "suspended" : "active" } : u))
    );
    try {
      await adminService.toggleUserStatus(id, prevStatus);
    } catch {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: prevStatus } : u)));
    }
  }

  const columns = [
    {
      key: "name",
      label: "Name",
      render: (u) => (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img
            src={u.photo_url}
            alt={u.name}
            style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover", backgroundColor: "#F5F5F0" }}
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
      render: (u) => <span style={{ fontSize: "13px", color: "#555555" }}>{new Date(u.created_at).toLocaleDateString()}</span>,
    },
    { key: "status", label: "Status", render: (u) => <StatusBadge status={u.status} /> },
    {
      key: "actions",
      label: "Actions",
      render: (u) => (
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {u.role === "admin" ? (
            <span style={{ fontSize: "13px", color: "#555555" }}>Protected</span>
          ) : (
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
          )}
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
      <main style={{ backgroundColor: "#F5F5F0", minHeight: "calc(100vh - 56px)", padding: "32px" }}>
        <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 500, color: "#111111", marginBottom: "20px" }}>
            All users
          </h1>
          {loading ? (
            <div style={{ textAlign: "center", padding: "80px 0", color: "#555555" }}>Loading…</div>
          ) : (
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
          )}
        </div>
      </main>
    </div>
  );
}
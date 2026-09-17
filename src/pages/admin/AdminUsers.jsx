import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminTopNav from "../../components/AdminTopNav";
import AdminTable from "../../components/AdminTable";
import { adminService } from "../../services/adminService";

const ROLE_CLS = {
  owner: "bg-green-tint text-green-dark",
  renter: "bg-page text-ink-muted",
  admin: "bg-green-dark text-white",
};
const STATUS_CLS = {
  active: "bg-green-tint text-green-dark",
  suspended: "bg-red-tint text-red",
};

function RoleBadge({ role }) {
  return (
    <span className={`inline-block text-[11px] font-medium px-2.5 py-[3px] rounded-full capitalize ${ROLE_CLS[role] || ROLE_CLS.renter}`}>
      {role}
    </span>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-block text-[11px] font-medium px-2.5 py-[3px] rounded-full capitalize ${STATUS_CLS[status] || STATUS_CLS.active}`}>
      {status}
    </span>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getAllUsers().then(setUsers).finally(() => setLoading(false));
  }, []);

  async function toggleStatus(id) {
    const target = users.find((u) => u.id === id);
    const prevStatus = target.status;
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: u.status === "active" ? "suspended" : "active" } : u)));
    try { await adminService.toggleUserStatus(id, prevStatus); }
    catch { setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: prevStatus } : u))); }
  }

  const columns = [
    {
      key: "name",
      label: "Name",
      render: (u) => (
        <div className="flex items-center gap-2.5">
          <img src={u.photo_url} alt={u.name}
            className="w-8 h-8 rounded-full object-cover shrink-0 bg-page" />
          <span className="text-sm font-medium text-ink">{u.name}</span>
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
      render: (u) => <span className="text-[13px] text-ink-muted">{u.email}</span>,
    },
    { key: "role", label: "Role", render: (u) => <RoleBadge role={u.role} /> },
    {
      key: "joined",
      label: "Joined",
      render: (u) => <span className="text-[13px] text-ink-muted">{new Date(u.created_at).toLocaleDateString()}</span>,
    },
    { key: "status", label: "Status", render: (u) => <StatusBadge status={u.status} /> },
    {
      key: "actions",
      label: "Actions",
      render: (u) => (
        <div className="flex items-center gap-3">
          {u.role === "admin" ? (
            <span className="text-[13px] text-ink-muted">Protected</span>
          ) : (
            <button onClick={() => toggleStatus(u.id)}
              className="text-[13px] px-3.5 py-1.5 border border-border rounded-lg bg-white text-ink-muted cursor-pointer">
              {u.status === "active" ? "Suspend" : "Unsuspend"}
            </button>
          )}
          <Link to={`/profile/${u.id}`} className="text-[13px] font-medium text-green no-underline">
            View profile
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminTopNav />
      <main className="min-h-[calc(100vh-56px)] bg-page px-4 sm:px-8 py-8">
        <div className="max-w-[1120px] mx-auto">
          <h1 className="text-[22px] font-medium text-ink mb-5">All users</h1>
          {loading ? (
            <div className="text-center py-20 text-ink-muted">Loading…</div>
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

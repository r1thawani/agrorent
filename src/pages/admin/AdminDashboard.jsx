import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminTopNav from "../../components/AdminTopNav";
import StatCard from "../../components/StatCard";
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

const thCls = "text-left px-4 py-3 text-xs font-medium uppercase tracking-[0.03em] text-ink-muted";
const tdCls = "px-4 py-3.5 text-[13px] text-ink-muted align-middle";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentSignups, setRecentSignups] = useState([]);
  const [openDisputes, setOpenDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminService.getStats(),
      adminService.getRecentUsers(5),
      adminService.getOpenDisputes(5),
    ])
      .then(([s, users, disputes]) => {
        setStats(s);
        setRecentSignups(users);
        setOpenDisputes(disputes);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <AdminTopNav />
      <main className="min-h-[calc(100vh-56px)] bg-page px-4 sm:px-8 py-8">
        <div className="max-w-[1120px] mx-auto">
          {loading ? (
            <div className="text-center py-20 text-ink-muted">Loading…</div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
                <StatCard label="Total users" value={stats.totalUsers.toLocaleString()} />
                <StatCard label="Total listings" value={stats.totalListings.toLocaleString()} />
                <StatCard label="Total bookings" value={stats.totalBookings.toLocaleString()} />
                <StatCard label="Total revenue" value={`K${stats.totalRevenue.toLocaleString()}`} valueColor="#FF5C00" />
              </div>

              <div className="bg-white rounded-xl border border-border/50 p-5 mb-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[15px] font-medium text-ink">Recent signups</h2>
                  <Link to="/admin/users" className="text-[13px] font-medium text-green no-underline">View all users</Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-page">
                        <th className={thCls}>Name</th>
                        <th className={thCls}>Email</th>
                        <th className={thCls}>Joined</th>
                        <th className={thCls}>Role</th>
                        <th className={thCls}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentSignups.map((u) => (
                        <tr key={u.id} className="border-t border-border">
                          <td className={`${tdCls} text-sm font-medium`}>
                            <Link to={`/profile/${u.id}`} className="text-ink no-underline">{u.name}</Link>
                          </td>
                          <td className={tdCls}>{u.email}</td>
                          <td className={tdCls}>{new Date(u.created_at).toLocaleDateString()}</td>
                          <td className={tdCls}><RoleBadge role={u.role} /></td>
                          <td className={tdCls}><StatusBadge status={u.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-border/50 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[15px] font-medium text-ink">Open disputes</h2>
                  <Link to="/admin/disputes" className="text-[13px] font-medium text-green no-underline">View all disputes</Link>
                </div>
                {openDisputes.length === 0 ? (
                  <p className="text-[13px] text-ink-muted">No open disputes right now.</p>
                ) : (
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-page">
                        <th className={thCls}>Reporter</th>
                        <th className={thCls}>Against</th>
                        <th className={thCls}>Reason</th>
                        <th className={thCls}>Date</th>
                        <th className={thCls}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {openDisputes.map((d) => (
                        <tr key={d.id} className="border-t border-border">
                          <td className={`${tdCls} text-ink`}>{d.reporter?.name}</td>
                          <td className={tdCls}>{d.against?.name}</td>
                          <td className={`${tdCls} max-w-[220px] truncate`}>{d.reason}</td>
                          <td className={tdCls}>{new Date(d.created_at).toLocaleDateString()}</td>
                          <td className={tdCls}>
                            <Link to="/admin/disputes" className="text-[13px] font-medium text-orange no-underline">Resolve</Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

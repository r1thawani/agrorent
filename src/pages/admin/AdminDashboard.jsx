// FILE: agrorent/src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminTopNav from "../../components/AdminTopNav";
import StatCard from "../../components/StatCard";
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

const cardStyle = {
  backgroundColor: "#FFFFFF",
  borderRadius: "12px",
  border: "0.5px solid #E0E8E3",
  padding: "20px",
  marginBottom: "20px",
};

const thStyle = {
  textAlign: "left",
  padding: "12px 16px",
  fontSize: "12px",
  fontWeight: 500,
  textTransform: "uppercase",
  letterSpacing: "0.03em",
  color: "#555555",
};

const tdStyle = { padding: "14px 16px", fontSize: "13px", color: "#555555", verticalAlign: "middle" };

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
      <main style={{ backgroundColor: "#F5F5F0", minHeight: "calc(100vh - 56px)", padding: "32px" }}>
        <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "80px 0", color: "#555555" }}>Loading…</div>
          ) : (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "16px",
                  marginBottom: "28px",
                }}
              >
                <StatCard label="Total users" value={stats.totalUsers.toLocaleString()} />
                <StatCard label="Total listings" value={stats.totalListings.toLocaleString()} />
                <StatCard label="Total bookings" value={stats.totalBookings.toLocaleString()} />
                <StatCard label="Total revenue" value={`K${stats.totalRevenue.toLocaleString()}`} valueColor="#FF5C00" />
              </div>

              <div style={cardStyle}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                  <h2 style={{ fontSize: "15px", fontWeight: 500, color: "#111111", margin: 0 }}>
                    Recent signups
                  </h2>
                  <Link to="/admin/users" style={{ fontSize: "13px", fontWeight: 500, color: "#1A5C2E", textDecoration: "none" }}>
                    View all users
                  </Link>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#F5F5F0" }}>
                        <th style={thStyle}>Name</th>
                        <th style={thStyle}>Email</th>
                        <th style={thStyle}>Joined</th>
                        <th style={thStyle}>Role</th>
                        <th style={thStyle}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentSignups.map((u) => (
                        <tr key={u.id} style={{ borderTop: "1px solid #E0E8E3" }}>
                          <td style={{ ...tdStyle, fontSize: "14px", fontWeight: 500 }}>
                            <Link to={`/profile/${u.id}`} style={{ color: "#111111", textDecoration: "none" }}>
                              {u.name}
                            </Link>
                          </td>
                          <td style={tdStyle}>{u.email}</td>
                          <td style={tdStyle}>{new Date(u.created_at).toLocaleDateString()}</td>
                          <td style={tdStyle}><RoleBadge role={u.role} /></td>
                          <td style={tdStyle}><StatusBadge status={u.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ ...cardStyle, marginBottom: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                  <h2 style={{ fontSize: "15px", fontWeight: 500, color: "#111111", margin: 0 }}>
                    Open disputes
                  </h2>
                  <Link to="/admin/disputes" style={{ fontSize: "13px", fontWeight: 500, color: "#1A5C2E", textDecoration: "none" }}>
                    View all disputes
                  </Link>
                </div>
                {openDisputes.length === 0 ? (
                  <p style={{ fontSize: "13px", color: "#555555", margin: 0 }}>No open disputes right now.</p>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#F5F5F0" }}>
                        <th style={thStyle}>Reporter</th>
                        <th style={thStyle}>Against</th>
                        <th style={thStyle}>Reason</th>
                        <th style={thStyle}>Date</th>
                        <th style={thStyle}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {openDisputes.map((d) => (
                        <tr key={d.id} style={{ borderTop: "1px solid #E0E8E3" }}>
                          <td style={{ ...tdStyle, color: "#111111" }}>{d.reporter?.name}</td>
                          <td style={tdStyle}>{d.against?.name}</td>
                          <td style={{ ...tdStyle, maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {d.reason}
                          </td>
                          <td style={tdStyle}>{new Date(d.created_at).toLocaleDateString()}</td>
                          <td style={tdStyle}>
                            <Link
                              to="/admin/disputes"
                              style={{ fontSize: "13px", fontWeight: 500, color: "#FF5C00", textDecoration: "none" }}
                            >
                              Resolve
                            </Link>
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
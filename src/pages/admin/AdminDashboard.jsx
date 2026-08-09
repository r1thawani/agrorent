import { Link } from "react-router-dom";
import AdminTopNav from "../../components/AdminTopNav";
import StatCard from "../../components/StatCard";
import { ADMIN_USERS, DISPUTES } from "../../data/mockData";

// Page-level file → 100% inline style (Pattern A), per Section 4.
// Reuses StatCard.jsx (4B) for the 4 top stat cards — no new stat-card
// component needed.
//
// The three sub-tables below (Recent signups / Flagged listings / Open
// disputes) are a dashboard SUMMARY, not a second place to manage this
// data — every "Review"/"Resolve" action here now navigates to the real
// management page (/admin/listings, /admin/disputes) instead of being a
// dead <button> with no handler, which is what these previously were.
//
// Recent signups reads the same ADMIN_USERS export AdminUsers.jsx uses
// (first 5 entries) rather than a separate hardcoded array, to avoid two
// sources of truth for user data. Open disputes now reads the same
// DISPUTES export AdminDisputes.jsx uses, filtered to "open", instead of a
// second hardcoded dispute that could silently drift out of sync with the
// real disputes list. Flagged listings has no matching global field in
// EQUIPMENT yet (flag status lives as local component state on
// AdminListings), so it stays a local demo array — same "local until a
// second consumer needs it" convention used elsewhere in this codebase.

const FLAGGED_LISTINGS = [
  { id: "f1", equipment: "Old Tractor (Broken)", owner: "Unknown User", flaggedBy: "Mutinta M.", reason: "Inaccurate description" },
  { id: "f2", equipment: "Sprayer Unit", owner: "Bwalya Mwape", flaggedBy: "Amos Phiri", reason: "Equipment not as listed" },
];

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
  const recentSignups = ADMIN_USERS.slice(0, 5);
  const openDisputes = DISPUTES.filter((d) => d.status === "open").slice(0, 5);

  return (
    <div>
      <AdminTopNav />
      <main style={{ backgroundColor: "#F5F5F0", minHeight: "calc(100vh - 56px)", padding: "32px" }}>
        <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
              marginBottom: "28px",
            }}
          >
            <StatCard label="Total users" value="2,841" />
            <StatCard label="Total listings" value="384" />
            <StatCard label="Total bookings" value="1,209" />
            <StatCard label="Total revenue" value="K892,400" valueColor="#FF5C00" />
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
                      <td style={tdStyle}>{u.joined}</td>
                      <td style={tdStyle}><RoleBadge role={u.role} /></td>
                      <td style={tdStyle}><StatusBadge status={u.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "15px", fontWeight: 500, color: "#111111", margin: 0 }}>
                Flagged listings
              </h2>
              <Link to="/admin/listings" style={{ fontSize: "13px", fontWeight: 500, color: "#1A5C2E", textDecoration: "none" }}>
                View all listings
              </Link>
            </div>
            {FLAGGED_LISTINGS.length === 0 ? (
              <p style={{ fontSize: "13px", color: "#555555", margin: 0 }}>No flagged listings right now.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#F5F5F0" }}>
                    <th style={thStyle}>Equipment</th>
                    <th style={thStyle}>Owner</th>
                    <th style={thStyle}>Flagged by</th>
                    <th style={thStyle}>Reason</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {FLAGGED_LISTINGS.map((f) => (
                    <tr key={f.id} style={{ borderTop: "1px solid #E0E8E3" }}>
                      <td style={{ ...tdStyle, color: "#111111" }}>{f.equipment}</td>
                      <td style={tdStyle}>{f.owner}</td>
                      <td style={tdStyle}>{f.flaggedBy}</td>
                      <td style={tdStyle}>{f.reason}</td>
                      <td style={tdStyle}>
                        {/* Was a dead <button> with no onClick — now a real
                            link into the full listings table, which is where
                            flag/unflag/delete actually live. */}
                        <Link
                          to="/admin/listings"
                          style={{ fontSize: "13px", fontWeight: 500, color: "#FF5C00", textDecoration: "none" }}
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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
                    <th style={thStyle}>ID</th>
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
                      <td style={{ ...tdStyle, color: "#111111" }}>{d.id}</td>
                      <td style={{ ...tdStyle, color: "#111111" }}>{d.reporter.name}</td>
                      <td style={tdStyle}>{d.against.name}</td>
                      <td style={{ ...tdStyle, maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {d.reason}
                      </td>
                      <td style={tdStyle}>{d.date}</td>
                      <td style={tdStyle}>
                        {/* Was a dead <button> with no onClick, and this
                            table used to be a separate hardcoded dispute
                            that didn't match AdminDisputes.jsx's data at
                            all — now both read the same DISPUTES export, and
                            resolving actually happens on that page. */}
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
        </div>
      </main>
    </div>
  );
}

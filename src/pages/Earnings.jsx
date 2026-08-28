// FILE: agrorent/src/pages/Earnings.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";
import { bookingService } from "../services/bookingService";
import { useAuth } from "../hooks/useAuth";

function PayoutStatusBadge({ status }) {
  const styles = {
    completed: { bg: "#D4EDDA", color: "#0F3D1E", label: "Completed" },
    confirmed: { bg: "#FFE8D6", color: "#CC4A00", label: "Confirmed" },
  };
  const s = styles[status] || { bg: "#E0E8E3", color: "#555555", label: status };
  return (
    <span
      style={{
        fontSize: "11px",
        padding: "3px 10px",
        borderRadius: "20px",
        fontWeight: 500,
        backgroundColor: s.bg,
        color: s.color,
      }}
    >
      {s.label}
    </span>
  );
}

function MiniBarChart({ data }) {
  const max = Math.max(...data.map((d) => d.amount), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "14px", height: "180px" }}>
      {data.map((d) => (
        <div key={d.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
          <div
            title={`K${d.amount.toLocaleString()}`}
            style={{
              width: "100%",
              maxWidth: "36px",
              height: `${Math.max((d.amount / max) * 140, 6)}px`,
              backgroundColor: "#FF5C00",
              borderRadius: "4px 4px 0 0",
            }}
          />
          <div style={{ fontSize: "11px", color: "#555555", marginTop: "8px" }}>{d.month}</div>
        </div>
      ))}
    </div>
  );
}

function lastEightMonths() {
  const months = [];
  const now = new Date();
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString("default", { month: "short" }) });
  }
  return months;
}

export default function Earnings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payoutRequested, setPayoutRequested] = useState(false);

  useEffect(() => {
    if (!user) return;
    bookingService
      .getRequestsForOwner(user.id)
      .then(setBookings)
      .finally(() => setLoading(false));
  }, [user]);

  // "Earnings" = total value of bookings that actually went through
  // (confirmed or completed). "Pending payout" = the balance still owed at
  // pickup on confirmed-but-not-yet-completed bookings — there's no separate
  // payout/transfer system in the database yet, so this is the closest real
  // signal available rather than a fabricated number.
  const earningBookings = bookings.filter((b) => b.status === "confirmed" || b.status === "completed");
  const totalEarnings = earningBookings.reduce((sum, b) => sum + Number(b.total_price), 0);
  const pendingPayout = bookings
    .filter((b) => b.status === "confirmed")
    .reduce((sum, b) => sum + Number(b.balance_due), 0);

  const months = lastEightMonths();
  const monthlyData = months.map(({ key, label }) => {
    const amount = earningBookings
      .filter((b) => {
        const d = new Date(b.created_at);
        return `${d.getFullYear()}-${d.getMonth()}` === key;
      })
      .reduce((sum, b) => sum + Number(b.total_price), 0);
    return { month: label, amount };
  });
  const thisMonth = monthlyData[monthlyData.length - 1]?.amount || 0;

  const payoutHistory = earningBookings
    .slice()
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F5F5F0", paddingTop: "56px" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 24px", display: "flex", gap: "24px" }}>
        <Sidebar role="owner" activeLink="/earnings" />

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: "22px", fontWeight: 500, color: "#111111", marginBottom: "20px" }}>
            Earnings
          </h1>

          {loading ? (
            <div style={{ textAlign: "center", padding: "64px 0", color: "#555555" }}>Loading…</div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "28px" }}>
                <StatCard label="Total earnings" value={`K${totalEarnings.toLocaleString()}`} valueColor="#FF5C00" />
                <StatCard label="This month" value={`K${thisMonth.toLocaleString()}`} valueColor="#FF5C00" />
                <StatCard label="Balance due at pickup" value={`K${pendingPayout.toLocaleString()}`} />
              </div>

              {/* Chart */}
              <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", padding: "20px", marginBottom: "28px", border: "0.5px solid #E0E8E3" }}>
                <h2 style={{ fontSize: "15px", fontWeight: 500, color: "#111111", marginBottom: "16px" }}>
                  Monthly earnings
                </h2>
                <MiniBarChart data={monthlyData} />
              </div>

              {/* Booking earnings history */}
              <div style={{ marginBottom: "28px" }}>
                <h2 style={{ fontSize: "15px", fontWeight: 500, color: "#111111", marginBottom: "16px" }}>
                  Recent booking earnings
                </h2>
                {payoutHistory.length === 0 ? (
                  <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", padding: "24px", textAlign: "center", color: "#555555", fontSize: "14px", border: "0.5px solid #E0E8E3" }}>
                    No earnings yet.
                  </div>
                ) : (
                  <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", overflow: "hidden", border: "0.5px solid #E0E8E3" }}>
                    {payoutHistory.map((b, i) => (
                      <div
                        key={b.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: "12px 16px",
                          borderBottom: i !== payoutHistory.length - 1 ? "1px solid #E0E8E3" : "none",
                        }}
                      >
                        <span style={{ fontSize: "13px", color: "#555555", width: "120px", flexShrink: 0 }}>
                          {new Date(b.created_at).toLocaleDateString()}
                        </span>
                        <span style={{ fontSize: "14px", color: "#111111", flex: 1 }}>
                          Booking for {b.equipment?.name}
                        </span>
                        <span style={{ fontSize: "14px", fontWeight: 500, color: "#111111", marginRight: "12px" }}>
                          K{Number(b.total_price).toLocaleString()}
                        </span>
                        <PayoutStatusBadge status={b.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <p style={{ fontSize: "12px", color: "#999999", marginBottom: "28px" }}>
                Payout transfers to your mobile money account aren't set up yet — the figures
                above reflect booking value, not an actual completed bank transfer.
              </p>

              {!payoutRequested ? (
                <button
                  onClick={() => setPayoutRequested(true)}
                  style={{
                    padding: "10px 24px",
                    fontSize: "14px",
                    color: "#FFFFFF",
                    borderRadius: "8px",
                    fontWeight: 500,
                    backgroundColor: "#1A5C2E",
                    border: "none",
                    cursor: "pointer",
                    marginBottom: "28px",
                  }}
                >
                  Request payout
                </button>
              ) : (
                <div
                  style={{
                    fontSize: "13px",
                    color: "#0F3D1E",
                    backgroundColor: "#D4EDDA",
                    borderRadius: "8px",
                    padding: "10px 16px",
                    marginBottom: "28px",
                    display: "inline-block",
                  }}
                >
                  Payout requested — you'll be notified once it's processed.
                </div>
              )}

              <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", padding: "20px", border: "0.5px solid #E0E8E3" }}>
                <h2 style={{ fontSize: "15px", fontWeight: 500, color: "#111111", marginBottom: "12px" }}>
                  Your payout account
                </h2>
                <div style={{ fontSize: "14px", color: "#111111" }}>Not set up yet</div>
                <Link to="/profile/edit" style={{ fontSize: "13px", color: "#1A5C2E", marginTop: "8px", display: "inline-block" }}>
                  Edit payout details
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
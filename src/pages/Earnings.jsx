import { useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";

// Local to this page, same convention as the reference zip's Earnings.tsx (its
// MONTHLY_DATA/PAYOUTS aren't in mockData.ts either) and the project's existing
// "local until a second consumer needs it" rule. No mockData.js export added for
// this sub-phase - flag to the person if Earnings-shaped data should move there.
const MONTHLY_DATA = [
  { month: "Jul", amount: 4200 },
  { month: "Aug", amount: 6800 },
  { month: "Sep", amount: 9100 },
  { month: "Oct", amount: 7400 },
  { month: "Nov", amount: 11200 },
  { month: "Dec", amount: 8300 },
  { month: "Jan", amount: 5600 },
  { month: "Feb", amount: 14250 },
];

const PAYOUTS = [
  { date: "20 Jan 2025", equipment: "John Deere 5075E Tractor", amount: 1750, status: "Paid" },
  { date: "15 Jan 2025", equipment: "4-Row Maize Planter", amount: 600, status: "Paid" },
  { date: "3 Jan 2025", equipment: "3-Disc Plough", amount: 240, status: "Paid" },
  { date: "28 Dec 2024", equipment: "John Deere 5075E Tractor", amount: 1250, status: "Paid" },
];

// Reuses the existing status-badge color table (Section 5) - "Paid" maps to the
// same green used for Available/Confirmed, since there's no dedicated payout
// status color defined yet.
function PayoutStatusBadge({ status }) {
  return (
    <span
      style={{
        fontSize: "11px",
        padding: "3px 10px",
        borderRadius: "20px",
        fontWeight: 500,
        backgroundColor: "#D4EDDA",
        color: "#0F3D1E",
      }}
    >
      {status}
    </span>
  );
}

// Small local bar-chart, built with plain divs since recharts isn't an installed
// dependency (Section 10 - not to be added without asking). Not extracted to
// components/ since no other page needs a chart yet.
function MiniBarChart({ data }) {
  const max = Math.max(...data.map((d) => d.amount));
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

export default function Earnings() {
  const [payoutRequested, setPayoutRequested] = useState(false);

  const totalEarnings = MONTHLY_DATA.reduce((sum, d) => sum + d.amount, 0);
  const thisMonth = MONTHLY_DATA[MONTHLY_DATA.length - 1].amount;
  const pendingPayout = 3250;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F5F5F0", paddingTop: "56px" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 24px", display: "flex", gap: "24px" }}>
        <Sidebar role="owner" activeLink="/earnings" />

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: "22px", fontWeight: 500, color: "#111111", marginBottom: "20px" }}>
            Earnings
          </h1>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "28px" }}>
            <StatCard label="Total earnings" value={`K${totalEarnings.toLocaleString()}`} valueColor="#FF5C00" />
            <StatCard label="This month" value={`K${thisMonth.toLocaleString()}`} valueColor="#FF5C00" />
            <StatCard label="Pending payout" value={`K${pendingPayout.toLocaleString()}`} />
          </div>

          {/* Chart */}
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", padding: "20px", marginBottom: "28px", border: "0.5px solid #E0E8E3" }}>
            <h2 style={{ fontSize: "15px", fontWeight: 500, color: "#111111", marginBottom: "16px" }}>
              Monthly earnings
            </h2>
            <MiniBarChart data={MONTHLY_DATA} />
          </div>

          {/* Payout history */}
          <div style={{ marginBottom: "28px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: 500, color: "#111111", marginBottom: "16px" }}>
              Payout history
            </h2>
            <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", overflow: "hidden", border: "0.5px solid #E0E8E3" }}>
              {PAYOUTS.map((p, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "12px 16px",
                    borderBottom: i !== PAYOUTS.length - 1 ? "1px solid #E0E8E3" : "none",
                  }}
                >
                  <span style={{ fontSize: "13px", color: "#555555", width: "120px", flexShrink: 0 }}>{p.date}</span>
                  <span style={{ fontSize: "14px", color: "#111111", flex: 1 }}>Payout for {p.equipment}</span>
                  <span style={{ fontSize: "14px", fontWeight: 500, color: "#111111", marginRight: "12px" }}>
                    K{p.amount.toLocaleString()}
                  </span>
                  <PayoutStatusBadge status={p.status} />
                </div>
              ))}
            </div>
          </div>

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
              Payout requested - you'll be notified once it's processed.
            </div>
          )}

          {/* Payout account */}
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", padding: "20px", border: "0.5px solid #E0E8E3" }}>
            <h2 style={{ fontSize: "15px", fontWeight: 500, color: "#111111", marginBottom: "12px" }}>
              Your payout account
            </h2>
            <div style={{ fontSize: "14px", color: "#111111" }}>Airtel Money — +260 97 123 4567</div>
            <Link to="/profile/edit" style={{ fontSize: "13px", color: "#1A5C2E", marginTop: "8px", display: "inline-block" }}>
              Edit payout details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

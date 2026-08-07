// src/components/StatCard.jsx
// New shared component — sub-phase 4B.
// Reusable stat card used by Dashboard.jsx and OwnerDashboard.jsx.
// Built fully inline-style (Pattern A) — no hover/active state needed, so no
// Tailwind required, consistent with the precedent set by Sidebar.jsx in 4A.

export default function StatCard({ label, value, valueColor }) {
  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "12px",
        padding: "16px",
        border: "0.5px solid #E0E8E3",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          color: "#555555",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "26px",
          fontWeight: 500,
          color: valueColor || "#111111",
          marginTop: "4px",
        }}
      >
        {value}
      </div>
    </div>
  );
}

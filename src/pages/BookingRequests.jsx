// FILE: agrorent/src/pages/BookingRequests.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { bookingService } from "../services/bookingService";
import { useAuth } from "../hooks/useAuth";

const TABS = ["Pending", "Accepted", "Declined"];

// Maps the tab label to the real database status value.
const TAB_TO_STATUS = {
  Pending: "pending",
  Accepted: "confirmed",
  Declined: "declined",
};

const STATUS_STYLES = {
  pending: { bg: "#FFE8D6", text: "#CC4A00", label: "Pending" },
  confirmed: { bg: "#D4EDDA", text: "#0F3D1E", label: "Accepted" },
  declined: { bg: "#FDECEA", text: "#A02020", label: "Declined" },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: "11px",
        fontWeight: 500,
        padding: "3px 10px",
        borderRadius: "20px",
        backgroundColor: s.bg,
        color: s.text,
      }}
    >
      {s.label}
    </span>
  );
}

function RequestRow({ request, onAccept, onDecline }) {
  const dateRange = `${request.start_date} → ${request.end_date}`;
  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "12px",
        padding: "16px",
        border: "0.5px solid #E0E8E3",
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
      }}
    >
      <img
        src={request.renter?.photo_url}
        alt={request.renter?.name}
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
          backgroundColor: "#F5F5F0",
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "15px", fontWeight: 500, color: "#111111" }}>
          {request.renter?.name}
        </div>
        <div style={{ fontSize: "13px", color: "#555555", marginTop: "2px" }}>
          wants to rent{" "}
          <Link
            to={`/listings/${request.equipment_id}`}
            style={{ fontWeight: 500, color: "#1A5C2E", textDecoration: "none" }}
          >
            {request.equipment?.name}
          </Link>
        </div>
        <div style={{ fontSize: "13px", color: "#555555" }}>{dateRange}</div>
        <div
          style={{
            fontSize: "15px",
            fontWeight: 500,
            color: "#FF5C00",
            marginTop: "4px",
          }}
        >
          K{Number(request.total_price).toLocaleString()} total
        </div>
      </div>
      <div style={{ flexShrink: 0 }}>
        {request.status === "pending" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <button
              onClick={() => onAccept(request.id)}
              style={{
                backgroundColor: "#1A5C2E",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "8px",
                padding: "9px 18px",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Accept
            </button>
            <button
              onClick={() => onDecline(request.id)}
              style={{
                backgroundColor: "transparent",
                color: "#555555",
                border: "0.5px solid #CCCCCC",
                borderRadius: "8px",
                padding: "9px 18px",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Decline
            </button>
            <Link
              to="/messages"
              style={{
                fontSize: "12px",
                textAlign: "center",
                color: "#1A5C2E",
                textDecoration: "none",
              }}
            >
              Message renter
            </Link>
          </div>
        ) : (
          <StatusBadge status={request.status} />
        )}
      </div>
    </div>
  );
}

export default function BookingRequests() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Pending");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!user) return;
    bookingService
      .getRequestsForOwner(user.id)
      .then(setRequests)
      .catch(() => setLoadError("Could not load booking requests."))
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = requests.filter((r) => r.status === TAB_TO_STATUS[activeTab]);

  async function accept(id) {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "confirmed" } : r)));
    try {
      await bookingService.accept(id);
    } catch {
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "pending" } : r)));
    }
  }

  async function decline(id) {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "declined" } : r)));
    try {
      await bookingService.decline(id);
    } catch {
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "pending" } : r)));
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#F5F5F0", paddingTop: "56px" }}>
      <Sidebar role="owner" activeLink="/booking-requests" />
      <div style={{ flex: 1, padding: "32px 40px" }}>
        <h1
          style={{
            fontSize: "22px",
            fontWeight: 500,
            color: "#111111",
            marginBottom: "16px",
          }}
        >
          Booking requests
        </h1>

        <div
          style={{
            display: "flex",
            gap: "24px",
            borderBottom: "1px solid #E0E8E3",
            marginBottom: "20px",
          }}
        >
          {TABS.map((tab) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                  paddingBottom: "12px",
                  borderBottom: active ? "2px solid #FF5C00" : "2px solid transparent",
                  color: active ? "#FF5C00" : "#555555",
                  fontWeight: active ? 500 : 400,
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: "40px", color: "#555555" }}>Loading…</div>
        )}

        {loadError && (
          <div style={{ textAlign: "center", padding: "40px", color: "#A02020" }}>{loadError}</div>
        )}

        {!loading && !loadError && filtered.length === 0 && (
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "12px",
              padding: "40px",
              textAlign: "center",
              fontSize: "14px",
              color: "#555555",
              border: "0.5px solid #E0E8E3",
            }}
          >
            No {activeTab.toLowerCase()} requests
          </div>
        )}

        {!loading && !loadError && filtered.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filtered.map((r) => (
              <RequestRow
                key={r.id}
                request={r}
                onAccept={accept}
                onDecline={decline}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
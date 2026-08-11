import { useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { BOOKING_REQUESTS } from "../data/mockData";
import { bookingService } from "../services/bookingService";

const TABS = ["Pending", "Accepted", "Declined"];

const STATUS_STYLES = {
  pending: { bg: "#FFE8D6", text: "#CC4A00" },
  accepted: { bg: "#D4EDDA", text: "#0F3D1E" },
  declined: { bg: "#FDECEA", text: "#A02020" },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status];
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
        textTransform: "capitalize",
      }}
    >
      {status}
    </span>
  );
}

function RequestRow({ request, onAccept, onDecline }) {
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
        src={request.renterPhoto}
        alt={request.renter}
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "15px", fontWeight: 500, color: "#111111" }}>
          {request.renter}
        </div>
        <div style={{ fontSize: "13px", color: "#555555", marginTop: "2px" }}>
          wants to rent{" "}
          <Link
            to={`/listings/${request.equipmentId}`}
            style={{ fontWeight: 500, color: "#1A5C2E", textDecoration: "none" }}
          >
            {request.equipment}
          </Link>
        </div>
        <div style={{ fontSize: "13px", color: "#555555" }}>{request.dates}</div>
        <div
          style={{
            fontSize: "15px",
            fontWeight: 500,
            color: "#FF5C00",
            marginTop: "4px",
          }}
        >
          K{request.value.toLocaleString()} total
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
  const [activeTab, setActiveTab] = useState("Pending");
  const [requests, setRequests] = useState(BOOKING_REQUESTS);

  const filtered = requests.filter(
    (r) => r.status === activeTab.toLowerCase()
  );

  async function accept(id) {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "accepted" } : r))
    );
    await bookingService.accept(id);
  }

  async function decline(id) {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "declined" } : r))
    );
    await bookingService.decline(id);
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

        {filtered.length === 0 ? (
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
        ) : (
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

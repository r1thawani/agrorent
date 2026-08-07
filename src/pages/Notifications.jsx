import { useState } from "react";
import { CheckCircle, Clock, MessageSquare, Bell } from "lucide-react";
import Sidebar from "../components/Sidebar";
import { NOTIFICATIONS } from "../data/mockData";

const ICON_CONFIG = {
  confirmed: { bg: "#D4EDDA", color: "#0F3D1E", Icon: CheckCircle },
  completed: { bg: "#D4EDDA", color: "#0F3D1E", Icon: CheckCircle },
  request: { bg: "#FFE8D6", color: "#CC4A00", Icon: Clock },
  message: { bg: "#E0E8E3", color: "#555555", Icon: MessageSquare },
};

function NotificationIcon({ type }) {
  const { bg, color, Icon } = ICON_CONFIG[type] || { bg: "#E0E8E3", color: "#555555", Icon: Bell };
  return (
    <div
      style={{
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        backgroundColor: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Icon size={18} color={color} />
    </div>
  );
}

export default function Notifications() {
  const [notifs, setNotifs] = useState(NOTIFICATIONS);

  function markAllRead() {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <div style={{ backgroundColor: "#F5F5F0", minHeight: "100vh", paddingTop: "56px" }}>
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "32px 24px",
          display: "flex",
          gap: "24px",
        }}
      >
        <Sidebar role="renter" />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "20px",
            }}
          >
            <h1 style={{ fontSize: "26px", fontWeight: 500, color: "#111111" }}>Notifications</h1>
            <button
              onClick={markAllRead}
              style={{
                background: "none",
                border: "none",
                fontSize: "13px",
                fontWeight: 500,
                color: "#FF5C00",
                cursor: "pointer",
                padding: 0,
              }}
            >
              Mark all as read
            </button>
          </div>

          {notifs.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "64px 0",
                gap: "12px",
              }}
            >
              <Bell size={32} color="#E0E8E3" />
              <div style={{ fontSize: "14px", color: "#555555" }}>No notifications yet</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {notifs.map((n) => (
                <div
                  key={n.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    padding: "14px 16px",
                    borderRadius: "12px",
                    backgroundColor: n.read ? "#FFFFFF" : "#FFF8F5",
                    border: n.read ? "0.5px solid #E0E8E3" : "none",
                    borderLeft: n.read ? undefined : "3px solid #FF5C00",
                  }}
                >
                  <NotificationIcon type={n.type} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", color: "#111111", lineHeight: 1.4 }}>{n.text}</div>
                    <div style={{ fontSize: "12px", color: "#555555", marginTop: "4px" }}>{n.time}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

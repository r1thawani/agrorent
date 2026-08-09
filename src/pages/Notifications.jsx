import { Bell } from "lucide-react";
import Sidebar from "../components/Sidebar";
import NotificationItem from "../components/Notification";
import { useNotifications } from "../context/NotificationContext";

export default function Notifications() {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();

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
              onClick={markAllAsRead}
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

          {notifications.length === 0 ? (
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
              {notifications.map((n) => (
                <NotificationItem key={n.id} notification={n} onClick={() => markAsRead(n.id)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

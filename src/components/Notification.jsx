import { CheckCircle, Clock, MessageSquare, Bell } from "lucide-react";

// One notification row: icon + text + timestamp, with an unread accent.
// Extracted from Notifications.jsx — Dashboard.jsx's "Recent notifications"
// widget had the same icon-by-type logic and row markup duplicated inline.

const ICON_CONFIG = {
  confirmed: { bg: "#D4EDDA", color: "#0F3D1E", Icon: CheckCircle },
  completed: { bg: "#D4EDDA", color: "#0F3D1E", Icon: CheckCircle },
  request: { bg: "#FFE8D6", color: "#CC4A00", Icon: Clock },
  message: { bg: "#E0E8E3", color: "#555555", Icon: MessageSquare },
};

export default function Notification({ notification, onClick }) {
  const { type, text, time, read } = notification;
  const { bg, color, Icon } = ICON_CONFIG[type] || { bg: "#E0E8E3", color: "#555555", Icon: Bell };

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        padding: "14px 16px",
        borderRadius: "12px",
        backgroundColor: read ? "#FFFFFF" : "#FFF8F5",
        border: read ? "0.5px solid #E0E8E3" : "none",
        borderLeft: read ? undefined : "3px solid #FF5C00",
        cursor: onClick ? "pointer" : "default",
      }}
    >
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
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "14px", color: "#111111", lineHeight: 1.4 }}>{text}</div>
        <div style={{ fontSize: "12px", color: "#555555", marginTop: "4px" }}>{time}</div>
      </div>
    </div>
  );
}

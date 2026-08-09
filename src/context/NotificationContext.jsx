import { createContext, useContext, useState } from "react";
import { NOTIFICATIONS } from "../data/mockData";

// Same pattern as AuthContext.jsx: lifted to context so notification state
// (read/unread, the unread count for a navbar badge) is shared across pages
// instead of each page keeping its own local copy. Notifications.jsx and
// Dashboard.jsx both display notifications, so both need to agree on what's
// been read.
//
// Swap NOTIFICATIONS/setNotifications for real API calls when the backend
// exists — the shape of the returned value is designed to stay the same.

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  function markAsRead(id) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function addNotification(notification) {
    setNotifications((prev) => [{ id: `n${Date.now()}`, read: false, time: "Just now", ...notification }, ...prev]);
  }

  const value = { notifications, unreadCount, markAsRead, markAllAsRead, addNotification };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications() must be used inside <NotificationProvider>. Check main.jsx.");
  }
  return ctx;
}

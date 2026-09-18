// FILE: agrorent/src/context/NotificationContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";

const NotificationContext = createContext(null);

function formatTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    setLoading(true);
    setLoadError("");
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) { setLoadError("Could not load notifications."); return; }
        if (data) setNotifications(data.map((n) => ({ ...n, time: formatTime(n.created_at) })));
      })
      .finally(() => setLoading(false));
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function markAsRead(id) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await supabase.from("notifications").update({ read: true }).eq("id", id);
    } catch {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: false } : n)));
    }
  }

  async function markAllAsRead() {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (unreadIds.length === 0 || !user) return;
    try {
      await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).in("id", unreadIds);
    } catch {
      // Not rolling back a bulk failure — acceptable tradeoff for simplicity.
    }
  }

  const value = { notifications, unreadCount, loading, loadError, markAsRead, markAllAsRead };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications() must be used inside <NotificationProvider>. Check main.jsx.");
  }
  return ctx;
}
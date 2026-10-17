// FILE: agrorent/src/context/NotificationContext.jsx
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";

const NotificationContext = createContext(null);

const NO_BADGES = { booking_requests: 0, my_bookings: 0, messages: 0, notifications: 0 };

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
  // Counts for the red badges in the menu (from my_badge_counts() in the DB).
  const [badges, setBadges] = useState(NO_BADGES);
  // Bumped whenever a new notification arrives, so open pages (My Bookings,
  // Booking Requests) can reload without the user refreshing.
  const [lastEventAt, setLastEventAt] = useState(0);

  const refreshBadges = useCallback(async () => {
    if (!user) { setBadges(NO_BADGES); return; }
    const { data, error } = await supabase.rpc("my_badge_counts");
    if (!error && data) setBadges({ ...NO_BADGES, ...data });
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setBadges(NO_BADGES);
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
    refreshBadges();

    // New notifications arrive live (Supabase Realtime)...
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications((prev) => [{ ...payload.new, time: formatTime(payload.new.created_at) }, ...prev]);
          setLastEventAt(Date.now());
          refreshBadges();
        }
      )
      .subscribe();

    // ...and as a fallback, re-check every minute and when the tab regains focus.
    const timer = setInterval(refreshBadges, 60000);
    window.addEventListener("focus", refreshBadges);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(timer);
      window.removeEventListener("focus", refreshBadges);
    };
  }, [user, refreshBadges]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function markAsRead(id) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await supabase.from("notifications").update({ read: true }).eq("id", id);
      refreshBadges();
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
      refreshBadges();
    } catch {
      // Not rolling back a bulk failure — acceptable tradeoff for simplicity.
    }
  }

  const value = {
    notifications, unreadCount, loading, loadError, markAsRead, markAllAsRead,
    badges, refreshBadges, lastEventAt,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications() must be used inside <NotificationProvider>. Check main.jsx.");
  }
  return ctx;
}
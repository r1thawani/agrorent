import { Bell } from "lucide-react";
import Sidebar from "../components/Sidebar";
import NotificationItem from "../components/Notification";
import { useNotifications } from "../context/NotificationContext";

export default function Notifications() {
  const { notifications, loading, loadError, markAsRead, markAllAsRead } = useNotifications();

  return (
    <div className="bg-page min-h-screen pt-14">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-8 pb-8 flex flex-col lg:flex-row gap-6">
        <Sidebar />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-[26px] font-medium text-ink">Notifications</h1>
            {notifications.length > 0 && (
              <button
                onClick={markAllAsRead}
                className="bg-transparent border-none text-[13px] font-medium text-orange cursor-pointer p-0"
              >
                Mark all as read
              </button>
            )}
          </div>

          {loading && (
            <div className="flex flex-col items-center py-16 gap-3">
              <div className="text-sm text-ink-muted">Loading…</div>
            </div>
          )}

          {!loading && loadError && (
            <div className="flex flex-col items-center py-16 gap-3">
              <div className="text-sm text-red">{loadError}</div>
            </div>
          )}

          {!loading && !loadError && notifications.length === 0 && (
            <div className="flex flex-col items-center py-16 gap-3">
              <Bell size={32} color="#E0E8E3" />
              <div className="text-sm text-ink-muted">No notifications yet</div>
            </div>
          )}

          {!loading && !loadError && notifications.length > 0 && (
            <div className="flex flex-col gap-2">
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

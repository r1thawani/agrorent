import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Avatar from "./Avatar";
import {
  LayoutDashboard,
  Calendar,
  MessageSquare,
  Bell,
  Heart,
  User,
  List,
  Inbox,
  DollarSign,
  PlusCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const LINKS = [
  { label: "Overview", path: "/dashboard", icon: LayoutDashboard },
  { label: "My Bookings", path: "/my-bookings", icon: Calendar },
  { label: "My Listings", path: "/my-listings", icon: List },
  { label: "Booking Requests", path: "/booking-requests", icon: Inbox },
  { label: "Messages", path: "/messages", icon: MessageSquare },
  { label: "Earnings", path: "/earnings", icon: DollarSign },
  { label: "Notifications", path: "/notifications", icon: Bell },
  { label: "Wishlist", path: "/wishlist", icon: Heart },
  { label: "Edit Profile", path: "/profile/edit", icon: User },
];

export default function Sidebar({ activeLink, userName, userPhoto }) {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentPath = activeLink || location.pathname;
  const displayName = userName || user?.name || "Your account";
  const displayPhoto = userPhoto || user?.photo_url || null;

  const activeLink_ = LINKS.find((l) => l.path === currentPath);
  const ActiveIcon = activeLink_?.icon || LayoutDashboard;

  function close() { setMobileOpen(false); }

  return (
    <aside className="w-full lg:w-[240px] shrink-0 bg-white rounded-xl border border-border/50 sticky top-20 self-start h-fit">

      {/* Mobile: collapsed header row with toggle */}
      <button
        onClick={() => setMobileOpen((o) => !o)}
        className="lg:hidden w-full flex items-center justify-between px-4 py-3 bg-transparent border-none cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <Avatar src={displayPhoto} name={displayName} className="w-9 h-9 text-[12px]" />
          <div className="text-left">
            <div className="text-[13px] font-medium text-ink">{displayName}</div>
            <div className="flex items-center gap-1.5 text-[12px] text-orange">
              <ActiveIcon size={13} />
              {activeLink_?.label || "Menu"}
            </div>
          </div>
        </div>
        {mobileOpen ? <ChevronUp size={18} className="text-ink-muted" /> : <ChevronDown size={18} className="text-ink-muted" />}
      </button>

      {/* Desktop: always-visible header */}
      <div className="hidden lg:flex items-center gap-3 p-5 pb-4">
        <Avatar src={displayPhoto} name={displayName} className="w-12 h-12 text-[15px]" />
        <div className="text-[15px] font-medium text-ink">{displayName}</div>
      </div>

      {/* Nav — always visible on desktop, toggled on mobile */}
      <div className={`${mobileOpen ? "block" : "hidden"} lg:block`}>
        <div className="border-t border-border/50 mx-5 mb-3" />
        <nav className="flex flex-col gap-1 px-3 pb-3">
          {LINKS.map((link) => {
            const Icon = link.icon;
            const active = currentPath === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={close}
                className={`flex items-center gap-3 px-3 h-10 rounded-lg text-sm no-underline transition-colors duration-150 ${
                  active
                    ? "font-medium text-orange bg-orange-tint"
                    : "font-normal text-ink-muted hover:bg-page"
                }`}
              >
                <Icon size={16} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-4 border-t border-border/50 pt-3 mx-2">
          <Link
            to="/post-listing"
            onClick={close}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-[13px] font-medium text-white bg-green no-underline"
          >
            <PlusCircle size={15} />
            Post New Listing
          </Link>
        </div>
      </div>
    </aside>
  );
}

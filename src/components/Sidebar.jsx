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

  const currentPath = activeLink || location.pathname;
  const displayName = userName || user?.name || "Your account";
  const displayPhoto = userPhoto || user?.photo_url || null;

  return (
    <aside className="w-[240px] shrink-0 bg-white rounded-xl border border-border/50 p-5 sticky top-20 self-start h-fit">
      <div className="flex items-center gap-3 mb-4">
        <Avatar src={displayPhoto} name={displayName} className="w-12 h-12 text-[15px]" />
        <div className="text-[15px] font-medium text-ink">{displayName}</div>
      </div>

      <div className="border-t border-border/50 mb-4" />

      <nav className="flex flex-col gap-1">
        {LINKS.map((link) => {
          const Icon = link.icon;
          const active = currentPath === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
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

      <div className="mt-6 pt-4 border-t border-border/50">
        <Link
          to="/post-listing"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-[13px] font-medium text-white bg-green no-underline"
        >
          <PlusCircle size={15} />
          Post New Listing
        </Link>
      </div>
    </aside>
  );
}

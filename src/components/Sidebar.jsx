import { Link, useLocation } from "react-router-dom";
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

const RENTER_LINKS = [
  { label: "Overview", path: "/dashboard", icon: LayoutDashboard },
  { label: "My Bookings", path: "/my-bookings", icon: Calendar },
  { label: "Messages", path: "/messages", icon: MessageSquare },
  { label: "Notifications", path: "/notifications", icon: Bell, badge: 2 },
  { label: "Wishlist", path: "/wishlist", icon: Heart },
  { label: "Edit Profile", path: "/profile/edit", icon: User },
];

const OWNER_LINKS = [
  { label: "Overview", path: "/dashboard/owner", icon: LayoutDashboard },
  { label: "My Listings", path: "/my-listings", icon: List },
  { label: "Booking Requests", path: "/booking-requests", icon: Inbox, badge: 3 },
  { label: "Messages", path: "/messages", icon: MessageSquare },
  { label: "Earnings", path: "/earnings", icon: DollarSign },
  { label: "Notifications", path: "/notifications", icon: Bell, badge: 2 },
  { label: "Edit Profile", path: "/profile/edit", icon: User },
];

/**
 * Sidebar — shared dashboard navigation, used by every dashboard-style page
 * built in sub-phases 4B through 4F.
 *
 * Props:
 *  - role: "renter" | "owner" — controls which link set and which footer CTA show
 *  - activeLink: string (optional) — path to force-highlight as active. If not
 *    passed, the sidebar figures out the active link from the current route
 *    via useLocation(), which is what most pages should rely on.
 *  - userName: string (optional) — display name in the profile header, defaults
 *    to a placeholder until real auth/profile data exists.
 *  - userPhoto: string (optional) — avatar image URL, defaults to a placeholder.
 */
export default function Sidebar({
  role = "renter",
  activeLink,
  userName = "Mutinta Mwansa",
  userPhoto = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop",
}) {
  const location = useLocation();
  const links = role === "owner" ? OWNER_LINKS : RENTER_LINKS;
  const currentPath = activeLink || location.pathname;

  return (
    <aside
      style={{
        width: "240px",
        flexShrink: 0,
        backgroundColor: "#FFFFFF",
        borderRadius: "12px",
        border: "0.5px solid #E0E8E3",
        padding: "20px",
        position: "sticky",
        top: "80px",
        alignSelf: "flex-start",
        height: "fit-content",
      }}
    >
      {/* Profile header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
        <img
          src={userPhoto}
          alt="Profile"
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            objectFit: "cover",
          }}
        />
        <div>
          <div style={{ fontSize: "15px", fontWeight: 500, color: "#111111" }}>
            {userName}
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "#555555",
              textTransform: "capitalize",
            }}
          >
            {role}
          </div>
        </div>
      </div>

      <div style={{ borderTop: "0.5px solid #E0E8E3", marginBottom: "16px" }} />

      {/* Nav links */}
      <nav style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {links.map((link) => {
          const Icon = link.icon;
          const active = currentPath === link.path;

          return (
            <Link
              key={link.path}
              to={link.path}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "0 12px",
                height: "40px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: active ? 500 : 400,
                color: active ? "#FF5C00" : "#555555",
                backgroundColor: active ? "#FFE8D6" : "transparent",
                textDecoration: "none",
                position: "relative",
                transition: "background-color 0.15s ease, color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.backgroundColor = "#F5F5F0";
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <Icon size={16} />
              {link.label}
              {link.badge ? (
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: "10px",
                    color: "#FFFFFF",
                    padding: "2px 6px",
                    borderRadius: "10px",
                    backgroundColor: active ? "#FF5C00" : "#A02020",
                  }}
                >
                  {link.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Owner-only CTA */}
      {role === "owner" && (
        <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "0.5px solid #E0E8E3" }}>
          <Link
            to="/post-listing"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "100%",
              padding: "10px 0",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 500,
              color: "#FFFFFF",
              backgroundColor: "#1A5C2E",
              textDecoration: "none",
              transition: "opacity 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <PlusCircle size={15} />
            Post New Listing
          </Link>
        </div>
      )}
    </aside>
  );
}

// FILE: agrorent/src/components/Sidebar.jsx
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
  const displayPhoto =
    userPhoto ||
    user?.photo_url ||
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop";

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
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
        <img
          src={displayPhoto}
          alt="Profile"
          style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover" }}
        />
        <div style={{ fontSize: "15px", fontWeight: 500, color: "#111111" }}>
          {displayName}
        </div>
      </div>

      <div style={{ borderTop: "0.5px solid #E0E8E3", marginBottom: "16px" }} />

      <nav style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {LINKS.map((link) => {
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
            </Link>
          );
        })}
      </nav>

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
          }}
        >
          <PlusCircle size={15} />
          Post New Listing
        </Link>
      </div>
    </aside>
  );
}
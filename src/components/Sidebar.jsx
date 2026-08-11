import { Link, useLocation, useNavigate } from "react-router-dom";
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
  Repeat,
  Search,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

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
 * Every non-admin account can act as both a renter and an owner — there's
 * no separate "owner account". `role` on the logged-in user is just which
 * mode they're currently in, and the switcher at the bottom of this sidebar
 * flips it (see AuthContext.setRole). Pages still pass a `role` prop for
 * their own default rendering, but the *source of truth* for which link set
 * and CTA show is always the live value from AuthContext, so the sidebar
 * stays in sync everywhere the moment someone switches modes.
 *
 * Props:
 *  - role: "renter" | "owner" — fallback used only if there's no logged-in
 *    user yet (shouldn't normally happen, since every page rendering this
 *    is behind ProtectedRoute).
 *  - activeLink: string (optional) — path to force-highlight as active. If not
 *    passed, the sidebar figures out the active link from the current route
 *    via useLocation(), which is what most pages should rely on.
 *  - userName: string (optional) — display name in the profile header. Defaults
 *    to the logged-in user's name from AuthContext, since every page that
 *    renders this is already behind ProtectedRoute (i.e. someone is logged in).
 *  - userPhoto: string (optional) — avatar image URL, defaults to the logged-in
 *    user's photo, then a placeholder if they haven't set one.
 */
export default function Sidebar({
  role = "renter",
  activeLink,
  userName,
  userPhoto,
}) {
  const { user, setRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Always prefer the live role from AuthContext over whatever the parent
  // page hardcoded, so switching modes updates this sidebar (and its link
  // set) immediately, no matter which page you switch from.
  const currentRole = user?.role || role;
  const links = currentRole === "owner" ? OWNER_LINKS : RENTER_LINKS;
  const currentPath = activeLink || location.pathname;
  const displayName = userName || user?.name || "Your account";
  const displayPhoto =
    userPhoto ||
    user?.photo ||
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop";

  function handleSwitchRole() {
    const nextRole = currentRole === "owner" ? "renter" : "owner";
    setRole(nextRole);
    navigate(nextRole === "owner" ? "/dashboard/owner" : "/dashboard", { replace: true });
  }

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
          src={displayPhoto}
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
            {displayName}
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "#555555",
              textTransform: "capitalize",
            }}
          >
            {currentRole} mode
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
      {currentRole === "owner" && (
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

      {/* Renter-only CTA — same treatment as the owner's "Post New Listing"
          button above, so renters get an equally obvious quick action
          instead of relying only on the small "Browse" link in the navbar. */}
      {currentRole === "renter" && (
        <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "0.5px solid #E0E8E3" }}>
          <Link
            to="/listings"
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
            <Search size={15} />
            Browse Equipment
          </Link>
        </div>
      )}

      {/* Role switcher — every account can act as both a renter and an
          owner, so this is always available (not shown for admin, which
          is a separate account type that never renders this sidebar). */}
      {(currentRole === "renter" || currentRole === "owner") && (
        <div style={{ marginTop: "8px", paddingTop: "0", borderTop: "none" }}>
          <button
            type="button"
            onClick={handleSwitchRole}
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
              color: "#1A5C2E",
              backgroundColor: "#FFFFFF",
              border: "1.5px solid #1A5C2E",
              cursor: "pointer",
              transition: "background-color 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F0F7F2")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
          >
            <Repeat size={15} />
            Switch to {currentRole === "owner" ? "Renter" : "Owner"} Mode
          </button>
        </div>
      )}
    </aside>
  );
}

import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  List,
  CalendarCheck,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

// Admin console's own top bar — the ONE nav shown on every /admin/* page.
//
// Previously this sat *below* the public site's dark-green Navbar (which
// kept rendering "Browse" / "How it works" / a link to the renter
// dashboard — none of which make sense once you're managing the
// platform), on a plain white bar with no AgroRent branding at all. That's
// what made the admin section feel disconnected and "just grey": two
// stacked navs, only one of which looked like AgroRent.
//
// Fix: App.jsx now hides the public Navbar and Footer for any /admin/*
// route, and this bar takes over as the sole chrome — same dark green
// (#0F3D1E) and orange (#FF5C00) as the rest of the site, with the
// AgroRent wordmark, an "Admin" pill so it's unmistakable which mode
// you're in, icons on each nav item (matching the Sidebar convention on
// the renter/owner dashboards), and the admin's own identity + logout on
// the right — so this never again has to borrow the public Navbar's
// logout button.
const ADMIN_LINKS = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { label: "Users", path: "/admin/users", icon: Users },
  { label: "Listings", path: "/admin/listings", icon: List },
  { label: "Bookings", path: "/admin/bookings", icon: CalendarCheck },
  { label: "Disputes", path: "/admin/disputes", icon: AlertTriangle },
];

export default function AdminTopNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <nav
      style={{
        backgroundColor: "#0F3D1E",
        position: "sticky",
        top: 0,
        zIndex: 50,
        height: "56px",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          height: "100%",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          gap: "24px",
        }}
      >
        {/* Left — wordmark + "Admin" pill, links back to the admin overview */}
        <Link
          to="/admin"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              color: "#FFFFFF",
              fontWeight: 500,
              fontSize: "18px",
              letterSpacing: "-0.3px",
            }}
          >
            AgroRent
          </span>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "#0F3D1E",
              backgroundColor: "#FF5C00",
              padding: "2px 9px",
              borderRadius: "20px",
              letterSpacing: "0.02em",
            }}
          >
            Admin
          </span>
        </Link>

        {/* Centre — section links, each highlighted only on an exact match
            so /admin doesn't stay lit up while browsing /admin/users etc. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            flex: 1,
            justifyContent: "center",
          }}
        >
          {ADMIN_LINKS.map((link) => {
            const Icon = link.icon;
            const active = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: active ? 500 : 400,
                  color: active ? "#FF5C00" : "#A8E6BE",
                  backgroundColor: active ? "rgba(255, 92, 0, 0.14)" : "transparent",
                  textDecoration: "none",
                  transition: "background-color 0.15s ease, color 0.15s ease",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <Icon size={15} />
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right — who's logged in + a real, working log out */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <img
              src={user?.photo || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop"}
              alt={user?.name || "Admin"}
              style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover" }}
            />
            <span style={{ color: "#FFFFFF", fontSize: "13px" }}>
              {user?.name || "Admin"}
            </span>
          </div>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: "transparent",
              color: "#A8E6BE",
              fontSize: "13px",
              fontWeight: 500,
              padding: "7px 14px",
              borderRadius: "8px",
              border: "1px solid rgba(168, 230, 190, 0.4)",
              cursor: "pointer",
            }}
          >
            Log Out
          </button>
        </div>
      </div>
    </nav>
  );
}

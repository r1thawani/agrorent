import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

// Shared admin sub-nav, imported directly at the top of every admin page —
// same convention as Sidebar.jsx (4A): a plain component, NOT an <Outlet/>
// layout wrapper, since this project uses <Routes>/<Route> per-page rather
// than nested layout routes. Does NOT render Navbar/Footer itself — those
// already wrap every page at the App.jsx level, same as every other page.
// Built 100% inline-style (Pattern A / Sidebar-style sub-pattern) — hover/
// active states handled with plain onMouseEnter/onMouseLeave, no Tailwind
// needed, matching the precedent set by Sidebar.jsx, StatCard.jsx, and
// PhotoUpload.jsx.

const ADMIN_LINKS = [
  { label: "Dashboard", path: "/admin" },
  { label: "Users", path: "/admin/users" },
  { label: "Listings", path: "/admin/listings" },
  { label: "Bookings", path: "/admin/bookings" },
  { label: "Disputes", path: "/admin/disputes" },
];

export default function AdminTopNav() {
  const location = useLocation();
  const [hovered, setHovered] = useState(null);

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        borderBottom: "1px solid #E0E8E3",
        height: "48px",
        display: "flex",
        alignItems: "center",
        gap: "32px",
        padding: "0 32px",
      }}
    >
      {ADMIN_LINKS.map((link) => {
        // "/admin" must match exactly (not startsWith) so it isn't active
        // for every /admin/* sub-route too.
        const active = location.pathname === link.path;
        const isHovered = hovered === link.path;
        return (
          <Link
            key={link.path}
            to={link.path}
            onMouseEnter={() => setHovered(link.path)}
            onMouseLeave={() => setHovered(null)}
            style={{
              height: "48px",
              display: "flex",
              alignItems: "center",
              fontSize: "14px",
              fontWeight: active ? 500 : 400,
              textDecoration: "none",
              borderBottom: active ? "2px solid #FF5C00" : "2px solid transparent",
              color: active ? "#FF5C00" : isHovered ? "#111111" : "#555555",
              transition: "color 0.15s, border-color 0.15s",
            }}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}

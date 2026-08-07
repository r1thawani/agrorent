import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <nav
      style={{
        backgroundColor: "#0F3D1E",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
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
          justifyContent: "space-between",
        }}
      >
        {/* Left — Logo */}
        <Link
          to="/"
          style={{
            color: "#FFFFFF",
            fontWeight: "500",
            fontSize: "18px",
            letterSpacing: "-0.3px",
            textDecoration: "none",
          }}
        >
          {isHome ? "AgroRent" : "Back to Home"}
        </Link>

        {/* Centre — Nav links */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "32px",
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <Link
            to="/listings"
            style={{ color: "#A8E6BE", fontSize: "14px", textDecoration: "none" }}
          >
            Browse
          </Link>
          <Link
            to="/#how-it-works"
            style={{ color: "#A8E6BE", fontSize: "14px", textDecoration: "none" }}
          >
            How it works
          </Link>
        </div>

        {/* Right — Login + Sign Up */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link
            to="/login"
            style={{ color: "#FFFFFF", fontSize: "14px", textDecoration: "none" }}
          >
            Login
          </Link>
          <Link
            to="/signup"
            style={{
              backgroundColor: "#FF5C00",
              color: "#FFFFFF",
              fontSize: "13px",
              fontWeight: "500",
              padding: "8px 16px",
              borderRadius: "8px",
              textDecoration: "none",
            }}
          >
            Sign Up
          </Link>
        </div>
      </div>
    </nav>
  );
}
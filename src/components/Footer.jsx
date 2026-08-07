import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer style={{ backgroundColor: "#0F3D1E", padding: "40px 0 24px 0" }}>
      <div style={{ width: "90%", maxWidth: "1100px", margin: "0 auto" }}>

        <div style={{ display: "flex", gap: "80px", marginBottom: "32px" }}>

          {/* Column 1 - left */}
          <div style={{ flex: "1", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <p style={{ color: "#FFFFFF", fontWeight: "600", fontSize: "16px", marginBottom: "8px" }}>AgroRent</p>
            <p style={{ color: "#A8E6BE", fontSize: "14px", lineHeight: "1.6" }}>Rent the equipment.<br />Grow the harvest.</p>
          </div>

          {/* Column 2 - center */}
          <div style={{ flex: "1", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <p style={{ color: "#FFFFFF", fontWeight: "600", fontSize: "16px", marginBottom: "8px" }}>Links</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0px", alignItems: "center" }}>
              <Link to="/listings" style={{ color: "#A8E6BE", fontSize: "14px", textDecoration: "none", lineHeight: "1.6" }}>Browse Equipment</Link>
              <Link to="/" style={{ color: "#A8E6BE", fontSize: "14px", textDecoration: "none", lineHeight: "1.6" }}>How It Works</Link>
              <Link to="/listings/new" style={{ color: "#A8E6BE", fontSize: "14px", textDecoration: "none", lineHeight: "1.6" }}>List Your Equipment</Link>
            </div>
          </div>

          {/* Column 3 - right */}
          <div style={{ flex: "1", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <p style={{ color: "#FFFFFF", fontWeight: "600", fontSize: "16px", marginBottom: "8px" }}>Support</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0px", alignItems: "flex-end" }}>
              <Link to="#" style={{ color: "#A8E6BE", fontSize: "14px", textDecoration: "none", lineHeight: "1.6" }}>Contact</Link>
              <Link to="#" style={{ color: "#A8E6BE", fontSize: "14px", textDecoration: "none", lineHeight: "1.6" }}>Privacy Policy</Link>
              <Link to="#" style={{ color: "#A8E6BE", fontSize: "14px", textDecoration: "none", lineHeight: "1.6" }}>Terms of Service</Link>
            </div>
          </div>

        </div>

        {/* Divider */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: "20px" }}>
          <p style={{ color: "#A8E6BE", fontSize: "13px", textAlign: "center" }}>
            © 2025 AgroRent. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}
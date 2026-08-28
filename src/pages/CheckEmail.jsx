// FILE: agrorent/src/pages/CheckEmail.jsx
import { useLocation, Link } from "react-router-dom";
import { Mail } from "lucide-react";

export default function CheckEmail() {
  const location = useLocation();
  const email = location.state?.email || "your email";

  return (
    <div style={{ minHeight: "calc(100vh - 56px)", backgroundColor: "#F5F5F0", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 16px" }}>
      <div style={{ backgroundColor: "#FFFFFF", border: "0.5px solid #E0E8E3", borderRadius: "12px", padding: "40px", width: "100%", maxWidth: "420px", textAlign: "center" }}>
        <Mail size={40} color="#FF5C00" style={{ margin: "0 auto 16px" }} />
        <h1 style={{ fontSize: "20px", fontWeight: 500, color: "#111111", marginBottom: "8px" }}>Check your email</h1>
        <p style={{ fontSize: "14px", color: "#555555", marginBottom: "24px" }}>
          We've sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then come back here to log in.
        </p>
        
          href="https://mail.google.com/mail/u/0/#inbox"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block",
            width: "100%",
            height: "48px",
            lineHeight: "48px",
            borderRadius: "8px",
            backgroundColor: "#FF5C00",
            color: "#FFFFFF",
            fontSize: "15px",
            fontWeight: 500,
            textDecoration: "none",
            marginBottom: "12px",
          }}
        >
          Open Gmail
        </a>
        <Link to="/login" style={{ fontSize: "13px", color: "#1A5C2E", textDecoration: "none" }}>
          Already confirmed? Log in
        </Link>
      </div>
    </div>
  );
}
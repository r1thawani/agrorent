import { Link } from "react-router-dom";
import { Tractor } from "lucide-react";

export default function NotFound() {
  return (
    <div
      style={{
        paddingTop: "56px",
        minHeight: "100vh",
        backgroundColor: "#F5F5F0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "56px 24px",
      }}
    >
      <div>
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            backgroundColor: "#FFE8D6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <Tractor size={28} style={{ color: "#FF5C00" }} />
        </div>
        <h1 style={{ fontSize: "48px", fontWeight: 600, color: "#0F3D1E", lineHeight: 1 }}>404</h1>
        <p style={{ fontSize: "16px", fontWeight: 500, color: "#111111", marginTop: "12px" }}>
          This page took a wrong turn in the field.
        </p>
        <p style={{ fontSize: "14px", color: "#555555", marginTop: "6px" }}>
          The page you're looking for doesn't exist or may have moved.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "28px" }}>
          <Link
            to="/"
            style={{
              padding: "12px 28px",
              borderRadius: "8px",
              backgroundColor: "#FF5C00",
              color: "#FFFFFF",
              fontSize: "13px",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Back to home
          </Link>
          <Link
            to="/listings"
            style={{
              padding: "12px 28px",
              borderRadius: "8px",
              border: "1.5px solid #FF5C00",
              color: "#FF5C00",
              fontSize: "13px",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Browse equipment
          </Link>
        </div>
      </div>
    </div>
  );
}

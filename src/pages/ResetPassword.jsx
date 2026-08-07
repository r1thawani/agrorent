import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setDone(true);
  }

  return (
    <div
      style={{
        minHeight: "calc(100vh - 56px)",
        backgroundColor: "#F5F5F0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 16px",
      }}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          border: "0.5px solid #E0E8E3",
          padding: "40px",
          width: "100%",
          maxWidth: "400px",
        }}
      >
        {done ? (
          <div style={{ textAlign: "center" }}>
            <CheckCircle size={40} style={{ color: "#1A5C2E", margin: "0 auto" }} />
            <h2
              style={{
                fontSize: "20px",
                fontWeight: 500,
                color: "#111111",
                marginTop: "16px",
              }}
            >
              Password updated!
            </h2>
            <p style={{ fontSize: "14px", color: "#555555", marginTop: "8px" }}>
              You can now log in with your new password.
            </p>
            <Link
              to="/login"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginTop: "24px",
                width: "100%",
                height: "48px",
                borderRadius: "8px",
                color: "#FFFFFF",
                fontSize: "15px",
                fontWeight: 500,
                backgroundColor: "#FF5C00",
                textDecoration: "none",
                transition: "opacity 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Go to Login
            </Link>
          </div>
        ) : (
          <>
            <div style={{ textAlign: "center", marginBottom: "28px" }}>
              <div style={{ fontSize: "18px", fontWeight: 500, color: "#1A5C2E" }}>
                AgroRent
              </div>
              <h1
                style={{
                  fontSize: "22px",
                  fontWeight: 500,
                  color: "#111111",
                  marginTop: "4px",
                }}
              >
                Set a new password
              </h1>
            </div>

            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#111111",
                    marginBottom: "6px",
                  }}
                >
                  New password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    height: "44px",
                    padding: "0 12px",
                    fontSize: "14px",
                    border: "1px solid #E0E8E3",
                    borderRadius: "8px",
                    outline: "none",
                    transition: "border-color 0.15s ease",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#FF5C00")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#E0E8E3")}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#111111",
                    marginBottom: "6px",
                  }}
                >
                  Confirm new password
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    height: "44px",
                    padding: "0 12px",
                    fontSize: "14px",
                    border: "1px solid #E0E8E3",
                    borderRadius: "8px",
                    outline: "none",
                    transition: "border-color 0.15s ease",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#FF5C00")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#E0E8E3")}
                />
              </div>

              <button
                type="submit"
                style={{
                  width: "100%",
                  height: "48px",
                  borderRadius: "8px",
                  border: "none",
                  color: "#FFFFFF",
                  fontSize: "15px",
                  fontWeight: 500,
                  backgroundColor: "#FF5C00",
                  cursor: "pointer",
                  transition: "opacity 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Reset Password
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// FILE: agrorent/src/pages/Login.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// Login only distinguishes account TYPE — a regular user vs. an admin.
// Renter/owner is not a login-time choice: every regular account can act
// as both, and which mode you're in is switched from the dashboard (see
// Sidebar.jsx), not picked here. Signup is the only place a "starting"
// mode gets chosen, and even that can be changed right after logging in.
const ACCOUNT_TYPES = [
  { value: "user", label: "User" },
  { value: "admin", label: "Admin" },
];

const ACCOUNT_TYPE_HOME = {
  user: "/dashboard",
  admin: "/admin",
};

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "", accountType: "user" });
  const navigate = useNavigate();
  const { login } = useAuth();

  // Each field updates only its own key, independently of the others and
  // regardless of the order they're filled in — so picking an account type
  // first, last, or in the middle all behave the same way.
  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const pickAccountType = (accountType) => setForm((f) => ({ ...f, accountType }));

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await login(form.email, form.password);
      navigate(ACCOUNT_TYPE_HOME[form.accountType], { replace: true });
    } catch (err) {
      alert(err.message || "Login failed. Check your email and password.");
    }
  }

  const inputStyle = { width: "100%", height: "44px", padding: "0 12px", fontSize: "13px", border: "1.5px solid #E0E8E3", borderRadius: "8px", outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ minHeight: "calc(100vh - 56px)", backgroundColor: "#F5F5F0", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 16px" }}>
      <div style={{ backgroundColor: "#FFFFFF", border: "0.5px solid #E0E8E3", borderRadius: "12px", padding: "40px", width: "100%", maxWidth: "420px" }}>

        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ fontSize: "18px", fontWeight: 500, color: "#1A5C2E" }}>AgroRent</div>
          <h1 style={{ fontSize: "22px", fontWeight: 500, color: "#111111", marginTop: "4px" }}>Welcome back</h1>
          <p style={{ fontSize: "14px", color: "#555555", marginTop: "4px" }}>Log in to your AgroRent account</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Email address</label>
            <input type="email" value={form.email} onChange={update("email")} required style={inputStyle} />
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: 500, color: "#111111" }}>Password</label>
              <Link to="/forgot-password" style={{ fontSize: "12px", color: "#FF5C00", textDecoration: "none" }}>Forgot password?</Link>
            </div>
            <input type="password" value={form.password} onChange={update("password")} required style={inputStyle} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Log in as</label>
            <div style={{ display: "flex", gap: "8px" }}>
              {ACCOUNT_TYPES.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => pickAccountType(opt.value)}
                  aria-pressed={form.accountType === opt.value}
                  style={{
                    flex: 1,
                    height: "40px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer",
                    border: form.accountType === opt.value ? "1.5px solid #FF5C00" : "1.5px solid #E0E8E3",
                    backgroundColor: form.accountType === opt.value ? "#FFF0E6" : "#FFFFFF",
                    color: form.accountType === opt.value ? "#FF5C00" : "#555555",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p style={{ fontSize: "12px", color: "#555555", marginTop: "6px" }}>
              {form.accountType === "admin"
                ? "Admin accounts are created directly in the database — sign up as a regular user, then have an admin update your role."
                : "Renting and listing both live under one account — switch between them anytime from your dashboard."}
            </p>
          </div>

          <button type="submit" style={{ width: "100%", height: "48px", borderRadius: "8px", backgroundColor: "#FF5C00", color: "#FFFFFF", fontSize: "15px", fontWeight: 500, border: "none", cursor: "pointer", marginTop: "8px" }}>
            Log In
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "20px 0" }}>
          <div style={{ flex: 1, height: "1px", backgroundColor: "#E0E8E3" }} />
          <span style={{ fontSize: "12px", color: "#555555" }}>or</span>
          <div style={{ flex: 1, height: "1px", backgroundColor: "#E0E8E3" }} />
        </div>

        <p style={{ textAlign: "center", fontSize: "14px", color: "#555555" }}>
          Don't have an account?{" "}
          <Link to="/signup" style={{ fontWeight: 500, color: "#FF5C00", textDecoration: "none" }}>Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
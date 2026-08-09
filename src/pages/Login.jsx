import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const ROLES = [
  { value: "renter", label: "Renter" },
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
];

const ROLE_HOME = {
  renter: "/dashboard",
  owner: "/dashboard/owner",
  admin: "/admin",
};

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "", role: "renter" });
  const navigate = useNavigate();
  const { login } = useAuth();

  // Each field updates only its own key, independently of the others and
  // regardless of the order they're filled in — so picking a role first,
  // last, or in the middle all behave the same way.
  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const pickRole = (role) => setForm((f) => ({ ...f, role }));

  function handleSubmit(e) {
    e.preventDefault();
    // No backend yet, so this doesn't verify the password — it just marks
    // the app as "logged in" as this email, with whichever role is
    // currently selected in form.role. See AuthContext.jsx.
    login(form.email, form.role);
    navigate(ROLE_HOME[form.role], { replace: true });
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
              {ROLES.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => pickRole(opt.value)}
                  aria-pressed={form.role === opt.value}
                  style={{
                    flex: 1,
                    height: "40px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer",
                    border: form.role === opt.value ? "1.5px solid #FF5C00" : "1.5px solid #E0E8E3",
                    backgroundColor: form.role === opt.value ? "#FFF0E6" : "#FFFFFF",
                    color: form.role === opt.value ? "#FF5C00" : "#555555",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p style={{ fontSize: "12px", color: "#555555", marginTop: "6px" }}>Demo only — no backend yet, so this just picks which dashboard you land on.</p>
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

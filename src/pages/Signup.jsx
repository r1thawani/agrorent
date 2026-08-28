// FILE: agrorent/src/pages/Signup.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LocationSelect from "../components/LocationSelect";
import { useAuth } from "../hooks/useAuth";

const PHONE_REGEX = /^\+260\d{9}$/;

function getPasswordError(password) {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(password)) return "Password must include at least one uppercase letter.";
  if (!/[a-z]/.test(password)) return "Password must include at least one lowercase letter.";
  if (!/[0-9]/.test(password)) return "Password must include at least one number.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Password must include at least one special character.";
  return "";
}

function formatPhoneInput(value) {
  const digitsOnly = value.replace(/\D/g, "").replace(/^260/, "");
  return "+260" + digitsOnly.slice(0, 9);
}

export default function Signup() {
  const [form, setForm] = useState({ name: "", email: "", phone: "+260", password: "", confirm: "", province: "", district: "" });
  const [role, setRole] = useState("renter");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { signup } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();

    if (!PHONE_REGEX.test(form.phone)) {
      setError("Please enter your phone number in the format +260XXXXXXXXX.");
      return;
    }
    const pwError = getPasswordError(form.password);
    if (pwError) {
      setError(pwError);
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!form.province || !form.district) {
      setError("Please select your province and district.");
      return;
    }
    setError("");
    try {
      await signup({ name: form.name, email: form.email, password: form.password, role });
      navigate("/check-email", { state: { email: form.email } });
    } catch (err) {
      setError(err.message || "Signup failed. Please try again.");
    }
  }

  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const inputStyle = { width: "100%", height: "44px", padding: "0 12px", fontSize: "13px", border: "1.5px solid #E0E8E3", borderRadius: "8px", outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ minHeight: "calc(100vh - 56px)", backgroundColor: "#F5F5F0", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 16px" }}>
      <div style={{ backgroundColor: "#FFFFFF", border: "0.5px solid #E0E8E3", borderRadius: "12px", padding: "40px", width: "100%", maxWidth: "480px" }}>

        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ fontSize: "18px", fontWeight: 500, color: "#1A5C2E" }}>AgroRent</div>
          <h1 style={{ fontSize: "22px", fontWeight: 500, color: "#111111", marginTop: "4px" }}>Create your account</h1>
          <p style={{ fontSize: "14px", color: "#555555", marginTop: "4px" }}>It's free. Start renting or listing today.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Full Name</label>
            <input type="text" value={form.name} onChange={update("name")} style={inputStyle} required />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Email</label>
            <input type="email" value={form.email} onChange={update("email")} style={inputStyle} required />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Phone Number</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm(f => ({ ...f, phone: formatPhoneInput(e.target.value) }))}
              placeholder="+260XXXXXXXXX"
              style={inputStyle}
              required
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Password</label>
            <input type="password" value={form.password} onChange={update("password")} style={inputStyle} required />
            <p style={{ fontSize: "12px", color: "#555555", marginTop: "4px" }}>
              Min 8 characters, with uppercase, lowercase, a number, and a special character.
            </p>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Confirm Password</label>
            <input type="password" value={form.confirm} onChange={update("confirm")} style={inputStyle} required />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Your province / district</label>
            <LocationSelect
              province={form.province}
              district={form.district}
              onProvinceChange={(v) => setForm(f => ({ ...f, province: v }))}
              onDistrictChange={(v) => setForm(f => ({ ...f, district: v }))}
              required
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>I'm signing up to</label>
            <div style={{ display: "flex", gap: "10px" }}>
              {[
                { value: "renter", label: "Rent equipment" },
                { value: "owner", label: "List my equipment" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRole(opt.value)}
                  style={{
                    flex: 1,
                    height: "44px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer",
                    border: role === opt.value ? "1.5px solid #FF5C00" : "1.5px solid #E0E8E3",
                    backgroundColor: role === opt.value ? "#FFF0E6" : "#FFFFFF",
                    color: role === opt.value ? "#FF5C00" : "#555555",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p style={{ fontSize: "12px", color: "#555555", marginTop: "6px" }}>This just picks where you land first — every account can both rent and list. Switch anytime with the "Switch to Owner/Renter Mode" button in your dashboard sidebar.</p>
          </div>

          {error && <p style={{ fontSize: "13px", color: "#A02020", margin: 0 }}>{error}</p>}

          <button type="submit" style={{ width: "100%", height: "48px", borderRadius: "8px", backgroundColor: "#FF5C00", color: "#FFFFFF", fontSize: "15px", fontWeight: 500, border: "none", cursor: "pointer", marginTop: "8px" }}>
            Create Account
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: "14px", color: "#555555", marginTop: "20px" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ fontWeight: 500, color: "#FF5C00", textDecoration: "none" }}>Log In</Link>
        </p>
        <p style={{ textAlign: "center", fontSize: "12px", color: "#555555", marginTop: "16px" }}>
          By signing up you agree to our{" "}
          <Link to="/terms" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline", color: "#555555" }}>Terms of Service</Link>{" "}and{" "}
          <Link to="/privacy" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline", color: "#555555" }}>Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
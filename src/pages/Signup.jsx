import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ZAMBIAN_PROVINCES } from "../data/mockData";

export default function Signup() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "", location: "" });
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    navigate("/dashboard");
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
          {[
            { label: "Full Name", field: "name", type: "text" },
            { label: "Email", field: "email", type: "email" },
            { label: "Phone Number", field: "phone", type: "tel", placeholder: "+260…" },
            { label: "Password", field: "password", type: "password" },
            { label: "Confirm Password", field: "confirm", type: "password" },
          ].map(({ label, field, type, placeholder }) => (
            <div key={field}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>{label}</label>
              <input type={type} value={form[field]} onChange={update(field)} placeholder={placeholder || ""} style={inputStyle} required />
              {field === "password" && <p style={{ fontSize: "12px", color: "#555555", marginTop: "4px" }}>Minimum 8 characters</p>}
            </div>
          ))}

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Your district / province</label>
            <select value={form.location} onChange={update("location")} required style={{ ...inputStyle, backgroundColor: "#FFFFFF" }}>
              <option value="">Select location…</option>
              {ZAMBIAN_PROVINCES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>

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
          <Link to="#" style={{ textDecoration: "underline", color: "#555555" }}>Terms of Service</Link>{" "}and{" "}
          <Link to="#" style={{ textDecoration: "underline", color: "#555555" }}>Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
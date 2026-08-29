// FILE: agrorent/src/pages/Signup.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Sparkles } from "lucide-react";
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

// Generates a random password guaranteed to satisfy getPasswordError() —
// one character from each required set, plus random fill, then shuffled
// so the required characters aren't always in the same position.
function generateStrongPassword() {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const numbers = "23456789";
  const special = "!@#$%^&*?";
  const all = upper + lower + numbers + special;

  const pick = (chars) => chars[Math.floor(Math.random() * chars.length)];

  let chars = [pick(upper), pick(lower), pick(numbers), pick(special)];
  for (let i = 0; i < 6; i++) chars.push(pick(all));

  // Shuffle
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

export default function Signup() {
  const [form, setForm] = useState({ name: "", email: "", phone: "+260", password: "", confirm: "", province: "", district: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [suggested, setSuggested] = useState(false);
  const navigate = useNavigate();
  const { signup } = useAuth();

  function suggestPassword() {
    const newPassword = generateStrongPassword();
    setForm((f) => ({ ...f, password: newPassword, confirm: newPassword }));
    setShowPassword(true);
    setSuggested(true);
  }

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
      await signup({ name: form.name, email: form.email, password: form.password });
      navigate("/check-email", { state: { email: form.email } });
    } catch (err) {
      setError(err.message || "Signup failed. Please try again.");
    }
  }

  const update = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    if (field === "password" || field === "confirm") setSuggested(false);
  };

  const inputStyle = { width: "100%", height: "44px", padding: "0 40px 0 12px", fontSize: "13px", border: "1.5px solid #E0E8E3", borderRadius: "8px", outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ minHeight: "calc(100vh - 56px)", backgroundColor: "#F5F5F0", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 16px" }}>
      <div style={{ backgroundColor: "#FFFFFF", border: "0.5px solid #E0E8E3", borderRadius: "12px", padding: "40px", width: "100%", maxWidth: "480px" }}>

        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ fontSize: "18px", fontWeight: 500, color: "#1A5C2E" }}>AgroRent</div>
          <h1 style={{ fontSize: "22px", fontWeight: 500, color: "#111111", marginTop: "4px" }}>Create your account</h1>
          <p style={{ fontSize: "14px", color: "#555555", marginTop: "4px" }}>It's free. Start renting and listing today.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Full Name</label>
            <input type="text" value={form.name} onChange={update("name")} style={{ ...inputStyle, paddingRight: 12 }} required />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Email</label>
            <input type="email" value={form.email} onChange={update("email")} style={{ ...inputStyle, paddingRight: 12 }} required />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Phone Number</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm(f => ({ ...f, phone: formatPhoneInput(e.target.value) }))}
              placeholder="+260XXXXXXXXX"
              style={{ ...inputStyle, paddingRight: 12 }}
              required
            />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: 500, color: "#111111" }}>Password</label>
              <button
                type="button"
                onClick={suggestPassword}
                style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#FF5C00", background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                <Sparkles size={13} />
                Suggest a strong password
              </button>
            </div>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={update("password")}
                style={inputStyle}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} color="#555555" /> : <Eye size={16} color="#555555" />}
              </button>
            </div>
            {suggested ? (
              <p style={{ fontSize: "12px", color: "#0F3D1E", marginTop: "4px" }}>
                Suggested password filled in — make sure to save it somewhere safe.
              </p>
            ) : (
              <p style={{ fontSize: "12px", color: "#555555", marginTop: "4px" }}>
                Min 8 characters, with uppercase, lowercase, a number, and a special character.
              </p>
            )}
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Confirm Password</label>
            <input
              type={showPassword ? "text" : "password"}
              value={form.confirm}
              onChange={update("confirm")}
              style={{ ...inputStyle, paddingRight: 12 }}
              required
            />
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
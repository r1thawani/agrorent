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

function generateStrongPassword() {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const numbers = "23456789";
  const special = "!@#$%^&*?";
  const all = upper + lower + numbers + special;

  const pick = (chars) => chars[Math.floor(Math.random() * chars.length)];

  let chars = [pick(upper), pick(lower), pick(numbers), pick(special)];
  for (let i = 0; i < 6; i++) chars.push(pick(all));

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
    if (pwError) { setError(pwError); return; }
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    if (!form.province || !form.district) { setError("Please select your province and district."); return; }
    setError("");
    try {
      await signup({ name: form.name, email: form.email, password: form.password });
      navigate("/check-email", { state: { email: form.email } });
    } catch (err) {
      setError(err.message || "Signup failed. Please try again.");
    }
  }

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (field === "password" || field === "confirm") setSuggested(false);
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-page flex items-center justify-center px-4 py-12">
      <div className="bg-white border border-border/50 rounded-xl p-10 sm:p-12 w-full max-w-[480px]">

        <div className="text-center mb-8">
          <div className="text-lg font-medium text-green">AgroRent</div>
          <h1 className="text-[22px] font-medium text-ink mt-1">Create your account</h1>
          <p className="text-sm text-ink-muted mt-1.5">It's free. Start renting and listing today.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label className="block text-[13px] font-medium text-ink mb-3">Full Name</label>
            <input type="text" value={form.name} onChange={update("name")} required
              className="w-full h-11 px-3 text-[13px] border-[1.5px] border-border rounded-lg outline-none" />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-ink mb-3">Email</label>
            <input type="email" value={form.email} onChange={update("email")} required
              className="w-full h-11 px-3 text-[13px] border-[1.5px] border-border rounded-lg outline-none" />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-ink mb-3">Phone Number</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: formatPhoneInput(e.target.value) }))}
              placeholder="+260XXXXXXXXX"
              required
              className="w-full h-11 px-3 text-[13px] border-[1.5px] border-border rounded-lg outline-none"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[13px] font-medium text-ink mb-3">Password</label>
              <button
                type="button"
                onClick={suggestPassword}
                className="flex items-center gap-1 text-xs text-orange bg-transparent border-none cursor-pointer p-0"
              >
                <Sparkles size={13} />
                Suggest a strong password
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={update("password")}
                required
                className="w-full h-11 px-3 pr-10 text-[13px] border-[1.5px] border-border rounded-lg outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-0 flex"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} color="#555555" /> : <Eye size={16} color="#555555" />}
              </button>
            </div>
            {suggested ? (
              <p className="text-xs text-green-dark mt-1">Suggested password filled in — make sure to save it somewhere safe.</p>
            ) : (
              <p className="text-xs text-ink-muted mt-1">Min 8 characters, with uppercase, lowercase, a number, and a special character.</p>
            )}
          </div>

          <div>
            <label className="block text-[13px] font-medium text-ink mb-3">Confirm Password</label>
            <input
              type={showPassword ? "text" : "password"}
              value={form.confirm}
              onChange={update("confirm")}
              required
              className="w-full h-11 px-3 text-[13px] border-[1.5px] border-border rounded-lg outline-none"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-ink mb-3">Your province / district</label>
            <LocationSelect
              province={form.province}
              district={form.district}
              onProvinceChange={(v) => setForm((f) => ({ ...f, province: v }))}
              onDistrictChange={(v) => setForm((f) => ({ ...f, district: v }))}
              required
            />
          </div>

          {error && <p className="text-[13px] text-red m-0">{error}</p>}

          <button
            type="submit"
            className="w-full h-12 rounded-lg bg-orange text-white text-[15px] font-medium border-none cursor-pointer mt-3"
          >
            Create Account
          </button>
        </form>

        <p className="text-center text-sm text-ink-muted mt-5">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-orange no-underline">Log In</Link>
        </p>
        <p className="text-center text-xs text-ink-muted mt-4">
          By signing up you agree to our{" "}
          <Link to="/terms" target="_blank" rel="noopener noreferrer" className="underline text-ink-muted">Terms of Service</Link>{" "}and{" "}
          <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="underline text-ink-muted">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState("");

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const profile = await login(form.email, form.password);
      navigate(profile.role === "admin" ? "/admin" : "/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed. Check your email and password.");
    }
  }

  return (
    <div className="min-h-[calc(100vh-56px)] bg-page flex items-center justify-center px-4 py-12">
      <div className="bg-white border border-border/50 rounded-xl p-10 sm:p-12 w-full max-w-[420px]">

        <div className="text-center mb-8">
          <div className="text-lg font-medium text-green">AgroRent</div>
          <h1 className="text-[22px] font-medium text-ink mt-1">Welcome back</h1>
          <p className="text-sm text-ink-muted mt-1.5">Log in to your AgroRent account</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label className="block text-[13px] font-medium text-ink mb-3">Email address</label>
            <input
              type="email"
              value={form.email}
              onChange={update("email")}
              required
              className="w-full h-11 px-3 text-[13px] border-[1.5px] border-border rounded-lg outline-none"
            />
          </div>

          <div>
            <div className="flex justify-between mb-3">
              <label className="text-[13px] font-medium text-ink">Password</label>
              <Link to="/forgot-password" className="text-xs text-orange no-underline">Forgot password?</Link>
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
          </div>

          {error && <p className="text-[13px] text-red m-0">{error}</p>}

          <button
            type="submit"
            className="w-full h-12 rounded-lg bg-orange text-white text-[15px] font-medium border-none cursor-pointer mt-3"
          >
            Log In
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-ink-muted">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <p className="text-center text-sm text-ink-muted">
          Don't have an account?{" "}
          <Link to="/signup" className="font-medium text-orange no-underline">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}

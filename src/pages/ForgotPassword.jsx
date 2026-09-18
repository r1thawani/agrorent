import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (err) throw err;
      setSent(true);
    } catch (err) {
      setError(err.message || "Could not send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-56px)] bg-page flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-xl border border-border/50 p-10 w-full max-w-[400px]">
        {sent ? (
          <div className="text-center">
            <CheckCircle size={40} className="text-green mx-auto" />
            <h2 className="text-xl font-medium text-ink mt-4">Check your email</h2>
            <p className="text-sm text-ink-muted mt-2">
              We sent a reset link to {email}. Check your inbox.
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-7">
              <div className="text-lg font-medium text-green">AgroRent</div>
              <h1 className="text-[22px] font-medium text-ink mt-1">Forgot your password?</h1>
              <p className="text-sm text-ink-muted mt-1">
                Enter your email and we'll send you a link to reset it.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div>
                <label className="block text-[13px] font-medium text-ink mb-2">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-11 px-3 text-sm border border-border rounded-lg outline-none transition-colors"
                />
              </div>

              {error && <p className="text-[13px] text-red -mt-2">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className={`w-full h-12 rounded-lg border-none text-white text-[15px] font-medium bg-orange ${loading ? "opacity-70 cursor-default" : "cursor-pointer"}`}
              >
                {loading ? "Sending…" : "Send Reset Link"}
              </button>
            </form>

            <div className="text-center mt-5">
              <Link to="/login" className="text-sm text-green no-underline">Back to Login</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

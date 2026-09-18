import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

function getPasswordError(pw) {
  if (pw.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(pw)) return "Password must contain at least one uppercase letter.";
  if (!/[a-z]/.test(pw)) return "Password must contain at least one lowercase letter.";
  if (!/\d/.test(pw)) return "Password must contain at least one number.";
  return "";
}

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    // Supabase auto-processes the recovery token from the URL hash on load.
    // PASSWORD_RECOVERY event fires when that token is valid.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setSessionReady(true);
    });
    // Handle case where session is already set (e.g. page reload)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const pwError = getPasswordError(password);
    if (pwError) { setError(pwError); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setError("");
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      setDone(true);
      await supabase.auth.signOut();
    } catch (err) {
      setError(err.message || "Could not update your password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-56px)] bg-page flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-xl border border-border/50 p-10 w-full max-w-[400px]">
        {done ? (
          <div className="text-center">
            <CheckCircle size={40} className="text-green mx-auto" />
            <h2 className="text-xl font-medium text-ink mt-4">Password updated!</h2>
            <p className="text-sm text-ink-muted mt-2">You can now log in with your new password.</p>
            <Link
              to="/login"
              className="flex items-center justify-center mt-6 w-full h-12 rounded-lg text-white text-[15px] font-medium bg-orange no-underline"
            >
              Go to Login
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-7">
              <div className="text-lg font-medium text-green">AgroRent</div>
              <h1 className="text-[22px] font-medium text-ink mt-1">Set a new password</h1>
              {!sessionReady && (
                <p className="text-sm text-red mt-2">
                  Invalid or expired reset link. Please{" "}
                  <Link to="/forgot-password" className="underline text-red">request a new one</Link>.
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div>
                <label className="block text-[13px] font-medium text-ink mb-2">New password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={!sessionReady}
                  className="w-full h-11 px-3 text-sm border border-border rounded-lg outline-none disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-ink mb-2">Confirm new password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  disabled={!sessionReady}
                  className="w-full h-11 px-3 text-sm border border-border rounded-lg outline-none disabled:opacity-50"
                />
              </div>

              {error && <p className="text-[13px] text-red -mt-2">{error}</p>}

              <button
                type="submit"
                disabled={loading || !sessionReady}
                className={`w-full h-12 rounded-lg border-none text-white text-[15px] font-medium bg-orange ${(loading || !sessionReady) ? "opacity-70 cursor-default" : "cursor-pointer"}`}
              >
                {loading ? "Updating…" : "Reset Password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

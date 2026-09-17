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
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div>
                <label className="block text-[13px] font-medium text-ink mb-2">New password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-11 px-3 text-sm border border-border rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-ink mb-2">Confirm new password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className="w-full h-11 px-3 text-sm border border-border rounded-lg outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full h-12 rounded-lg border-none text-white text-[15px] font-medium bg-orange cursor-pointer"
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

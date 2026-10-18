import { useEffect } from "react";
import { Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabaseClient";

// Shown after "Delete my account". Signs out here rather than on Edit
// Profile, so that protected page doesn't redirect to /login first.
export default function AccountDeleted() {
  const { user } = useAuth();

  useEffect(() => {
    // The login no longer exists, so only the local session needs clearing.
    if (user) supabase.auth.signOut({ scope: "local" }).catch(() => {});
  }, [user]);

  return (
    <div className="min-h-[calc(100vh-56px)] bg-page flex items-center justify-center px-4 py-12">
      <div className="bg-white border border-border/50 rounded-xl p-10 w-full max-w-[420px] text-center">
        <CheckCircle size={40} color="#2F5E3A" className="mx-auto mb-4" />
        <h1 className="text-xl font-medium text-ink mb-2">Your account has been deleted</h1>
        <p className="text-sm text-ink-muted mb-6">
          Your personal details and listings have been removed. Thank you for using AgroRent.
          You're welcome to sign up again any time.
        </p>
        <Link to="/" className="block w-full h-12 leading-[48px] rounded-lg bg-orange text-white text-[15px] font-medium no-underline">
          Back to the home page
        </Link>
      </div>
    </div>
  );
}

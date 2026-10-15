import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// When someone opens a password-reset link, Supabase may land them on any page
// (e.g. the site root if /reset-password isn't in its redirect allow-list).
// Send them to the "set a new password" screen as soon as a recovery is detected.
//
// Deliberately keyed on `recovering` only, not on the path: it fires once when
// recovery starts, so the person can still navigate away afterwards.
export default function RecoveryRedirect() {
  const { recovering } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (recovering && pathname !== "/reset-password") {
      navigate("/reset-password", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recovering]);

  return null;
}

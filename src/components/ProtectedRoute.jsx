import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// Guards a route behind login (and optionally a specific role).
//
// Previously App.jsx had zero gating: /dashboard, /my-listings, /admin,
// etc. were all reachable by anyone — logged in or not, whatever role
// they had. That's why typing a URL directly could show pages that
// shouldn't be visible yet. Wrap a <Route element={...}> in this to fix
// that for a given route.
//
// requireRole: "owner" | "admin" — if set, redirects users who ARE logged
// in but don't have that role, instead of just checking isAuthenticated.
export default function ProtectedRoute({ children, requireRole }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (requireRole && user?.role !== requireRole) {
    // Logged in, just not allowed here — send them somewhere that makes
    // sense for the role they do have, rather than a login loop.
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// FILE: agrorent/src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// Guards a route behind login (and optionally a specific role).
//
// requireRole: "owner" | "admin" — if set, redirects users who ARE logged
// in but don't have that role, instead of just checking isAuthenticated.
export default function ProtectedRoute({ children, requireRole }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Wait for the initial Supabase session check to finish before deciding
  // whether to redirect — otherwise a direct URL load or full page refresh
  // sees isAuthenticated=false for a brief moment (before the real session
  // loads) and incorrectly bounces a logged-in user to /login.
  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (requireRole && user?.role !== requireRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
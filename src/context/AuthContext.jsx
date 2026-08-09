import { createContext, useState } from "react";

// Global "is someone logged in" state for the whole app.
//
// No backend yet, so this doesn't verify passwords or persist across a full
// page reload — it's just React state, lifted here so it survives normal
// client-side navigation (clicking links, useNavigate, back/forward).
// That's the fix for the "back to Home logs me out" bug: previously every
// page had zero knowledge of auth state, so Navbar always rendered as
// logged-out. Now Login/Signup call login()/signup() below, which updates
// this context, and every component that calls useAuth() (Navbar, Sidebar,
// etc.) re-renders with the current user.
//
// Swap this for real API calls + persisted tokens when the backend exists;
// the shape of `user` and the login/signup/logout functions are designed to
// stay the same so callers won't need to change.

export const AuthContext = createContext(null);

// Matches the mock identity already hardcoded as Sidebar's default props
// and used across Dashboard/EditProfile, so the app looks consistent.
const DEFAULT_USER = {
  name: "Mutinta Mwansa",
  email: "",
  photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop",
  role: "renter", // "renter" | "owner"
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Simple no-backend way to reach the admin panel: logging in with this
  // exact email gives you the "admin" role instead of the default
  // "renter". There's no real auth yet, so this is just a fixed trigger —
  // swap it for a real admin check once the backend exists.
  const ADMIN_EMAIL = "admin@agrorent.com";

  function login(email) {
    const role = email === ADMIN_EMAIL ? "admin" : DEFAULT_USER.role;
    setUser({ ...DEFAULT_USER, email, role });
  }

  function signup({ name, email, role = "renter" }) {
    setUser({ ...DEFAULT_USER, name: name || DEFAULT_USER.name, email, role });
  }

  function logout() {
    setUser(null);
  }

  function setRole(role) {
    setUser((u) => (u ? { ...u, role } : u));
  }

  function updateProfile(changes) {
    setUser((u) => (u ? { ...u, ...changes } : u));
  }

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    setRole,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

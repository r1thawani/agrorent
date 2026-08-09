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
// Roles: "renter" and "owner" are not separate account types — every
// regular account can act as both, and `user.role` just tracks which mode
// they're currently in. The Sidebar's "Switch to Owner/Renter Mode" button
// calls setRole() below to flip it, which is what actually makes "you can
// switch roles later" (shown at signup) true. "admin" is the one exception:
// it's a genuinely separate account type, chosen on the Login page instead
// of Signup, and there's no UI that switches a renter/owner into it.
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
  role: "renter", // "renter" | "owner" | "admin"
};

// A separate identity for the "Admin" login path — previously admin logins
// just reused DEFAULT_USER, so every admin session showed up as "Mutinta
// Mwansa" with the same renter photo used all over the rest of the demo
// data. Admin is a genuinely different account type (see the note above),
// so it gets its own name/photo instead of borrowing a renter's identity.
// Same person as the "Site Administrator" row (au10) in ADMIN_USERS —
// mockData.js — so the identity is consistent wherever it shows up.
const ADMIN_USER = {
  name: "Natasha Chileshe",
  email: "",
  photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&fit=crop",
  role: "admin",
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  function login(email, role = DEFAULT_USER.role) {
    const base = role === "admin" ? ADMIN_USER : DEFAULT_USER;
    setUser({ ...base, email, role });
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

import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

// Small wrapper so components do `const { user, login, logout } = useAuth();`
// instead of importing AuthContext + useContext everywhere.
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth() must be used inside <AuthProvider>. Check main.jsx.");
  }
  return ctx;
}

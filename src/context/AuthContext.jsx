// FILE: agrorent/src/context/AuthContext.jsx
import { createContext, useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export const AuthContext = createContext(null);

async function loadProfile(userId) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error) throw error;
  return data;
}

// A password-reset email link gives the browser a real Supabase session so
// that updateUser({ password }) is allowed. That must NOT look like a normal
// login — otherwise tapping the link silently signs the person in and they
// never get asked for a new password. While this flag is on, the app treats
// the visitor as logged out and sends them to /reset-password.
//
// The flag lives in sessionStorage so a refresh on /reset-password (after
// Supabase has already stripped the token from the URL) still knows.
const RECOVERY_KEY = "agrorent:password-recovery";

function readRecoveryFlag() {
  try {
    if (sessionStorage.getItem(RECOVERY_KEY) === "1") return true;
  } catch {
    // storage blocked — fall through to the URL check
  }
  // Implicit flow: the emailed link arrives as "#access_token=…&type=recovery".
  return /[#&]type=recovery(&|$)/.test(window.location.hash);
}

function writeRecoveryFlag(on) {
  try {
    if (on) sessionStorage.setItem(RECOVERY_KEY, "1");
    else sessionStorage.removeItem(RECOVERY_KEY);
  } catch {
    // storage blocked — the in-memory state still works for this page load
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recovering, setRecovering] = useState(() => {
    const on = readRecoveryFlag();
    if (on) writeRecoveryFlag(true);
    return on;
  });
  const recoveringRef = useRef(recovering);

  const markRecovering = useCallback((on) => {
    recoveringRef.current = on;
    writeRecoveryFlag(on);
    setRecovering(on);
  }, []);

  useEffect(() => {
    let active = true;

    async function syncUser(session) {
      if (!active) return;
      if (!session?.user || recoveringRef.current) {
        setUser(null);
        return;
      }
      try {
        const profile = await loadProfile(session.user.id);
        if (active) setUser(profile);
      } catch (err) {
        console.error("Could not load profile:", err);
        if (active) setUser(null);
      }
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      // A stale flag with no session behind it (expired link) shouldn't linger.
      if (!session && recoveringRef.current) markRecovering(false);
      await syncUser(session);
      if (active) setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        markRecovering(true);
        setUser(null);
        return;
      }
      if (event === "SIGNED_OUT") {
        markRecovering(false);
        setUser(null);
        return;
      }
      // Deferred: awaiting other Supabase calls inside this callback can
      // deadlock the auth lock.
      setTimeout(() => syncUser(session), 0);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [markRecovering]);

  async function login(email, password) {
    // A normal login ends any half-finished password reset.
    markRecovering(false);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const { data: { session } } = await supabase.auth.getSession();
    const profile = await loadProfile(session.user.id);
    setUser(profile);
    return profile;
  }

  async function signup({ name, email, password }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw error;
    // identities is empty when the email is already registered (Supabase silent-duplicate behaviour)
    if (data.user?.identities?.length === 0) {
      throw new Error("An account with this email already exists. Please log in instead.");
    }
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  // Optimistic update that rolls back and throws if the database rejects it,
  // so callers can show the real error instead of a false "saved".
  async function updateProfile(changes) {
    if (!user) return;
    const previous = user;
    setUser((u) => (u ? { ...u, ...changes } : u));
    const { error } = await supabase.from("profiles").update(changes).eq("id", user.id);
    if (error) {
      setUser(previous);
      throw error;
    }
  }

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    recovering,
    login,
    signup,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

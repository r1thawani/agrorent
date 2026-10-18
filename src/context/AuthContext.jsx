// FILE: agrorent/src/context/AuthContext.jsx
import { createContext, useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { isBusyError } from "../utils/friendlyError";

export const AuthContext = createContext(null);

// The profile lookup is what decides "logged in or not", so ride out a brief
// database stall (timeout / dropped connection) with a couple of spaced
// retries instead of failing the whole login on the first slow response.
const RETRY_DELAYS_MS = [800, 2000];

// Profile columns anyone may read and that exist in every version of the
// database (not email, phone or date of birth, which are private).
const PUBLIC_PROFILE_COLUMNS = "id, name, photo_url, bio, role, status, created_at";

// Details typed on the sign-up form travel with the account (user metadata)
// until the person first logs in; copy any the profile is still missing.
const SIGNUP_FIELDS = ["phone", "province", "district", "date_of_birth"];

async function fillFromSignup(profile) {
  // Only with the full profile (my_profile()): the public fallback can't see
  // phone or date of birth, so it can't tell whether they're missing.
  if (!profile || !("phone" in profile)) return profile;
  const { data: { session } } = await supabase.auth.getSession();
  const meta = session?.user?.user_metadata || {};
  const changes = {};
  for (const field of SIGNUP_FIELDS) {
    if (!profile[field] && meta[field]) changes[field] = meta[field];
  }
  if (Object.keys(changes).length === 0) return profile;
  const { error } = await supabase.from("profiles").update(changes).eq("id", profile.id);
  if (error) {
    console.warn("Could not copy sign-up details to the profile:", error.message);
    return profile;
  }
  return { ...profile, ...changes };
}

async function loadProfile() {
  for (let attempt = 0; ; attempt++) {
    // my_profile() returns the signed-in user's own row in full; other
    // people's emails are hidden (migrations/004_private_emails.sql).
    let { data, error } = await supabase.rpc("my_profile").single();
    // If the function can't be reached (migration not run yet, or Supabase's
    // API hasn't picked it up), read the columns everyone may read and take
    // the email from the login session. Never select("*"): once emails are
    // private, that is refused outright.
    if (error && !isBusyError(error)) {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase
        .from("profiles")
        .select(PUBLIC_PROFILE_COLUMNS)
        .eq("id", session?.user?.id)
        .single();
      data = res.data ? { ...res.data, email: session.user.email } : null;
      error = res.error;
    }
    if (!error) return fillFromSignup(data);
    if (!isBusyError(error) || attempt >= RETRY_DELAYS_MS.length) throw error;
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
  }
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
  const userRef = useRef(null);

  const markRecovering = useCallback((on) => {
    recoveringRef.current = on;
    writeRecoveryFlag(on);
    setRecovering(on);
  }, []);

  // Nine pages/contexts refetch their data whenever `user` changes identity.
  // Re-setting an identical profile as a *new object* (which happened on every
  // token refresh and tab refocus) made all of them hit the database again,
  // so only swap the object when the profile data really differs.
  const applyUser = useCallback((next) => {
    const prev = userRef.current;
    if (next && prev && JSON.stringify(prev) === JSON.stringify(next)) return;
    userRef.current = next;
    setUser(next);
  }, []);

  useEffect(() => {
    let active = true;

    async function syncUser(session) {
      if (!active) return;
      if (!session?.user || recoveringRef.current) {
        applyUser(null);
        return;
      }
      try {
        const profile = await loadProfile();
        if (active) applyUser(profile);
      } catch (err) {
        console.error("Could not load profile:", err);
        if (active) applyUser(null);
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
        applyUser(null);
        return;
      }
      if (event === "SIGNED_OUT") {
        markRecovering(false);
        applyUser(null);
        return;
      }
      // A token refresh doesn't change the profile, and the initial-session
      // replay is already covered by getSession() above.
      if (event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") return;
      // Supabase re-announces SIGNED_IN when the tab regains focus; don't
      // re-download the profile of someone who is already loaded.
      if (event === "SIGNED_IN" && session?.user?.id === userRef.current?.id) return;
      // Deferred: awaiting other Supabase calls inside this callback can
      // deadlock the auth lock.
      setTimeout(() => syncUser(session), 0);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [markRecovering, applyUser]);

  async function login(email, password) {
    // A normal login ends any half-finished password reset.
    markRecovering(false);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const profile = await loadProfile();
    applyUser(profile);
    return profile;
  }

  async function signup({ name, email, password, phone, province, district, dateOfBirth }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      // Saved to the profile at first login (fillFromSignup).
      options: { data: { name, phone, province, district, date_of_birth: dateOfBirth } },
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
    applyUser({ ...user, ...changes });
    const { error } = await supabase.from("profiles").update(changes).eq("id", user.id);
    if (error) {
      applyUser(previous);
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

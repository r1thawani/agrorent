// FILE: agrorent/src/context/AuthContext.jsx
import { createContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export const AuthContext = createContext(null);

async function loadProfile(userId) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error) throw error;
  return data;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) setUser(await loadProfile(session.user.id));
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) setUser(await loadProfile(session.user.id));
      else setUser(null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function login(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const { data: { session } } = await supabase.auth.getSession();
    const profile = await loadProfile(session.user.id);
    setUser(profile);
    return profile;
  }

  async function signup({ name, email, password }) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw error;
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  async function updateProfile(changes) {
    setUser((u) => (u ? { ...u, ...changes } : u));
    if (user) await supabase.from("profiles").update(changes).eq("id", user.id);
  }

  const value = { user, isAuthenticated: !!user, loading, login, signup, logout, updateProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
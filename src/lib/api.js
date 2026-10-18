// Calls the serverless functions in /api (Vercel). The signed-in user's
// access token is sent along so the server knows who is asking.
import { supabase } from "./supabaseClient";

export async function postApi(path, body = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = { "Content-Type": "application/json" };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

  const res = await fetch(path, { method: "POST", headers, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "Something went wrong. Please try again.");
    err.status = res.status;
    throw err;
  }
  return data;
}

// Calls the email functions in /api (Vercel serverless functions; they send
// through the AgroRent Gmail account). The signed-in user's access token is
// sent along so the server knows who is asking.
import { supabase } from "../lib/supabaseClient";

async function post(path, body) {
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

export const emailService = {
  sendHelpRequest({ name, email, message, website }) {
    return post("/api/help", { name, email, message, website, page: window.location.pathname });
  },

  // Asks the server to send queued booking emails now (the database also
  // asks every minute). Fire-and-forget.
  flushQueue() {
    post("/api/send-emails", {}).catch((err) => console.warn("Email flush failed:", err.message));
  },

  // Fire-and-forget: a failed notification email must never make sending
  // the message itself look like it failed.
  notifyNewMessage(messageId) {
    post("/api/notify-message", { messageId }).catch((err) =>
      console.warn("Message email notification failed:", err.message)
    );
  },
};

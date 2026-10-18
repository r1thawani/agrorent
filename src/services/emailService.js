// Calls the email functions in /api (Vercel serverless functions; they send
// through the AgroRent Gmail account).
import { postApi as post } from "../lib/api";

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

// POST /api/notify-message { messageId } — called by the app right after a
// message is sent. Emails the recipient that they have a new message, who
// it's from, and a short glimpse (not the full text), with a link to the
// conversation.
//
// To avoid flooding inboxes, a sender's message only triggers an email when
// the recipient has no earlier unread message from them that was already
// emailed. Once they read the conversation, the next message emails again.

import { getAdmin, getUserFromRequest, sendMail, appUrl } from "./_lib/server.js";
import { messageGlimpse, escapeHtml } from "./_lib/text.js";

const MAX_AGE_MS = 10 * 60 * 1000;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: "Not signed in." });

    const messageId = String(req.body?.messageId || "");
    if (!messageId) return res.status(400).json({ error: "messageId is required." });

    const db = getAdmin();

    const { data: msg, error: msgErr } = await db
      .from("messages")
      .select("id, conversation_id, sender_id, text, read, created_at, email_notified_at")
      .eq("id", messageId)
      .maybeSingle();
    if (msgErr) throw msgErr;
    // Only the sender can trigger the email for their own message.
    if (!msg || msg.sender_id !== user.id) return res.status(404).json({ error: "Message not found." });
    if (msg.email_notified_at || msg.read) return res.status(200).json({ sent: false, reason: "already handled" });
    if (Date.now() - new Date(msg.created_at).getTime() > MAX_AGE_MS) {
      return res.status(200).json({ sent: false, reason: "too old" });
    }

    const { count: pendingEmailed, error: pendErr } = await db
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", msg.conversation_id)
      .eq("sender_id", msg.sender_id)
      .eq("read", false)
      .not("email_notified_at", "is", null);
    if (pendErr) throw pendErr;
    if (pendingEmailed > 0) return res.status(200).json({ sent: false, reason: "recipient already notified" });

    // Claim the message so a retry or double call can't send twice.
    const { data: claimed, error: claimErr } = await db
      .from("messages")
      .update({ email_notified_at: new Date().toISOString() })
      .eq("id", msg.id)
      .is("email_notified_at", null)
      .select("id");
    if (claimErr) throw claimErr;
    if (!claimed?.length) return res.status(200).json({ sent: false, reason: "already handled" });

    const { data: conv, error: convErr } = await db
      .from("conversations")
      .select("id, renter_id, owner_id, equipment(name)")
      .eq("id", msg.conversation_id)
      .single();
    if (convErr) throw convErr;

    const recipientId = conv.renter_id === msg.sender_id ? conv.owner_id : conv.renter_id;
    const [{ data: recipientAuth, error: recErr }, { data: sender }] = await Promise.all([
      db.auth.admin.getUserById(recipientId),
      db.from("profiles").select("name").eq("id", msg.sender_id).maybeSingle(),
    ]);
    if (recErr) throw recErr;
    const to = recipientAuth?.user?.email;
    if (!to) return res.status(200).json({ sent: false, reason: "recipient has no email" });

    const senderName = sender?.name || "Someone";
    const equipment = conv.equipment?.name;
    const glimpse = messageGlimpse(msg.text);
    const link = `${appUrl(req)}/messages/${conv.id}`;
    const about = equipment ? ` about ${equipment}` : "";

    const email = {
      to,
      subject: `New message from ${senderName} on AgroRent`,
      text: `${senderName} sent you a message${about}:\n\n"${glimpse}"\n\nRead and reply on AgroRent: ${link}\n\nYou're getting this because someone messaged you on AgroRent.`,
      html: `<p><strong>${escapeHtml(senderName)}</strong> sent you a message${escapeHtml(about)}:</p>
<p style="color:#555;font-style:italic">"${escapeHtml(glimpse)}"</p>
<p><a href="${escapeHtml(link)}" style="display:inline-block;background:#FF5C00;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Read and reply</a></p>
<p style="color:#888;font-size:12px">You're getting this because someone messaged you on AgroRent.</p>`,
    };

    try {
      await sendMail(email);
    } catch (err) {
      // Release the claim, otherwise this unsent message would count as
      // "already emailed" and silence the sender's next messages too.
      await db.from("messages").update({ email_notified_at: null }).eq("id", msg.id);
      throw err;
    }

    return res.status(200).json({ sent: true });
  } catch (err) {
    console.error("notify-message failed:", err);
    return res.status(500).json({ error: "Could not send the notification." });
  }
}

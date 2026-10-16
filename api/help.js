// POST /api/help — the "Need help?" / Contact form. Emails the request to
// the AgroRent inbox with Reply-To set to the sender, so replying from Gmail
// goes straight back to them. Signing in is not required.

import { validateHelpRequest, escapeHtml } from "./_lib/text.js";
import { sendMail, getUserFromRequest, tooManyRequests, clientIp } from "./_lib/server.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const body = req.body || {};

  // Hidden form field real people never fill in; bots usually do.
  // Pretend success so they don't retry.
  if (body.website) return res.status(200).json({ ok: true });

  if (tooManyRequests(`help:${clientIp(req)}`, 5, 60 * 60 * 1000)) {
    return res.status(429).json({ error: "Too many requests. Please wait a while and try again." });
  }

  const { value, error } = validateHelpRequest(body);
  if (error) return res.status(400).json({ error });
  const { name, email, message } = value;

  let account = "Not signed in";
  try {
    const user = await getUserFromRequest(req);
    if (user) account = `Signed in as ${user.email} (user id ${user.id})`;
  } catch {
    // Missing server credentials shouldn't stop a help request going out.
  }

  const page = String(body.page || "").slice(0, 200);
  const to = process.env.SUPPORT_INBOX || process.env.GMAIL_USER;

  try {
    await sendMail({
      to,
      replyTo: email,
      subject: `Help request from ${name}`,
      text: `${message}\n\n---\nFrom: ${name} <${email}>\nAccount: ${account}\nSent from page: ${page || "unknown"}`,
      html: `<p style="white-space:pre-wrap">${escapeHtml(message)}</p>
<hr>
<p style="color:#555;font-size:13px">
From: ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;<br>
Account: ${escapeHtml(account)}<br>
Sent from page: ${escapeHtml(page || "unknown")}<br>
Reply to this email to answer them directly.
</p>`,
    });
  } catch (err) {
    console.error("help email failed:", err);
    return res.status(502).json({ error: "We couldn't send your message right now. Please try again in a few minutes." });
  }

  return res.status(200).json({ ok: true });
}

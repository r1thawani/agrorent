// POST /api/send-emails — sends the booking emails queued in email_outbox.
// Called by the app right after a booking action (so emails go out
// immediately) and every minute by the database job while emails are
// waiting (so expiry emails go out even when nobody has the site open).
// Safe for anyone to call: it only sends what the database already queued,
// and each email is claimed before sending so it goes out once.

import { getAdmin, sendMail, appUrl, tooManyRequests, clientIp } from "./_lib/server.js";
import { renderBookingEmail } from "./_lib/bookingEmails.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }
  if (tooManyRequests(`flush:${clientIp(req)}`, 30, 60 * 1000)) {
    return res.status(429).json({ error: "Too many requests." });
  }

  try {
    const db = getAdmin();
    const { data: jobs, error } = await db.rpc("claim_email_outbox", { p_limit: 20 });
    if (error) throw error;

    let sent = 0;
    for (const job of jobs || []) {
      try {
        const email = renderBookingEmail(job.kind, job.data, { appUrl: appUrl(req), bookingId: job.booking_id });
        if (!email) throw new Error(`Unknown email kind ${job.kind}`);

        const { data: recipient, error: userErr } = await db.auth.admin.getUserById(job.user_id);
        if (userErr) throw userErr;
        if (!recipient?.user?.email) throw new Error("Recipient has no email address");

        await sendMail({ to: recipient.user.email, ...email });
        await db.from("email_outbox").update({ sent_at: new Date().toISOString(), last_error: null }).eq("id", job.id);
        sent++;
      } catch (err) {
        // Release the claim so the next run retries (up to 5 attempts in total).
        await db.from("email_outbox").update({ claimed_at: null, last_error: String(err.message || err) }).eq("id", job.id);
      }
    }
    return res.status(200).json({ claimed: jobs?.length || 0, sent });
  } catch (err) {
    console.error("send-emails failed:", err);
    return res.status(500).json({ error: "Could not send emails." });
  }
}

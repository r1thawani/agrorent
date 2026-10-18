// POST /api/delete-account — "Delete my account" on Edit Profile.
// The database closes the account first (delete_account() in
// migrations/007_delete_account.sql: checks for unfinished paid bookings,
// withdraws open requests, wipes personal details), then the login itself is
// removed, which needs the service-role key and so happens here. Retrying
// after a failure is safe: the database step is skipped once it has run.

import { getAdmin, getUserFromRequest, tooManyRequests } from "./_lib/server.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  let user;
  try {
    user = await getUserFromRequest(req);
  } catch (err) {
    console.error("delete-account: server not configured:", err);
    return res.status(500).json({ error: "Account deletion isn't available right now. Please try again later." });
  }
  if (!user) return res.status(401).json({ error: "Please log in again, then try once more." });

  if (tooManyRequests(`delete-account:${user.id}`, 5, 10 * 60 * 1000)) {
    return res.status(429).json({ error: "Too many attempts. Please wait a few minutes and try again." });
  }

  const db = getAdmin();

  const { error: closeErr } = await db.rpc("delete_account", { p_user_id: user.id });
  if (closeErr) {
    // 23514 = check_violation: an unfinished paid booking, or an admin account.
    if (closeErr.code === "23514") return res.status(409).json({ error: closeErr.message });
    console.error("delete-account: closing the account failed:", closeErr);
    return res.status(502).json({ error: "We couldn't delete your account right now. Please try again in a few minutes." });
  }

  const { error: authErr } = await db.auth.admin.deleteUser(user.id);
  if (authErr) {
    console.error("delete-account: removing the login failed:", authErr);
    return res.status(502).json({
      error: "Your details were removed, but we couldn't finish closing your login. Please try again.",
    });
  }

  return res.status(200).json({ ok: true });
}

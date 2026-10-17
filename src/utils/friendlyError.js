// Turns the raw errors Supabase / the browser throw into sentences a
// non-technical person can act on ("Failed to fetch" means nothing to them).

const BUSY_MESSAGE = "The server is busy right now. Please wait a moment and try again.";
const RATE_MESSAGE = "Too many attempts. Please wait a minute and try again.";

function messageOf(err) {
  return String(err?.message ?? err ?? "");
}

export function isRateLimitError(err) {
  return (
    err?.status === 429 ||
    err?.code === "over_request_rate_limit" ||
    /rate limit|too many requests/i.test(messageOf(err))
  );
}

// Slow database / dropped connection / server hiccup: worth retrying shortly.
// Rate limits are deliberately excluded, because retrying only makes them worse.
export function isBusyError(err) {
  if (!err || isRateLimitError(err)) return false;
  const status = Number(err.status);
  return (
    String(err.code) === "57014" ||
    (status >= 500 && status < 600) ||
    /statement timeout|failed to fetch|networkerror|network request failed|timed out|timeout/i.test(
      messageOf(err)
    )
  );
}

export function friendlyError(err, fallback = "Something went wrong. Please try again.") {
  if (isRateLimitError(err)) return RATE_MESSAGE;
  if (isBusyError(err)) return BUSY_MESSAGE;

  const message = messageOf(err);
  if (/invalid login credentials/i.test(message)) {
    return "Wrong email or password. Please check and try again.";
  }
  if (/email not confirmed/i.test(message)) {
    return "Please confirm your email first — open the link we sent you.";
  }
  return message || fallback;
}

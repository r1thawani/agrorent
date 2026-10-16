// Pure text helpers for the email functions (unit-tested in text.test.js).

// A short preview of a message for the notification email: the first few
// words, cut at a word boundary, so the recipient knows roughly what it's
// about without the email carrying the whole message.
export function messageGlimpse(text, maxChars = 40) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= maxChars) return clean;
  const cut = clean.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > maxChars / 2 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const HELP_LIMITS = { nameMax: 80, emailMax: 254, messageMin: 10, messageMax: 2000 };

// Returns { value } with trimmed fields, or { error } with a plain message.
export function validateHelpRequest(body) {
  const name = String(body?.name ?? "").trim();
  const email = String(body?.email ?? "").trim();
  const message = String(body?.message ?? "").trim();

  if (!name || name.length > HELP_LIMITS.nameMax) {
    return { error: `Please enter your name (up to ${HELP_LIMITS.nameMax} characters).` };
  }
  if (!EMAIL_RE.test(email) || email.length > HELP_LIMITS.emailMax) {
    return { error: "Please enter a valid email address so we can reply." };
  }
  if (message.length < HELP_LIMITS.messageMin || message.length > HELP_LIMITS.messageMax) {
    return {
      error: `Your message should be between ${HELP_LIMITS.messageMin} and ${HELP_LIMITS.messageMax} characters.`,
    };
  }
  // Header injection guard: name ends up in the email subject line.
  if (/[\r\n]/.test(name) || /[\r\n]/.test(email)) {
    return { error: "Please remove line breaks from your name and email." };
  }
  return { value: { name, email, message } };
}

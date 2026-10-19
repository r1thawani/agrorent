// Zambian mobile numbers as the app stores them: +260 then 9 digits.
// The database checks the same format (migrations/005).
export const PHONE_REGEX = /^\+260\d{9}$/;

// Keeps whatever is typed or pasted in "+260XXXXXXXXX" shape: digits only,
// a leading 260 or 0 is dropped, at most 9 digits after +260.
export function formatPhoneInput(value) {
  const digits = String(value || "").replace(/\D/g, "").replace(/^260/, "").replace(/^0/, "");
  return "+260" + digits.slice(0, 9);
}

export function isValidPhone(value) {
  return PHONE_REGEX.test(value || "");
}

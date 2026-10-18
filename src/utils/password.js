// The password rules, shared by Sign Up, Reset Password and Edit Profile so
// a password can't be changed to one sign-up would have refused.
export const PASSWORD_HINT = "Min 8 characters, with uppercase, lowercase, a number, and a special character.";

// Returns "" when the password is fine, otherwise what's missing.
export function getPasswordError(password) {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(password)) return "Password must include at least one uppercase letter.";
  if (!/[a-z]/.test(password)) return "Password must include at least one lowercase letter.";
  if (!/[0-9]/.test(password)) return "Password must include at least one number.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Password must include at least one special character.";
  return "";
}

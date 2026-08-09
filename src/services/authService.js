import { mockDelay } from "./api";

// Mock service mirroring the shape of AuthContext.jsx's login/signup/logout.
// AuthContext currently calls its own local setUser() directly since there's
// no backend to hit; this service exists as the drop-in replacement for that
// setUser() call once a real API exists (AuthContext would `await
// authService.login(...)` instead of updating state synchronously).
export const authService = {
  async login(email, _password) {
    await mockDelay();
    if (!email) throw new Error("Email is required");
    return { email, token: "mock-token" };
  },

  async signup({ name, email, role = "renter" }) {
    await mockDelay();
    if (!email) throw new Error("Email is required");
    return { name, email, role, token: "mock-token" };
  },

  async logout() {
    await mockDelay(100);
    return { success: true };
  },

  async requestPasswordReset(email) {
    await mockDelay();
    return { email, sent: true };
  },

  async resetPassword(_token, _newPassword) {
    await mockDelay();
    return { success: true };
  },
};

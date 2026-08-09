import { mockDelay } from "./api";

// Mock service backing EditProfile.jsx / PublicProfile.jsx.
export const userService = {
  async getProfile(_id) {
    await mockDelay();
    // PublicProfile.jsx / EditProfile.jsx currently read the signed-in user
    // from useAuth() and mock owner data from mockData.EQUIPMENT[].owner —
    // this is the future single source once a real user endpoint exists.
    throw new Error("userService.getProfile: no backend yet — use useAuth() or EQUIPMENT[].owner");
  },

  async updateProfile(changes) {
    await mockDelay();
    return { ...changes, updatedAt: new Date().toISOString() };
  },
};

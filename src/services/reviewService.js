import { mockDelay } from "./api";

// Mock service backing LeaveReview.jsx and ListingDetail.jsx's reviews list.
// ListingDetail.jsx currently has its own MOCK_REVIEWS array inline (kept
// there since it's display-only seed data) — this service is what
// LeaveReview.jsx's submit handler would call once there's a backend to
// persist the new review to.
export const reviewService = {
  async getForEquipment(_equipmentId) {
    await mockDelay();
    // ListingDetail.jsx owns its own mock review list for now; this stays
    // async-shaped so swapping in a real fetch later doesn't change callers.
    return [];
  },

  async create({ bookingId, rating, text }) {
    await mockDelay();
    if (!rating) throw new Error("A rating is required");
    return { id: `rev${Date.now()}`, bookingId, rating, text, date: "Just now" };
  },
};

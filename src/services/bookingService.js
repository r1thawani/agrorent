import { mockDelay } from "./api";
import { BOOKINGS, BOOKING_REQUESTS } from "../data/mockData";

// Mock service backing MyBookings.jsx, BookingRequests.jsx, BookingPage.jsx,
// BookingConfirmation.jsx, and the dashboard widgets. Same swap-to-real-API
// pattern as equipmentService.js.
export const bookingService = {
  async getMyBookings() {
    await mockDelay();
    return BOOKINGS;
  },

  async getRequestsForOwner() {
    await mockDelay();
    return BOOKING_REQUESTS;
  },

  async getById(id) {
    await mockDelay();
    const booking = BOOKINGS.find((b) => b.id === id);
    if (!booking) throw new Error(`Booking ${id} not found`);
    return booking;
  },

  async create(bookingDraft) {
    await mockDelay();
    // Push into BOOKINGS so MyBookings.jsx (and the dashboard) sees it on
    // its next render — same "mutate the shared array" pattern as
    // equipmentService, since there's no backend to persist to yet.
    const newBooking = { status: "pending", ...bookingDraft, id: `b${Date.now()}` };
    BOOKINGS.unshift(newBooking);
    return newBooking;
  },

  async cancel(id) {
    await mockDelay();
    const booking = BOOKINGS.find((b) => b.id === id);
    if (!booking) throw new Error(`Booking ${id} not found`);
    booking.status = "cancelled";
    return booking;
  },

  async accept(id) {
    await mockDelay();
    const request = BOOKING_REQUESTS.find((r) => r.id === id);
    if (!request) throw new Error(`Booking request ${id} not found`);
    request.status = "accepted";
    return request;
  },

  async decline(id) {
    await mockDelay();
    const request = BOOKING_REQUESTS.find((r) => r.id === id);
    if (!request) throw new Error(`Booking request ${id} not found`);
    request.status = "declined";
    return request;
  },
};

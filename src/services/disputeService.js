import { supabase } from "../lib/supabaseClient";

// Renters and owners report a problem with a booking; an admin resolves it on
// /admin/disputes. The database only accepts a report about a confirmed or
// completed booking the reporter is on, against the other person
// (migrations/012_report_problem.sql).
export const REPORTABLE_STATUSES = ["confirmed", "completed"];
export const REASON_MIN = 10;
export const REASON_MAX = 1000;

const FIELDS = "id, booking_id, status, resolution_notes, created_at";

export const disputeService = {
  // The current user's latest report for each booking, keyed by booking id.
  async getMyReports(userId) {
    const { data, error } = await supabase
      .from("disputes")
      .select(FIELDS)
      .eq("reporter_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    const byBooking = {};
    for (const d of data) {
      if (d.booking_id && !byBooking[d.booking_id]) byBooking[d.booking_id] = d;
    }
    return byBooking;
  },

  async report({ booking, reporterId, reason }) {
    const againstId = booking.renter_id === reporterId ? booking.owner_id : booking.renter_id;
    const { data, error } = await supabase
      .from("disputes")
      .insert({ booking_id: booking.id, reporter_id: reporterId, against_id: againstId, reason: reason.trim() })
      .select(FIELDS)
      .single();
    if (error?.code === "23505") {
      throw new Error("You've already reported a problem with this booking. AgroRent is looking into it.");
    }
    if (error?.code === "42501") {
      throw new Error("You can only report a problem with a confirmed or completed booking you're part of.");
    }
    if (error) throw error;
    return data;
  },
};

// Fixed to UTC so "YYYY-MM-DD" -> toLocaleDateString doesn't shift a day
// depending on the machine running the tests. Must be set before any Date/
// Intl call in this file.
process.env.TZ = "UTC";

import { describe, expect, it, vi, afterEach } from "vitest";
import { formatDate, formatDateRange, formatRelativeTime } from "./formatDate";

describe("formatDate", () => {
  it("formats a YYYY-MM-DD string as 'D Mon YYYY'", () => {
    expect(formatDate("2026-02-10")).toBe("10 Feb 2026");
  });

  it("returns an empty string for a missing date", () => {
    expect(formatDate("")).toBe("");
    expect(formatDate(null)).toBe("");
    expect(formatDate(undefined)).toBe("");
  });

  it("falls back to the raw string for an unparseable date instead of 'Invalid Date'", () => {
    expect(formatDate("not-a-date")).toBe("not-a-date");
  });
});

describe("formatDateRange", () => {
  it("joins two formatted dates with an arrow", () => {
    expect(formatDateRange("2026-02-10", "2026-02-17")).toBe("10 Feb 2026 → 17 Feb 2026");
  });

  it("degrades gracefully when a side is missing", () => {
    expect(formatDateRange("", "2026-02-17")).toBe(" → 17 Feb 2026");
  });
});

describe("formatRelativeTime", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns an empty string for a missing timestamp", () => {
    expect(formatRelativeTime("")).toBe("");
  });

  it("says 'Just now' for anything comfortably under a minute old", () => {
    const now = new Date("2026-02-10T12:00:00Z");
    vi.useFakeTimers();
    vi.setSystemTime(now);
    // diffMins is Math.round(ms / 60000), so 30s already rounds up to 1 ("1
    // min ago") — "Just now" only covers roughly the first 29s.
    expect(formatRelativeTime(new Date(now.getTime() - 10_000).toISOString())).toBe("Just now");
  });

  it("uses singular 'min'/'hour'/'day' for a count of exactly 1", () => {
    const now = new Date("2026-02-10T12:00:00Z");
    vi.useFakeTimers();
    vi.setSystemTime(now);
    expect(formatRelativeTime(new Date(now.getTime() - 60_000).toISOString())).toBe("1 min ago");
    expect(formatRelativeTime(new Date(now.getTime() - 60 * 60_000).toISOString())).toBe("1 hour ago");
  });

  it("pluralizes for anything else", () => {
    const now = new Date("2026-02-10T12:00:00Z");
    vi.useFakeTimers();
    vi.setSystemTime(now);
    expect(formatRelativeTime(new Date(now.getTime() - 5 * 60_000).toISOString())).toBe("5 mins ago");
    expect(formatRelativeTime(new Date(now.getTime() - 3 * 60 * 60_000).toISOString())).toBe("3 hours ago");
  });

  it("falls back to an absolute date once it's a week or older", () => {
    const now = new Date("2026-02-10T12:00:00Z");
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60_000).toISOString();
    expect(formatRelativeTime(eightDaysAgo)).toBe(formatDate(eightDaysAgo));
  });
});

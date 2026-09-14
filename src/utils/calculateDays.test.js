import { describe, expect, it } from "vitest";
import { calculateDays } from "./calculateDays";

describe("calculateDays", () => {
  it("returns 0 when either date is missing", () => {
    expect(calculateDays("", "2026-03-10")).toBe(0);
    expect(calculateDays("2026-03-01", "")).toBe(0);
    expect(calculateDays(null, null)).toBe(0);
  });

  it("returns 0 for a same-day range", () => {
    expect(calculateDays("2026-03-01", "2026-03-01")).toBe(0);
  });

  it("returns 0 when the end date is before the start date", () => {
    expect(calculateDays("2026-03-10", "2026-03-01")).toBe(0);
  });

  it("returns the number of days between two dates", () => {
    expect(calculateDays("2026-03-01", "2026-03-08")).toBe(7);
  });

  it("handles a range spanning a month boundary", () => {
    expect(calculateDays("2026-01-28", "2026-02-02")).toBe(5);
  });
});

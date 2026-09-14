import { describe, expect, it } from "vitest";
import { formatCurrency } from "./formatCurrency";

describe("formatCurrency", () => {
  it("prefixes the amount with K and adds thousands separators", () => {
    expect(formatCurrency(1750)).toBe("K1,750");
    expect(formatCurrency(500)).toBe("K500");
  });

  it("treats null/undefined as K0 instead of throwing or showing 'Knull'", () => {
    expect(formatCurrency(null)).toBe("K0");
    expect(formatCurrency(undefined)).toBe("K0");
  });

  it("treats NaN as K0", () => {
    expect(formatCurrency("not a number")).toBe("K0");
  });

  it("accepts numeric strings (as returned by Postgres numeric columns)", () => {
    expect(formatCurrency("1750")).toBe("K1,750");
  });

  it("does not show more than 2 decimal places", () => {
    expect(formatCurrency(1750.5)).toBe("K1,750.5");
    expect(formatCurrency(1750.999)).toBe("K1,751");
  });

  it("formats zero as K0, not blank", () => {
    expect(formatCurrency(0)).toBe("K0");
  });
});

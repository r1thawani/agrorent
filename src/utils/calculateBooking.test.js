import { describe, expect, it } from "vitest";
import { calculateBooking, priceBreakdown } from "./calculateBooking";

describe("calculateBooking", () => {
  it("computes subtotal as priceDay x days", () => {
    const { subtotal } = calculateBooking(500, 3);
    expect(subtotal).toBe(1500);
  });

  it("charges a 5% service fee, rounded to the nearest Kwacha", () => {
    const { fee } = calculateBooking(500, 3); // subtotal 1500 -> fee 75
    expect(fee).toBe(75);
  });

  it("rounds the fee instead of truncating it", () => {
    // subtotal 333 * 0.05 = 16.65 -> rounds to 17, not 16
    const { fee } = calculateBooking(333, 1);
    expect(fee).toBe(17);
  });

  it("totals subtotal + fee", () => {
    const { subtotal, fee, total } = calculateBooking(500, 3);
    expect(total).toBe(subtotal + fee);
  });

  it("takes a 25% down payment, rounded, and leaves the rest as balance", () => {
    const { total, downPayment, balance } = calculateBooking(500, 3);
    expect(downPayment).toBe(Math.round(total * 0.25));
    expect(balance).toBe(total - downPayment);
    expect(downPayment + balance).toBe(total);
  });

  it("returns all zeros for a zero-day booking", () => {
    expect(calculateBooking(500, 0)).toMatchObject({
      subtotal: 0,
      fee: 0,
      total: 0,
      downPayment: 0,
      balance: 0,
    });
  });

  it("matches a known figure end to end (K500/day x 7 days)", () => {
    // subtotal 3500, fee 175 (5%), total 3675, downPayment 919 (round(3675*0.25)=918.75->919)
    expect(calculateBooking(500, 7)).toMatchObject({
      subtotal: 3500,
      fee: 175,
      total: 3675,
      downPayment: 919,
      balance: 2756,
    });
  });
});

describe("calculateBooking with a weekly price", () => {
  it("charges whole weeks at the weekly price and leftover days at the daily price", () => {
    // K500/day, K3,000/week, 10 days = 3,000 + 3 x 500 = 4,500
    const { subtotal, weeks, extraDays } = calculateBooking(500, 10, 3000);
    expect(subtotal).toBe(4500);
    expect(weeks).toBe(1);
    expect(extraDays).toBe(3);
  });

  it("charges an exact week at the weekly price, and shorter stays by the day", () => {
    expect(calculateBooking(500, 7, 3000).subtotal).toBe(3000);
    expect(calculateBooking(500, 6, 3000).subtotal).toBe(3000);
    expect(calculateBooking(500, 14, 3000).subtotal).toBe(6000);
  });

  it("ignores a weekly price that isn't cheaper than 7 days, or isn't set", () => {
    expect(calculateBooking(500, 7, 3500).subtotal).toBe(3500);
    expect(calculateBooking(500, 7, 4000).subtotal).toBe(3500);
    expect(calculateBooking(500, 7, null).subtotal).toBe(3500);
  });

  it("works out the fee and deposit from the weekly subtotal", () => {
    const { fee, total, downPayment, balance } = calculateBooking(500, 10, 3000);
    expect(fee).toBe(225);
    expect(total).toBe(4725);
    expect(downPayment).toBe(1181);
    expect(balance).toBe(3544);
  });
});

describe("priceBreakdown", () => {
  it("describes the sum the way the renter is charged", () => {
    expect(priceBreakdown(500, 10, 3000)).toBe("1 week × K3,000 + 3 days × K500");
    expect(priceBreakdown(500, 14, 3000)).toBe("2 weeks × K3,000");
    expect(priceBreakdown(500, 3, 3000)).toBe("3 days × K500");
    expect(priceBreakdown(500, 1, null)).toBe("1 day × K500");
  });
});

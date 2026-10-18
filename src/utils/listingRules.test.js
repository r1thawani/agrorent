import { describe, it, expect } from "vitest";
import { validateListing, checkPhotoFile, maxAvailabilityDate } from "./listingRules";

const TODAY = "2026-10-18";
const ok = {
  name: "John Deere Tractor",
  category: "Tractors",
  description: "Well kept 75hp tractor, serviced in September.",
  pickup: "Chilanga Road near the Total station",
  province: "Lusaka Province",
  district: "Chilanga",
  priceDay: "500",
  priceWeek: "",
  availFrom: "",
  availUntil: "",
};
const check = (changes, photoCount = 1) => validateListing({ ...ok, ...changes }, { today: TODAY, photoCount });

describe("validateListing", () => {
  it("accepts a complete listing", () => {
    expect(check({})).toBe("");
  });

  it("keeps the daily price between K50 and K5,000", () => {
    expect(check({ priceDay: "49" })).toMatch(/between K50 and K5,000/);
    expect(check({ priceDay: "5001" })).toMatch(/between K50 and K5,000/);
    expect(check({ priceDay: "5000" })).toBe("");
  });

  it("refuses prices with ngwee (whole Kwacha only)", () => {
    expect(check({ priceDay: "500.50" })).toMatch(/whole number/);
  });

  it("keeps the weekly price between one and seven days' price", () => {
    expect(check({ priceWeek: "400" })).toMatch(/between one day's price/);
    expect(check({ priceWeek: "3501" })).toMatch(/7 days' price \(K3,500\)/);
    expect(check({ priceWeek: "3000" })).toBe("");
  });

  it("checks name, description and pickup lengths", () => {
    expect(check({ name: "JD" })).toMatch(/between 3 and 80/);
    expect(check({ description: "Good tractor" })).toMatch(/at least 20/);
    expect(check({ pickup: "Rd" })).toMatch(/between 5 and 150/);
  });

  it("refuses past dates, reversed dates and dates over 2 years ahead", () => {
    expect(check({ availFrom: "2026-10-17" })).toMatch(/can't be in the past/);
    expect(check({ availFrom: "2026-11-10", availUntil: "2026-11-01" })).toMatch(/before the available from/);
    expect(check({ availUntil: "2028-10-19" })).toMatch(/at most 2 years ahead/);
  });

  it("needs between 1 and 8 photos", () => {
    expect(check({}, 0)).toMatch(/at least one photo/);
    expect(check({}, 9)).toMatch(/at most 8 photos/);
    expect(check({}, 8)).toBe("");
  });
});

describe("checkPhotoFile", () => {
  it("accepts JPG, PNG and WebP photos up to 10 MB", () => {
    expect(checkPhotoFile({ name: "a.jpg", type: "image/jpeg", size: 9 * 1024 * 1024 })).toBe("");
  });

  it("refuses other file types and files over 10 MB", () => {
    expect(checkPhotoFile({ name: "a.pdf", type: "application/pdf", size: 1000 })).toMatch(/isn't a JPG, PNG or WebP/);
    expect(checkPhotoFile({ name: "big.png", type: "image/png", size: 11 * 1024 * 1024 })).toMatch(/larger than 10 MB/);
  });
});

describe("maxAvailabilityDate", () => {
  it("is two years after today", () => {
    expect(maxAvailabilityDate(TODAY)).toBe("2028-10-18");
  });
});

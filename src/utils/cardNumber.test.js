import { describe, it, expect } from "vitest";
import { detectCardType, luhn } from "./cardNumber";

// Standard test card numbers published by payment providers; not real cards.
const VISA = "4111111111111111";
const MASTERCARD = "5555555555554444";
const MASTERCARD_2_SERIES = "2223003122003222";

describe("luhn", () => {
  it("accepts valid Visa and Mastercard numbers", () => {
    expect(luhn(VISA)).toBe(true);
    expect(luhn(MASTERCARD)).toBe(true);
    expect(luhn(MASTERCARD_2_SERIES)).toBe(true);
  });

  it("rejects a number with one digit mistyped", () => {
    expect(luhn("4111111111111112")).toBe(false);
    expect(luhn("5555555555554443")).toBe(false);
  });

  it("rejects a number with two neighbouring digits swapped", () => {
    expect(luhn("4539578763621486")).toBe(true);
    expect(luhn("4539578763621468")).toBe(false);
  });
});

describe("detectCardType", () => {
  it("recognises Visa and Mastercard, including 2-series Mastercard", () => {
    expect(detectCardType(VISA)).toBe("visa");
    expect(detectCardType(MASTERCARD)).toBe("mastercard");
    expect(detectCardType(MASTERCARD_2_SERIES)).toBe("mastercard");
  });

  it("returns nothing for other cards, which the deposit page refuses", () => {
    expect(detectCardType("378282246310005")).toBe(null);
    expect(detectCardType("6011111111111117")).toBe(null);
  });
});

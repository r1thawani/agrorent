import { describe, it, expect } from "vitest";
import { formatPhoneInput, isValidPhone } from "./phone";

describe("formatPhoneInput", () => {
  it("keeps the +260 prefix and up to 9 digits", () => {
    expect(formatPhoneInput("+260971234567")).toBe("+260971234567");
    expect(formatPhoneInput("+2609712345678")).toBe("+260971234567");
  });

  it("accepts local and pasted formats", () => {
    expect(formatPhoneInput("0971 234 567")).toBe("+260971234567");
    expect(formatPhoneInput("260-97-123-4567")).toBe("+260971234567");
  });

  it("starts from +260 when empty", () => {
    expect(formatPhoneInput("")).toBe("+260");
  });
});

describe("isValidPhone", () => {
  it("needs exactly 9 digits after +260", () => {
    expect(isValidPhone("+260971234567")).toBe(true);
    expect(isValidPhone("+26097123456")).toBe(false);
    expect(isValidPhone("0971234567")).toBe(false);
    expect(isValidPhone(null)).toBe(false);
  });
});

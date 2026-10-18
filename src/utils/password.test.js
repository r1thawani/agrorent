import { describe, it, expect } from "vitest";
import { getPasswordError } from "./password";

describe("getPasswordError", () => {
  it("accepts a password that meets every rule", () => {
    expect(getPasswordError("Harvest#2026")).toBe("");
  });

  it("says what is missing, one rule at a time", () => {
    expect(getPasswordError("Ab1#")).toBe("Password must be at least 8 characters.");
    expect(getPasswordError("harvest#2026")).toBe("Password must include at least one uppercase letter.");
    expect(getPasswordError("HARVEST#2026")).toBe("Password must include at least one lowercase letter.");
    expect(getPasswordError("Harvest#####")).toBe("Password must include at least one number.");
    expect(getPasswordError("Harvest2026")).toBe("Password must include at least one special character.");
  });
});

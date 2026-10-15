import { describe, expect, it } from "vitest";
import { friendlyError, isBusyError } from "./friendlyError";

const BUSY = "The server is busy right now. Please wait a moment and try again.";
const RATE = "Too many attempts. Please wait a minute and try again.";

describe("friendlyError", () => {
  it("explains Supabase's rate limit in plain words", () => {
    expect(friendlyError(new Error("Request rate limit reached"))).toBe(RATE);
    expect(friendlyError({ code: "over_request_rate_limit", message: "x" })).toBe(RATE);
    expect(friendlyError({ status: 429, message: "" })).toBe(RATE);
  });

  it("explains a database timeout instead of showing 'statement timeout'", () => {
    expect(friendlyError({ code: "57014", message: "canceling statement due to statement timeout" })).toBe(BUSY);
  });

  it("explains a failed network request instead of 'TypeError: Failed to fetch'", () => {
    expect(friendlyError(new TypeError("Failed to fetch"))).toBe(BUSY);
  });

  it("treats server errors (5xx) as the server being busy", () => {
    expect(friendlyError({ status: 503, message: "" })).toBe(BUSY);
  });

  it("gives plain messages for the common login mistakes", () => {
    expect(friendlyError(new Error("Invalid login credentials"))).toBe(
      "Wrong email or password. Please check and try again."
    );
    expect(friendlyError(new Error("Email not confirmed"))).toBe(
      "Please confirm your email first — open the link we sent you."
    );
  });

  it("passes any other message through unchanged", () => {
    expect(friendlyError(new Error("Password should be at least 6 characters."))).toBe(
      "Password should be at least 6 characters."
    );
  });

  it("falls back when there is no message at all", () => {
    expect(friendlyError(undefined)).toBe("Something went wrong. Please try again.");
    expect(friendlyError(new Error(""), "Login failed.")).toBe("Login failed.");
  });
});

describe("isBusyError", () => {
  it("is true for timeouts, network failures and 5xx, which are worth retrying", () => {
    expect(isBusyError({ code: "57014", message: "" })).toBe(true);
    expect(isBusyError(new TypeError("Failed to fetch"))).toBe(true);
    expect(isBusyError({ status: 502, message: "" })).toBe(true);
  });

  it("is false for errors a retry cannot fix", () => {
    expect(isBusyError({ code: "PGRST116", message: "no rows" })).toBe(false);
    expect(isBusyError(new Error("Invalid login credentials"))).toBe(false);
    expect(isBusyError({ status: 429, message: "Request rate limit reached" })).toBe(false);
    expect(isBusyError(null)).toBe(false);
  });
});

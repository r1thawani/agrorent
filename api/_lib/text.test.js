import { describe, it, expect } from "vitest";
import { messageGlimpse, escapeHtml, validateHelpRequest } from "./text";

describe("messageGlimpse", () => {
  it("keeps short messages whole", () => {
    expect(messageGlimpse("Is the tractor free?")).toBe("Is the tractor free?");
  });

  it("cuts long messages at a word boundary and adds an ellipsis", () => {
    const text = "Hello, I would like to rent your tractor next week for my maize field near Chongwe";
    const g = messageGlimpse(text);
    expect(g.endsWith("…")).toBe(true);
    expect(g.length).toBeLessThanOrEqual(41);
    expect(text.startsWith(g.slice(0, -1))).toBe(true);
    expect(g).not.toMatch(/ …$/);
  });

  it("collapses line breaks and extra spaces", () => {
    expect(messageGlimpse("Hi\n\n  there")).toBe("Hi there");
  });

  it("handles empty or missing text", () => {
    expect(messageGlimpse("")).toBe("");
    expect(messageGlimpse(null)).toBe("");
  });
});

describe("escapeHtml", () => {
  it("escapes characters that could inject markup into the email", () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
  });
});

describe("validateHelpRequest", () => {
  const ok = { name: " Chanda ", email: "chanda@example.com", message: "My booking page will not load." };

  it("accepts a normal request and trims it", () => {
    expect(validateHelpRequest(ok)).toEqual({
      value: { name: "Chanda", email: "chanda@example.com", message: "My booking page will not load." },
    });
  });

  it("rejects a missing name, bad email, or too-short message", () => {
    expect(validateHelpRequest({ ...ok, name: "" }).error).toBeTruthy();
    expect(validateHelpRequest({ ...ok, email: "not-an-email" }).error).toBeTruthy();
    expect(validateHelpRequest({ ...ok, message: "help" }).error).toBeTruthy();
  });

  it("rejects line breaks in the name, which would end up in the subject line", () => {
    expect(validateHelpRequest({ ...ok, name: "A\r\nBcc: x@y.com" }).error).toBeTruthy();
  });
});

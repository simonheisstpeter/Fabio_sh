import { describe, expect, it } from "vitest";
import { CONTACT_FIELDS, CONTACT_LIMITS, invalidContactFields } from "../../src/lib/contact-rules.js";

const ok = { name: "Tester", email: "tester@example.com", message: "A perfectly fine message." };
const invalid = (over: Partial<typeof ok>) => invalidContactFields({ ...ok, ...over });

describe("invalidContactFields", () => {
  it("accepts a valid submission", () => {
    expect(invalid({})).toEqual([]);
  });

  it("lists fields in form order, so the first is the one to focus", () => {
    expect(invalidContactFields({ name: "", email: "x", message: "" })).toEqual(["name", "email", "message"]);
    expect(CONTACT_FIELDS).toEqual(["name", "email", "message"]);
  });

  it("treats missing values as empty", () => {
    expect(invalidContactFields({})).toEqual(["name", "email", "message"]);
  });

  describe("name", () => {
    it.each([
      [CONTACT_LIMITS.nameMin - 1, false],
      [CONTACT_LIMITS.nameMin, true],
      [CONTACT_LIMITS.nameMax, true],
      [CONTACT_LIMITS.nameMax + 1, false],
    ])("length %d → valid=%s", (length, valid) => {
      expect(invalid({ name: "x".repeat(length) }).includes("name")).toBe(!valid);
    });
  });

  describe("message", () => {
    it.each([
      [CONTACT_LIMITS.messageMin - 1, false],
      [CONTACT_LIMITS.messageMin, true],
      [CONTACT_LIMITS.messageMax, true],
      [CONTACT_LIMITS.messageMax + 1, false],
    ])("length %d → valid=%s", (length, valid) => {
      expect(invalid({ message: "x".repeat(length) }).includes("message")).toBe(!valid);
    });
  });

  describe("email", () => {
    it.each(["a@b.de", "first.last+tag@sub.example.co.uk", "ümlaut@bücher.de"])("accepts %s", (email) => {
      expect(invalid({ email })).toEqual([]);
    });

    it.each(["", "plain", "a@b", "a@b.c", "a b@c.de", "@x.de", "a@@b.de", "a@b .de"])("rejects %j", (email) => {
      expect(invalid({ email })).toEqual(["email"]);
    });

    it("enforces the 254-character limit", () => {
      const local = "a".repeat(CONTACT_LIMITS.emailMax - "@x.de".length);
      expect(invalid({ email: `${local}@x.de` })).toEqual([]);
      expect(invalid({ email: `${local}a@x.de` })).toEqual(["email"]);
    });
  });

  describe("trimming (same as the server, which trims before storing)", () => {
    it("ignores surrounding whitespace when counting", () => {
      expect(invalid({ name: `  ${"x".repeat(CONTACT_LIMITS.nameMin)}  ` })).toEqual([]);
      expect(invalid({ message: `\n${"x".repeat(CONTACT_LIMITS.messageMin)}\n` })).toEqual([]);
    });

    it("rejects whitespace-only input, however long", () => {
      expect(invalid({ name: "     " })).toEqual(["name"]);
      expect(invalid({ message: " ".repeat(50) })).toEqual(["message"]);
    });

    it("padding can't rescue a too-short value", () => {
      expect(invalid({ message: `   short   ` })).toEqual(["message"]);
    });
  });
});

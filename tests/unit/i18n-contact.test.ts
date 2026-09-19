import { describe, expect, it } from "vitest";
import { LOCALES, getTranslations } from "../../src/i18n/index";
import { CONTACT_LIMITS } from "../../src/lib/contact-rules.js";

const KEYS = ["contactErrName", "contactErrEmail", "contactErrMessage", "contactErrRate", "contactSending"] as const;

describe("contact form copy exists in every locale", () => {
  it("covers all locales", () => {
    expect(LOCALES).toHaveLength(23);
  });

  describe.each([...LOCALES])("%s", (locale) => {
    const t = getTranslations(locale) as Record<string, string>;

    it.each(KEYS)("defines %s", (key) => {
      expect(typeof t[key]).toBe("string");
      expect(t[key].trim().length).toBeGreaterThan(0);
    });

    it("states the real limits, so the copy can't drift from the rules", () => {
      // Guards against changing CONTACT_LIMITS without updating the wording.
      expect(t.contactErrName).toContain(String(CONTACT_LIMITS.nameMax));
      expect(t.contactErrMessage).toContain(String(CONTACT_LIMITS.messageMax));
      expect(t.contactErrMessage).toContain(String(CONTACT_LIMITS.messageMin));
    });
  });

  it("does not silently reuse the generic error as a field message", () => {
    for (const locale of LOCALES) {
      const t = getTranslations(locale);
      expect(t.contactErrName).not.toBe(t.contactError);
      expect(t.contactErrMessage).not.toBe(t.contactError);
    }
  });
});

import { describe, it, expect } from "vitest";
import { getDictionary, isRtl, dirFor, LOCALE_LABELS } from "@/lib/i18n";
import { en } from "@/lib/i18n/en";
import { SUPPORTED_LOCALES } from "@/lib/constants";

describe("i18n dictionaries", () => {
  it("provides a dictionary for every supported locale with identical keys", () => {
    const expectedKeys = Object.keys(en).sort();
    for (const locale of SUPPORTED_LOCALES) {
      const dict = getDictionary(locale);
      expect(Object.keys(dict).sort(), `keys for ${locale}`).toEqual(expectedKeys);
      for (const value of Object.values(dict)) {
        expect(value.length, `non-empty strings for ${locale}`).toBeGreaterThan(0);
      }
    }
  });

  it("marks Arabic as right-to-left and others left-to-right", () => {
    expect(isRtl("ar")).toBe(true);
    expect(dirFor("ar")).toBe("rtl");
    expect(isRtl("en")).toBe(false);
    expect(dirFor("fr")).toBe("ltr");
  });

  it("labels every locale", () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(LOCALE_LABELS[locale].length).toBeGreaterThan(0);
    }
  });
});

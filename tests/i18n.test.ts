import { describe, it, expect } from "vitest";
import { getDictionary, isRtl, dirFor, LOCALE_LABELS } from "@/lib/i18n";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/lib/constants";

describe("i18n dictionaries", () => {
  it("provides a dictionary for every supported locale with identical keys", () => {
    const expectedKeys = Object.keys(getDictionary(DEFAULT_LOCALE)).sort();
    expect(expectedKeys.length).toBeGreaterThan(0);
    for (const locale of SUPPORTED_LOCALES) {
      const dict = getDictionary(locale);
      expect(Object.keys(dict).sort(), `keys for ${locale}`).toEqual(expectedKeys);
      for (const value of Object.values(dict)) {
        expect(value.length, `non-empty strings for ${locale}`).toBeGreaterThan(0);
      }
    }
  });

  it("translates rather than copies, with every locale differing from English", () => {
    // Dictionaries share construction order, so values can be compared by index.
    const englishValues = Object.values(getDictionary("en"));
    for (const locale of SUPPORTED_LOCALES.filter((l) => l !== "en")) {
      const values = Object.values(getDictionary(locale));
      const differing = values.filter((value, i) => value !== englishValues[i]);
      expect(differing.length, `translated strings for ${locale}`).toBeGreaterThan(10);
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

import { describe, expect, it } from "vitest";
import { defaultLanguage } from "@/lib/lang-detect";

describe("default language by location", () => {
  it("Kochi defaults to Malayalam", () => expect(defaultLanguage({ point: { lat: 9.93, lng: 76.27 } })).toBe("ml"));
  it("Bengaluru defaults to Kannada", () => expect(defaultLanguage({ point: { lat: 12.97, lng: 77.59 } })).toBe("kn"));
  it("a manual Malayalam choice beats location", () => expect(defaultLanguage({ saved: "ml", point: { lat: 13.08, lng: 80.27 } })).toBe("ml"));
  it("a manual Kannada choice beats location", () => expect(defaultLanguage({ saved: "kn", point: { lat: 13.08, lng: 80.27 } })).toBe("kn"));
  it("recognizes a Malayalam device language", () => expect(defaultLanguage({ deviceLangs: ["ml-IN"] })).toBe("ml"));
  it("recognizes a Kannada device language", () => expect(defaultLanguage({ deviceLangs: ["kn-IN"] })).toBe("kn"));
  it("Chennai (Tamil Nadu) defaults to Tamil", () => expect(defaultLanguage({ point: { lat: 13.08, lng: 80.27 } })).toBe("ta"));
  it("Hyderabad (Telangana) defaults to Telugu", () => expect(defaultLanguage({ point: { lat: 17.38, lng: 78.48 } })).toBe("te"));
  it("Delhi defaults to Hindi", () => expect(defaultLanguage({ point: { lat: 28.61, lng: 77.2 } })).toBe("hi"));
  it("Harris Park NSW defaults to English", () => expect(defaultLanguage({ point: { lat: -33.82, lng: 151.01 } })).toBe("en"));
  it("a saved manual choice beats location", () => expect(defaultLanguage({ saved: "en", point: { lat: 13.08, lng: 80.27 } })).toBe("en"));
  it("no location uses a supported device language", () => expect(defaultLanguage({ deviceLangs: ["fr-FR", "ta-IN"] })).toBe("ta"));
  it("otherwise English", () => expect(defaultLanguage({ deviceLangs: ["fr-FR"] })).toBe("en"));
});

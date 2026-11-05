import type { Point } from "./data";

export type Lang = "en" | "ta" | "te" | "hi" | "ml" | "kn";
export const LANGS: Lang[] = ["en", "ta", "te", "hi", "ml", "kn"];
export const LANG_LABEL: Record<Lang, string> = { en: "English", ta: "தமிழ்", te: "తెలుగు", hi: "हिन्दी", ml: "മലയാളം", kn: "ಕನ್ನಡ" };
export const isLang = (v: unknown): v is Lang => typeof v === "string" && (LANGS as string[]).includes(v);

type Box = { lang: Lang; region: string; s: number; n: number; w: number; e: number };
// Ordered: first match wins (Tamil Nadu is checked before the wider Telugu box).
const REGIONS: Box[] = [
  { lang: "ml", region: "Kerala", s: 8.1, n: 12.8, w: 74.8, e: 77.4 },
  { lang: "kn", region: "Karnataka", s: 12.8, n: 18.5, w: 74.0, e: 77.6 },
  { lang: "ta", region: "Tamil Nadu", s: 8.0, n: 13.6, w: 76.2, e: 80.4 },
  { lang: "ta", region: "Northern Sri Lanka", s: 7.5, n: 9.9, w: 79.6, e: 81.9 },
  { lang: "te", region: "Andhra Pradesh / Telangana", s: 12.6, n: 19.9, w: 76.7, e: 84.8 },
  { lang: "hi", region: "North India", s: 21.0, n: 31.0, w: 73.0, e: 88.5 },
];

export function regionFor(p: Point): Box | undefined {
  return REGIONS.find((r) => p.lat >= r.s && p.lat <= r.n && p.lng >= r.w && p.lng <= r.e);
}

/**
 * Default language: a manual choice always wins; otherwise the user's state/region;
 * otherwise their device language if we support it; otherwise English.
 */
export function defaultLanguage(opts: { saved?: string | null; point?: Point | null; deviceLangs?: readonly string[] }): Lang {
  if (isLang(opts.saved)) return opts.saved;
  if (opts.point) {
    const r = regionFor(opts.point);
    if (r) return r.lang;
  }
  for (const d of opts.deviceLangs ?? []) {
    const code = d.toLowerCase().split("-")[0];
    if (isLang(code)) return code;
  }
  return "en";
}

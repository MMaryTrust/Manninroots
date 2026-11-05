import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { en, ta, te, hi, ml, kn, type Dict } from "./translations";
import { defaultLanguage, isLang, regionFor, type Lang } from "./lang-detect";
import { getLocationState, startLocating, subscribeLocation } from "./location-store";

export type { Lang } from "./lang-detect";
const dicts: Record<Lang, Partial<Dict>> = { en, ta, te, hi, ml, kn };
const KEY = "mr-lang";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** Region name the automatic default came from, if any. */
  region: string | null;
  manual: boolean;
  resetToRegion: () => void;
  t: (k: keyof Dict, vars?: Record<string, string | number>) => string;
};
// Keep one context across hot reloads so editing translations never orphans the provider.
const g = globalThis as { __mrI18nCtx?: React.Context<Ctx | null> };
const I18nContext = (g.__mrI18nCtx ??= createContext<Ctx | null>(null));

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [manual, setManual] = useState(false);
  const [region, setRegion] = useState<string | null>(null);

  const applyAuto = () => {
    const s = getLocationState();
    const point = s.exact ? s.point : null;
    setRegion(point ? regionFor(point)?.region ?? null : null);
    setLangState(defaultLanguage({ point, deviceLangs: navigator.languages }));
  };

  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    if (isLang(saved)) { setLangState(saved); setManual(true); }
    else applyAuto();
    startLocating();
    return subscribeLocation(() => { if (!isLang(localStorage.getItem(KEY))) applyAuto(); });
  }, []);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const setLang = (l: Lang) => { setLangState(l); setManual(true); localStorage.setItem(KEY, l); };
  const resetToRegion = () => { localStorage.removeItem(KEY); setManual(false); applyAuto(); };
  const t: Ctx["t"] = (k, vars) => {
    let s = dicts[lang][k] ?? en[k] ?? String(k);
    if (vars) for (const [v, val] of Object.entries(vars)) s = s.replace(`{${v}}`, String(val));
    return s;
  };
  return <I18nContext.Provider value={{ lang, setLang, region, manual, resetToRegion, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const c = useContext(I18nContext);
  if (!c) throw new Error("useI18n outside provider");
  return c;
}

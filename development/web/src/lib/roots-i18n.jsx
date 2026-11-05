import { createContext, useContext, useEffect, useState } from 'react';
import { en, ta, te, hi, kn, ml } from './roots-translations.js';

const dicts = { en, ta, te, hi, kn, ml };
const KEY = 'roots_lang';

const I18nContext = createContext(null);

export function RootsI18nProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem(KEY) || 'en');

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (l) => {
    setLangState(l);
    localStorage.setItem(KEY, l);
  };

  const t = (key) => {
    return dicts[lang]?.[key] ?? dicts.en[key] ?? key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useRootsI18n() {
  const c = useContext(I18nContext);
  if (!c) throw new Error('useRootsI18n outside provider');
  return c;
}

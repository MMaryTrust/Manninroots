import { createContext, useContext, useEffect, useState } from 'react';

// English is the key; Tamil is looked up. Anything missing falls back to English.
const TA = {
  Home: 'முகப்பு', Plans: 'திட்டங்கள்', Menu: 'உணவுப்பட்டியல்', 'How it works': 'எப்படி செயல்படுகிறது', Roots: 'வேர்கள்',
  'Sign in': 'உள்நுழை', 'Sign out': 'வெளியேறு', 'Sign up': 'பதிவு செய்', Dashboard: 'முகப்புப் பலகை',
  'See plans': 'திட்டங்களைப் பார்', "This week's menu": 'இந்த வார உணவுப்பட்டியல்', Explore: 'ஆராயுங்கள்', Account: 'கணக்கு',
  'Family meal plans': 'குடும்ப உணவுத் திட்டங்கள்', Breakfast: 'காலை உணவு', Lunch: 'மதிய உணவு', Dinner: 'இரவு உணவு',
  'Order Food': 'உணவு ஆர்டர்', 'Explore Restaurants': 'உணவகங்களை ஆராய்', 'Healthy Choices': 'ஆரோக்கிய தேர்வுகள்', 'Top Rated': 'உயர் மதிப்பீடு',
  'Offers & Deals': 'சலுகைகள்', 'Explore Our Cuisines': 'எங்கள் உணவு வகைகள்', 'Choose a kitchen': 'உணவகத்தைத் தேர்ந்தெடுக்கவும்',
  'All kitchens': 'அனைத்து உணவகங்கள்', restaurants: 'உணவகங்கள்', dishes: 'உணவுகள்', 'Back to all kitchens': 'அனைத்து உணவகங்களுக்கும் திரும்பு',
  'Top at': 'சிறந்தவை —', 'Recommended for you': 'உங்களுக்கு பரிந்துரை', Add: 'சேர்', Cart: 'கூடை', Checkout: 'பணம் செலுத்து',
  'My orders': 'என் ஆர்டர்கள்', Orders: 'ஆர்டர்கள்', Email: 'மின்னஞ்சல்', Password: 'கடவுச்சொல்',
};

const Ctx = createContext(null);
export const useI18n = () => useContext(Ctx);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');
  const [big, setBig] = useState(() => localStorage.getItem('big') === '1');
  useEffect(() => { localStorage.setItem('lang', lang); document.documentElement.lang = lang === 'ta' ? 'ta' : 'en'; }, [lang]);
  useEffect(() => { localStorage.setItem('big', big ? '1' : '0'); document.documentElement.style.fontSize = big ? '118%' : ''; }, [big]);
  const t = (k) => (lang === 'ta' && TA[k]) || k;
  const bi = (en, ta) => (lang === 'ta' && ta ? ta : en); // inline English/Tamil pair
  return <Ctx.Provider value={{ lang, setLang, big, setBig, t, bi }}>{children}</Ctx.Provider>;
}

import { db } from './store.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const inr = (n) => '₹' + Number(n).toLocaleString('en-IN');
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* language: English default, Tamil toggle, persisted in localStorage */
const TA = {
  'See plans': 'திட்டங்களைக் காண்க', "This week's menu": 'இந்த வார உணவுப்பட்டியல்', Home: 'முகப்பு', Plans: 'திட்டங்கள்', Menu: 'உணவுப்பட்டியல்',
  'How it works': 'எப்படி செயல்படுகிறது', 'Sign in': 'உள்நுழை', 'Sign up': 'பதிவு செய்', 'Sign out': 'வெளியேறு', Roots: 'வேர்கள்',
  'Taste of the Land': 'மண்ணின் சுவை', 'Getting started': 'தொடங்குவது எப்படி', 'Pick a rhythm': 'உங்கள் தாளத்தைத் தேர்ந்தெடுங்கள்',
  'Share family health profile': 'குடும்ப சுகாதார விவரம் பகிருங்கள்', 'Doctor consultation': 'மருத்துவர் ஆலோசனை', 'Enjoy traditional meals': 'மரபு உணவை அனுபவியுங்கள்',
  'Family meal plans': 'குடும்ப உணவுத் திட்டங்கள்', 'Heritage menu': 'மரபு வழி உணவுப்பட்டியல்', 'Subscribe': 'சந்தா செலுத்து', 'per day': 'நாளுக்கு',
  Dashboard: 'முகப்புப் பலகை', Customers: 'வாடிக்கையாளர்கள்', Appointments: 'சந்திப்புகள்', Care: 'பராமரிப்பு', Kitchen: 'சமையலறை', Finance: 'நிதி', Approvals: 'ஒப்புதல்கள்', Staff: 'பணியாளர்கள்',
  'Order Food': 'உணவு ஆர்டர்', 'Voice Order': 'குரல் ஆர்டர்', 'Explore Restaurants': 'உணவகங்கள்', 'Healthy Choices': 'ஆரோக்கிய தேர்வுகள்', 'Top Rated': 'உயர் மதிப்பீடு', 'Offers & Deals': 'சலுகைகள்',
  'Our Roots. Our Taste.': 'நம் மண். நம் சுவை.', 'Add': 'சேர்', Checkout: 'செலுத்து', Cart: 'கூடை', 'Search restaurants, dishes or cuisines...': 'உணவகங்கள், உணவுகள் தேடுங்கள்...',
  'Explore Our Cuisines': 'எங்கள் உணவு வகைகள்', 'Pure Veg': 'சைவம்',
};
export const lang = () => localStorage.getItem('mannin_lang') || 'en';
export const setLang = (l) => localStorage.setItem('mannin_lang', l);
export const t = (s) => (lang() === 'ta' && TA[s]) || s;
export const bi = (en, ta) => (lang() === 'ta' && ta ? ta : en);

export function toast(msg, kind = 'ok') {
  let w = $('#toasts');
  if (!w) { w = document.createElement('div'); w.id = 'toasts'; w.setAttribute('role', 'status'); w.setAttribute('aria-live', 'polite'); document.body.append(w); }
  const el = document.createElement('div');
  el.className = 'toast ' + kind; el.textContent = msg; w.append(el);
  setTimeout(() => el.remove(), 4200);
}
export function modal(html, onMount) {
  const m = document.createElement('div');
  m.className = 'modal-bg';
  m.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
  m.addEventListener('click', (e) => { if (e.target === m || e.target.closest('[data-close]')) m.remove(); });
  document.body.append(m);
  onMount?.(m.firstElementChild, () => m.remove());
  return m;
}
export const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
export const roleCan = (u, ...roles) => !!u && roles.includes(u.role);
export const userName = (id) => db().users.find((u) => u.id === id)?.name || '—';

/* global action registry: elements use data-act="name"; modules register handlers here */
export const acts = {};
export const routes = {};
export const mounts = [];
export const hooks = {}; // workflow.js plugs into screens through these (keeps modules decoupled)
export const textSize = () => { try { return localStorage.getItem('mannin_text') || '1'; } catch { return '1'; } };
export const textBtn = (cls = 'btn ghost sm') => `<button class="${cls}" data-act="textsize" aria-label="Text size" title="Text size">A${'+'.repeat(+textSize() - 1)}<span class="sr"> text size</span></button>`; // functions run after every render (e.g. carousel wiring)
export const rerender = () => window.dispatchEvent(new Event('mannin:rerender'));
export const go = (h) => { if (location.hash === h) rerender(); else location.hash = h; };
export const logo = (size = 36) => `<svg width="${size}" height="${size}" viewBox="0 0 48 48" aria-hidden="true"><path d="M10 20c0-6 6-10 14-10s14 4 14 10c0 8-5 15-14 15S10 28 10 20z" fill="var(--accent)"/><path d="M24 35v8M24 40c-5 0-9-2-12-6M24 40c5 0 9-2 12-6" stroke="var(--primary)" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M6 14c6-2 11 0 13 5-6 2-11 0-13-5zM42 14c-6-2-11 0-13 5 6 2 11 0 13-5z" fill="var(--primary)"/></svg>`;

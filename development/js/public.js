import { db, save, log, PLANS, planTotal, planSaving, ROLE_LABEL, hash, tempPassword, uid, session, setSession, currentUser } from './store.js';
import { DEMO_MODE } from './config.js';
import { requestPayment } from './payments.js';
import { esc, inr, t, bi, lang, setLang, toast, acts, routes, mounts, go, rerender, logo, textBtn } from './util.js';

const ADDRESS = 'Madha Church Street, Virachilai, Pudukkottai, 622412';

export function publicShell(inner, active = '') {
  const u = currentUser();
  const nav = [['#/', 'Home'], ['#/plans', 'Plans'], ['#/menu', 'Menu'], ['#/how', 'How it works'], ['#/roots', 'Roots']];
  return `<header class="pub-head"><div class="wrap row">
    <a class="brand" href="#/">${logo()}<span><b>Mannin Suvai</b><small>${bi('Taste of the Land', 'மண்ணின் சுவை')}</small></span></a>
    <nav aria-label="Main">${nav.map(([h, l]) => `<a href="${h}" class="${active === h ? 'on' : ''}">${t(l)}</a>`).join('')}</nav>
    <div class="row gap">${textBtn()}
      <button class="btn ghost sm" data-act="lang" aria-label="Language">${lang() === 'en' ? 'தமிழ்' : 'English'}</button>
      ${u ? `<a class="btn sm" href="#/app">${t('Dashboard')}</a>` : `<a class="btn ghost sm" href="#/signin">${t('Sign in')}</a><a class="btn sm" href="#/signup">${t('Sign up')}</a>`}
    </div></div></header>
  <main>${inner}</main>
  <footer class="pub-foot"><div class="wrap"><b>Mannin Suvai Unavagam</b> · ${ADDRESS}<br><small>${bi('Heritage meals for elders and families, cooked in mud pots with cold-pressed sesame oil.', 'மண்பானையில் சமைத்த மரபு உணவு — பெரியோருக்கும் குடும்பத்திற்கும்.')}</small></div></footer>`;
}

export const planCard = (p, cta = true) => `<article class="plan card ${p.id === 'yearly' ? 'gold' : ''}">
  <h3 class="serif">${bi(p.name, p.ta)}</h3>
  <div class="price mono">${inr(planTotal(p))}</div>
  <p class="muted mono">${p.days} ${bi('days', 'நாட்கள்')} · ${inr(p.rate)} ${t('per day')}</p>
  ${planSaving(p) ? `<span class="badge gold">${bi('Save', 'சேமிப்பு')} ${inr(planSaving(p))}</span>` : `<span class="badge">${bi('Trial', 'சோதனை')}</span>`}
  <p>${bi(p.note, p.noteTa)}</p>
  ${cta ? `<a class="btn" href="#/signup?plan=${p.id}">${t('Subscribe')}</a>` : ''}</article>`;

export const dishCard = (d) => `<article class="dish card">
  <div class="dish-art" aria-hidden="true">${esc(d.name[0])}</div>
  <h4>${bi(d.name, d.ta)}</h4>
  <div class="tags"><span class="badge ${d.gi === 'Low-GI' ? 'green' : 'gold'}">${d.gi}</span><span class="badge">FSSAI</span>${d.tags.map((x) => `<span class="badge">${esc(x)}</span>`).join('')}</div>
  <p class="muted mono" title="Calories · Protein · Carbs · Fat">${d.kcal} kcal · P${d.protein} C${d.carbs} F${d.fat}</p></article>`;

const steps = [
  ['Pick a rhythm', 'Weekly to Yearly subscription selection.'],
  ['Share family health profile', 'Dietary tags, diabetes/hypertension disclosures.'],
  ['Doctor consultation', 'Clinical care assignment and kitchen briefing.'],
  ['Enjoy traditional meals', 'Scheduled 3× daily hot delivery.'],
];
const stepsHtml = () => `<ol class="steps">${steps.map(([a, b], i) => `<li class="reveal"><span class="num mono">${i + 1}</span><h3 class="serif">${t(a)}</h3><p>${b}</p></li>`).join('')}</ol>`;

routes['/'] = () => publicShell(`
  <section class="hero"><div class="wrap">
    <p class="eyebrow">${bi('Heritage food for elders & families', 'பெரியோருக்கும் குடும்பத்திற்கும் மரபு உணவு')}</p>
    <h1 class="serif">${bi('The <em>taste of the land</em>, three times a day.', 'மண்ணின் சுவை, <em>தினமும் மூன்று வேளை</em>.')}</h1>
    <p class="lead">${bi('Thanjavur and Pudukkottai home cooking — mud-pot thalis, native millets and cold-pressed sesame oil — planned with a doctor for your family.', 'தஞ்சை, புதுக்கோட்டை மரபு சமையல் — மண்பானை தாலி, சிறுதானியம், செக்கு எண்ணெய் — மருத்துவர் ஆலோசனையுடன்.')}</p>
    <div class="row gap"><a class="btn lg" href="#/plans">${t('See plans')}</a><a class="btn ghost lg" href="#/menu">${t("This week's menu")}</a></div>
    <p class="muted">📍 ${ADDRESS}</p></div></section>
  <section class="wrap sec"><h2 class="serif">${t('Getting started')}</h2>${stepsHtml()}</section>
  <section class="sec stage-sec"><div class="wrap row between"><h2 class="serif">${t('Family meal plans')}</h2>
    <div class="row gap"><button class="btn ghost sm" data-act="stage" data-d="-1" aria-label="Previous plan">←</button><button class="btn ghost sm" data-act="stage" data-d="1" aria-label="Next plan">→</button></div></div>
    <div class="stage" id="plan-stage" tabindex="0" aria-label="Plans carousel" aria-roledescription="carousel">${PLANS.map((p, i) => `<div class="slide${i === 2 ? ' active' : ''}" aria-label="${i + 1} of ${PLANS.length}"><div class="browser-card-inner">${planCard(p)}</div></div>`).join('')}</div></section>
  <section class="wrap sec roots-cta card"><div><h2 class="serif">Mannin Roots</h2><p>${bi('Neighbourhood restaurants, one cart, one flat fee. Order by web or by phone.', 'அருகிலுள்ள உணவகங்கள், ஒரே கூடை, ஒரே கட்டணம்.')}</p></div><a class="btn" href="#/roots">${t('Order Food')}</a></section>`, '#/');

routes['/plans'] = () => publicShell(`<section class="wrap sec"><h1 class="serif">${t('Family meal plans')}</h1>
  <p class="lead">${bi('Daily rate × days, rounded to the nearest ₹100. Every plan is for the whole family — elders, nominees and children.', 'நாள் கட்டணம் × நாட்கள், ₹100க்கு முழுமையாக்கப்பட்டது. குடும்பம் முழுவதற்கும்.')}</p>
  <div class="grid plans">${PLANS.map((p) => planCard(p)).join('')}</div></section>`, '#/plans');

routes['/menu'] = () => publicShell(`<section class="wrap sec"><h1 class="serif">${t('Heritage menu')}</h1>
  <p class="lead">${bi('Seasonal thalis in mud pots, unpolished Kambu, Ragi and Samai, cold-pressed sesame oil. Subscriptions are vegetarian-only.', 'மண்பானை தாலி, கம்பு, ராகி, சாமை, செக்கு எண்ணெய்.')}</p>
  <div class="grid dishes">${db().dishes.map(dishCard).join('')}</div></section>`, '#/menu');

routes['/how'] = () => publicShell(`<section class="wrap sec"><h1 class="serif">${t('Getting started')}</h1>${stepsHtml()}</section>`, '#/how');

/* ---------- auth ---------- */
const qs = () => new URLSearchParams(location.hash.split('?')[1] || '');

routes['/signin'] = () => publicShell(`<section class="wrap narrow sec"><h1 class="serif">${t('Sign in')}</h1>
  <form id="f-signin" class="card form"><label>Email<input name="email" type="email" required autocomplete="username"></label>
  <label>Password<input name="pw" type="password" required autocomplete="current-password"></label>
  <p class="err" id="signin-err" role="alert"></p><button class="btn lg">${t('Sign in')}</button></form>
  ${DEMO_MODE ? `<details class="card demo"><summary>Prototype demo: sign in as a role</summary>
    <p class="muted">Demo shortcut for reviewing this prototype. Passwords are never stored or shown; this bypass is removed in production.</p>
    <div class="row wrap gap">${db().users.map((u) => `<button class="btn ghost sm" data-act="demo" data-id="${u.id}">${ROLE_LABEL[u.role]}${u.role === 'doctor' ? ' · ' + esc(u.name.split(' ')[1]) : ''}</button>`).join('')}</div></details>` : ''}</section>`);

routes['/signup'] = () => {
  const pre = qs().get('plan');
  return publicShell(`<section class="wrap narrow sec"><h1 class="serif">${t('Sign up')}</h1>
  <p class="lead">${bi('New accounts start as pending. An admin verifies your bank transaction, then sends your one-time temporary password.', 'புதிய கணக்கு நிலுவையில் இருக்கும். வங்கி பரிவர்த்தனை சரிபார்த்த பின் தற்காலிக கடவுச்சொல் வழங்கப்படும்.')}</p>
  <form id="f-signup" class="card form"><label>Full name<input name="name" required></label>
  <label>Email<input name="email" type="email" required></label><label>Mobile<input name="phone" inputmode="numeric" pattern="[0-9]{10}" required placeholder="10 digits"></label>
  <label>Plan<select name="plan">${PLANS.map((p) => `<option value="${p.id}" ${pre === p.id ? 'selected' : ''}>${p.name} — ${inr(planTotal(p))}</option>`).join('')}</select></label>
  <label>Bank / UPI transaction reference<input name="ref" required></label>
  <p class="err" id="signup-err" role="alert"></p><button class="btn lg">${t('Sign up')}</button></form></section>`);
};

routes['/change-password'] = () => {
  const u = currentUser(); if (!u) return go('#/signin');
  return publicShell(`<section class="wrap narrow sec"><h1 class="serif">Set your password</h1>
  <p class="lead">${u.mustChange ? 'You signed in with a temporary password. Choose a new one to continue.' : 'Change your password.'}</p>
  <form id="f-pw" class="card form"><label>New password (min 8)<input name="pw" type="password" minlength="8" required autocomplete="new-password"></label>
  <label>Confirm<input name="pw2" type="password" minlength="8" required autocomplete="new-password"></label><p class="err" id="pw-err" role="alert"></p><button class="btn lg">Save</button></form></section>`);
};

export function afterLogin(u) {
  setSession({ userId: u.id });
  if (u.mustChange) return go('#/change-password');
  go(u.role === 'customer' ? '#/app/me' : '#/app');
}

/* Active-focus stage: the slide nearest the centre gets .active; only .browser-card-inner is transformed (CSS). */
function stageActive(st) {
  const mid = st.scrollLeft + st.clientWidth / 2; let best = null, bd = Infinity;
  for (const s of st.children) { const d = Math.abs(s.offsetLeft + s.offsetWidth / 2 - mid); if (d < bd) { bd = d; best = s; } }
  for (const s of st.children) s.classList.toggle('active', s === best);
  return best;
}
mounts.push(() => {
  const st = document.getElementById('plan-stage'); if (!st) return;
  const center = (s, smooth) => st.scrollTo({ left: s.offsetLeft - (st.clientWidth - s.offsetWidth) / 2, behavior: smooth ? 'smooth' : 'instant' });
  center(st.querySelector('.slide.active'), false);
  let raf; st.addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => stageActive(st)); }, { passive: true });
  st.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); acts.stage({ dataset: { d: e.key === 'ArrowRight' ? 1 : -1 } }); } });
  st._center = center;
});
acts.stage = (el) => {
  const st = document.getElementById('plan-stage'), cur = stageActive(st), sl = [...st.children];
  const next = sl[(sl.indexOf(cur) + +el.dataset.d + sl.length) % sl.length];
  st._center(next, true);
};
acts.lang = () => { setLang(lang() === 'en' ? 'ta' : 'en'); rerender(); };
acts.demo = (el) => { if (!DEMO_MODE) return; const u = db().users.find((x) => x.id === el.dataset.id); log(u.name, 'Demo sign-in', ROLE_LABEL[u.role]); afterLogin(u); };

document.addEventListener('submit', async (e) => {
  const f = e.target;
  if (f.id === 'f-signin') {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f)); const err = document.getElementById('signin-err');
    const u = db().users.find((x) => x.email.toLowerCase() === d.email.toLowerCase());
    if (!u || (await hash(d.pw, u.salt)) !== u.pwHash) { err.textContent = 'Email or password is incorrect.'; return; }
    if (u.status === 'pending') { err.textContent = 'Your account is awaiting payment verification by an admin. Sign-in is blocked until approval.'; return; }
    if (u.status !== 'active') { err.textContent = 'This account is suspended.'; return; }
    log(u.name, 'Sign-in'); afterLogin(u);
  }
  if (f.id === 'f-signup') {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f)); const err = document.getElementById('signup-err');
    if (db().users.some((x) => x.email.toLowerCase() === d.email.toLowerCase())) { err.textContent = 'An account with this email already exists.'; return; }
    const salt = uid('s');
    const nu = { id: uid('u'), name: d.name, email: d.email, phone: d.phone, role: 'customer', status: 'pending', mustChange: true, salt, pwHash: await hash(tempPassword(), salt), financeAdmin: false };
    db().users.push(nu);
    requestPayment({ customer: d.name, planId: d.plan, ref: d.ref, userId: nu.id });
    log(d.name, 'Signup submitted', `Pending verification · ${d.ref}`); save();
    f.closest('section').innerHTML = `<h1 class="serif">Thank you</h1><p class="lead">Your account is <b>pending</b>. An admin will verify your payment reference <span class="mono">${esc(d.ref)}</span> and issue your temporary password.</p><a class="btn" href="#/">Home</a>`;
  }
  if (f.id === 'f-pw') {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f)); const err = document.getElementById('pw-err'); const u = currentUser();
    if (d.pw !== d.pw2) { err.textContent = 'Passwords do not match.'; return; }
    u.salt = uid('s'); u.pwHash = await hash(d.pw, u.salt); u.mustChange = false; log(u.name, 'Password changed'); save();
    toast('Password updated'); afterLogin(u);
  }
});

export { stepsHtml };

import { db, rdb, saveRoots, uid, currentUser, checkPayToken, notify } from './store.js';
import { esc, t, bi, lang, setLang, toast, modal, acts, routes, go, rerender, logo, textBtn } from './util.js';

const S = { region: localStorage.getItem('roots_region') || 'IN', cart: [], q: '', cuisine: '', filter: '', kitchen: '', otp: null };
try { S.cart = JSON.parse(localStorage.getItem('roots_cart') || '[]'); } catch { S.cart = []; }
const persist = () => localStorage.setItem('roots_cart', JSON.stringify(S.cart));
const FEE = { IN: { sym: '₹', fee: 50, city: 'Chennai, India' }, AU: { sym: '$', fee: 10, city: 'Sydney, Australia' } };
const audRate = () => rdb().settings?.audPer100 || 0; // AUD per ₹100, set by Owner/Admin in Staff → Roots
const auBlocked = () => S.region === 'AU' && !audRate();
const local = (inr) => (S.region === 'IN' ? inr : Math.round((inr * audRate()) / 50) / 2); // AUD rounded to $0.50
const money = (n) => FEE[S.region].sym + (S.region === 'AU' ? Number(n).toFixed(2) : Number(n).toLocaleString('en-IN'));
// cuisine photos are cut from the brand reference image with CSS (x, y, w, h in source pixels)
const PHOTO = { 'South Indian': [378, 757, 145, 75], Biryani: [562, 757, 146, 75], 'Traditional Meals': [748, 757, 148, 75], 'Millet Specials': [935, 757, 146, 75], 'Street Food': [1123, 757, 146, 75], 'Healthy & Light': [1313, 757, 148, 75] };
const photo = (k, w = 120) => { const [x, y, pw, ph] = PHOTO[k], sc = w / pw; return `<span class="cu-photo" style="width:${w}px;height:${Math.round(ph * sc)}px;background-size:${Math.round(1672 * sc)}px auto;background-position:-${Math.round(x * sc)}px -${Math.round(y * sc)}px" aria-hidden="true"></span>`; };
const live = (r) => !r.status || r.status === 'active';
const CUIS = [['South Indian', 'தென்னிந்திய', '🍚'], ['Biryani', 'பிரியாணி', '🍛'], ['Traditional Meals', 'மரபு உணவு', '🍽️'], ['Millet Specials', 'சிறுதானியம்', '🌾'], ['Street Food', 'தெரு உணவு', '🍩'], ['Healthy & Light', 'ஆரோக்கியம்', '🥗']];

const allDishes = () => rdb().restaurants.filter(live).flatMap((r) => r.dishes.map((d) => ({ ...d, rid: r.id, rname: r.name, rta: r.ta })));
const cartRestaurants = () => [...new Set(S.cart.map((c) => c.rid))];
const subtotal = () => S.cart.reduce((s, c) => s + local(c.price) * c.qty, 0);

function dishRow(d) {
  return `<article class="rdish">${PHOTO[d.cat] ? photo(d.cat, 72) : ''}<div class="grow"><b>${esc(d.name)}</b><br><small>${esc(bi(d.rname, d.rta))} · ★ ${d.rating.toFixed(1)}</small>${d.tags.map((x) => `<span class="badge green">${esc(x)}</span>`).join('')}</div>
   <div class="row gap"><b class="mono">${auBlocked() ? '—' : money(local(d.price))}</b><button class="btn sm" ${auBlocked() ? 'disabled' : ''} data-act="radd" data-rid="${d.rid}" data-id="${d.id}">${t('Add')}</button></div></article>`;
}

routes['/roots'] = () => {
  const R = rdb(), q = S.q.toLowerCase();
  let dishes = allDishes();
  if (S.cuisine) dishes = dishes.filter((d) => d.cat === S.cuisine);
  if (S.filter === 'healthy') dishes = dishes.filter((d) => d.tags.includes('Healthy'));
  if (S.filter === 'top') dishes = dishes.filter((d) => d.rating >= 4.6).sort((a, b) => b.rating - a.rating); // surfaced immediately, no probation
  if (q) dishes = dishes.filter((d) => (d.name + d.rname + d.cat).toLowerCase().includes(q));
  const rests = R.restaurants.filter((r) => live(r) && (!S.cuisine || r.cuisine === S.cuisine) && (!q || (r.name + r.cuisine).toLowerCase().includes(q)));
  if (S.kitchen) dishes = dishes.filter((d) => d.rid === S.kitchen);
  const kList = R.restaurants.filter(live), kSel = kList.find((r) => r.id === S.kitchen);
  const recs = [...dishes].sort((a, b) => b.rating - a.rating).slice(0, 3);
  const byRest = (kSel ? [kSel] : kList).map((r) => [r, dishes.filter((d) => d.rid === r.id)]).filter(([, ds]) => ds.length);
  const full = cartRestaurants().length;
  const tiles = [['food', '🍴', 'Order Food'], ['voice', '🎙️', 'Voice Order'], ['rest', '🏪', 'Explore Restaurants'], ['healthy', '🌿', 'Healthy Choices'], ['top', '⭐', 'Top Rated'], ['offers', '🏷️', 'Offers & Deals']];
  return `<div class="roots"><header class="r-head row between">
    <div class="row gap"><button class="pill" data-act="rlang">🌐 ${lang() === 'en' ? 'தமிழ்' : 'English'}</button>${textBtn('pill')}</div>
    <div class="row gap"><select class="pill" data-act-region aria-label="Region">${Object.entries(FEE).map(([k, v]) => `<option value="${k}" ${S.region === k ? 'selected' : ''}>📍 ${v.city}</option>`).join('')}</select>
    <a class="pill" href="#/">Mannin Suvai</a><a class="pill" href="#/roots/orders">Orders</a><a class="pill" href="#/signin" title="Account">👤</a></div></header>
  <section class="r-hero">${logo(88)}<h1 class="serif">தமிழ் மண்ணின் வேர்கள்<br><span>MANNIN ROOTS</span></h1><p class="gold">நம் மண். நம் சுவை. · ${t('Our Roots. Our Taste.')}</p>
    <div class="searchbar"><input id="rq" value="${esc(S.q)}" placeholder="${t('Search restaurants, dishes or cuisines...')}" aria-label="Search"><button data-act="rvoice" aria-label="Voice order">🎙️</button></div>
    <div class="tiles">${tiles.map(([k, i, l]) => `<button class="tile ${S.filter === k ? 'on' : ''}" data-act="rtile" data-k="${k}"><span>${i}</span>${t(l)}</button>`).join('')}</div></section>
  <section class="r-cuis"><h2>${t('Explore Our Cuisines')}</h2><div class="cuis">${CUIS.map(([k, ta, i]) => `<button class="cu ${S.cuisine === k ? 'on' : ''}" data-act="rcuis" data-k="${k}">${photo(k)}${bi(k, ta)}</button>`).join('')}</div></section>
  ${auBlocked() ? '<p class="r-sec wide notice" role="status">Australian prices are not set yet. An Owner or Admin must enter the AUD rate in Staff → Roots before orders can be taken in Australia.</p>' : ''}
  ${S.filter === 'offers' ? `<section class="r-sec">${R.offers.map((o) => `<div class="offer"><b class="mono">${o.code}</b> ${esc(o.text)}</div>`).join('')}</section>` : ''}
  <section class="r-sec wide" aria-label="Choose a kitchen"><h2>${bi('Choose a kitchen', 'உணவகத்தைத் தேர்ந்தெடுக்கவும்')}</h2>
    <div class="kitchens"><button class="kit ${!S.kitchen ? 'on' : ''}" data-act="rkit" data-k=""><b>${t('All kitchens')}</b><small>${kList.length} ${t('restaurants')}</small></button>
    ${kList.map((r) => `<button class="kit ${S.kitchen === r.id ? 'on' : ''}" data-act="rkit" data-k="${r.id}"><b>${esc(bi(r.name, r.ta))}</b><small>★ ${r.rating} · ${allDishes().filter((d) => d.rid === r.id).length} ${t('dishes')}</small></button>`).join('')}</div>
    ${kSel ? `<button class="linkbtn" data-act="rkit" data-k="">← ${t('Back to all kitchens')}</button>` : ''}</section>
  <div class="r-main"><div>
  <section class="r-sec"><h2>${S.filter === 'top' ? '⭐ ' + t('Top Rated') : S.filter === 'healthy' ? '🌿 ' + t('Healthy Choices') : kSel ? t('Top at') + ' ' + esc(bi(kSel.name, kSel.ta)) : t('Recommended for you')}</h2>${recs.map(dishRow).join('') || '<p>No matches.</p>'}</section>
  ${byRest.map(([r, ds]) => `<section class="r-sec"><h2>🏪 ${esc(bi(r.name, r.ta))} <small>★ ${r.rating} · ${esc(r.area)}</small></h2>${ds.map(dishRow).join('')}</section>`).join('')}
  <p class="r-sec small"><a href="#/app/roots">${t('Restaurant orders view')}</a> · <a href="#/roots/orders">${t('My orders')}</a></p></div>
  <aside class="r-cart" aria-label="Cart"><h2>${t('Cart')} <small>(${full}/3 restaurants)</small></h2>${cartHtml()}</aside></div></div>`;
};

function cartHtml() {
  if (!S.cart.length) return '<p>Your cart is empty. Combine dishes from up to 3 restaurants.</p>';
  const fee = FEE[S.region].fee, rs = rdb().restaurants;
  const groups = cartRestaurants().map((rid) => `<div class="cg"><b>${esc(rs.find((r) => r.id === rid).name)}</b>${S.cart.filter((c) => c.rid === rid).map((c) => `<div class="row between"><span>${esc(c.name)}</span>
    <span class="row gap"><button class="qty" data-act="rqty" data-id="${c.id}" data-d="-1" aria-label="Less">−</button><b class="mono">${c.qty}</b><button class="qty" data-act="rqty" data-id="${c.id}" data-d="1" aria-label="More">+</button></span></div>`).join('')}</div>`).join('');
  return `${groups}<div class="row between"><span>Items</span><b class="mono">${money(subtotal())}</b></div><div class="row between"><span>Flat service &amp; delivery fee</span><b class="mono">${money(fee)}</b></div>
   <div class="row between tot"><span>Total</span><b class="mono">${money(subtotal() + fee)}</b></div><p class="small">Splits into ${cartRestaurants().length} kitchen receipt(s). No surge pricing.</p><button class="btn lg" ${auBlocked() ? 'disabled' : ''} data-act="rcheckout">${t('Checkout')}</button>`;
}

document.addEventListener('input', (e) => { if (e.target.id === 'rq') { S.q = e.target.value; const p = e.target.selectionStart; rerender(); const n = document.getElementById('rq'); n.focus(); n.setSelectionRange(p, p); } });
document.addEventListener('change', (e) => { if ('actRegion' in e.target.dataset) { S.region = e.target.value; localStorage.setItem('roots_region', S.region); rerender(); } });
acts.rlang = () => { setLang(lang() === 'en' ? 'ta' : 'en'); rerender(); };
acts.rtile = (el) => { const k = el.dataset.k; if (k === 'voice') return acts.rvoice(); S.filter = ['healthy', 'top', 'offers'].includes(k) && S.filter !== k ? k : ''; if (k === 'food' || k === 'rest') S.cuisine = ''; rerender(); };
acts.rkit = (el) => { S.kitchen = el.dataset.k; rerender(); };
acts.rcuis = (el) => { S.cuisine = S.cuisine === el.dataset.k ? '' : el.dataset.k; rerender(); };
function addToCart(rid, id) {
  const d = allDishes().find((x) => x.id === id); if (!d) return false;
  if (!cartRestaurants().includes(rid) && cartRestaurants().length >= 3) { toast('Your cart can hold dishes from at most 3 restaurants.', 'err'); return false; }
  const ex = S.cart.find((c) => c.id === id); if (ex) ex.qty++; else S.cart.push({ id, rid, name: d.name, price: d.price, qty: 1 });
  persist(); return true;
}
acts.radd = (el) => { if (auBlocked()) return; if (addToCart(el.dataset.rid, el.dataset.id)) { toast('Added to cart'); rerender(); } };
acts.rqty = (el) => { const c = S.cart.find((x) => x.id === el.dataset.id); c.qty += +el.dataset.d; if (c.qty <= 0) S.cart = S.cart.filter((x) => x !== c); persist(); rerender(); };

/* registered customer lookup by either saved number */
const findByPhone = (p) => db().users.find((u) => u.status === 'active' && (u.phone === p || u.phone2 === p));
function sendOtp(phone) { S.otp = { phone, code: String(Math.floor(100000 + Math.random() * 900000)), exp: Date.now() + 5 * 60e3 }; return S.otp; }

acts.rcheckout = () => modal(`<h2 class="serif">Checkout</h2><form id="f-ck" class="form"><label>Mobile number<input name="phone" inputmode="numeric" pattern="[0-9]{10}" required placeholder="Primary or backup number"></label>
  <button class="btn">Send SMS code</button></form><p class="muted">Registered customers use a 5-minute SMS code plus their saved 5-digit token. Others can place an order and pay on delivery.</p>`);
function otpStep(phone, user) {
  const o = sendOtp(phone);
  $m().innerHTML = `<h2 class="serif">Verify</h2><p class="smsbox" role="status">📱 <b>Simulated SMS to ${esc(phone)}:</b> your Mannin code is <b class="mono">${o.code}</b> (valid 5 minutes). <small>No real SMS is sent in this offline prototype.</small></p>
   <form id="f-otp" class="form" data-phone="${esc(phone)}"><label>SMS code<input name="code" inputmode="numeric" maxlength="6" required></label>
   ${user ? '<label>Your 5-digit payment token<input name="token" inputmode="numeric" maxlength="5" required></label>' : '<p class="muted">Not registered — payment on delivery.</p>'}<button class="btn">Place order</button></form>`;
}
const $m = () => document.querySelector('.modal');
document.addEventListener('submit', (e) => {
  const f = e.target;
  if (f.id === 'f-ck') { e.preventDefault(); const phone = new FormData(f).get('phone'); otpStep(phone, findByPhone(phone)); }
  if (f.id === 'f-otp') {
    e.preventDefault(); const d = Object.fromEntries(new FormData(f)), user = findByPhone(f.dataset.phone), err = (m) => toast(m, 'err');
    if (!S.otp || Date.now() > S.otp.exp) return err('Code expired. Please request a new one.');
    if (d.code !== S.otp.code) return err('Incorrect code.');
    (async () => {
      if (user && !(await checkPayToken(user, d.token))) return err('Payment token does not match.');
      placeOrder(f.dataset.phone, !!user);
    })();
  }
});
function placeOrder(phone, registered) {
  const R = rdb(), fee = FEE[S.region].fee, batch = 'M' + Date.now().toString().slice(-6), ids = cartRestaurants();
  ids.forEach((rid, i) => {
    const items = S.cart.filter((c) => c.rid === rid).map((c) => ({ ...c, price: local(c.price) }));
    R.orders.unshift({ id: uid('o'), no: `${batch}-${String.fromCharCode(65 + i)}`, batch, restaurantId: rid, items, itemTotal: items.reduce((s, c) => s + c.price * c.qty, 0), fee: i === 0 ? fee : 0, region: S.region, phone, payment: registered ? 'Saved token' : 'On delivery', status: 'New', at: new Date().toISOString() });
  });
  saveRoots(); rememberBatch(batch);
  notify({ roles: ['kitchen', 'rider', 'manager'] }, `New Mannin Roots order ${batch}: ${ids.length} kitchen receipt(s)`, '#/roots/orders');
  S.cart = []; S.otp = null; persist(); document.querySelector('.modal-bg')?.remove(); toast(`Order placed — ${ids.length} kitchen receipt(s)`); go('#/roots/orders');
}

/* ---------- voice order simulator (no speech API; type what the caller says) ---------- */
acts.rvoice = () => modal(`<h2 class="serif">🎙️ Voice order (call simulator)</h2><p class="muted">Type the caller's number and what they say. Calls from a saved primary or backup number get an SMS code; other callers are directed to web checkout.</p>
  <form id="f-voice" class="form"><label>Caller number<input name="phone" inputmode="numeric" pattern="[0-9]{10}" required></label><label>What the caller says<input name="say" placeholder="e.g. one Ghee Pongal and two Sundal Cup" required></label><button class="btn">Place call</button></form>`);
document.addEventListener('submit', (e) => {
  if (e.target.id !== 'f-voice') return; e.preventDefault(); const d = Object.fromEntries(new FormData(e.target)), user = findByPhone(d.phone);
  if (!user) { document.querySelector('.modal-bg')?.remove(); return toast('This number is not registered. Please continue with online web checkout.', 'err'); }
  const words = d.say.toLowerCase(), found = allDishes().filter((x) => words.includes(x.name.toLowerCase().replace(/\s*\(.*\)/, '')));
  if (!found.length) return toast('Sorry, we did not catch a dish name. Please repeat.', 'err');
  found.forEach((x) => { const m = new RegExp('(one|two|three|\\d)\\s+(?:\\w+\\s+){0,2}?' + x.name.toLowerCase().replace(/\s*\(.*\)/, '')).exec(words); const n = m ? ({ one: 1, two: 2, three: 3 }[m[1]] || +m[1] || 1) : 1; for (let i = 0; i < n; i++) if (!addToCart(x.rid, x.id)) break; });
  rerender(); otpStep(d.phone, user); toast('Order read back: ' + found.map((x) => x.name).join(', '));
});

/* ---------- orders / kitchen slips ---------- */
const myBatches = () => { try { return JSON.parse(localStorage.getItem('roots_my_batches') || '[]'); } catch { return []; } };
function rememberBatch(b) { try { localStorage.setItem('roots_my_batches', JSON.stringify([b, ...myBatches()].slice(0, 20))); } catch {} }
const STAFF = ['owner', 'admin', 'manager', 'kitchen', 'rider'];
routes['/roots/orders'] = () => {
  const R = rdb(), u = currentUser(), rs = R.restaurants;
  // privacy: staff see every receipt; customers see orders from their saved numbers; guests see orders placed from this device
  const mine = (o) => (u && STAFF.includes(u.role)) || (u && [u.phone, u.phone2].includes(o.phone)) || myBatches().includes(o.batch);
  const orders = R.orders.filter(mine);
  const next = { New: 'Preparing', Preparing: 'Out for delivery', 'Out for delivery': 'Delivered' };
  return `<div class="roots"><header class="r-head row between"><a class="pill" href="#/roots">← Mannin Roots</a><span class="pill">Orders</span></header><section class="r-sec wide"><h2>${u && STAFF.includes(u.role) ? 'Kitchen receipts' : 'Your orders'}</h2>
  <p class="small">Each restaurant receives its own receipt and order number. The flat fee appears on the first receipt of an order.</p>
  ${orders.map((o) => `<article class="slip"><div class="row between"><b class="mono">#${o.no}</b><span class="badge">${o.status}</span></div><b>${esc(rs.find((r) => r.id === o.restaurantId).name)}</b>
   ${o.items.map((i) => `<div class="row between"><span>${i.qty}× ${esc(i.name)}</span><span class="mono">${FEE[o.region].sym}${i.price * i.qty}</span></div>`).join('')}
   <div class="row between"><small>Fee ${FEE[o.region].sym}${o.fee} · ${esc(o.payment)} · ${esc(o.phone)}</small>${next[o.status] && u && ['rider', 'kitchen', 'manager', 'admin', 'owner'].includes(u.role) ? `<button class="btn sm" data-act="rnext" data-id="${o.id}">→ ${next[o.status]}</button>` : ''}
   <button class="btn sm ghost" onclick="window.print()">Print</button></div></article>`).join('') || '<p>No orders yet.</p>'}</section></div>`;
};
acts.rnext = (el) => { const o = rdb().orders.find((x) => x.id === el.dataset.id), n = { New: 'Preparing', Preparing: 'Out for delivery', 'Out for delivery': 'Delivered' }; o.status = n[o.status]; saveRoots(); rerender(); };

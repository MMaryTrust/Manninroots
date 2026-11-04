import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n.jsx';
import { useApi } from '../hooks.js';
import { api } from '../api.js';

const REGIONS = { IN: { sym: '₹', city: 'Chennai, India' }, AU: { sym: '$', city: 'Sydney, Australia' } };
const CUIS = [['South Indian', 'தென்னிந்திய', '🍚'], ['Biryani', 'பிரியாணி', '🍛'], ['Traditional Meals', 'மரபு உணவு', '🍽️'],
  ['Millet Specials', 'சிறுதானியம்', '🌾'], ['Street Food', 'தெரு உணவு', '🥘'], ['Healthy & Light', 'ஆரோக்கிய உணவு', '🥗']];
const TILES = [['food', '🍴', 'Order Food'], ['rest', '🏪', 'Explore Restaurants'], ['healthy', '🌿', 'Healthy Choices'], ['top', '⭐', 'Top Rated']];
const MAX_RESTAURANTS = 3;

const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };

export default function Roots() {
  const { t, bi, lang, setLang } = useI18n();
  const [catalog, error] = useApi('/roots/catalog', { settings: {}, restaurants: [] });
  const [region, setRegion] = useState(() => localStorage.getItem('roots_region') || 'IN');
  const [cart, setCart] = useState(() => load('roots_cart', [])); // [{dishId, restId, qty}]
  const [q, setQ] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [filter, setFilter] = useState('');
  const [kitchen, setKitchen] = useState('');
  const [msg, setMsg] = useState(null);

  useEffect(() => localStorage.setItem('roots_region', region), [region]);
  useEffect(() => localStorage.setItem('roots_cart', JSON.stringify(cart)), [cart]);

  const { settings, restaurants } = catalog;
  const audRate = settings.audPer100;
  const blocked = region === 'AU' && !audRate;
  const local = (inr) => (region === 'IN' ? inr : Math.round((inr * audRate) / 50) / 2);
  const money = (n) => REGIONS[region].sym + (region === 'AU' ? Number(n).toFixed(2) : Number(n).toLocaleString('en-IN'));
  const fee = region === 'IN' ? settings.feeIn : settings.feeAu;

  const all = useMemo(() => restaurants.flatMap((r) => r.dishes.map((d) => ({ ...d, restId: r.id, restName: r.name, restTa: r.nameTa }))), [restaurants]);
  const byId = useMemo(() => new Map(all.map((d) => [d.id, d])), [all]);

  const shown = useMemo(() => {
    let d = all;
    if (cuisine) d = d.filter((x) => x.cuisine === cuisine);
    if (kitchen) d = d.filter((x) => x.restId === kitchen);
    if (filter === 'healthy') d = d.filter((x) => x.tags.includes('Healthy'));
    if (filter === 'top') d = d.filter((x) => x.rating >= 4.6);
    if (q) d = d.filter((x) => (x.name + x.restName + x.cuisine).toLowerCase().includes(q.toLowerCase()));
    return d;
  }, [all, cuisine, kitchen, filter, q]);
  const recs = [...shown].sort((a, b) => b.rating - a.rating).slice(0, 3);
  const sel = restaurants.find((r) => r.id === kitchen);
  const groups = (sel ? [sel] : restaurants).map((r) => [r, shown.filter((d) => d.restId === r.id)]).filter(([, ds]) => ds.length);

  const cartRests = [...new Set(cart.map((c) => c.restId))];
  const lines = cart.map((c) => ({ ...c, d: byId.get(c.dishId) })).filter((c) => c.d);
  const subtotal = lines.reduce((s, c) => s + local(c.d.priceInr) * c.qty, 0);

  function add(d) {
    setMsg(null);
    if (!cartRests.includes(d.restId) && cartRests.length >= MAX_RESTAURANTS) return setMsg({ bad: true, text: `A cart can hold dishes from at most ${MAX_RESTAURANTS} restaurants.` });
    setCart((c) => (c.some((x) => x.dishId === d.id) ? c.map((x) => (x.dishId === d.id ? { ...x, qty: Math.min(20, x.qty + 1) } : x)) : [...c, { dishId: d.id, restId: d.restId, qty: 1 }]));
  }
  const qty = (id, dlt) => setCart((c) => c.map((x) => (x.dishId === id ? { ...x, qty: x.qty + dlt } : x)).filter((x) => x.qty > 0));

  async function checkout(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setMsg(null);
    try {
      const r = await api('/roots/orders', { method: 'POST', body: {
        phone: f.get('phone'), region, token: f.get('token') || undefined,
        items: cart.map((c) => ({ dishId: c.dishId, qty: c.qty })),
      } });
      localStorage.setItem('roots_batches', JSON.stringify([r.batch, ...load('roots_batches', [])].slice(0, 50)));
      setCart([]);
      setMsg({ text: `Order placed: ${r.orders.join(', ')}` });
    } catch (err) { setMsg({ bad: true, text: err.message }); }
  }

  const dishRow = (d) => (
    <article className="rdish" key={d.id}>
      <div className="grow"><b>{d.name}</b><br /><small>{bi(d.restName, d.restTa)} · ★ {d.rating.toFixed(1)}</small>
        {d.tags.map((x) => <span key={x} className="badge green">{x}</span>)}</div>
      <div className="row gap"><b className="mono">{blocked ? '—' : money(local(d.priceInr))}</b>
        <button className="btn sm" disabled={blocked} onClick={() => add(d)}>{t('Add')}</button></div>
    </article>
  );

  return (
    <div className="roots">
      <header className="r-head row between">
        <div className="row gap"><button className="pill" onClick={() => setLang(lang === 'en' ? 'ta' : 'en')}>🌐 {lang === 'en' ? 'தமிழ்' : 'English'}</button></div>
        <div className="row gap">
          <select className="pill" value={region} onChange={(e) => setRegion(e.target.value)} aria-label="Region">
            {Object.entries(REGIONS).map(([k, v]) => <option key={k} value={k}>📍 {v.city}</option>)}
          </select>
          <Link className="pill" to="/">Mannin Suvai</Link><Link className="pill" to="/roots/orders">{t('Orders')}</Link><Link className="pill" to="/signin" title="Account">👤</Link>
        </div>
      </header>

      <section className="r-hero">
        <h1 className="serif">தமிழ் மண்ணின் வேர்கள்<br /><span>MANNIN ROOTS</span></h1>
        <p className="gold">நம் மண். நம் சுவை. · Our Roots. Our Taste.</p>
        <div className="searchbar"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search restaurants, dishes or cuisines..." aria-label="Search" /></div>
        <div className="tiles">{TILES.map(([k, i, l]) => (
          <button key={k} className={'tile ' + (filter === k ? 'on' : '')} onClick={() => { setFilter(['healthy', 'top'].includes(k) && filter !== k ? k : ''); if (k === 'food' || k === 'rest') setCuisine(''); }}><span>{i}</span>{t(l)}</button>
        ))}</div>
      </section>

      <section className="r-cuis"><h2>{t('Explore Our Cuisines')}</h2>
        <div className="cuis">{CUIS.map(([k, ta, i]) => <button key={k} className={'cu ' + (cuisine === k ? 'on' : '')} onClick={() => setCuisine(cuisine === k ? '' : k)}><span>{i}</span>{bi(k, ta)}</button>)}</div>
      </section>

      {error && <p className="r-sec wide notice" role="alert">{error}</p>}
      {blocked && <p className="r-sec wide notice" role="status">Australian prices are not set yet. An Owner or Admin must enter the AUD rate before orders can be taken in Australia.</p>}
      {msg && <p className={'r-sec wide notice ' + (msg.bad ? 'bad' : '')} role="status">{msg.text}</p>}

      <section className="r-sec wide" aria-label="Choose a kitchen"><h2>{t('Choose a kitchen')}</h2>
        <div className="kitchens">
          <button className={'kit ' + (!kitchen ? 'on' : '')} onClick={() => setKitchen('')}><b>{t('All kitchens')}</b><small>{restaurants.length} {t('restaurants')}</small></button>
          {restaurants.map((r) => (
            <button key={r.id} className={'kit ' + (kitchen === r.id ? 'on' : '')} onClick={() => setKitchen(r.id)}><b>{bi(r.name, r.nameTa)}</b><small>★ {r.rating} · {r.dishes.length} {t('dishes')}</small></button>
          ))}
        </div>
        {sel && <button className="linkbtn" onClick={() => setKitchen('')}>← {t('Back to all kitchens')}</button>}
      </section>

      <div className="r-main">
        <div>
          <section className="r-sec"><h2>{filter === 'top' ? '⭐ ' + t('Top Rated') : filter === 'healthy' ? '🌿 ' + t('Healthy Choices') : sel ? `${t('Top at')} ${bi(sel.name, sel.nameTa)}` : t('Recommended for you')}</h2>
            {recs.map(dishRow)}{recs.length === 0 && <p>No matches.</p>}</section>
          {groups.map(([r, ds]) => <section className="r-sec" key={r.id}><h2>🏪 {bi(r.name, r.nameTa)} <small>★ {r.rating} · {r.area}</small></h2>{ds.map(dishRow)}</section>)}
        </div>
        <aside className="r-cart" aria-label="Cart"><h2>{t('Cart')} <small>({cartRests.length}/{MAX_RESTAURANTS} restaurants)</small></h2>
          {lines.length === 0 ? <p>Your cart is empty. Combine dishes from up to {MAX_RESTAURANTS} restaurants.</p> : (
            <>
              {cartRests.map((rid) => (
                <div className="cg" key={rid}><b>{restaurants.find((r) => r.id === rid)?.name}</b>
                  {lines.filter((c) => c.restId === rid).map((c) => (
                    <div className="row between" key={c.dishId}><span>{c.d.name}</span>
                      <span className="row gap"><button className="qty" onClick={() => qty(c.dishId, -1)} aria-label="Less">−</button><b className="mono">{c.qty}</b><button className="qty" onClick={() => qty(c.dishId, 1)} aria-label="More">+</button></span></div>
                  ))}
                </div>
              ))}
              <div className="row between"><span>Items</span><b className="mono">{money(subtotal)}</b></div>
              <div className="row between"><span>Flat service &amp; delivery fee</span><b className="mono">{money(fee)}</b></div>
              <div className="row between tot"><span>Total</span><b className="mono">{money(subtotal + fee)}</b></div>
              <p className="small">Splits into {cartRests.length} kitchen receipt(s). Prices and fee are re-checked by the server.</p>
              <form className="form" onSubmit={checkout}>
                <label>Phone (10 digits)<input name="phone" inputMode="numeric" pattern="[0-9]{10}" required /></label>
                <label>Saved payment token (if registered)<input name="token" inputMode="numeric" pattern="[0-9]{5}" maxLength={5} /></label>
                <button className="btn lg" disabled={blocked}>{t('Checkout')}</button>
              </form>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

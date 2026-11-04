// Browser smoke test of the React app over Chrome DevTools Protocol (Node 24 built-ins only).
// Needs: API on :3001 seeded (DEV_SEED=1 SEED_PASSWORD=...), web on :5174 (npm run dev), Chrome installed.
// Usage: SEED_PASSWORD=... node tests/smoke.mjs
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env.BASE || 'http://127.0.0.1:5174';
const PW = process.env.SEED_PASSWORD;
if (!PW) { console.error('Set SEED_PASSWORD'); process.exit(1); }
const prof = path.resolve('.smoke-profile'); fs.rmSync(prof, { recursive: true, force: true });
const ch = spawn(CHROME, ['--headless=new', '--disable-gpu', '--remote-debugging-port=9334', `--user-data-dir=${prof}`, '--window-size=1400,1000', 'about:blank']);
process.on('exit', () => ch.kill());
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws, n = 0; const pending = {}; const errors = [];
for (let i = 0; i < 40; i++) { try { const l = await (await fetch('http://127.0.0.1:9334/json/list')).json(); const p = l.find((x) => x.type === 'page'); if (p) { ws = new WebSocket(p.webSocketDebuggerUrl); break; } } catch {} await sleep(250); }
await new Promise((r) => ws.addEventListener('open', r));
ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pending[d.id]) { pending[d.id](d); delete pending[d.id]; }
  if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text); });
const send = (method, params = {}) => new Promise((r) => { const id = ++n; pending[id] = r; ws.send(JSON.stringify({ id, method, params })); });
const HELP = `const $=(s)=>document.querySelector(s),$$=(s)=>[...document.querySelectorAll(s)],w=(m)=>new Promise(r=>setTimeout(r,m));
 const setv=(el,v)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}));};
 const btn=(txt)=>$$('button').find(b=>b.textContent.trim().startsWith(txt));`;
const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: `(async()=>{${HELP}${expr}})()`, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description); return r.result.result.value; };
await send('Runtime.enable');
let pass = 0, fail = 0; const ok = (c, msg) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + msg); };
const go = async (p) => { await send('Page.navigate', { url: BASE + p }); await sleep(3500); };
const H = '';

await go('/');
ok(await ev(`return document.body.innerText.includes('taste of the land')`), 'home renders');
ok(await ev(`await w(600);return ['₹700','₹2,700','₹7,200','₹13,500','₹23,700'].every(p=>document.body.innerText.includes(p))`), 'plan totals come from the API');
await go('/menu');
ok(await ev(`return $$('.dish').length===10`), 'menu shows 10 dishes');

await go('/roots');
const kits = await ev(`return $$('.kit').length`);
ok(kits === 7, 'roots: All kitchens + 6 restaurants');
if (kits !== 7) { console.log('kits=', kits, 'errors=', errors.join(' | ').slice(0, 600), 'body=', (await ev(`return document.body.innerText.slice(0,300)`))); process.exit(1); }
await ev(`${H} $$('.kit')[1].click(); await w(200);`);
ok(await ev(`return document.body.innerText.includes('Back to all kitchens')`), 'roots: kitchen filter on');
await ev(`${H} $$('.rdish .btn')[0].click(); $$('.rdish .btn')[1].click(); await w(200);`);
ok(await ev(`return document.body.innerText.includes('(1/3 restaurants)')`), 'roots: cart counts restaurants');
await ev(`${H} btn('← Back').click(); await w(200); $$('.rdish .btn').at(-1).click(); await w(200);`);
ok(await ev(`return document.body.innerText.includes('Flat service')`), 'roots: fee line shown');
await ev(`${H} setv($('input[name=phone]'),'9000000077'); $('.r-cart form').requestSubmit(); await w(2000);`);
ok(await ev(`return document.body.innerText.includes('Order placed')`), 'roots: guest checkout succeeds');

await go('/roots/orders');
ok(await ev(`return $$('.card').length>=1`), 'roots: my orders lists the receipts');

await go('/app');
ok(await ev(`return location.pathname==='/signin'`), 'staff area redirects to sign-in when signed out');
await ev(`${H} setv($('input[name=email]'),'kitchen@mannin.test'); setv($('input[name=password]'),${JSON.stringify(PW)}); $('form').requestSubmit(); await w(2500);`);
ok(await ev(`return location.pathname==='/app'&&document.body.innerText.includes('Roots orders')`), 'kitchen signs in and sees the order queue');
await ev(`${H} btn('Start preparing').click(); await w(2000);`);
ok(await ev(`return document.body.innerText.includes('Preparing')`), 'kitchen advances an order');

console.log(`\n${pass} passed, ${fail} failed`);
console.log('JS errors:', errors.length ? errors.join('\n') : 'none');
process.exit(fail || errors.length ? 1 : 0);

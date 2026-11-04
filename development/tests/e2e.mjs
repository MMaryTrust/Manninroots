// End-to-end smoke test over Chrome DevTools Protocol (Node 24 built-ins only).
import { spawn } from 'node:child_process';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
// Requires the app server running (npm start). Usage: npm test
import path from 'node:path'; import fs from 'node:fs';
const prof = path.resolve(process.argv[2] || '.test-profile'); fs.rmSync(prof, { recursive: true, force: true });
const ch = spawn(CHROME, ['--headless=new', '--disable-gpu', '--remote-debugging-port=9333', `--user-data-dir=${prof}`, '--window-size=1400,1000', 'about:blank']);
process.on('exit', () => ch.kill());
process.on('uncaughtException', (e) => { console.error(e.message); process.exit(1); });
process.on('unhandledRejection', (e) => { console.error(e.message); process.exit(1); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws, n = 0; const pending = {}; const errors = [];
for (let i = 0; i < 40; i++) { try { const l = await (await fetch('http://127.0.0.1:9333/json/list')).json(); const p = l.find((x) => x.type === 'page'); if (p) { ws = new WebSocket(p.webSocketDebuggerUrl); break; } } catch {} await sleep(250); }
await new Promise((r) => ws.addEventListener('open', r));
ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pending[d.id]) { pending[d.id](d); delete pending[d.id]; }
  if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
  if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') errors.push(d.params.args.map((a) => a.value || a.description).join(' ')); });
const send = (method, params = {}) => new Promise((r) => { const id = ++n; pending[id] = r; ws.send(JSON.stringify({ id, method, params })); });
const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: `(async()=>{${expr}})()`, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description); return r.result.result.value; };
await send('Runtime.enable');
const nav = async (h) => { await ev(`location.hash='${h}'`); await sleep(250); };
let pass = 0, fail = 0; const ok = (c, msg) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + msg); };
const H = `const $=(s)=>document.querySelector(s),$$=(s)=>[...document.querySelectorAll(s)],w=(m)=>new Promise(r=>setTimeout(r,m));
 const fill=(f,o)=>{for(const[k,v]of Object.entries(o)){const e=f.elements[k];e.value=v;}};`;

await send('Page.navigate', { url: 'http://localhost:5173/#/' }); await sleep(1200);
await ev(`localStorage.clear(); location.reload()`); await sleep(1500);

// public pages
for (const r of ['#/', '#/plans', '#/menu', '#/how']) { await nav(r); ok(await ev(`return !document.body.innerText.includes('Page not found')`), 'public ' + r); }
ok(await ev(`location.hash='#/plans';await new Promise(r=>setTimeout(r,200));return ['₹700','₹2,700','₹7,200','₹13,500','₹23,700'].every(p=>document.body.innerText.includes(p))`), 'plan totals');
ok(!(await ev(`return document.body.innerText.includes('Unlimited')`)), 'no Unlimited tier');

// signup -> pending -> blocked
await nav('#/signup');
await ev(`${H} const f=$('#f-signup'); fill(f,{name:'Test Family',email:'t@x.in',phone:'9000000001',ref:'UPI-123'}); f.requestSubmit(); await w(300);`);
ok(await ev(`return document.body.innerText.includes('pending')`), 'signup pending');

// admin approves -> temp pw
await nav('#/signin'); await ev(`${H} [...document.querySelectorAll('[data-act=demo]')].find(b=>b.textContent.trim()==='Admin').click(); await w(300)`);
ok(await ev(`return location.hash`) === '#/app', 'admin demo login → dashboard');
for (const r of ['#/app', '#/app/customers', '#/app/appointments', '#/app/care', '#/app/kitchen', '#/app/people']) { await nav(r); ok(await ev(`return !document.body.innerText.includes('Not available') && !document.body.innerText.includes('Page not found')`), 'admin ' + r); }
await nav('#/app/finance'); ok(await ev(`return document.body.innerText.includes('Not available')`), 'admin (not finance-admin) blocked from finance');
await nav('#/app/people');
const temp = await ev(`${H} $('[data-act=approve]').click(); await w(400); return $('#tpw')?.textContent`);
ok(temp && temp.length === 10, 'temp password shown once: ' + temp);
await ev(`document.querySelector('[data-close]').click()`);
ok(!(await ev(`return document.body.innerHTML.includes(${JSON.stringify(temp)})`)), 'temp pw gone after close');
ok(!(await ev(`return localStorage.getItem('mannin_db_v1').includes(${JSON.stringify(temp)})`)), 'temp pw not stored in plaintext');

// staff creation
await ev(`${H} const f=$('#f-staff'); fill(f,{name:'Rider Two',email:'r2@x.in',role:'rider'}); f.requestSubmit(); await w(400); document.querySelector('[data-close]')?.click()`);
ok(await ev(`return document.body.innerText.includes('Rider Two')`), 'staff created');

// wizard
await nav('#/app/customers');
await ev(`${H} $('[data-act=wiz]').click(); await w(100); let f=$('#f-wiz'); fill(f,{name:'Wiz Fam',phone:'9111111111',address:'Addr'}); f.requestSubmit(); await w(100);
 f=$('#f-wiz'); fill(f,{nname:'Grandma',nrel:'Mother',nphone:'9222222222'}); f.requestSubmit(); await w(100); $('#f-wiz').requestSubmit(); await w(300);`);
ok(await ev(`return document.body.innerText.includes('Wiz Fam')`), '3-step wizard creates customer');
// deceased lock
ok(await ev(`${H} const b=[...$$('tr')].find(r=>r.innerText.includes('Alamelu')).querySelector('[data-act=cview]'); b.click(); await w(200); const r=!!$('.lockbar') && !$('#f-member'); $('.modal-bg').remove(); return r`), 'deceased record locked');

// appointment collision
await nav('#/app/appointments'); await ev(`${H} $$('[data-act=tab]')[2].click(); await w(200)`);
const before = await ev(`return document.querySelectorAll('tr.collide').length`);
await ev(`${H} const f=$('#f-appt'); const t=$('table tr:nth-child(2) td').textContent; f.elements.doctor.selectedIndex=0; f.elements.time.value='10:15'; f.requestSubmit(); await w(300)`);
ok((await ev(`return document.querySelectorAll('tr.collide').length`)) > before, 'overlap flagged');

// sign out, sign in with temp password → forced change → customer
await ev(`document.querySelector('[data-act=signout]').click()`); await sleep(200);
await nav('#/signin');
await ev(`${H} const f=$('#f-signin'); fill(f,{email:'t@x.in',pw:${JSON.stringify(temp)}}); f.requestSubmit(); await w(600)`);
ok(await ev(`return location.hash`) === '#/change-password', 'temp pw forces change');
await ev(`${H} const f=$('#f-pw'); fill(f,{pw:'newpass123',pw2:'newpass123'}); f.requestSubmit(); await w(600)`);
ok(await ev(`return location.hash`) === '#/app/me', 'customer lands on My plan');
await ev(`document.querySelector('[data-act=signout]').click()`); await sleep(200);

// doctor scoping
await nav('#/signin'); await ev(`${H} [...$$('[data-act=demo]')].find(b=>b.textContent.includes('Arumugam')).click(); await w(300)`);
await nav('#/app/care');
ok(await ev(`return document.body.innerText.includes('Parvathi') && !document.body.innerText.includes('Subbaiah')`), 'doctor sees only assigned members');
await nav('#/app/finance'); ok(await ev(`return document.body.innerText.includes('Not available')`), 'doctor blocked from finance');
await ev(`document.querySelector('[data-act=signout]').click()`); await sleep(200);

// owner finance
await nav('#/signin'); await ev(`${H} [...$$('[data-act=demo]')].find(b=>b.textContent.trim()==='Shop Owner').click(); await w(300)`);
await nav('#/app/finance');
for (let i = 0; i < 5; i++) ok(await ev(`${H} $$('[data-act=tab]')[${i}].click(); await w(150); return $$('.mono-wrap').length===1`), 'finance tab ' + i);
ok(await ev(`return document.body.innerText.includes('Account approved')`), 'audit log has approval');
await ev(`document.querySelector('[data-act=signout]').click()`); await sleep(200);

// roots: cart cap & split
await nav('#/roots');
await ev(`${H} for (const r of ['r1','r2','r3']) { $('[data-act=radd][data-rid='+r+']').click(); await w(80);} `);
ok(await ev(`return document.body.innerText.includes('3/3')`), 'cart holds 3 restaurants');
await ev(`${H} $('[data-act=radd][data-rid=r4]').click(); await w(100)`);
ok(await ev(`return document.body.innerText.includes('3/3') && document.querySelector('.toast.err')!==null`), '4th restaurant refused');
ok(await ev(`return document.querySelector('.r-cart').innerText.includes('₹50')`), 'flat ₹50 fee');
await ev(`${H} $('[data-act=rcheckout]').click(); await w(100); const f=$('#f-ck'); f.elements.phone.value='9840033344'; f.requestSubmit(); await w(200);
 const code=$('.smsbox b.mono').textContent; const g=$('#f-otp'); g.elements.code.value=code; g.elements.token.value='48213'; g.requestSubmit(); await w(500)`);
ok(await ev(`return location.hash==='#/roots/orders' && document.querySelectorAll('.slip').length===3`), 'backup number + OTP + token → 3 split receipts');
// voice: unregistered
await nav('#/roots');
await ev(`${H} $('[data-act=rvoice]').click(); await w(100); const f=$('#f-voice'); f.elements.phone.value='9999999999'; f.elements.say.value='one Ghee Pongal'; f.requestSubmit(); await w(200)`);
ok(await ev(`return !document.querySelector('.modal-bg') && document.querySelector('.r-cart').innerText.includes('empty')`), 'unregistered caller directed to web');
await ev(`${H} $('[data-act=rvoice]').click(); await w(100); const f=$('#f-voice'); f.elements.phone.value='9840011122'; f.elements.say.value='one Ghee Pongal and two Sundal Cup'; f.requestSubmit(); await w(200)`);
ok(await ev(`return !!document.querySelector('#f-otp') && document.querySelector('.r-cart').innerText.match(/Sundal Cup[\\s\\S]*?2/)!==null`), 'voice order parsed + OTP sent');
// AU region
await ev(`${H} const s=$('[data-act-region]'); s.value='AU'; s.dispatchEvent(new Event('change',{bubbles:true})); await w(200)`);
ok(await ev(`return document.querySelector('.r-cart').innerText.includes('$10')`), 'AU flat $10 fee');
// tamil
await ev(`${H} $('[data-act=rlang]').click(); await w(200)`);
ok(await ev(`return document.body.innerText.includes('கூடை')`), 'Tamil toggle');

// token stored hashed only
ok(await ev(`const s=localStorage.getItem('mannin_db_v1'); return !s.includes('"payToken"') && !s.includes('48213')`), 'payment token stored hashed only');
// carousel
await ev(`${H} $('[data-act=rlang]').click(); await w(100)`); await nav('#/'); await sleep(400);
const a0 = await ev(`return [...document.querySelectorAll('#plan-stage .slide')].findIndex(s=>s.classList.contains('active'))`);
await ev(`${H} $('[data-act=stage][data-d="1"]').click(); await w(900)`);
const a1 = await ev(`return [...document.querySelectorAll('#plan-stage .slide')].findIndex(s=>s.classList.contains('active'))`);
ok(a0 === 2 && a1 === 3, `carousel advances active slide (${a0}→${a1})`);
ok(await ev(`const s=document.querySelector('#plan-stage .slide'); return getComputedStyle(s).transform==='none' && getComputedStyle(s.firstElementChild).transform!=='none'`), 'transform only on inner wrapper');
// suspend blocks sign-in
await nav('#/signin'); await ev(`${H} [...$$('[data-act=demo]')].find(b=>b.textContent.trim()==='Admin').click(); await w(300)`);
await nav('#/app/people');
await ev(`${H} window.confirm=()=>true; [...$$('tr')].find(r=>r.innerText.includes('t@x.in')).querySelector('[data-act=suspend]').click(); await w(200); $('[data-act=signout]').click(); await w(200)`);
await nav('#/signin');
await ev(`${H} const f=$('#f-signin'); fill(f,{email:'t@x.in',pw:'newpass123'}); f.requestSubmit(); await w(600)`);
ok(await ev(`return location.hash==='#/signin' && document.getElementById('signin-err').textContent.includes('suspended')`), 'suspended account cannot sign in');

const demo = (label) => ev(`${H} location.hash='#/signin'; await w(200); [...$$('[data-act=demo]')].find(b=>b.textContent.trim()===${JSON.stringify(label)}).click(); await w(300)`);
const out = () => ev(`${H} $('[data-act=signout]')?.click(); await w(200)`);

// cuisine photos + AU pause
await nav('#/roots');
ok(await ev(`return document.querySelectorAll('.cu .cu-photo').length===6 && document.querySelectorAll('.rdish .cu-photo').length>0`), 'cuisine & dish photos rendered');
await ev(`${H} const s=$('[data-act-region]'); s.value='AU'; s.dispatchEvent(new Event('change',{bubbles:true})); await w(200)`);
ok(await ev(`return !!document.querySelector('.notice') && document.querySelector('[data-act=radd]').disabled`), 'AU orders paused until rate set');

// manager onboards restaurant → pending → hidden; admin approves + sets AUD rate
await demo('Manager'); await nav('#/app/roots');
await ev(`${H} $('[data-act=pwiz]').click(); await w(100); let f=$('#f-pw3'); fill(f,{name:'Kongu Kitchen',area:'Guindy'}); f.requestSubmit(); await w(100);
 f=$('#f-pw3'); fill(f,{fssai:'12345678901234',owner:'Ravi',phone:'9000011111',payout:'ravi@upi'}); f.requestSubmit(); await w(100);
 $('#pw-dn').value='Kongu Thali'; $('#pw-dp').value='160'; $('[data-act=pwitem]').click(); await w(100); $('#f-pw3').requestSubmit(); await w(300)`);
ok(await ev(`return [...document.querySelectorAll('tr')].some(r=>r.innerText.includes('Kongu Kitchen') && r.innerText.includes('pending'))`), 'manager submission is pending');
await out(); await nav('#/roots');
ok(await ev(`return !document.body.innerText.includes('Kongu Thali')`), 'pending restaurant hidden from marketplace');
await demo('Admin'); await nav('#/app/roots');
await ev(`${H} [...$$('tr')].find(r=>r.innerText.includes('Kongu')).querySelector('[data-act=rstat]').click(); await w(150); const f=$('#f-aud'); f.elements.rate.value='1.80'; f.requestSubmit(); await w(200)`);
await out(); await nav('#/roots');
ok(await ev(`return document.body.innerText.includes('Kongu Thali') && document.body.innerText.includes('$3.00')`), 'approved restaurant live; ₹160 → $3.00 at 1.80/₹100');
ok(await ev(`return !document.querySelector('[data-act=radd]').disabled && !document.querySelector('.notice')`), 'AU ordering enabled after rate set');
await ev(`${H} const s=$('[data-act-region]'); s.value='IN'; s.dispatchEvent(new Event('change',{bubbles:true})); await w(100)`);

// renewal: customer requests, owner confirms → plan extended
await demo('Customer'); await nav('#/app/me');
const end0 = await ev(`return JSON.parse(localStorage.getItem('mannin_db_v1')).customers.find(c=>c.code==='MS-1001').planEnd`);
await ev(`${H} const f=$('#f-renew'); fill(f,{plan:'monthly',ref:'UPI-RENEW-1'}); f.requestSubmit(); await w(200)`);
ok(await ev(`return document.body.innerText.includes('awaiting payment verification')`), 'renewal pending after request');
await out(); await demo('Shop Owner'); await nav('#/app/finance');
await ev(`${H} $$('[data-act=tab]')[1].click(); await w(150); [...$$('tr')].find(r=>r.innerText.includes('UPI-RENEW-1')).querySelector('[data-act=payok]').click(); await w(200)`);
const end1 = await ev(`return JSON.parse(localStorage.getItem('mannin_db_v1')).customers.find(c=>c.code==='MS-1001').planEnd`);
ok((new Date(end1) - new Date(end0)) / 864e5 === 30, `renewal extends plan by 30 days (${end0} → ${end1})`);
// rating averages
await nav('#/app/kitchen'); await ev(`${H} [...$$('[data-act=tab]')].find(b=>b.textContent==='Dish Master').click(); await w(150)`);
ok(await ev(`return document.body.innerText.includes('5.0★ (1)')`), 'dish rating averages shown');
await out();

/* ===== full workflow: sign-up → approval → profile → doctor → kitchen → delivery ===== */
const hasText = (s) => ev(`return document.body.innerText.includes(${JSON.stringify(s)})`);
await nav('#/signup');
await ev(`${H} const f=$('#f-signup'); fill(f,{name:'Flow Family',email:'flow@x.in',phone:'9000000077',plan:'quarterly',ref:'UPI-FLOW-9'}); f.requestSubmit(); await w(300)`);
await demo('Admin'); await nav('#/app');
ok(await hasText('awaiting payment verification'), 'admin dashboard: needs-attention lists sign-up');
await nav('#/app/inbox'); ok(await hasText('UPI-FLOW-9'), 'admin inbox: payment-to-verify notification');
await nav('#/app/people');
const tp = await ev(`${H} [...$$('#view .row')].find(r=>r.innerText.includes('Flow Family')).querySelector('[data-act=approve]').click(); await w(400); return $('#tpw').textContent`);
await ev(`document.querySelector('[data-close]').click()`);
ok(await ev(`const c=JSON.parse(localStorage.getItem('mannin_db_v1')).customers.find(c=>c.name==='Flow Family'); return !!c && c.planId==='quarterly' && c.status==='active'`), 'approval creates subscriber record with paid plan');
await out(); await nav('#/signin');
await ev(`${H} const f=$('#f-signin'); fill(f,{email:'flow@x.in',pw:${JSON.stringify(tp)}}); f.requestSubmit(); await w(500); const g=$('#f-pw'); fill(g,{pw:'flowpass1',pw2:'flowpass1'}); g.requestSubmit(); await w(500)`);
ok(await ev(`return location.hash==='#/app/me' && !!document.querySelector('.journey li.now') && !!document.getElementById('f-house')`), 'customer sees journey at step 2 with profile form');
ok(await ev(`return document.querySelector('[data-act=profdone]').disabled`), 'cannot finish profile before details');
await ev(`${H} let f=$('#f-house'); fill(f,{address:'12 Temple St, Virachilai',nname:'Kumar',nrel:'Son',nphone:'9000000078',mob:'Uses walker'}); f.requestSubmit(); await w(200);
 f=$('#f-mem'); fill(f,{name:'Grandpa Flow',age:'80'}); f.querySelector('[value=Diabetes]').checked=true; f.requestSubmit(); await w(200); $('[data-act=profdone]').click(); await w(300)`);
ok(await ev(`return JSON.parse(localStorage.getItem('mannin_db_v1')).customers.find(c=>c.name==='Flow Family').members[0].tags.includes('Diabetic')`), 'diabetes condition becomes Diabetic tag');
ok(await hasText("Today's meals"), 'profile complete → today\'s meals shown');
await out();
await demo('Doctor Admin'); await nav('#/app/inbox'); ok(await hasText('need a doctor assigned'), 'doctor admin notified to assign');
await nav('#/app/care');
await ev(`${H} const s=[...$$('tr')].find(r=>r.innerText.includes('Grandpa Flow')).querySelector('select'); s.value=[...s.options].find(o=>o.text.includes('Arumugam')).value; s.dispatchEvent(new Event('change',{bubbles:true})); await w(200)`);
await out(); await demo('Doctor · Arumugam');
await nav('#/app'); ok(await hasText('Your day'), 'doctor role dashboard');
await nav('#/app/inbox'); ok(await hasText('New patient assigned: Grandpa Flow'), 'doctor notified of assignment');
await nav('#/app/care');
await ev(`${H} [...$$('tr')].find(r=>r.innerText.includes('Grandpa Flow')).querySelector('[data-act=note]').click(); await w(100); const f=$('#f-note'); f.elements.text.value='Soft rice, no added sugar, millet dosa at breakfast'; f.querySelector('[value=Diabetic]').checked=true; f.requestSubmit(); await w(200)`);
const nAppt = await ev(`return JSON.parse(localStorage.getItem('mannin_db_v1')).appointments.length`);
await nav('#/app/appointments');
await ev(`${H} const s=$('select[data-act-change=astatus]'); s.value='Completed'; s.dispatchEvent(new Event('change',{bubbles:true})); await w(200)`);
ok(await ev(`const d=JSON.parse(localStorage.getItem('mannin_db_v1')); return d.appointments.length===${nAppt}+1 && d.appointments.some(a=>a.notes==='Follow-up')`), 'completed consultation auto-books follow-up');
await out();
await demo('Kitchen Staff'); await nav('#/app'); ok(await hasText('Today in the kitchen'), 'kitchen role dashboard');
await nav('#/app/inbox'); ok(await hasText('Diet update for Grandpa Flow'), 'kitchen notified of consultation');
await nav('#/app/kitchen'); ok(await hasText('Soft rice, no added sugar'), "doctor's note on today's prep sheet");
await out();
await demo('Delivery Rider'); await nav('#/app'); ok(await hasText('Your run'), 'rider role dashboard');
await nav('#/app/deliveries');
await ev(`${H} [...$$('.stop')].find(s=>s.innerText.includes('MS-1001')).querySelector('[data-act=deliver]').click(); await w(200)`);
ok(await ev(`return [...document.querySelectorAll('.stop.done')].some(s=>s.innerText.includes('MS-1001'))`), 'rider marks stop delivered');
await out(); await demo('Customer'); await nav('#/app/me');
ok(await hasText('delivered'), 'customer sees delivery status');
// roots privacy
await out(); await ev(`localStorage.removeItem('roots_my_batches')`); await nav('#/roots/orders');
ok(await ev(`return document.querySelectorAll('.slip').length===0`), 'guest cannot see other people\'s orders');
await demo('Customer'); await nav('#/roots/orders');
ok(await ev(`return document.querySelectorAll('.slip').length===3`), 'customer sees own orders by saved number');
await out(); await demo('Admin'); await nav('#/app');
ok(await ev(`return /Meals dispatched today\\s*\\d+/.test(document.body.innerText) && !/Meals dispatched today\\s*0\\b/.test(document.body.innerText)`), 'dispatch count comes from deliveries');
// text size
await ev(`${H} $('[data-act=textsize]').click(); await w(150)`);
ok(await ev(`return document.documentElement.dataset.text==='2' && parseFloat(getComputedStyle(document.documentElement).fontSize)===18`), 'elder text size control');
await ev(`localStorage.setItem('mannin_text','1')`); await out();

console.log(`\n${pass} passed, ${fail} failed`); console.log('JS errors:', errors.length ? errors : 'none');
ch.kill(); process.exit(0);

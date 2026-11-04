import { rdb, saveRoots } from './store.js';
import { db, save, log, PLANS, planTotal, ROLE_LABEL, ROLES, hash, tempPassword, uid, today, addDays, currentUser, setSession, resetAll, setPayToken } from './store.js';
import { esc, inr, $, toast, modal, acts, routes, go, rerender, logo, fmtDate, userName, t, lang, hooks, textBtn } from './util.js';
import { requestPayment, confirmPayment, pendingPaymentFor } from './payments.js';

const NAV = [
  ['#/app', 'Dashboard', ['owner', 'admin', 'doctorAdmin', 'doctor', 'manager', 'kitchen', 'rider']],
  ['#/app/inbox', 'Inbox', ['owner', 'admin', 'doctorAdmin', 'doctor', 'manager', 'kitchen', 'rider', 'customer']],
  ['#/app/customers', 'Customers', ['owner', 'admin', 'manager']],
  ['#/app/appointments', 'Appointments', ['owner', 'admin', 'doctorAdmin', 'doctor', 'manager']],
  ['#/app/care', 'Care', ['owner', 'admin', 'doctorAdmin', 'doctor', 'manager', 'kitchen']],
  ['#/app/kitchen', 'Kitchen', ['owner', 'admin', 'manager', 'kitchen']],
  ['#/app/finance', 'Finance', ['owner', 'admin']],
  ['#/app/people', 'Approvals', ['owner', 'admin']],
  ['#/app/roots', 'Roots partners', ['owner', 'admin', 'manager']],
  ['#/app/deliveries', 'Meal deliveries', ['owner', 'admin', 'manager', 'rider']],
  ['#/roots/orders', 'Roots orders', ['owner', 'admin', 'manager', 'kitchen', 'rider']],
  ['#/app/me', 'My plan', ['customer']],
];
const canFinance = (u) => u.role === 'owner' || u.financeAdmin;
const allowed = (u, h) => { const n = NAV.find((x) => x[0] === h); return n && n[2].includes(u.role) && (h !== '#/app/finance' || canFinance(u)); };

function shell(inner, active) {
  const u = currentUser();
  const items = NAV.filter((n) => allowed(u, n[0]));
  return `<div class="app"><aside class="side"><a class="brand" href="#/">${logo(32)}<span><b>Mannin Suvai</b><small>${ROLE_LABEL[u.role]}</small></span></a>
    <nav aria-label="Staff">${items.map(([h, l]) => { const n = h === '#/app/inbox' ? hooks.unread?.(u) || 0 : 0; return `<a href="${h}" class="${h === active ? 'on' : ''}">${t(l)}${n ? ` <span class="count" aria-label="${n} unread">${n}</span>` : ''}</a>`; }).join('')}<a href="#/roots">Mannin Roots ↗</a></nav>
    <div class="side-foot"><p class="muted">${esc(u.name)}</p><div class="row gap">${textBtn()}<button class="btn ghost sm" data-act="lang">${lang() === 'en' ? 'தமிழ்' : 'English'}</button></div>
    <button class="btn ghost sm" data-act="signout">${t('Sign out')}</button><button class="btn ghost sm" data-act="reset" title="Clear local demo data">Reset demo</button></div></aside>
    <main class="content">${inner}</main></div>`;
}
const guard = (h, fn) => () => {
  const u = currentUser(); if (!u || u.status !== 'active') { setSession(null); return go('#/signin'); }
  if (u.mustChange) return go('#/change-password');
  if (!allowed(u, h)) return shell(`<h1 class="serif">Not available</h1><p class="lead">Your role (${ROLE_LABEL[u.role]}) does not have access to this area.</p>`, '');
  return shell(fn(u), h);
};
acts.signout = () => { for (const k in UI) delete UI[k]; setSession(null); go('#/'); }; // tab/search state never carries over to the next person
acts.reset = () => { if (confirm('Clear all demo data in this browser and reseed?')) resetAll(); };

const locked = (c) => c.status === 'deceased' || c.status === 'cancelled';
const badge = (s, k = '') => `<span class="badge ${k}">${esc(s)}</span>`;
const tab = (key, tabs, cur) => `<div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" aria-selected="${k === cur}" class="${k === cur ? 'on' : ''}" data-act="tab" data-key="${key}" data-v="${k}">${l}</button>`).join('')}</div>`;
const UI = {}; // transient ui state
acts.tab = (el) => { UI[el.dataset.key] = el.dataset.v; rerender(); };
const stat = (label, val, extra = '') => `<div class="stat card"><span class="muted">${label}</span><b class="mono">${val}</b>${extra}</div>`;

/* ---------- dashboard ---------- */
routes['/app'] = guard('#/app', (u) => {
  const D = db(), td = today();
  const active = D.customers.filter((c) => c.status === 'active');
  const members = active.reduce((n, c) => n + c.members.length, 0);
  const disp = hooks.mealsOn?.(td) || 0;
  const revenue = D.payments.filter((p) => p.status === 'confirmed').reduce((s, p) => s + p.amount, 0);
  const due = active.filter((c) => c.planEnd >= td && new Date(c.planEnd) - new Date(td) <= 48 * 3600e3);
  return `<h1 class="serif">${t('Dashboard')}</h1>${hooks.dashTop?.(u) || ''}<div class="grid stats">
    ${stat('Active subscribers', active.length)}${stat('Family members enrolled', members)}${stat('Meals dispatched today', disp)}${['owner', 'admin'].includes(u.role) ? stat('Revenue (confirmed)', inr(revenue)) : ''}</div>
  <section class="card"><h2 class="serif">Renewals due within 48 hours</h2>
    ${due.length ? `<table><tr><th>Customer</th><th>Plan</th><th>Ends</th></tr>${due.map((c) => `<tr class="warn"><td>${esc(c.name)}</td><td>${PLANS.find((p) => p.id === c.planId).name}</td><td class="mono">${fmtDate(c.planEnd)}</td></tr>`).join('')}</table>` : '<p class="muted">No renewals due.</p>'}</section>
  ${hooks.dispatchHistory?.(u) || ''}`;
});

/* ---------- customers ---------- */
routes['/app/customers'] = guard('#/app/customers', () => {
  const q = (UI.cq || '').toLowerCase();
  const list = db().customers.filter((c) => !q || (c.name + c.code + c.phone).toLowerCase().includes(q));
  return `<div class="row between"><h1 class="serif">${t('Customers')}</h1><button class="btn" data-act="wiz">+ New customer</button></div>
  <input class="search" id="cq" placeholder="Search name, code or phone" value="${esc(UI.cq || '')}" aria-label="Search customers">
  <table><tr><th>Code</th><th>Name</th><th>Tier</th><th>Plan</th><th>Ends</th><th>Status</th><th></th></tr>
  ${list.map((c) => `<tr><td class="mono">${c.code}</td><td>${esc(c.name)} <small class="muted">(${c.members.length} members)</small></td>
   <td>${badge({ standard: 'Standard', premium: 'Premium Gold', vip: 'VIP Berry' }[c.tier], c.tier === 'premium' ? 'gold' : c.tier === 'vip' ? 'berry' : '')}</td>
   <td>${PLANS.find((p) => p.id === c.planId)?.name}</td><td class="mono">${fmtDate(c.planEnd)}</td>
   <td>${badge(c.status, c.status === 'active' ? 'green' : 'berry')}</td><td><button class="btn ghost sm" data-act="cview" data-id="${c.id}">Open</button></td></tr>`).join('')}</table>`;
});
document.addEventListener('input', (e) => { if (e.target.id === 'cq') { UI.cq = e.target.value; const p = e.target.selectionStart; rerender(); const n = $('#cq'); n.focus(); n.setSelectionRange(p, p); } });

acts.cview = (el) => {
  const c = db().customers.find((x) => x.id === el.dataset.id), L = locked(c);
  modal(`<h2 class="serif">${esc(c.name)} <span class="mono muted">${c.code}</span></h2>
   ${L ? `<p class="lockbar">🔒 This record is ${c.status}. Editing and meal dispatch are permanently locked.</p>` : ''}
   <p>📍 ${esc(c.address)} · 📞 ${esc(c.phone)}</p><p><b>Nominee:</b> ${esc(c.nominee.name)} (${esc(c.nominee.relation)}) · ${esc(c.nominee.phone)} · <i>${esc(c.nominee.mobility)}</i></p>
   <h3>Family members</h3><ul>${c.members.map((m) => `<li>${esc(m.name)}, ${m.age} — ${m.tags.map(badge).join(' ')}</li>`).join('') || '<li class="muted">None</li>'}</ul>
   ${L ? '' : `<form id="f-member" class="row wrap gap" data-id="${c.id}"><input name="name" placeholder="Add family member" required><input name="age" type="number" min="0" max="120" placeholder="Age" required style="width:90px">
    <select name="tag"><option>Pure Veg</option><option>Mixed</option><option>Diabetic</option><option>Low-Sodium</option></select><button class="btn sm">Add</button></form>
    <div class="row gap wrap"><button class="btn ghost sm" data-act="cstatus" data-id="${c.id}" data-s="deceased">Mark deceased</button><button class="btn ghost sm" data-act="cstatus" data-id="${c.id}" data-s="cancelled">Mark cancelled</button></div>`}
   <button class="btn" data-close>Close</button>`);
};
acts.cstatus = (el) => {
  if (!confirm(`Mark as ${el.dataset.s}? This permanently locks the record.`)) return;
  const c = db().customers.find((x) => x.id === el.dataset.id); c.status = el.dataset.s;
  log(currentUser().name, 'Customer ' + el.dataset.s, c.code); save(); $('.modal-bg')?.remove(); rerender();
};
document.addEventListener('submit', (e) => {
  if (e.target.id !== 'f-member') return; e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target)), c = db().customers.find((x) => x.id === e.target.dataset.id);
  if (locked(c)) return;
  c.members.push({ id: uid('m'), name: d.name, age: +d.age, tags: [d.tag], doctorId: null, condition: '', assignedBy: null });
  log(currentUser().name, 'Family member added', c.code); save(); $('.modal-bg')?.remove(); rerender(); toast('Member added');
});

/* 3-step wizard */
let W = null;
acts.wiz = () => { W = { step: 1, d: { tier: 'standard', plan: 'monthly', tags: ['Pure Veg'], timing: 'All three' } }; drawWiz(); };
function drawWiz() {
  $('.modal-bg')?.remove();
  const d = W.d, s = W.step, f = (n, label, extra = '') => `<label>${label}<input name="${n}" value="${esc(d[n] || '')}" ${extra}></label>`;
  const body = s === 1 ? f('name', 'Primary contact name', 'required') + f('phone', 'Phone', 'required inputmode="numeric"') + f('address', 'Physical address', 'required')
    : s === 2 ? f('nname', 'Nominee / elder name', 'required') + f('nrel', 'Relationship', 'required') + f('nphone', 'Emergency contact phone', 'required') + f('mob', 'Mobility notes')
    : `<label>Tier<select name="tier">${[['standard', 'Standard'], ['premium', 'Premium Gold'], ['vip', 'VIP Berry']].map(([v, l]) => `<option value="${v}" ${d.tier === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
       <label>Plan<select name="plan">${PLANS.map((p) => `<option value="${p.id}" ${d.plan === p.id ? 'selected' : ''}>${p.name} — ${inr(planTotal(p))}</option>`).join('')}</select></label>
       <fieldset><legend>Dietary tags (subscriptions are vegetarian-only)</legend>${['Pure Veg', 'Diabetic', 'Low-Sodium'].map((x) => `<label class="chk"><input type="checkbox" name="tags" value="${x}" ${d.tags.includes(x) ? 'checked' : ''}> ${x}</label>`).join('')}</fieldset>
       <label>Meal timing<select name="timing">${['All three', 'Lunch & Dinner', 'Breakfast & Lunch'].map((x) => `<option ${d.timing === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label>`;
  modal(`<h2 class="serif">New customer · step ${s} of 3</h2><div class="progress"><i style="width:${s * 33.3}%"></i></div>
   <form id="f-wiz" class="form">${body}<div class="row between">${s > 1 ? '<button type="button" class="btn ghost" data-act="wback">Back</button>' : '<span></span>'}<button class="btn">${s === 3 ? 'Create customer' : 'Next'}</button></div></form>`);
}
acts.wback = () => { W.step--; drawWiz(); };
document.addEventListener('submit', (e) => {
  if (e.target.id !== 'f-wiz') return; e.preventDefault();
  const fd = new FormData(e.target); const o = Object.fromEntries(fd); if (W.step === 3) o.tags = fd.getAll('tags'); Object.assign(W.d, o);
  if (W.step < 3) { W.step++; return drawWiz(); }
  const d = W.d, D = db(), plan = PLANS.find((p) => p.id === d.plan), code = 'MS-' + (1001 + D.customers.length);
  D.customers.push({ id: uid('c'), code, name: d.name, phone: d.phone, address: d.address, tier: d.tier, status: 'active', nominee: { name: d.nname, relation: d.nrel, phone: d.nphone, mobility: d.mob || '-' },
    planId: d.plan, planStart: today(), planEnd: addDays(today(), plan.days), timing: d.timing, members: [{ id: uid('m'), name: d.nname, age: 0, tags: d.tags.length ? d.tags : ['Pure Veg'], doctorId: null, condition: '', assignedBy: null }] });
  log(currentUser().name, 'Customer created', code); save(); $('.modal-bg')?.remove(); rerender(); toast('Customer ' + code + ' created');
});

/* ---------- appointments ---------- */
const mins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const collide = (a, list) => list.filter((b) => b.id !== a.id && b.doctorId === a.doctorId && b.date === a.date && b.status !== 'Completed' && a.status !== 'Completed' && mins(a.time) < mins(b.time) + b.duration && mins(b.time) < mins(a.time) + a.duration);
routes['/app/appointments'] = guard('#/app/appointments', (u) => {
  const D = db(), cur = UI.at || 'q', td = today();
  let all = D.appointments; if (u.role === 'doctor') all = all.filter((a) => a.doctorId === u.id);
  const doctors = D.users.filter((x) => x.role === 'doctor');
  const row = (a, edit) => { const col = collide(a, D.appointments); return `<tr class="${col.length ? 'collide' : ''}"><td class="mono">${a.date} ${a.time}</td><td>${esc(a.memberName)}</td><td>${esc(userName(a.doctorId))}</td><td>${badge(a.status, a.status === 'Completed' ? 'green' : a.status === 'In-Session' ? 'gold' : '')}</td>
    <td>${col.length ? `<span class="warnmsg" role="alert">⚠ Overlaps with ${esc(col.map((c) => c.memberName).join(', '))}</span>` : ''}${a.status !== 'Completed' ? `<select data-act-change="astatus" data-id="${a.id}">${['Waiting', 'In-Session', 'Completed'].map((s) => `<option ${s === a.status ? 'selected' : ''}>${s}</option>`).join('')}</select>` : ''}${edit ? ` <button class="btn ghost sm" data-act="resched" data-id="${a.id}">Reschedule</button>` : ''}</td></tr>`; };
  const head = '<tr><th>When</th><th>Patient</th><th>Doctor</th><th>Status</th><th></th></tr>';
  let body;
  if (cur === 'q') body = `<h2 class="serif">Today's queue</h2><table>${head}${all.filter((a) => a.date === td).sort((a, b) => a.time.localeCompare(b.time)).map((a) => row(a)).join('') || '<tr><td colspan=5 class="muted">No appointments today.</td></tr>'}</table>`;
  else if (cur === 'd') body = `<h2 class="serif">${u.role === 'doctor' ? 'My duty' : 'Upcoming duty'}</h2><table>${head}${all.filter((a) => a.date > td).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).map((a) => row(a)).join('') || '<tr><td colspan=5 class="muted">Nothing scheduled ahead.</td></tr>'}</table>`;
  else body = ['owner', 'admin', 'doctorAdmin', 'manager'].includes(u.role) ? `<h2 class="serif">Book / reschedule</h2>
    <form id="f-appt" class="card form row wrap gap"><select name="customer">${D.customers.filter((c) => !locked(c)).map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select>
     <select name="doctor">${doctors.map((x) => `<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select><input type="date" name="date" value="${td}" min="${td}" required><input type="time" name="time" value="10:00" required>
     <select name="duration"><option>15</option><option selected>30</option><option>45</option></select><button class="btn">Book</button></form>
    <label class="card form">Follow-up interval (days) — auto-suggested after a completed consultation<input type="number" min="1" value="${D.settings.followUpDays}" data-act-change="followup"></label>
    <table>${head}${D.appointments.map((a) => row(a, true)).join('')}</table>` : '<p class="muted">Admin settings are available to Admin, Doctor Admin, Manager and Owner.</p>';
  return `<h1 class="serif">${t('Appointments')}</h1>${tab('at', [['q', 'Appointment'], ['d', 'My Duty'], ['s', 'Admin Settings']], cur)}${body}`;
});
document.addEventListener('submit', (e) => {
  if (e.target.id !== 'f-appt') return; e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target)), c = db().customers.find((x) => x.id === d.customer);
  const a = { id: uid('a'), customerId: c.id, memberName: c.members[0]?.name || c.name, doctorId: d.doctor, date: d.date, time: d.time, duration: +d.duration, status: 'Waiting', notes: '' };
  db().appointments.push(a); log(currentUser().name, 'Appointment booked', c.code + ' ' + d.date + ' ' + d.time); save(); rerender();
  collide(a, db().appointments).length ? toast('Booked — but it overlaps another appointment for this doctor.', 'err') : toast('Appointment booked');
});
acts.resched = (el) => {
  const a = db().appointments.find((x) => x.id === el.dataset.id);
  modal(`<h2 class="serif">Reschedule</h2><form id="f-resched" class="form" data-id="${a.id}"><input type="date" name="date" value="${a.date}" required><input type="time" name="time" value="${a.time}" required><button class="btn">Save</button></form>`);
};
document.addEventListener('submit', (e) => {
  if (e.target.id !== 'f-resched') return; e.preventDefault();
  const a = db().appointments.find((x) => x.id === e.target.dataset.id), d = Object.fromEntries(new FormData(e.target)); a.date = d.date; a.time = d.time;
  save(); $('.modal-bg')?.remove(); rerender(); collide(a, db().appointments).length && toast('Warning: overlaps another appointment.', 'err');
});
document.addEventListener('change', (e) => {
  const k = e.target.dataset.actChange; if (!k) return;
  if (k === 'astatus') { const a = db().appointments.find((x) => x.id === e.target.dataset.id); a.status = e.target.value; if (a.status === 'Completed') hooks.onCompleted?.(a); log(currentUser().name, 'Appointment ' + a.status, a.memberName); save(); rerender(); }
  if (k === 'followup') { db().settings.followUpDays = +e.target.value || 30; save(); toast('Follow-up interval saved'); }
  if (k === 'assign') { const [cid, mid] = e.target.dataset.id.split('|'); const c = db().customers.find((x) => x.id === cid), m = c.members.find((x) => x.id === mid); m.doctorId = e.target.value || null; m.assignedBy = currentUser().id; log(currentUser().name, 'Doctor assigned', m.name + ' → ' + userName(m.doctorId)); hooks.onAssigned?.(c, m); save(); rerender(); }
  if (k === 'plan') { const pl = db().planner; const [day, slot] = e.target.dataset.id.split('|'); pl[day][slot] = e.target.value; save(); toast('Planner updated'); }
});

/* ---------- care ---------- */
routes['/app/care'] = guard('#/app/care', (u) => {
  const D = db(); D.consults ||= [];
  const canAssign = ['owner', 'admin', 'doctorAdmin'].includes(u.role) && u.role !== 'owner';
  const doctors = D.users.filter((x) => x.role === 'doctor');
  let rows = D.customers.filter((c) => !locked(c)).flatMap((c) => c.members.map((m) => ({ c, m })));
  if (u.role === 'doctor') rows = rows.filter((r) => r.m.doctorId === u.id); // strict row-level scoping
  const feed = D.consults.filter((x) => u.role !== 'doctor' || x.doctorId === u.id).slice().reverse();
  return `<h1 class="serif">${t('Care')}</h1>${u.role === 'doctor' ? '<p class="muted">You see only family members assigned to you.</p>' : ''}
  <table><tr><th>Family member</th><th>Customer</th><th>Condition</th><th>Dietary tags</th><th>Doctor</th><th></th></tr>
  ${rows.map(({ c, m }) => `<tr><td>${esc(m.name)}</td><td>${esc(c.name)}</td><td>${esc(m.condition || '—')}</td><td>${m.tags.map(badge).join(' ')}</td>
   <td>${canAssign ? `<select data-act-change="assign" data-id="${c.id}|${m.id}" aria-label="Assign doctor"><option value="">Unassigned</option>${doctors.map((d) => `<option value="${d.id}" ${m.doctorId === d.id ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}</select>` : esc(userName(m.doctorId))}</td>
   <td>${u.role === 'doctor' || u.role === 'doctorAdmin' ? `<button class="btn ghost sm" data-act="note" data-id="${c.id}|${m.id}">Add consultation</button>` : ''}</td></tr>`).join('') || '<tr><td colspan=6 class="muted">No members to show.</td></tr>'}</table>
  <h2 class="serif">Consultation feed</h2><p class="muted">Notes and dietary tags are shared with Managers and Kitchen Staff for menu customisation.</p>
  ${feed.map((x) => `<article class="card feed"><b>${esc(x.member)}</b> <span class="muted mono">${fmtDate(x.at)} · ${esc(userName(x.doctorId))}</span><p>${esc(x.text)}</p>${x.tags.map(badge).join(' ')}</article>`).join('') || '<p class="muted">No consultations yet.</p>'}`;
});
acts.note = (el) => modal(`<h2 class="serif">Consultation note</h2><form id="f-note" class="form" data-id="${el.dataset.id}"><label>Notes<textarea name="text" rows="4" required></textarea></label>
  <fieldset><legend>Dietary tags</legend>${['Veg', 'Mixed', 'Low-Sodium', 'Diabetic'].map((x) => `<label class="chk"><input type="checkbox" name="tags" value="${x}"> ${x}</label>`).join('')}</fieldset><button class="btn">Post to feed</button></form>`);
document.addEventListener('submit', (e) => {
  if (e.target.id !== 'f-note') return; e.preventDefault();
  const [cid, mid] = e.target.dataset.id.split('|'), fd = new FormData(e.target), c = db().customers.find((x) => x.id === cid), m = c.members.find((x) => x.id === mid), u = currentUser();
  const tags = fd.getAll('tags'); if (tags.length) m.tags = [...new Set([...m.tags.filter((x) => x !== 'Pure Veg' || !tags.includes('Mixed')), ...tags])];
  db().consults.push({ id: uid('n'), member: m.name, doctorId: u.id, text: fd.get('text'), tags, at: new Date().toISOString() });
  log(u.name, 'Consultation posted', m.name); hooks.onConsult?.(c, m, tags); save(); $('.modal-bg')?.remove(); rerender(); toast('Posted to feed');
});

/* ---------- kitchen ---------- */
// ratings feed the quality audit: dishes averaging under 3.5 stars are flagged
const avgCell = (id) => { const r = db().ratings.filter((x) => x.dishId === id); if (!r.length) return '<span class="muted">—</span>'; const a = r.reduce((s, x) => s + x.stars, 0) / r.length; return `<span class="mono">${a.toFixed(1)}★ (${r.length})</span>${a < 3.5 ? ' ' + badge('Audit', 'berry') : ''}`; };
routes['/app/kitchen'] = guard('#/app/kitchen', () => {
  const D = db(), cur = UI.kt || 'prep', dn = (id) => D.dishes.find((x) => x.id === id)?.name || '—';
  const body = cur === 'prep' ? hooks.prep?.() || '' : cur === 'dishes' ? `<table><tr><th>Dish</th><th>GI</th><th>kcal</th><th>P/C/F g</th><th>Allergens</th><th>Tags</th><th>FSSAI</th><th>Rating</th></tr>
      ${D.dishes.map((d) => `<tr><td>${esc(d.name)}<br><small class="muted">${esc(d.ta)}</small></td><td>${badge(d.gi, d.gi === 'Low-GI' ? 'green' : 'gold')}</td><td class="mono">${d.kcal}</td><td class="mono">${d.protein}/${d.carbs}/${d.fat}</td><td>${d.allergens.map((a) => badge(a, 'berry')).join(' ') || '—'}</td><td>${d.tags.map(badge).join(' ')}</td><td>${d.fssai ? '✔' : ''}</td><td>${avgCell(d.id)}</td></tr>`).join('')}</table>
      <form id="f-dish" class="card form row wrap gap"><input name="name" placeholder="New dish" required><select name="cat"><option>Breakfast</option><option>Lunch</option><option>Dinner</option></select><select name="gi"><option>Low-GI</option><option>Medium-GI</option></select>
      <input name="kcal" type="number" placeholder="kcal" required style="width:90px"><input name="allergens" placeholder="Allergens, comma separated"><button class="btn">Add dish</button></form>`
    : cur === 'planner' ? `<table><tr><th>Day</th>${['Breakfast', 'Lunch', 'Dinner'].map((s) => `<th>${s}</th>`).join('')}</tr>${Object.entries(D.planner).map(([day, sl]) => `<tr><td><b>${day}</b></td>${['Breakfast', 'Lunch', 'Dinner'].map((s) => `<td><select data-act-change="plan" data-id="${day}|${s}">${D.dishes.filter((x) => x.cat === s).map((x) => `<option value="${x.id}" ${sl[s] === x.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></td>`).join('')}</tr>`).join('')}</table>`
    : `<table><tr><th>Date</th><th>Dish</th><th>Stars</th><th>Comment</th><th>By</th></tr>${D.ratings.map((r) => `<tr><td class="mono">${r.date}</td><td>${esc(dn(r.dishId))}</td><td class="mono">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</td><td>${esc(r.comment)}</td><td>${esc(r.by)}</td></tr>`).join('')}</table>`;
  return `<h1 class="serif">${t('Kitchen')}</h1>${tab('kt', [['prep', "Today's prep"], ['dishes', 'Dish Master'], ['planner', 'Weekly Planner'], ['ratings', 'Meal Ratings']], cur)}${body}`;
});
document.addEventListener('submit', (e) => {
  if (e.target.id !== 'f-dish') return; e.preventDefault(); const d = Object.fromEntries(new FormData(e.target));
  db().dishes.push({ id: uid('d'), name: d.name, ta: '', cat: d.cat, gi: d.gi, tags: ['Pure Veg'], kcal: +d.kcal, protein: 0, carbs: 0, fat: 0, allergens: d.allergens.split(',').map((x) => x.trim()).filter(Boolean), price: 0, fssai: true });
  log(currentUser().name, 'Dish added', d.name); save(); rerender();
});

/* ---------- finance (owner + designated finance admin) ---------- */
routes['/app/finance'] = guard('#/app/finance', (u) => {
  const D = db(), cur = UI.ft || 'dash';
  const inc = D.payments.filter((p) => p.status === 'confirmed').reduce((s, p) => s + p.amount, 0), exp = D.expenses.reduce((s, e) => s + e.amount, 0);
  const body = cur === 'dash' ? `<div class="grid stats">${stat('Income', inr(inc))}${stat('Expenses', inr(exp))}${stat('Net', inr(inc - exp))}${stat('Pending payments', D.payments.filter((p) => p.status === 'pending').length)}</div>`
    : cur === 'pay' ? `<table class="mono"><tr><th>Date</th><th>Ref</th><th>Customer</th><th>Plan</th><th>Amount</th><th>Status</th><th></th></tr>${D.payments.map((p) => `<tr><td>${p.date}</td><td>${esc(p.ref)}</td><td>${esc(p.customer)}</td><td>${p.plan}</td><td>${inr(p.amount)}</td><td>${badge(p.status, p.status === 'confirmed' ? 'green' : 'gold')}</td><td>${p.status === 'pending' ? `<button class="btn sm" data-act="payok" data-id="${p.id}">Confirm</button>` : ''}</td></tr>`).join('')}</table>`
    : cur === 'exp' ? `<form id="f-exp" class="card form row wrap gap"><input name="cat" placeholder="Category" required><input name="amount" type="number" min="1" placeholder="Amount ₹" required><input name="note" placeholder="Note"><button class="btn">Add expense</button></form>
      <table class="mono"><tr><th>Date</th><th>Category</th><th>Amount</th><th>Note</th></tr>${D.expenses.map((e) => `<tr><td>${e.date}</td><td>${esc(e.cat)}</td><td>${inr(e.amount)}</td><td>${esc(e.note)}</td></tr>`).join('')}</table>`
    : cur === 'pl' ? `<table class="mono"><tr><th>Line</th><th>₹</th></tr><tr><td>Subscription income (confirmed)</td><td>${inr(inc)}</td></tr>${[...new Set(D.expenses.map((e) => e.cat))].map((c) => `<tr><td>− ${esc(c)}</td><td>${inr(D.expenses.filter((e) => e.cat === c).reduce((s, e) => s + e.amount, 0))}</td></tr>`).join('')}<tr><th>Net profit</th><th>${inr(inc - exp)}</th></tr></table>`
    : `<p class="muted">Append-only. Entries cannot be edited or deleted.</p><table class="mono"><tr><th>Time</th><th>By</th><th>Action</th><th>Detail</th></tr>${D.audit.map((a) => `<tr><td>${a.at.replace('T', ' ').slice(0, 19)}</td><td>${esc(a.by)}</td><td>${esc(a.action)}</td><td>${esc(a.detail)}</td></tr>`).join('')}</table>`;
  return `<h1 class="serif">${t('Finance')}</h1>${tab('ft', [['dash', 'Executive Dashboard'], ['pay', 'Payments'], ['exp', 'Operating Expenses'], ['pl', 'Profit & Loss'], ['audit', 'Audit Log']], cur)}<div class="mono-wrap">${body}</div>`;
});
acts.payok = (el) => { confirmPayment(db().payments.find((x) => x.id === el.dataset.id), currentUser().name); rerender(); };
document.addEventListener('submit', (e) => {
  if (e.target.id !== 'f-exp') return; e.preventDefault(); const d = Object.fromEntries(new FormData(e.target));
  db().expenses.unshift({ id: uid('e'), cat: d.cat, amount: +d.amount, note: d.note, date: today() }); log(currentUser().name, 'Expense added', `${d.cat} ${inr(d.amount)}`); save(); rerender();
});

/* ---------- approvals & staff (temporary password shown once) ---------- */
const showTemp = (name, pw) => modal(`<h2 class="serif">Temporary password for ${esc(name)}</h2><p class="lead">Shown <b>once</b>. The user must change it at first sign-in.</p>
  <p class="temp mono" id="tpw">${esc(pw)}</p><div class="row gap"><button class="btn" data-act="copy" data-v="${esc(pw)}">Copy</button><button class="btn ghost" data-close>Done</button></div>`);
acts.copy = (el) => { navigator.clipboard?.writeText(el.dataset.v).then(() => toast('Copied')).catch(() => toast('Copy failed — select and copy manually', 'err')); };
routes['/app/people'] = guard('#/app/people', (u) => {
  const D = db(), pend = D.users.filter((x) => x.status === 'pending');
  return `<h1 class="serif">${t('Approvals')}</h1><section class="card"><h2 class="serif">Pending sign-ups</h2>
  ${pend.map((p) => { const pay = pendingPaymentFor(p); return `<div class="row between"><span><b>${esc(p.name)}</b> · ${esc(p.email)} · ${esc(p.phone)}<br><small class="mono muted">${pay ? esc(pay.ref) + ' · ' + inr(pay.amount) : 'no payment reference'}</small></span><button class="btn" data-act="approve" data-id="${p.id}">Verify payment &amp; approve</button></div>`; }).join('') || '<p class="muted">No pending accounts.</p>'}</section>
  <section class="card"><h2 class="serif">Create staff account</h2><form id="f-staff" class="form row wrap gap"><input name="name" placeholder="Name" required><input name="email" type="email" placeholder="Email" required>
   <select name="role">${ROLES.filter((r) => r !== 'customer' && (u.role === 'owner' || r !== 'owner')).map((r) => `<option value="${r}">${ROLE_LABEL[r]}</option>`).join('')}</select><button class="btn">Create</button></form></section>
  <section class="card"><h2 class="serif">All users</h2><table><tr><th>Name</th><th>Role</th><th>Status</th><th></th></tr>${D.users.map((x) => `<tr><td>${esc(x.name)}<br><small class="muted">${esc(x.email)}</small></td><td>${ROLE_LABEL[x.role]}</td><td>${badge(x.status, x.status === 'active' ? 'green' : x.status === 'suspended' ? 'berry' : 'gold')}</td>
   <td>${x.id !== u.id && x.status !== 'pending' && (x.role !== 'owner' || u.role === 'owner') ? `<button class="btn ghost sm" data-act="suspend" data-id="${x.id}">${x.status === 'suspended' ? 'Reactivate' : 'Suspend'}</button>` : ''}</td></tr>`).join('')}</table></section>`;
});
acts.suspend = (el) => {
  const x = db().users.find((v) => v.id === el.dataset.id), to = x.status === 'suspended' ? 'active' : 'suspended';
  if (!confirm(`${to === 'suspended' ? 'Suspend' : 'Reactivate'} ${x.name}?`)) return;
  x.status = to; log(currentUser().name, 'Account ' + to, x.email); save(); rerender();
};
acts.approve = async (el) => {
  const p = db().users.find((x) => x.id === el.dataset.id), pw = tempPassword(); p.salt = uid('s'); p.pwHash = await hash(pw, p.salt); p.status = 'active'; p.mustChange = true;
  const pay = pendingPaymentFor(p); if (pay) confirmPayment(pay, currentUser().name);
  log(currentUser().name, 'Account approved', p.email); hooks.onApproved?.(p, pay); save(); rerender(); showTemp(p.name, pw);
};
document.addEventListener('submit', async (e) => {
  if (e.target.id !== 'f-staff') return; e.preventDefault(); const d = Object.fromEntries(new FormData(e.target)), pw = tempPassword(), salt = uid('s');
  if (db().users.some((x) => x.email.toLowerCase() === d.email.toLowerCase())) return toast('Email already in use', 'err');
  db().users.push({ id: uid('u'), name: d.name, email: d.email, phone: '', role: d.role, status: 'active', mustChange: true, salt, pwHash: await hash(pw, salt), financeAdmin: false });
  log(currentUser().name, 'Staff created', `${d.email} (${ROLE_LABEL[d.role]})`); save(); rerender(); showTemp(d.name, pw);
});

/* ---------- customer self-service ---------- */
routes['/app/me'] = guard('#/app/me', (u) => {
  const D = db(), c = D.customers.find((x) => x.userId === u.id), p = c && PLANS.find((x) => x.id === c.planId);
  return `<h1 class="serif">${t('My plan')}</h1>${hooks.meTop?.(u, c) || ''}${c ? `<section class="card"><h2 class="serif">${p.name}</h2><p class="mono">${fmtDate(c.planStart)} → ${fmtDate(c.planEnd)}</p><p>${c.members.map((m) => esc(m.name)).join(', ')}</p>${renewBox(c)}</section>` : '<p class="muted">No active subscription yet.</p>'}
  <section class="card"><h2 class="serif">Rate a recent dish</h2><form id="f-rate" class="row wrap gap"><select name="dish">${D.dishes.map((d) => `<option value="${d.id}">${esc(d.name)}</option>`).join('')}</select>
   <select name="stars">${[5, 4, 3, 2, 1].map((n) => `<option>${n}</option>`).join('')}</select><input name="comment" placeholder="Comment"><button class="btn">Submit</button></form></section>
  <section class="card"><h2 class="serif">Voice &amp; payment profile (Mannin Roots)</h2><p>Primary: <span class="mono">${esc(u.phone || '—')}</span> · Backup: <span class="mono">${esc(u.phone2 || '—')}</span></p>
   <p>Saved payment token: <span class="mono">${u.payTokenHash ? '••••• (set)' : 'not set'}</span></p><button class="btn ghost" data-act="token">Generate new 5-digit token</button></section>`;
});
document.addEventListener('submit', (e) => {
  if (e.target.id !== 'f-rate') return; e.preventDefault(); const d = Object.fromEntries(new FormData(e.target)), u = currentUser();
  db().ratings.unshift({ id: uid('r'), dishId: d.dish, stars: +d.stars, comment: d.comment, by: u.name, date: today() }); save(); toast('Thanks for rating'); e.target.reset();
});
acts.token = async () => { const u = currentUser(), tk = String(10000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 90000)); await setPayToken(u, tk); log(u.name, 'Payment token regenerated'); save(); modal(`<h2 class="serif">Your new 5-digit token</h2><p class="temp mono">${tk}</p><p class="muted">Shown once. Use with the SMS code for web or voice orders.</p><button class="btn" data-close>Done</button>`); rerender(); };

function renewBox(c) {
  if (locked(c)) return '';
  if (db().payments.some((x) => x.renewalFor === c.id && x.status === 'pending')) return '<p><span class="badge gold">Renewal awaiting payment verification</span></p>';
  return `<form id="f-renew" class="form row wrap gap"><select name="plan" aria-label="Plan">${PLANS.map((x) => `<option value="${x.id}" ${x.id === c.planId ? 'selected' : ''}>${x.name} — ${inr(planTotal(x))}</option>`).join('')}</select><input name="ref" placeholder="Bank / UPI reference" required aria-label="Payment reference"><button class="btn">Request renewal</button></form>`;
}
document.addEventListener('submit', (e) => {
  if (e.target.id !== 'f-renew') return; e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target)), u = currentUser(), c = db().customers.find((x) => x.userId === u.id), pl = PLANS.find((x) => x.id === d.plan);
  requestPayment({ customer: c.name, planId: pl.id, ref: d.ref, userId: u.id, renewalFor: c.id });
  log(u.name, 'Renewal requested', `${c.code} ${pl.name} · ${d.ref}`); save(); rerender(); toast('Renewal requested. It activates once payment is verified.');
});

/* ---------- Roots partners: onboarding wizard, approval, AUD pricing ---------- */
routes['/app/roots'] = guard('#/app/roots', (u) => {
  const R = rdb(); R.settings ||= {};
  const canSet = u.role === 'owner' || u.role === 'admin';
  return `<div class="row between"><h1 class="serif">Mannin Roots partners</h1><button class="btn" data-act="pwiz">+ Onboard restaurant</button></div>
  <section class="card"><h2 class="serif">Australia pricing</h2><p class="muted">Menu prices are entered in rupees. Australian prices are converted with the rate set here (AUD per ₹100, rounded to $0.50). Until it is set, Australian orders are paused. The $10 flat fee does not change.</p>
   ${canSet ? `<form id="f-aud" class="form row wrap gap"><label>AUD per ₹100<input name="rate" type="number" step="0.01" min="0.01" value="${R.settings.audPer100 || ''}" required></label><button class="btn">Save rate</button></form>` : `<p class="mono">${R.settings.audPer100 || 'Not set'}</p>`}</section>
  <table><tr><th>Restaurant</th><th>Cuisine · Area</th><th>FSSAI</th><th>Dishes</th><th>Status</th><th></th></tr>${R.restaurants.map((r) => { const st = r.status || 'active'; return `<tr><td>${esc(r.name)}<br><small class="muted">${esc(r.ta || '')}</small></td><td>${esc(r.cuisine)} · ${esc(r.area)}</td><td class="mono">${esc(r.fssai || '—')}</td><td class="mono">${r.dishes.length}</td>
   <td>${badge(st, st === 'active' ? 'green' : st === 'pending' ? 'gold' : 'berry')}</td><td>${st === 'pending' && canSet ? `<button class="btn sm" data-act="rstat" data-id="${r.id}" data-s="active">Approve</button>` : st === 'active' ? `<button class="btn ghost sm" data-act="rstat" data-id="${r.id}" data-s="paused">Pause</button>` : st === 'paused' ? `<button class="btn ghost sm" data-act="rstat" data-id="${r.id}" data-s="active">Resume</button>` : ''}</td></tr>`; }).join('')}</table>`;
});
acts.rstat = (el) => { const r = rdb().restaurants.find((x) => x.id === el.dataset.id); r.status = el.dataset.s; saveRoots(); log(currentUser().name, 'Restaurant ' + el.dataset.s, r.name); rerender(); };
document.addEventListener('submit', (e) => {
  if (e.target.id !== 'f-aud') return; e.preventDefault(); const v = +new FormData(e.target).get('rate'); const R = rdb(); R.settings ||= {};
  R.settings.audPer100 = v; saveRoots(); log(currentUser().name, 'AUD rate set', v + ' AUD per ₹100'); toast('Australia rate saved'); rerender();
});
let PW = null;
const CUISINES = ['South Indian', 'Biryani', 'Traditional Meals', 'Millet Specials', 'Street Food', 'Healthy & Light'];
acts.pwiz = () => { PW = { step: 1, d: { cuisine: CUISINES[0], items: [] } }; drawPW(); };
function drawPW() {
  $('.modal-bg')?.remove();
  const d = PW.d, s = PW.step, f = (n, l, x = '') => `<label>${l}<input name="${n}" value="${esc(d[n] || '')}" ${x}></label>`;
  const body = s === 1 ? f('name', 'Restaurant name', 'required') + f('ta', 'Tamil name (optional)') + `<label>Cuisine<select name="cuisine">${CUISINES.map((c) => `<option ${d.cuisine === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label>` + f('area', 'Area / locality', 'required')
    : s === 2 ? f('fssai', 'FSSAI licence number (14 digits)', 'required pattern="[0-9]{14}" inputmode="numeric"') + f('owner', 'Owner / manager name', 'required') + f('phone', 'Kitchen phone', 'required pattern="[0-9]{10}" inputmode="numeric"') + f('payout', 'Payout bank / UPI ID', 'required')
    : `<p class="muted">Add at least one dish. Prices in rupees.</p><ul>${d.items.map((i) => `<li>${esc(i.name)} — ₹${i.price}${i.healthy ? ' · Healthy' : ''}</li>`).join('') || '<li class="muted">No dishes yet</li>'}</ul>
       <div class="row wrap gap"><input id="pw-dn" placeholder="Dish name" aria-label="Dish name"><input id="pw-dp" type="number" min="1" placeholder="₹" style="width:100px" aria-label="Price"><label class="chk"><input type="checkbox" id="pw-dh"> Healthy</label><button type="button" class="btn ghost sm" data-act="pwitem">Add dish</button></div>`;
  modal(`<h2 class="serif">Onboard restaurant · step ${s} of 3</h2><div class="progress"><i style="width:${s * 33.3}%"></i></div>
   <form id="f-pw3" class="form">${body}<div class="row between">${s > 1 ? '<button type="button" class="btn ghost" data-act="pwback">Back</button>' : '<span></span>'}<button class="btn">${s === 3 ? 'Submit' : 'Next'}</button></div></form>`);
}
acts.pwback = () => { PW.step--; drawPW(); };
acts.pwitem = () => { const n = $('#pw-dn').value.trim(), p = +$('#pw-dp').value; if (!n || !(p > 0)) return toast('Enter a dish name and price', 'err'); PW.d.items.push({ name: n, price: p, healthy: $('#pw-dh').checked }); drawPW(); };
document.addEventListener('submit', (e) => {
  if (e.target.id !== 'f-pw3') return; e.preventDefault(); Object.assign(PW.d, Object.fromEntries(new FormData(e.target)));
  if (PW.step < 3) { PW.step++; return drawPW(); }
  const d = PW.d; if (!d.items.length) return toast('Add at least one dish', 'err');
  const u = currentUser(), st = u.role === 'manager' ? 'pending' : 'active'; // managers submit; Owner/Admin approve
  rdb().restaurants.push({ id: uid('r'), name: d.name, ta: d.ta, cuisine: d.cuisine, area: d.area, rating: 0, fssai: d.fssai, owner: d.owner, phone: d.phone, payout: d.payout, status: st,
    dishes: d.items.map((i) => ({ id: uid('rd'), name: i.name, price: i.price, cat: d.cuisine, tags: i.healthy ? ['Healthy'] : [], rating: 0 })) });
  saveRoots(); log(u.name, 'Restaurant onboarded', `${d.name} (${st})`); $('.modal-bg')?.remove(); rerender(); toast(st === 'pending' ? 'Submitted — awaiting Admin approval' : 'Restaurant is live');
});

export { shell, guard, badge, stat, tab, UI, locked };

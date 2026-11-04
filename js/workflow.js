/* Workflow integration: connects sign-up → approval → family profile → doctor → kitchen → delivery,
   plus notifications and role-specific dashboards. Screens call in through `hooks`. */
import { db, save, log, PLANS, uid, today, addDays, currentUser, notify, notesFor } from './store.js';
import { esc, toast, acts, routes, mounts, hooks, rerender, fmtDate, go } from './util.js';
import { guard, badge, stat, locked } from './staff.js';

const SLOTS = ['Breakfast', 'Lunch', 'Dinner'];
const TIMING = { 'All three': SLOTS, 'Lunch & Dinner': ['Lunch', 'Dinner'], 'Breakfast & Lunch': ['Breakfast', 'Lunch'] };
const slotsOf = (c) => TIMING[c.timing] || SLOTS;
const served = () => db().customers.filter((c) => c.status === 'active' && !locked(c) && c.members.length);
const weekday = (d = new Date()) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
const profileDone = (c) => c.profileDone ?? c.members.length > 0;
const link = (h, label) => `<a class="btn ghost sm" href="${h}">${label} →</a>`;

/* ---------- 1. approval creates the subscriber record ---------- */
hooks.onApproved = (user, pay) => {
  const D = db();
  if (user.role !== 'customer' || D.customers.some((c) => c.userId === user.id)) return;
  const plan = PLANS.find((p) => p.id === pay?.plan) || PLANS[0];
  const code = 'MS-' + (1001 + D.customers.length);
  D.customers.push({ id: uid('c'), code, name: user.name, phone: user.phone, address: '', tier: 'standard', status: 'active', userId: user.id,
    nominee: { name: '', relation: '', phone: '', mobility: '' }, planId: plan.id, planStart: today(), planEnd: addDays(today(), plan.days), timing: 'All three', members: [], profileDone: false });
  log(currentUser().name, 'Subscriber record created', `${code} · ${plan.name}`);
  notify({ userId: user.id }, `Welcome to Mannin Suvai! Your ${plan.name} plan is active. Next step: share your family health profile.`, '#/app/me');
};

/* ---------- 2. customer journey + family health profile ---------- */
hooks.meTop = (u, c) => {
  if (!c) return '<p class="lead">Your subscription will appear here once your payment is verified.</p>';
  const D = db(), names = c.members.map((m) => m.name);
  const s2 = profileDone(c);
  const assigned = c.members.some((m) => m.doctorId);
  const consulted = (D.consults || []).some((x) => names.includes(x.member)) || D.appointments.some((a) => a.customerId === c.id && a.status === 'Completed');
  const steps = [
    ['Pick a rhythm', 'done', PLANS.find((p) => p.id === c.planId).name],
    ['Share family health profile', s2 ? 'done' : 'now', s2 ? `${c.members.length} member(s)` : 'Fill in below'],
    ['Doctor consultation', consulted ? 'done' : s2 ? 'now' : 'todo', consulted ? 'Kitchen briefed' : assigned ? 'Doctor assigned — consultation pending' : s2 ? 'We are assigning your doctor' : ''],
    ['Enjoy traditional meals', consulted ? 'now' : 'todo', consulted ? `${slotsOf(c).join(', ')} daily` : ''],
  ];
  const journey = `<ol class="journey" aria-label="Your progress">${steps.map(([l, st, sub], i) => `<li class="${st}" ${st === 'now' ? 'aria-current="step"' : ''}><span class="dot">${st === 'done' ? '✓' : i + 1}</span><b>${l}</b><small>${esc(sub)}</small></li>`).join('')}</ol>`;
  const td = today(), dv = D.deliveries?.[td] || {};
  const todayBox = s2 ? `<section class="card"><h2 class="serif">Today's meals</h2><div class="row wrap gap">${slotsOf(c).map((s) => { const x = dv[`${c.id}|${s}`]; return `<span class="badge ${x ? 'green' : ''}">${s}: ${x ? 'delivered ' + new Date(x.at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'scheduled'}</span>`; }).join('')}</div></section>` : '';
  return journey + (s2 || locked(c) ? todayBox : profileForm(c));
};
function profileForm(c) {
  const n = c.nominee, f = (k, l, v, x = '') => `<label>${l}<input name="${k}" value="${esc(v || '')}" ${x}></label>`;
  return `<section class="card"><h2 class="serif">Family health profile</h2><p class="muted">This helps our doctor and kitchen cook safely for each person. You can add several family members.</p>
  <form id="f-house" class="form"><h3>Household &amp; nominee</h3>${f('address', 'Delivery address', c.address, 'required')}
   <div class="grid two">${f('nname', 'Nominee / emergency contact', n.name, 'required')}${f('nrel', 'Relationship', n.relation, 'required')}${f('nphone', 'Nominee phone', n.phone, 'required inputmode="numeric" pattern="[0-9]{10}"')}${f('mob', 'Mobility notes (e.g. uses walker)', n.mobility)}</div>
   <label>Meal timing<select name="timing">${Object.keys(TIMING).map((x) => `<option ${c.timing === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label><button class="btn ghost">Save household</button></form>
  <h3>Family members</h3><ul class="members">${c.members.map((m) => `<li><b>${esc(m.name)}</b>, ${m.age} — ${esc(m.condition || 'no conditions')} ${m.tags.map((t) => badge(t)).join('')}</li>`).join('') || '<li class="muted">No one added yet.</li>'}</ul>
  <form id="f-mem" class="form card inset"><div class="grid two"><label>Name<input name="name" required></label><label>Age<input name="age" type="number" min="1" max="120" required></label></div>
   <fieldset><legend>Health conditions</legend>${['Diabetes', 'Hypertension', 'Heart condition', 'Kidney care'].map((x) => `<label class="chk"><input type="checkbox" name="cond" value="${x}"> ${x}</label>`).join('')}</fieldset>
   <label>Other notes (allergies, chewing difficulty…)<input name="note"></label><button class="btn ghost">Add family member</button></form>
  <button class="btn lg" data-act="profdone" ${c.members.length && c.address && n.name ? '' : 'disabled'}>Finish profile</button>
  ${c.members.length && c.address && n.name ? '' : '<p class="muted small">Save the household details and add at least one family member to finish.</p>'}</section>`;
}
const myCustomer = () => db().customers.find((x) => x.userId === currentUser()?.id);
document.addEventListener('submit', (e) => {
  const f = e.target;
  if (f.id === 'f-house') {
    e.preventDefault(); const d = Object.fromEntries(new FormData(f)), c = myCustomer();
    c.address = d.address; c.timing = d.timing; c.nominee = { name: d.nname, relation: d.nrel, phone: d.nphone, mobility: d.mob || '-' };
    save(); toast('Household saved'); rerender();
  }
  if (f.id === 'f-mem') {
    e.preventDefault(); const fd = new FormData(f), c = myCustomer(), cond = fd.getAll('cond');
    const tags = ['Pure Veg', ...(cond.includes('Diabetes') ? ['Diabetic'] : []), ...(cond.some((x) => x === 'Hypertension' || x === 'Heart condition' || x === 'Kidney care') ? ['Low-Sodium'] : [])];
    c.members.push({ id: uid('m'), name: fd.get('name'), age: +fd.get('age'), tags, condition: [...cond, fd.get('note')].filter(Boolean).join(', '), doctorId: null, assignedBy: null });
    save(); toast('Family member added'); rerender();
  }
});
acts.profdone = () => {
  const c = myCustomer(); c.profileDone = true;
  log(currentUser().name, 'Family health profile completed', `${c.code} · ${c.members.length} member(s)`);
  notify({ roles: ['doctorAdmin', 'admin'] }, `${c.code} ${c.name}: ${c.members.length} family member(s) need a doctor assigned`, '#/app/care');
  notify({ roles: ['kitchen', 'manager'] }, `New household ${c.code} starts meals (${slotsOf(c).join(', ')}) — check dietary tags`, '#/app/kitchen');
  save(); rerender(); toast('Profile complete — our doctor team will contact you');
};

/* ---------- 3. doctor assignment, consultations, follow-ups ---------- */
hooks.onAssigned = (c, m) => { if (m.doctorId) notify({ userId: m.doctorId }, `New patient assigned: ${m.name} (${c.code}). Please book a consultation.`, '#/app/care'); };
hooks.onConsult = (c, m, tags) => notify({ roles: ['kitchen', 'manager'] }, `Diet update for ${m.name} (${c.code})${tags.length ? ': ' + tags.join(', ') : ''}`, '#/app/care');
hooks.onCompleted = (a) => {
  const D = db(); if (a.followUpId) return;
  const f = { id: uid('a'), customerId: a.customerId, memberName: a.memberName, doctorId: a.doctorId, date: addDays(a.date, D.settings.followUpDays), time: a.time, duration: a.duration, status: 'Waiting', notes: 'Follow-up', followUpOf: a.id };
  D.appointments.push(f); a.followUpId = f.id;
  notify({ userId: a.doctorId }, `Follow-up booked: ${a.memberName} on ${f.date} ${f.time}`, '#/app/appointments');
  log(currentUser().name, 'Follow-up booked', `${a.memberName} ${f.date} ${f.time}`);
  const clash = D.appointments.some((b) => b.id !== f.id && b.doctorId === f.doctorId && b.date === f.date && b.status !== 'Completed' && Math.abs(toMin(b.time) - toMin(f.time)) < Math.max(b.duration, f.duration));
  toast(clash ? `Follow-up booked for ${f.date}, but it overlaps another appointment — please reschedule.` : `Follow-up booked for ${f.date} ${f.time}`, clash ? 'err' : 'ok');
};
const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

/* ---------- 4. kitchen: today's prep sheet ---------- */
hooks.prep = () => {
  const D = db(), plan = D.planner[weekday()], dish = (id) => D.dishes.find((x) => x.id === id);
  const cs = served();
  const rows = SLOTS.map((s) => { const d = dish(plan[s]); const people = cs.filter((c) => slotsOf(c).includes(s)).flatMap((c) => c.members);
    const tagN = (t) => people.filter((m) => m.tags.includes(t)).length;
    return `<tr><td><b>${s}</b></td><td>${esc(d?.name || '—')}<br><small class="muted">${d ? d.gi : ''}</small></td><td class="mono big">${people.length}</td><td>${tagN('Diabetic') ? badge(`${tagN('Diabetic')} diabetic`, 'gold') : ''}${tagN('Low-Sodium') ? badge(`${tagN('Low-Sodium')} low-sodium`, 'gold') : ''}</td></tr>`; }).join('');
  const lastNote = (m) => (D.consults || []).filter((x) => x.member === m.name).slice(-1)[0];
  const special = cs.flatMap((c) => c.members.map((m) => ({ c, m, n: lastNote(m) }))).filter(({ m, n }) => n || m.tags.some((t) => t !== 'Pure Veg') || m.condition);
  return `<div class="row between"><p class="lead">${weekday()} · ${fmtDate(new Date())} · ${cs.length} households</p><button class="btn ghost sm" onclick="window.print()">Print prep sheet</button></div>
  <table class="printable"><tr><th>Meal</th><th>Dish (weekly planner)</th><th>Portions</th><th>Special portions</th></tr>${rows}</table>
  <h2 class="serif">Individual instructions</h2><p class="muted">From family health profiles and the latest doctor consultation.</p>
  <table class="printable"><tr><th>Member</th><th>Household</th><th>Tags</th><th>Doctor's latest note</th></tr>${special.map(({ c, m, n }) => `<tr><td>${esc(m.name)}${m.age ? `, ${m.age}` : ''}<br><small class="muted">${esc(m.condition || '')}</small></td><td>${esc(c.code)} · ${slotsOf(c).length} meals</td><td>${m.tags.map((t) => badge(t)).join('')}</td><td>${n ? esc(n.text) + `<br><small class="muted">${fmtDate(n.at)}</small>` : '—'}</td></tr>`).join('') || '<tr><td colspan=4 class="muted">No special instructions today.</td></tr>'}</table>`;
};

/* ---------- 5. delivery run (dispatch counts come from here; past days lock) ---------- */
const deliveredMeals = (date) => Object.values(db().deliveries?.[date] || {}).reduce((s, x) => s + x.meals, 0);
hooks.mealsOn = deliveredMeals;
routes['/app/deliveries'] = guard('#/app/deliveries', (u) => {
  const D = db(), td = today(), dv = D.deliveries?.[td] || {};
  const run = SLOTS.map((s) => ({ s, stops: served().filter((c) => slotsOf(c).includes(s)) }));
  const total = run.reduce((n, r) => n + r.stops.length, 0), done = Object.keys(dv).length;
  return `<h1 class="serif">Meal deliveries</h1><p class="lead">${fmtDate(new Date())} · ${done} of ${total} stops delivered · ${deliveredMeals(td)} meals</p>
  <div class="progress" aria-hidden="true"><i style="width:${total ? (done / total) * 100 : 0}%"></i></div>
  ${run.map(({ s, stops }) => `<section class="card"><h2 class="serif">${s}</h2>${stops.map((c) => { const x = dv[`${c.id}|${s}`]; return `<div class="stop ${x ? 'done' : ''}"><div><b>${esc(c.name)}</b> <span class="mono muted">${c.code}</span><br>📍 ${esc(c.address || 'Address not provided')}<br>
     <small>${c.members.length} meal(s) · ${[...new Set(c.members.flatMap((m) => m.tags))].map((t) => badge(t)).join('')} · Nominee ${esc(c.nominee.name || '—')} ${c.nominee.phone ? `<a href="tel:${esc(c.nominee.phone)}">${esc(c.nominee.phone)}</a>` : ''}${c.nominee.mobility && c.nominee.mobility !== '-' ? ` · <i>${esc(c.nominee.mobility)}</i>` : ''}</small></div>
     ${x ? `<span class="badge green">✓ ${new Date(x.at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} · ${esc(x.by)}</span>` : `<button class="btn" data-act="deliver" data-k="${c.id}|${s}">Mark delivered</button>`}</div>`; }).join('') || '<p class="muted">No deliveries for this meal.</p>'}</section>`).join('')}`;
});
acts.deliver = (el) => {
  const D = db(), td = today(), [cid] = el.dataset.k.split('|'), c = D.customers.find((x) => x.id === cid);
  if (locked(c)) return toast('This record is locked', 'err');
  D.deliveries ||= {}; D.deliveries[td] ||= {};
  if (D.deliveries[td][el.dataset.k]) return;
  D.deliveries[td][el.dataset.k] = { at: new Date().toISOString(), by: currentUser().name, meals: c.members.length };
  log(currentUser().name, 'Meal delivered', `${c.code} ${el.dataset.k.split('|')[1]}`); save(); rerender();
};
hooks.dispatchHistory = () => {
  const D = db(), td = today(), dates = Object.keys(D.deliveries || {}).sort().reverse();
  return `<section class="card"><h2 class="serif">Daily dispatch</h2><p class="muted">Counted from riders' delivery marks. Today stays open until midnight; earlier days are locked.</p>
   <table><tr><th>Date</th><th>Stops</th><th>Meals</th><th></th></tr>${dates.map((d) => `<tr><td class="mono">${d}</td><td class="mono">${Object.keys(D.deliveries[d]).length}</td><td class="mono">${deliveredMeals(d)}</td><td>${d === td ? badge('Open', 'green') : badge('🔒 Locked')}</td></tr>`).join('') || '<tr><td colspan=4 class="muted">Nothing delivered yet.</td></tr>'}</table></section>`;
};

/* ---------- 6. role dashboards ---------- */
hooks.dashTop = (u) => {
  const D = db(), td = today();
  if (u.role === 'doctor') {
    const q = D.appointments.filter((a) => a.doctorId === u.id && a.date === td).sort((a, b) => a.time.localeCompare(b.time));
    const mine = D.customers.flatMap((c) => c.members).filter((m) => m.doctorId === u.id).length;
    return `<section class="card day"><h2 class="serif">Your day</h2><div class="grid stats">${stat('Consultations today', q.length)}${stat('Waiting', q.filter((a) => a.status === 'Waiting').length)}${stat('Patients assigned', mine)}</div>
     ${q.map((a) => `<p><span class="mono">${a.time}</span> ${esc(a.memberName)} ${badge(a.status)}</p>`).join('')}${link('#/app/appointments', 'Open queue')}</section>`;
  }
  if (u.role === 'kitchen') {
    const cs = served(), plan = D.planner[weekday()];
    return `<section class="card day"><h2 class="serif">Today in the kitchen</h2><div class="grid stats">${SLOTS.map((s) => stat(`${s} · ${esc(D.dishes.find((x) => x.id === plan[s])?.name || '')}`, cs.filter((c) => slotsOf(c).includes(s)).reduce((n, c) => n + c.members.length, 0) + ' portions')).join('')}</div>${link('#/app/kitchen', "Today's prep sheet")}</section>`;
  }
  if (u.role === 'rider') {
    const total = SLOTS.reduce((n, s) => n + served().filter((c) => slotsOf(c).includes(s)).length, 0), done = Object.keys(D.deliveries?.[td] || {}).length;
    return `<section class="card day"><h2 class="serif">Your run</h2><div class="grid stats">${stat('Stops today', total)}${stat('Delivered', done)}${stat('Remaining', total - done)}</div>${link('#/app/deliveries', 'Start deliveries')} ${link('#/roots/orders', 'Roots orders')}</section>`;
  }
  const todo = [];
  const unassigned = served().flatMap((c) => c.members).filter((m) => !m.doctorId).length;
  if (['owner', 'admin'].includes(u.role)) {
    const ps = D.users.filter((x) => x.status === 'pending').length; if (ps) todo.push([`${ps} sign-up(s) awaiting payment verification`, '#/app/people']);
    const pp = D.payments.filter((p) => p.status === 'pending' && p.renewalFor).length; if (pp) todo.push([`${pp} renewal payment(s) to confirm`, '#/app/finance']);
  }
  if (['owner', 'admin', 'doctorAdmin'].includes(u.role) && unassigned) todo.push([`${unassigned} family member(s) without a doctor`, '#/app/care']);
  if (['owner', 'admin', 'manager'].includes(u.role)) {
    const incomplete = D.customers.filter((c) => c.status === 'active' && !profileDone(c)).length; if (incomplete) todo.push([`${incomplete} household(s) still completing their health profile`, '#/app/customers']);
  }
  if (u.role === 'doctorAdmin') { const w = D.appointments.filter((a) => a.date === td && a.status !== 'Completed').length; todo.push([`${w} consultation(s) still open today`, '#/app/appointments']); }
  return todo.length ? `<section class="card day"><h2 class="serif">Needs attention</h2><ul class="todo">${todo.map(([l, h]) => `<li><a href="${h}">${esc(l)} →</a></li>`).join('')}</ul></section>` : '';
};

/* ---------- 7. notifications inbox + renewal-due sweep ---------- */
hooks.unread = (u) => notesFor(u).filter((n) => !n.readBy.includes(u.id)).length;
routes['/app/inbox'] = guard('#/app/inbox', (u) => {
  const list = notesFor(u);
  return `<div class="row between"><h1 class="serif">Inbox</h1>${list.some((n) => !n.readBy.includes(u.id)) ? '<button class="btn ghost sm" data-act="readall">Mark all read</button>' : ''}</div>
  ${list.map((n) => `<a class="note card ${n.readBy.includes(u.id) ? '' : 'unread'}" href="${n.link || '#/app/inbox'}" data-act="readnote" data-id="${n.id}"><span>${esc(n.text)}</span><small class="mono muted">${new Date(n.at).toLocaleString('en-IN')}</small></a>`).join('') || '<p class="muted">Nothing here yet.</p>'}`;
});
acts.readnote = (el) => { const u = currentUser(), n = db().notes.find((x) => x.id === el.dataset.id); if (!n.readBy.includes(u.id)) n.readBy.push(u.id); save(); go(el.getAttribute('href')); };
acts.readall = () => { const u = currentUser(); notesFor(u).forEach((n) => { if (!n.readBy.includes(u.id)) n.readBy.push(u.id); }); save(); rerender(); };
mounts.push(() => {
  const D = db(), td = today(); D.renewNotified ||= {}; let changed = false;
  for (const c of D.customers) {
    if (c.status !== 'active' || c.planEnd < td || new Date(c.planEnd) - new Date(td) > 48 * 3600e3) continue;
    const k = c.id + '|' + c.planEnd; if (D.renewNotified[k]) continue;
    D.renewNotified[k] = true; changed = true;
    notify({ roles: ['manager', 'admin'] }, `Renewal due: ${c.name} (${c.code}) ends ${c.planEnd}`, '#/app/customers');
    if (c.userId) notify({ userId: c.userId }, `Your plan ends on ${c.planEnd}. Renew from My plan to keep meals coming.`, '#/app/me');
  }
  if (changed) save();
});

/* ---------- 8. text size for elders ---------- */
acts.textsize = () => { const n = (+localStorage.getItem('mannin_text') || 1) % 3 + 1; try { localStorage.setItem('mannin_text', String(n)); } catch {} rerender(); };
mounts.push(() => { document.documentElement.dataset.text = localStorage.getItem('mannin_text') || '1'; });

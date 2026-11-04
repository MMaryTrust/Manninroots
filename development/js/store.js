/* Mannin store: all data lives in this browser's localStorage. No network, no external APIs. */
const KEY = 'mannin_db_v1';
const KEY_ROOTS = 'mannin_roots_db_v1'; // separate "database" for Roots, per the dual-DB architecture

export const ROLES = ['owner', 'admin', 'doctorAdmin', 'doctor', 'manager', 'kitchen', 'rider', 'customer'];
export const ROLE_LABEL = {
  owner: 'Shop Owner', admin: 'Admin', doctorAdmin: 'Doctor Admin', doctor: 'Doctor',
  manager: 'Manager', kitchen: 'Kitchen Staff', rider: 'Delivery Rider', customer: 'Customer',
};

export const PLANS = [
  { id: 'weekly',    days: 7,   rate: 100, name: 'Weekly Nourish',   ta: 'வாராந்திர ஊட்டம்',     note: '3 meals daily (Breakfast, Lunch, Dinner). Trial tier.', noteTa: 'தினமும் 3 வேளை உணவு. சோதனை திட்டம்.' },
  { id: 'monthly',   days: 30,  rate: 90,  name: 'Monthly Balance',  ta: 'மாதாந்திர சமநிலை',     note: 'Includes dietary physician review.', noteTa: 'உணவு மருத்துவர் ஆய்வு உட்பட.' },
  { id: 'quarterly', days: 90,  rate: 80,  name: 'Quarterly Roots',  ta: 'காலாண்டு வேர்கள்',     note: 'Free monthly physician consultation.', noteTa: 'மாதந்தோறும் இலவச மருத்துவர் ஆலோசனை.' },
  { id: 'half',      days: 180, rate: 75,  name: 'Six Months Season', ta: 'ஆறு மாத பருவம்',      note: 'Priority kitchen slot & personalised menu.', noteTa: 'முன்னுரிமை சமையல் நேரம், தனிப்பயன் உணவுப்பட்டியல்.' },
  { id: 'yearly',    days: 365, rate: 65,  name: 'Yearly Heritage',  ta: 'ஆண்டு மரபு',           note: 'Dedicated care manager & custom thali.', noteTa: 'தனிப்பட்ட பராமரிப்பு மேலாளர், சிறப்பு தாலி.' },
];
// total = days * rate, rounded to the nearest 100
export const planTotal = (p) => Math.round((p.days * p.rate) / 100) * 100;
export const planSaving = (p) => 100 * p.days - planTotal(p);

const today = () => new Date().toISOString().slice(0, 10);
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
export const uid = (p = 'id') => p + '_' + Math.random().toString(36).slice(2, 9);

export async function hash(pw, salt) {
  const buf = new TextEncoder().encode(salt + ':' + pw);
  const d = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
export function tempPassword() {
  const c = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const a = crypto.getRandomValues(new Uint32Array(10));
  return [...a].map((n) => c[n % c.length]).join('');
}

async function seedUser(name, email, role, extra = {}) {
  const salt = uid('s');
  return { id: uid('u'), name, email, phone: extra.phone || '', role, status: 'active', mustChange: false,
    salt, pwHash: await hash(tempPassword(), salt), financeAdmin: false, ...extra };
}

async function seed() {
  const t = today();
  const users = [
    await seedUser('Meenakshi Sundaram', 'owner@mannin.test', 'owner', { financeAdmin: true }),
    await seedUser('Kavitha Rajan', 'admin@mannin.test', 'admin'),
    await seedUser('Dr. Lakshmi Narayanan', 'docadmin@mannin.test', 'doctorAdmin'),
    await seedUser('Dr. Arumugam P', 'doctor1@mannin.test', 'doctor'),
    await seedUser('Dr. Sivagami R', 'doctor2@mannin.test', 'doctor'),
    await seedUser('Senthil Kumar', 'manager@mannin.test', 'manager'),
    await seedUser('Chef Pazhani', 'kitchen@mannin.test', 'kitchen'),
    await seedUser('Muthu Vel', 'rider@mannin.test', 'rider'),
    await seedUser('Janaki Ramesh', 'customer@mannin.test', 'customer', { phone: '9840011122', phone2: '9840033344', payToken: '48213' }),
  ];
  const id = (e) => users.find((u) => u.email === e).id;
  const customers = [
    { id: uid('c'), code: 'MS-1001', name: 'Janaki Ramesh', phone: '9840011122', address: 'Madha Church St, Virachilai', tier: 'premium', status: 'active', userId: id('customer@mannin.test'),
      nominee: { name: 'Ramesh Iyer', relation: 'Son', phone: '9840099900', mobility: 'Walks with a stick' }, planId: 'quarterly', planStart: addDays(t, -80), planEnd: addDays(t, 1),
      members: [
        { id: uid('m'), name: 'Parvathi Ammal', age: 78, tags: ['Pure Veg', 'Diabetic'], doctorId: id('doctor1@mannin.test'), condition: 'Type 2 diabetes', assignedBy: id('docadmin@mannin.test') },
        { id: uid('m'), name: 'Subbaiah', age: 81, tags: ['Pure Veg', 'Low-Sodium'], doctorId: id('doctor2@mannin.test'), condition: 'Hypertension', assignedBy: id('docadmin@mannin.test') },
      ] },
    { id: uid('c'), code: 'MS-1002', name: 'Rajalakshmi K', phone: '9786012345', address: 'Pudukkottai Main Rd', tier: 'vip', status: 'active',
      nominee: { name: 'Karthik', relation: 'Son', phone: '9786055566', mobility: 'Wheelchair' }, planId: 'yearly', planStart: addDays(t, -120), planEnd: addDays(t, 245),
      members: [{ id: uid('m'), name: 'Rajalakshmi K', age: 84, tags: ['Pure Veg', 'Diabetic'], doctorId: id('doctor1@mannin.test'), condition: 'Diabetes, arthritis', assignedBy: id('docadmin@mannin.test') }] },
    { id: uid('c'), code: 'MS-1003', name: 'Thangavel M', phone: '9677123456', address: 'Virachilai Bazaar', tier: 'standard', status: 'active',
      nominee: { name: 'Mani', relation: 'Daughter', phone: '9677100200', mobility: 'Independent' }, planId: 'monthly', planStart: addDays(t, -29), planEnd: addDays(t, 1),
      members: [{ id: uid('m'), name: 'Thangavel M', age: 72, tags: ['Mixed'], doctorId: id('doctor2@mannin.test'), condition: 'Cardiac follow-up', assignedBy: id('docadmin@mannin.test') }] },
    { id: uid('c'), code: 'MS-1004', name: 'Alamelu S', phone: '9443011223', address: 'Karaikudi Rd', tier: 'standard', status: 'deceased',
      nominee: { name: 'Sathish', relation: 'Son', phone: '9443044556', mobility: '-' }, planId: 'weekly', planStart: addDays(t, -40), planEnd: addDays(t, -33), members: [] },
    { id: uid('c'), code: 'MS-1005', name: 'Visalakshi N', phone: '9894012300', address: 'Thirumayam Rd', tier: 'premium', status: 'active',
      nominee: { name: 'Nithya', relation: 'Daughter', phone: '9894045600', mobility: 'Uses walker' }, planId: 'half', planStart: addDays(t, -60), planEnd: addDays(t, 120), members: [
        { id: uid('m'), name: 'Visalakshi N', age: 76, tags: ['Pure Veg'], doctorId: null, condition: 'General check-up', assignedBy: null }] },
  ];
  const mk = (n, ta, cat, gi, tags, kcal, p, c, f, allergens, price) => ({ id: uid('d'), name: n, ta, cat, gi, tags, kcal, protein: p, carbs: c, fat: f, allergens, price, fssai: true });
  const dishes = [
    mk('Kambu Koozh', 'கம்பு கூழ்', 'Breakfast', 'Low-GI', ['Pure Veg', 'Diabetic'], 180, 5, 32, 3, [], 40),
    mk('Ragi Dosai with Coconut Chutney', 'ராகி தோசை', 'Breakfast', 'Low-GI', ['Pure Veg', 'Diabetic'], 240, 6, 38, 7, ['Coconut'], 50),
    mk('Samai Pongal', 'சாமை பொங்கல்', 'Breakfast', 'Low-GI', ['Pure Veg', 'Low-Sodium'], 260, 7, 40, 8, ['Cashew'], 50),
    mk('Mud-pot Sambar Thali', 'மண்பானை சாம்பார் தாலி', 'Lunch', 'Medium-GI', ['Pure Veg'], 520, 15, 82, 12, [], 90),
    mk('Kuthiraivali Curd Rice', 'குதிரைவாலி தயிர் சாதம்', 'Lunch', 'Low-GI', ['Pure Veg', 'Diabetic'], 310, 9, 48, 7, ['Milk'], 60),
    mk('Keerai Kootu & Kambu Sadam', 'கீரை கூட்டு', 'Lunch', 'Low-GI', ['Pure Veg', 'Diabetic', 'Low-Sodium'], 380, 12, 58, 8, [], 70),
    mk('Vazhaipoo Poriyal Meal', 'வாழைப்பூ பொரியல்', 'Lunch', 'Low-GI', ['Pure Veg', 'Diabetic'], 360, 10, 55, 9, [], 70),
    mk('Idli, Sambar (2 pc)', 'இட்லி சாம்பார்', 'Dinner', 'Medium-GI', ['Pure Veg', 'Low-Sodium'], 220, 7, 42, 2, [], 40),
    mk('Chettinad Veg Kuzhambu Meal', 'செட்டிநாடு குழம்பு', 'Dinner', 'Medium-GI', ['Mixed'], 480, 14, 70, 14, ['Sesame'], 80),
    mk('Ragi Adai & Avial', 'ராகி அடை அவியல்', 'Dinner', 'Low-GI', ['Pure Veg', 'Diabetic'], 300, 9, 44, 9, ['Coconut'], 60),
  ];
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const byCat = (c) => dishes.filter((d) => d.cat === c);
  const planner = {};
  weekDays.forEach((d, i) => { planner[d] = { Breakfast: byCat('Breakfast')[i % 3].id, Lunch: byCat('Lunch')[i % 4].id, Dinner: byCat('Dinner')[i % 3].id }; });
  const ratings = [
    { id: uid('r'), dishId: dishes[0].id, stars: 5, comment: 'Warm and light.', by: 'Janaki Ramesh', date: addDays(t, -1) },
    { id: uid('r'), dishId: dishes[3].id, stars: 4, comment: 'Sambar a little salty.', by: 'Thangavel M', date: addDays(t, -2) },
  ];
  const mkAppt = (cust, doc, off, hh, mm, dur, status) => ({ id: uid('a'), customerId: cust.id, memberName: cust.members[0]?.name || cust.name, doctorId: doc, date: addDays(t, off), time: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`, duration: dur, status, notes: '' });
  const appointments = [
    mkAppt(customers[0], id('doctor1@mannin.test'), 0, 10, 0, 30, 'Waiting'),
    mkAppt(customers[1], id('doctor1@mannin.test'), 0, 11, 0, 30, 'In-Session'),
    mkAppt(customers[2], id('doctor2@mannin.test'), 0, 11, 30, 30, 'Waiting'),
    mkAppt(customers[0], id('doctor2@mannin.test'), 3, 9, 30, 30, 'Waiting'),
  ];
  const payments = [
    { id: uid('p'), ref: 'UPI-77120931', customer: 'Janaki Ramesh', plan: 'quarterly', amount: 7200, status: 'confirmed', date: addDays(t, -80) },
    { id: uid('p'), ref: 'UPI-77654120', customer: 'Rajalakshmi K', plan: 'yearly', amount: 23700, status: 'confirmed', date: addDays(t, -120) },
    { id: uid('p'), ref: 'NEFT-5523981', customer: 'Visalakshi N', plan: 'half', amount: 13500, status: 'pending', date: addDays(t, -1) },
  ];
  const expenses = [
    { id: uid('e'), cat: 'Groceries & millets', amount: 18400, date: addDays(t, -6), note: 'Weekly millet & lentil purchase' },
    { id: uid('e'), cat: 'Cold-pressed oil', amount: 6200, date: addDays(t, -10), note: 'Sesame & coconut oil' },
    { id: uid('e'), cat: 'Staff wages', amount: 42000, date: addDays(t, -2), note: 'Kitchen & riders' },
    { id: uid('e'), cat: 'Fuel & delivery', amount: 5400, date: addDays(t, -4), note: '' },
  ];
  return {
    users, customers, dishes, planner, ratings, appointments, payments, expenses,
    audit: [{ id: uid('l'), at: new Date().toISOString(), by: 'system', action: 'Database seeded', detail: 'Demo data created' }],
    dispatch: {}, // { 'YYYY-MM-DD': {count, lockedAt} }
    settings: { followUpDays: 30, language: 'en' },
  };
}

async function seedRoots() {
  const R = (id, name, ta, cuisine, area, rating, dishes) => ({ id, name, ta, cuisine, area, rating, dishes });
  const D = (n, price, cat, tags = [], rating = 4.5) => ({ id: uid('rd'), name: n, price, cat, tags, rating });
  return {
    restaurants: [
      R('r1', 'Annapoorani Mess', 'அன்னபூரணி மெஸ்', 'South Indian', 'T. Nagar', 4.8, [D('Ghee Pongal', 90, 'South Indian', [], 4.9), D('Podi Idli (4)', 80, 'South Indian'), D('Filter Coffee', 30, 'South Indian', [], 4.7)]),
      R('r2', 'Thalappakatti Corner', 'தலப்பாகட்டி முனை', 'Biryani', 'Anna Nagar', 4.7, [D('Veg Dum Biryani', 180, 'Biryani', [], 4.6), D('Seeraga Samba Biryani', 220, 'Biryani', [], 4.8), D('Raita', 30, 'Biryani')]),
      R('r3', 'Chettinad Rasam House', 'செட்டிநாடு ரசம் இல்லம்', 'Traditional Meals', 'Adyar', 4.6, [D('Full Meals', 170, 'Traditional Meals', [], 4.7), D('Kozhi Milagu Curry', 240, 'Traditional Meals'), D('Kalan Kuzhambu', 120, 'Traditional Meals')]),
      R('r4', 'Kambu Kitchen', 'கம்பு கிச்சன்', 'Millet Specials', 'Mylapore', 4.5, [D('Kambu Dosa', 90, 'Millet Specials', ['Healthy'], 4.6), D('Ragi Ball Meal', 130, 'Millet Specials', ['Healthy']), D('Samai Upma', 80, 'Millet Specials', ['Healthy'])]),
      R('r5', 'Marina Street Bites', 'மெரினா தெரு உணவு', 'Street Food', 'Besant Nagar', 4.4, [D('Medu Vadai (2)', 50, 'Street Food'), D('Sundal Cup', 40, 'Street Food', ['Healthy'], 4.7), D('Bajji Platter', 90, 'Street Food')]),
      R('r6', 'Green Leaf Light', 'பசுமை இலை', 'Healthy & Light', 'Velachery', 4.6, [D('Sprouts Salad Bowl', 140, 'Healthy & Light', ['Healthy'], 4.5), D('Keerai Soup', 70, 'Healthy & Light', ['Healthy']), D('Veg Millet Khichdi', 150, 'Healthy & Light', ['Healthy'])]),
    ],
    offers: [{ code: 'MANNIN10', text: 'Free sundal cup on orders above ₹300' }],
    orders: [],
  };
}

let DB = null, RDB = null;
export const db = () => DB;
export const rdb = () => RDB;
export async function init() {
  try { DB = JSON.parse(localStorage.getItem(KEY)); } catch { DB = null; }
  try { RDB = JSON.parse(localStorage.getItem(KEY_ROOTS)); } catch { RDB = null; }
  if (!DB) { DB = await seed(); save(); }
  // payment tokens are stored only as salted hashes (also migrates older local data)
  for (const u of DB.users) if (u.payToken) { await setPayToken(u, u.payToken); delete u.payToken; save(); }
  if (!RDB) { RDB = await seedRoots(); saveRoots(); }
}
export async function setPayToken(u, tk) { u.tokenSalt = uid('t'); u.payTokenHash = await hash(tk, u.tokenSalt); }
export const checkPayToken = async (u, tk) => !!u.payTokenHash && (await hash(tk, u.tokenSalt)) === u.payTokenHash;
export const save = () => localStorage.setItem(KEY, JSON.stringify(DB));
export const saveRoots = () => localStorage.setItem(KEY_ROOTS, JSON.stringify(RDB));
export function resetAll() { localStorage.removeItem(KEY); localStorage.removeItem(KEY_ROOTS); localStorage.removeItem('mannin_session'); location.hash = '#/'; location.reload(); }
export function log(by, action, detail = '') { DB.audit.unshift({ id: uid('l'), at: new Date().toISOString(), by, action, detail }); save(); }
export { today, addDays };

/* notifications: addressed to roles and/or one user; read state is per user */
export function notify(to, text, link = '') {
  DB.notes ||= [];
  DB.notes.unshift({ id: uid('n'), at: new Date().toISOString(), roles: to.roles || [], userId: to.userId || null, text, link, readBy: [] });
  save();
}
export const notesFor = (u) => (DB.notes || []).filter((n) => n.userId === u.id || n.roles.includes(u.role));

/* session */
export const session = () => { try { return JSON.parse(localStorage.getItem('mannin_session')); } catch { return null; } };
export const setSession = (s) => (s ? localStorage.setItem('mannin_session', JSON.stringify(s)) : localStorage.removeItem('mannin_session'));
export const currentUser = () => { const s = session(); return s ? DB.users.find((u) => u.id === s.userId) : null; };

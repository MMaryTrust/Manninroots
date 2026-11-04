// Demo seed: plans, Suvai menu, Roots restaurants/dishes and one login per role.
// Idempotent: re-running updates plans and skips rows that already exist.
import bcrypt from 'bcryptjs';

const PLANS = [
  ['weekly', 'Weekly Nourish', 'வாராந்திர ஊட்டம்', 7, 100, '3 meals daily (Breakfast, Lunch, Dinner). Trial tier.', 'தினமும் 3 வேளை உணவு. சோதனை திட்டம்.'],
  ['monthly', 'Monthly Balance', 'மாதாந்திர சமநிலை', 30, 90, 'Includes dietary physician review.', 'உணவு மருத்துவர் ஆய்வு உட்பட.'],
  ['quarterly', 'Quarterly Roots', 'காலாண்டு வேர்கள்', 90, 80, 'Free monthly physician consultation.', 'மாதந்தோறும் இலவச மருத்துவர் ஆலோசனை.'],
  ['half', 'Six Months Season', 'ஆறு மாத பருவம்', 180, 75, 'Priority kitchen slot & personalised menu.', 'முன்னுரிமை சமையல் நேரம், தனிப்பயன் உணவுப்பட்டியல்.'],
  ['yearly', 'Yearly Heritage', 'ஆண்டு மரபு', 365, 65, 'Dedicated care manager & custom thali.', 'தனிப்பட்ட பராமரிப்பு மேலாளர், சிறப்பு தாலி.'],
];

// name, ta, slot, gi, tags, kcal, protein, carbs, fat, allergens
const DISHES = [
  ['Kambu Koozh', 'கம்பு கூழ்', 'Breakfast', 'Low-GI', ['Pure Veg', 'Diabetic'], 180, 5, 32, 3, []],
  ['Ragi Dosai with Coconut Chutney', 'ராகி தோசை', 'Breakfast', 'Low-GI', ['Pure Veg', 'Diabetic'], 240, 6, 38, 7, ['Coconut']],
  ['Samai Pongal', 'சாமை பொங்கல்', 'Breakfast', 'Low-GI', ['Pure Veg', 'Low-Sodium'], 260, 7, 40, 8, ['Cashew']],
  ['Mud-pot Sambar Thali', 'மண்பானை சாம்பார் தாலி', 'Lunch', 'Medium-GI', ['Pure Veg'], 520, 15, 82, 12, []],
  ['Kuthiraivali Curd Rice', 'குதிரைவாலி தயிர் சாதம்', 'Lunch', 'Low-GI', ['Pure Veg', 'Diabetic'], 310, 9, 48, 7, ['Milk']],
  ['Keerai Kootu & Kambu Sadam', 'கீரை கூட்டு', 'Lunch', 'Low-GI', ['Pure Veg', 'Diabetic', 'Low-Sodium'], 380, 12, 58, 8, []],
  ['Vazhaipoo Poriyal Meal', 'வாழைப்பூ பொரியல்', 'Lunch', 'Low-GI', ['Pure Veg', 'Diabetic'], 360, 10, 55, 9, []],
  ['Idli, Sambar (2 pc)', 'இட்லி சாம்பார்', 'Dinner', 'Medium-GI', ['Pure Veg', 'Low-Sodium'], 220, 7, 42, 2, []],
  ['Chettinad Veg Kuzhambu Meal', 'செட்டிநாடு குழம்பு', 'Dinner', 'Medium-GI', ['Mixed'], 480, 14, 70, 14, ['Sesame']],
  ['Ragi Adai & Avial', 'ராகி அடை அவியல்', 'Dinner', 'Low-GI', ['Pure Veg', 'Diabetic'], 300, 9, 44, 9, ['Coconut']],
];

// name, ta, cuisine, area, rating, dishes[name, price, tags, rating]
const RESTAURANTS = [
  ['Annapoorani Mess', 'அன்னபூரணி மெஸ்', 'South Indian', 'T. Nagar', 4.8, [['Ghee Pongal', 90, [], 4.9], ['Podi Idli (4)', 80, [], 4.5], ['Filter Coffee', 30, [], 4.7]]],
  ['Thalappakatti Corner', 'தலப்பாகட்டி முனை', 'Biryani', 'Anna Nagar', 4.7, [['Veg Dum Biryani', 180, [], 4.6], ['Seeraga Samba Biryani', 220, [], 4.8], ['Raita', 30, [], 4.5]]],
  ['Chettinad Rasam House', 'செட்டிநாடு ரசம் இல்லம்', 'Traditional Meals', 'Adyar', 4.6, [['Full Meals', 170, [], 4.7], ['Kozhi Milagu Curry', 240, [], 4.5], ['Kalan Kuzhambu', 120, [], 4.5]]],
  ['Kambu Kitchen', 'கம்பு கிச்சன்', 'Millet Specials', 'Mylapore', 4.5, [['Kambu Dosa', 90, ['Healthy'], 4.6], ['Ragi Ball Meal', 130, ['Healthy'], 4.5], ['Samai Upma', 80, ['Healthy'], 4.5]]],
  ['Marina Street Bites', 'மெரினா தெரு உணவு', 'Street Food', 'Besant Nagar', 4.4, [['Medu Vadai (2)', 50, [], 4.5], ['Sundal Cup', 40, ['Healthy'], 4.7], ['Bajji Platter', 90, [], 4.5]]],
  ['Green Leaf Light', 'பசுமை இலை', 'Healthy & Light', 'Velachery', 4.6, [['Sprouts Salad Bowl', 140, ['Healthy'], 4.5], ['Keerai Soup', 70, ['Healthy'], 4.5], ['Veg Millet Khichdi', 150, ['Healthy'], 4.5]]],
];

const USERS = [
  ['Meenakshi Sundaram', 'owner@mannin.test', 'owner', { finance: true }],
  ['Kavitha Rajan', 'admin@mannin.test', 'admin'],
  ['Mannin Admin', 'admin@manninsuvai.com', 'admin'],
  ['Dr. Lakshmi Narayanan', 'docadmin@mannin.test', 'doctorAdmin'],
  ['Dr. Arumugam P', 'doctor1@mannin.test', 'doctor'],
  ['Dr. Sivagami R', 'doctor2@mannin.test', 'doctor'],
  ['Senthil Kumar', 'manager@mannin.test', 'manager'],
  ['Chef Pazhani', 'kitchen@mannin.test', 'kitchen'],
  ['Muthu Vel', 'rider@mannin.test', 'rider'],
  ['Janaki Ramesh', 'customer@mannin.test', 'customer', { phone: '9840011122', phone2: '9840033344', token: '48213' }],
];

export async function seed(db, { password } = {}) {
  for (const [i, p] of PLANS.entries()) {
    await db.query(
      `insert into plans(id, name, name_ta, days, rate, note, note_ta, position) values ($1,$2,$3,$4,$5,$6,$7,$8)
       on conflict (id) do update set name=$2, name_ta=$3, days=$4, rate=$5, note=$6, note_ta=$7, position=$8`, [...p, i]);
  }
  if ((await db.query('select 1 from dishes limit 1')).rows.length === 0) {
    for (const d of DISHES) {
      await db.query('insert into dishes(name, name_ta, slot, gi, tags, kcal, protein, carbs, fat, allergens) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)', d);
    }
  }
  if ((await db.query('select 1 from roots.restaurants limit 1')).rows.length === 0) {
    for (const [name, ta, cuisine, area, rating, dishes] of RESTAURANTS) {
      const { rows: [r] } = await db.query(
        "insert into roots.restaurants(name, name_ta, cuisine, area, rating, status) values ($1,$2,$3,$4,$5,'active') returning id", [name, ta, cuisine, area, rating]);
      for (const [dn, price, tags, dr] of dishes) {
        await db.query('insert into roots.dishes(restaurant_id, name, price_inr, cuisine, tags, rating) values ($1,$2,$3,$4,$5,$6)', [r.id, dn, price, cuisine, tags, dr]);
      }
    }
  }
  const pw = password || process.env.SEED_PASSWORD;
  if (!pw) throw new Error('Set SEED_PASSWORD to create the demo logins');
  const hash = await bcrypt.hash(pw, 10);
  for (const [name, email, role, x = {}] of USERS) {
    await db.query(
      `insert into users(name, email, phone, phone2, password_hash, role, finance_admin, pay_token_hash) values ($1,$2,$3,$4,$5,$6,$7,$8)
       on conflict (email) do nothing`,
      [name, email, x.phone || null, x.phone2 || null, hash, role, !!x.finance, x.token ? await bcrypt.hash(x.token, 10) : null]);
  }
}

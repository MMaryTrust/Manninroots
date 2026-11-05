import dosa from "@/assets/dosa.jpg";
import biryani from "@/assets/biryani.jpg";
import meals from "@/assets/meals.jpg";
import sweets from "@/assets/sweets.jpg";
import kothu from "@/assets/kothu.jpg";
import chettinad from "@/assets/chettinad.jpg";

// Test data (Australia, AUD, 10% GST included). Money in cents.
export const COUNTRY = { code: "AU", currency: "AUD", gstRate: 0.1, platformFee: 99 };

export type Category = "dosa" | "biryani" | "meals" | "sweets" | "parotta" | "curry";
export type Restaurant = {
  id: string; slug: string; nameEn: string; nameTa: string; distanceKm: number;
  deliveryFee: number; prepMin: number; open: boolean; registration: string; hours: string;
  enrolled: boolean; lat: number; lng: number; suburb: string;
  /** Local council / district, searchable as a location. */
  district: string;
  /** Average customer stars (0 = no reviews yet) and number of reviews. */
  rating: number; ratingCount: number;
  /** Mannin Roots system score 0–5 (hygiene, on-time, complaints). 0 = not assessed (not enrolled). */
  systemScore: number;
};
export type Dish = {
  id: string; restaurantId: string; nameEn: string; nameTa: string; aliases: string[];
  descEn: string; descTa: string; price: number; veg: boolean; spice: 0 | 1 | 2 | 3;
  allergens: string[]; category: Category; available: boolean; prepMin: number; orders: number;
  rating: number; ratingCount: number;
};

export const HOME_POINT = { lat: -33.8235, lng: 151.0085 }; // Harris Park, NSW

export const restaurants: Restaurant[] = [
  { id: "r1", slug: "kumars-kitchen", nameEn: "Kumar's Kitchen", nameTa: "குமார சமையலறை", distanceKm: 0, deliveryFee: 499, prepMin: 20, open: true, registration: "PAR-FS-20419", hours: "11:00 am – 9:30 pm", enrolled: true, lat: -33.8235, lng: 151.0085, suburb: "Harris Park", district: "Parramatta", rating: 4.7, ratingCount: 312, systemScore: 4.8 },
  { id: "r2", slug: "amma-veedu", nameEn: "Amma Veedu", nameTa: "அமா வீடு", distanceKm: 0, deliveryFee: 599, prepMin: 25, open: true, registration: "PAR-FS-31877", hours: "7:00 am – 8:00 pm", enrolled: true, lat: -33.815, lng: 151.0011, suburb: "Parramatta", district: "Parramatta", rating: 4.8, ratingCount: 428, systemScore: 4.6 },
  { id: "r3", slug: "chettinad-house", nameEn: "Chettinad House", nameTa: "செட்டிநாடு இல்லம்", distanceKm: 0, deliveryFee: 699, prepMin: 35, open: true, registration: "CUM-FS-11902", hours: "12:00 pm – 10:00 pm", enrolled: true, lat: -33.836, lng: 151.038, suburb: "Granville", district: "Cumberland", rating: 4.5, ratingCount: 201, systemScore: 4.7 },
  { id: "r4", slug: "madurai-mess", nameEn: "Madurai Mess", nameTa: "மதுரை மெஸ்", distanceKm: 0, deliveryFee: 549, prepMin: 25, open: true, registration: "PAR-FS-40211", hours: "11:30 am – 10:00 pm", enrolled: true, lat: -33.798, lng: 150.98, suburb: "Westmead", district: "Parramatta", rating: 4.4, ratingCount: 176, systemScore: 4.3 },
  { id: "r5", slug: "saravana-tiffin", nameEn: "Saravana Tiffin Centre", nameTa: "சரவணா டிபன் சென்டர்", distanceKm: 0, deliveryFee: 0, prepMin: 0, open: true, registration: "", hours: "8:00 am – 9:00 pm", enrolled: false, lat: -33.769, lng: 150.906, suburb: "Blacktown", district: "Blacktown", rating: 4.3, ratingCount: 98, systemScore: 0 },
  { id: "r6", slug: "thanjavur-kitchen", nameEn: "Thanjavur Kitchen", nameTa: "தஞ்சாவூர் சமையலறை", distanceKm: 0, deliveryFee: 0, prepMin: 0, open: false, registration: "", hours: "5:00 pm – 10:00 pm", enrolled: false, lat: -33.917, lng: 151.035, suburb: "Bankstown", district: "Canterbury-Bankstown", rating: 4.1, ratingCount: 64, systemScore: 0 },
  { id: "r7", slug: "kovai-cafe", nameEn: "Kovai Cafe", nameTa: "கோவை கஃபே", distanceKm: 0, deliveryFee: 0, prepMin: 0, open: true, registration: "", hours: "10:00 am – 9:00 pm", enrolled: false, lat: -34.425, lng: 150.893, suburb: "Wollongong", district: "Wollongong", rating: 4.2, ratingCount: 51, systemScore: 0 },
  { id: "r8", slug: "nellai-virundhu", nameEn: "Nellai Virundhu", nameTa: "நெல்லை விருந்து", distanceKm: 0, deliveryFee: 0, prepMin: 0, open: true, registration: "", hours: "11:00 am – 9:00 pm", enrolled: false, lat: -32.928, lng: 151.781, suburb: "Newcastle", district: "Newcastle", rating: 4.6, ratingCount: 87, systemScore: 0 },
  { id: "r9", slug: "canberra-chettinad", nameEn: "Canberra Chettinad", nameTa: "கேன்பெரா செட்டிநாடு", distanceKm: 0, deliveryFee: 0, prepMin: 0, open: true, registration: "", hours: "11:30 am – 9:30 pm", enrolled: false, lat: -35.281, lng: 149.13, suburb: "Canberra", district: "Canberra", rating: 4.4, ratingCount: 73, systemScore: 0 },
  { id: "r10", slug: "trichy-tastes", nameEn: "Trichy Tastes", nameTa: "திருச்சி சுவை", distanceKm: 0, deliveryFee: 0, prepMin: 0, open: false, registration: "", hours: "12:00 pm – 9:00 pm", enrolled: false, lat: -33.75, lng: 150.69, suburb: "Penrith", district: "Penrith", rating: 3.9, ratingCount: 40, systemScore: 0 },
  { id: "r11", slug: "annapoorna-merrylands", nameEn: "Annapoorna", nameTa: "அன்னபூர்ணா", distanceKm: 0, deliveryFee: 0, prepMin: 0, open: true, registration: "", hours: "11:00 am – 9:30 pm", enrolled: false, lat: -33.836, lng: 150.989, suburb: "Merrylands", district: "Cumberland", rating: 4.6, ratingCount: 140, systemScore: 0 },
  { id: "r12", slug: "pongal-house", nameEn: "Pongal House", nameTa: "பொங்கல் இல்லம்", distanceKm: 0, deliveryFee: 0, prepMin: 0, open: true, registration: "", hours: "11:00 am – 9:30 pm", enrolled: false, lat: -33.866, lng: 151.042, suburb: "Auburn", district: "Cumberland", rating: 4.2, ratingCount: 88, systemScore: 0 },
  { id: "r13", slug: "idli-corner", nameEn: "Idli Corner", nameTa: "இட்லி கார்னர்", distanceKm: 0, deliveryFee: 0, prepMin: 0, open: true, registration: "", hours: "11:00 am – 9:30 pm", enrolled: false, lat: -33.817, lng: 151.045, suburb: "Rydalmere", district: "Parramatta", rating: 4.5, ratingCount: 210, systemScore: 0 },
  { id: "r14", slug: "karaikudi-grill", nameEn: "Karaikudi Grill", nameTa: "காரைக்குடி கிரில்", distanceKm: 0, deliveryFee: 0, prepMin: 0, open: true, registration: "", hours: "11:00 am – 9:30 pm", enrolled: false, lat: -33.731, lng: 150.956, suburb: "Castle Hill", district: "The Hills", rating: 4.0, ratingCount: 55, systemScore: 0 },
  { id: "r15", slug: "ooty-bakes", nameEn: "Ooty Bakes & Meals", nameTa: "ஊட்டி பேக்ஸ்", distanceKm: 0, deliveryFee: 0, prepMin: 0, open: true, registration: "", hours: "11:00 am – 9:30 pm", enrolled: false, lat: -33.799, lng: 151.075, suburb: "Ermington", district: "Parramatta", rating: 3.8, ratingCount: 31, systemScore: 0 },
  { id: "r16", slug: "salem-spice", nameEn: "Salem Spice", nameTa: "சேலம் ஸ்பைஸ்", distanceKm: 0, deliveryFee: 0, prepMin: 0, open: true, registration: "", hours: "11:00 am – 9:30 pm", enrolled: false, lat: -33.879, lng: 150.96, suburb: "Fairfield", district: "Fairfield", rating: 4.3, ratingCount: 77, systemScore: 0 },
  { id: "r17", slug: "ramanathapuram-kitchen", nameEn: "Ramnad Kitchen", nameTa: "ராமநாதபுரம் சமையலறை", distanceKm: 0, deliveryFee: 0, prepMin: 0, open: true, registration: "", hours: "11:00 am – 9:30 pm", enrolled: false, lat: -33.922, lng: 150.923, suburb: "Liverpool", district: "Liverpool", rating: 4.1, ratingCount: 49, systemScore: 0 },
  { id: "r18", slug: "vellore-dhaba", nameEn: "Vellore Dhaba", nameTa: "வேலூர் தாபா", distanceKm: 0, deliveryFee: 0, prepMin: 0, open: true, registration: "", hours: "11:00 am – 9:30 pm", enrolled: false, lat: -33.778, lng: 151.121, suburb: "Epping", district: "Parramatta", rating: 4.4, ratingCount: 102, systemScore: 0 },
  { id: "r19", slug: "erode-eats", nameEn: "Erode Eats", nameTa: "ஈரோடு உணவகம்", distanceKm: 0, deliveryFee: 0, prepMin: 0, open: true, registration: "", hours: "11:00 am – 9:30 pm", enrolled: false, lat: -33.877, lng: 151.105, suburb: "Strathfield", district: "Strathfield", rating: 3.9, ratingCount: 36, systemScore: 0 },
  { id: "r20", slug: "kanyakumari-kadal", nameEn: "Kanyakumari Kadal", nameTa: "கன்னியாகுமரி கடல்", distanceKm: 0, deliveryFee: 0, prepMin: 0, open: true, registration: "", hours: "11:00 am – 9:30 pm", enrolled: false, lat: -33.869, lng: 151.207, suburb: "Sydney CBD", district: "Sydney", rating: 4.7, ratingCount: 260, systemScore: 0 },
];
for (const r of restaurants) r.distanceKm = distanceKm(HOME_POINT, r);

export type Point = { lat: number; lng: number };
export function distanceKm(a: Point, b: Point) {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 10) / 10;
}
/** Open restaurants (enrolled and not enrolled) within radiusKm of the point, nearest first. */
export function nearbyRestaurants(p: Point, radiusKm: number) {
  return restaurants
    .map((r) => ({ ...r, distanceKm: distanceKm(p, r) }))
    .filter((r) => r.open && r.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export const categoryImage: Record<Category, string> = { dosa, biryani, meals, sweets, parotta: kothu, curry: chettinad };

type Seed = [string, string, string[], Category, number, boolean, 0 | 1 | 2 | 3, string[], string, string];
const seed: Record<string, Seed[]> = {
  r1: [
    ["Masala Dosai", "மசாலா தோசை", ["dosa", "dosai", "தோசை"], "dosa", 1450, true, 1, ["mustard"], "Crisp rice crepe with spiced potato, sambar and coconut chutney.", "மொறுமொறுப்பான தோசை, உருளைக்கிழங்கு மசாலா, சாம்பார், தேங்காய் சட்னியுடன்."],
    ["Ghee Roast Dosai", "நெய் ரோஸ்ட் தோசை", ["dosa", "ghee roast"], "dosa", 1650, true, 0, ["milk"], "Paper-thin dosai roasted in ghee.", "நெய்யில் வறுத்த மெல்லிய தோசை."],
    ["Egg Kothu Parotta", "முட்டை கொத்து பரோட்டா", ["kothu", "kottu", "கொத்து", "parotta"], "parotta", 1800, false, 2, ["egg", "gluten"], "Shredded parotta tossed with egg, onion and salna on the tawa.", "முட்டை, வெங்காயம், சலணாவுடன் கொத்திய பரோட்டா."],
    ["Veg Kothu Parotta", "காய்கறி கொத்து பரோட்டா", ["kothu", "kottu", "கொத்து"], "parotta", 1600, true, 2, ["gluten"], "Kothu parotta with seasonal vegetables.", "காய்கறிகளுடன் கொத்து பரோட்டா."],
    ["Chicken Biryani", "கோழி பிரியாணி", ["biryani", "briyani", "பிரியாணி"], "biryani", 2200, false, 2, ["milk"], "Seeraga samba rice slow-cooked with chicken and spices.", "சீரக சம்பா அரிசியில் கோழிகுடன மெதுவாக வேகவைத்த பிரியாண."],
    ["Kesari", "கேசரி", ["kesari", "sweet"], "sweets", 650, true, 0, ["milk", "nuts"], "Semolina sweet with ghee and cashews.", "நெய், முந்திரியுடன் ரவை கேசரி."],
    ["Onion Uthappam", "வெங்காய ஊத்தப்பம்", ["uthappam", "dosa"], "dosa", 1500, true, 1, [], "Thick dosai topped with onion and chilli.", "வெங்காயம், மிளகாய் தூவிய ஊத்தப்பம்."],
    ["Mutton Biryani", "மட்டன் பிரியாணி", ["biryani", "briyani"], "biryani", 2700, false, 2, ["milk"], "Dindigul-style mutton biryani.", "திண்டுக்கல் பாணி மட்டன் பிரியாணி."],
  ],
  r2: [
    ["Veg Meals", "சைவ சாப்பாடு", ["meals", "thali", "சாப்பாடு"], "meals", 1900, true, 1, ["mustard"], "Rice, sambar, rasam, poriyal, kootu, appalam and curd on banana leaf.", "வாழை இலையில் சாதம், சாம்பார், ரசம், பொரியல், கூட்டு, அப்பளம், தயிர்."],
    ["Plain Dosai", "சாதா தோசை", ["dosa", "dosai"], "dosa", 1100, true, 0, [], "Classic dosai with chutney and sambar.", "சட்னி, சாம்பாருடன் தோசை."],
    ["Payasam", "பாயசம்", ["payasam", "kheer"], "sweets", 700, true, 0, ["milk", "nuts"], "Vermicelli payasam with cardamom.", "ஏலக்காய் சேமியா பாயசம்."],
    ["Mysore Pak", "மைசூர் பாக்", ["mysore pak", "sweet"], "sweets", 800, true, 0, ["milk"], "Melt-in-the-mouth gram flour and ghee sweet.", "நெய், கடலை மாவு இனிப்பு."],
    ["Lemon Rice", "எலுமிச்சை சாதம்", ["lemon rice", "chitranna"], "meals", 1200, true, 1, ["peanuts"], "Tangy rice with peanuts and curry leaves.", "வேர்க்கடலை, கறிவேப்பிலையுடன் எலுமிச்சை சாதம்."],
    ["Curd Rice", "தயிர் சாதம்", ["curd rice", "thayir"], "meals", 1000, true, 0, ["milk"], "Cool curd rice with pomegranate and pickle.", "மாதுளை, ஊறுகாயுடன் தயிர் சாதம்."],
    ["Rava Dosai", "ரவா தோசை", ["dosa", "rava"], "dosa", 1400, true, 1, ["gluten"], "Lacy semolina dosai with onion.", "வெங்காயத்துடன் ரவா தோசை."],
    ["Vathal Kuzhambu", "வத்தல் குழம்பு", ["kuzhambu", "curry"], "curry", 1300, true, 2, [], "Tamarind curry with sun-dried berries.", "சுண்டைக்காய் வத்தல் புளிக் குழம்பு."],
  ],
  r3: [
    ["Chettinad Chicken Curry", "செட்டிநாடு கோழி குழம்பு", ["chettinad", "chicken curry", "குழம்பு"], "curry", 2400, false, 3, [], "Fiery chicken curry with freshly ground Chettinad masala.", "புதிதாக அரைத்த செட்டிநாடு மசாலாவுடன் காரமான கோழி குழம்பு."],
    ["Pepper Mutton", "மிளகு மட்டன்", ["pepper mutton", "milagu"], "curry", 2800, false, 3, [], "Dry mutton roast with black pepper.", "கருமிளகு மட்டன் வறுவல்."],
    ["Chettinad Biryani", "செட்டிநாடு பிரியாணி", ["biryani", "briyani"], "biryani", 2500, false, 3, ["milk"], "Spicy Chettinad-style chicken biryani.", "காரமான செட்டிநாடு கோழி பிரியாணி."],
    ["Kaalan Pepper Fry", "காளான் மிளகு வறுவல்", ["mushroom", "kaalan"], "curry", 1800, true, 2, [], "Mushroom tossed with pepper and curry leaves.", "மிளகு, கறிவேப்பிலையுடன் காளான்."],
    ["Fish Kuzhambu", "மீன் குழம்பு", ["fish curry", "meen"], "curry", 2600, false, 2, ["fish"], "Tamarind fish curry, village style.", "கிராமத்து புளி மீன் குழம்பு."],
    ["Bun Parotta", "பன் பரோட்டா", ["parotta", "porotta"], "parotta", 1400, true, 1, ["gluten", "milk"], "Fluffy layered parotta with salna.", "சலணாவுடன் மிருதுவான பன் பரோட்டா."],
    ["Kavuni Arisi", "கவுனி அரிசி", ["kavuni", "sweet"], "sweets", 900, true, 0, ["nuts"], "Black rice sweet with coconut.", "தேங்காயுடன் கவுனி அரிசி இனிப்பு."],
    ["Non-veg Meals", "அசைவ சாப்பாடு", ["meals", "thali"], "meals", 2600, false, 2, ["fish"], "Rice with chicken, mutton and fish gravies.", "கோழி, மட்டன், மீன் குழம்புகளுடன் சாதம்."],
  ],
  r4: [
    ["Jigarthanda", "ஜிகர்தண்டா", ["jigarthanda", "sweet"], "sweets", 850, true, 0, ["milk"], "Madurai's famous cold milk drink.", "மதுரையின் புகழ்பெற்ற குளிர் பானம்."],
    ["Kari Dosai", "கறி தோசை", ["dosa", "kari"], "dosa", 2000, false, 2, ["egg"], "Dosai layered with egg and minced mutton.", "முட்டை, கொத்துக்கறியுடன் தோசை."],
    ["Chicken Kothu Parotta", "கோழி கொத்து பரோட்டா", ["kothu", "kottu", "கொத்து"], "parotta", 2000, false, 2, ["egg", "gluten"], "Kothu parotta with chicken salna.", "கோழி சலணாவுடன் கொத்து பரோட்டா."],
    ["Mutton Chukka", "மட்டன் சுக்கா", ["chukka", "mutton"], "curry", 2700, false, 3, [], "Dry spiced mutton.", "காரமான மட்டன் சுக்கா."],
    ["Veg Biryani", "காய்கறி பிரியாணி", ["biryani"], "biryani", 1800, true, 1, ["milk"], "Seeraga samba vegetable biryani.", "சீரக சம்பா காய்கறி பிரியாணி."],
    ["Mini Meals", "மினி சாப்பாடு", ["meals"], "meals", 1500, true, 1, [], "A lighter meals plate.", "சிறிய சாப்பாடு."],
    ["Idiyappam", "இடியாப்பம்", ["idiyappam", "string hoppers"], "dosa", 1200, true, 0, [], "String hoppers with coconut milk.", "தேங்காய்ப் பாலுடன் இடியாப்பம்."],
    ["Paruthi Paal", "பருத்திப் பால்", ["paruthi"], "sweets", 700, true, 0, ["milk"], "Warm cottonseed milk sweet drink.", "சூடான பருத்திப் பால்."],
  ],
};

export const dishes: Dish[] = Object.entries(seed).flatMap(([rid, list]) =>
  list.map(([nameEn, nameTa, aliases, category, price, veg, spice, allergens, descEn, descTa], i) => ({
    id: `${rid}-d${i + 1}`, restaurantId: rid, nameEn, nameTa, aliases, category, price, veg, spice, allergens, descEn, descTa,
    available: !(rid === "r2" && i === 3),
    prepMin: restaurants.find((r) => r.id === rid)!.prepMin + (i % 3) * 5,
    orders: 400 - i * 37 + rid.charCodeAt(1) * 3,
    rating: Math.round((4.9 - ((i * 7 + rid.charCodeAt(1)) % 9) * 0.1) * 10) / 10,
    ratingCount: 20 + ((i * 53 + rid.charCodeAt(1) * 11) % 180),
  })),
);

export const getRestaurant = (id: string) => restaurants.find((r) => r.id === id);
export const getDish = (id: string) => dishes.find((d) => d.id === id);
export const dishImage = (d: Dish) => categoryImage[d.category];

export function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", currencyDisplay: "narrowSymbol" }).format(cents / 100);
}

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{M}\p{N}]+/gu, "");
export function searchDishes(q: string) {
  const n = norm(q);
  if (!n) return dishes;
  return dishes.filter((d) => [d.nameEn, d.nameTa, ...d.aliases].some((s) => norm(s).includes(n)));
}

export const ALLERGEN_TA: Record<string, string> = {
  milk: "பால்", egg: "முட்டை", gluten: "கோதுமை (குளூட்டன்)", nuts: "கொட்டைகள்", peanuts: "வேர்க்கடலை", fish: "மீன்", mustard: "கடுகு",
};

/** Kitchen score: average of customer rating and system score; whichever exists if only one. */
export function kitchenScore(r: Pick<Restaurant, "rating" | "systemScore">) {
  const parts = [r.rating, r.systemScore].filter((n) => n > 0);
  return parts.length ? parts.reduce((a, b) => a + b, 0) / parts.length : 0;
}
export function topKitchens<T extends Restaurant>(list: T[], n = 15) {
  return [...list].sort((a, b) => kitchenScore(b) - kitchenScore(a) || a.distanceKm - b.distanceKm).slice(0, n);
}
/** Popular and high-rated dishes from the given kitchens (orders weighted by stars). */
export function cravingDishes(restaurantIds: Set<string>, n = 12, category?: Category) {
  return dishes
    .filter((d) => d.available && restaurantIds.has(d.restaurantId) && (!category || d.category === category))
    .sort((a, b) => b.orders * b.rating - a.orders * a.rating)
    .slice(0, n);
}
/** Restaurants whose suburb or district matches a typed place name (any distance, open or closed). */
export function restaurantsInPlace(q: string) {
  const n = norm(q);
  if (n.length < 3) return [];
  return topKitchens(restaurants.filter((r) => [r.suburb, r.district].some((p) => norm(p).includes(n))), 100);
}

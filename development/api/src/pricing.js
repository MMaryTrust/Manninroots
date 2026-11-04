// Server-side pricing. The browser never decides a price or a fee.
// AUD is rounded to the nearest $0.50; audPer100 = AUD per Rs 100.
export const toLocal = (inr, region, audPer100) => (region === 'IN' ? inr : Math.round((inr * Number(audPer100)) / 50) / 2);
export const planTotal = (p) => Math.round((p.days * p.rate) / 100) * 100;

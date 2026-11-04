import { planTotal } from '../pricing.js';

export default async function (app) {
  const { db } = app;

  app.get('/plans', async () => {
    const { rows } = await db.query('select * from plans order by position');
    return rows.map((p) => ({
      id: p.id, name: p.name, nameTa: p.name_ta, days: p.days, rate: p.rate, note: p.note, noteTa: p.note_ta,
      total: planTotal(p), saving: 100 * p.days - planTotal(p),
    }));
  });

  app.get('/menu', async () => {
    const { rows } = await db.query("select * from dishes order by array_position(array['Breakfast','Lunch','Dinner'], slot), name");
    return rows.map((d) => ({
      id: d.id, name: d.name, nameTa: d.name_ta, slot: d.slot, gi: d.gi, tags: d.tags,
      kcal: d.kcal, protein: d.protein, carbs: d.carbs, fat: d.fat, allergens: d.allergens, fssai: d.fssai,
    }));
  });
}

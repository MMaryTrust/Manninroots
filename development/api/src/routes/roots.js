import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { toLocal } from '../pricing.js';

const NEXT = { New: 'Preparing', Preparing: 'Out for delivery', 'Out for delivery': 'Delivered' };
const STAFF = ['owner', 'admin', 'manager', 'kitchen', 'rider'];
const Order = z.object({
  phone: z.string().regex(/^[0-9]{10}$/, 'Invalid phone number'),
  region: z.enum(['IN', 'AU']),
  items: z.array(z.object({ dishId: z.string().uuid(), qty: z.number().int().min(1).max(20) })).min(1).max(60),
  token: z.string().regex(/^[0-9]{5}$/).optional(),
});
const orderOut = (o) => ({
  id: o.id, orderNo: o.order_no, batch: o.batch, restaurantId: o.restaurant_id, restaurant: o.restaurant, items: o.items,
  itemTotal: Number(o.item_total), fee: Number(o.fee), region: o.region, phone: o.phone, payment: o.payment, status: o.status, createdAt: o.created_at,
});

export default async function (app) {
  const { db } = app;

  app.get('/catalog', async () => {
    const [{ rows: rs }, { rows: ds }, { rows: st }] = await Promise.all([
      db.query("select * from roots.restaurants where status = 'active' order by rating desc, name"),
      db.query("select d.* from roots.dishes d join roots.restaurants r on r.id = d.restaurant_id and r.status = 'active' order by d.rating desc, d.name"),
      db.query('select * from roots.settings where id = 1'),
    ]);
    const s = st[0];
    return {
      settings: { feeIn: s.fee_in, feeAu: s.fee_au, audPer100: s.aud_per_100 == null ? null : Number(s.aud_per_100) },
      restaurants: rs.map((r) => ({
        id: r.id, name: r.name, nameTa: r.name_ta, cuisine: r.cuisine, area: r.area, rating: Number(r.rating),
        dishes: ds.filter((d) => d.restaurant_id === r.id).map((d) => ({
          id: d.id, name: d.name, priceInr: d.price_inr, cuisine: d.cuisine, tags: d.tags, rating: Number(d.rating),
        })),
      })),
    };
  });

  // The only way to create orders. Prices, fee, 3-restaurant cap and token are all checked here.
  app.post('/orders', { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, async (req, reply) => {
    const p = Order.safeParse(req.body);
    if (!p.success) return reply.code(400).send({ error: p.error.issues[0]?.message || 'Invalid order' });
    const { phone, region, items, token } = p.data;

    let failedToken = false;
    const out = await db.tx(async (q) => {
      const { rows: [s] } = await q.query('select * from roots.settings where id = 1');
      if (region === 'AU' && s.aud_per_100 == null) return { code: 409, error: 'Australian ordering is paused until prices are set' };

      const ids = items.map((i) => i.dishId);
      const { rows: dishes } = await q.query(
        `select d.id, d.name, d.price_inr, d.restaurant_id from roots.dishes d
         join roots.restaurants r on r.id = d.restaurant_id and r.status = 'active' where d.id = any($1::uuid[])`, [ids]);
      const byId = new Map(dishes.map((d) => [d.id, d]));
      if (new Set(ids).size !== ids.length || ids.some((i) => !byId.has(i))) return { code: 409, error: 'Some dishes are no longer available' };
      const restIds = [...new Set(dishes.map((d) => d.restaurant_id))].sort();
      if (restIds.length > 3) return { code: 422, error: 'A cart can hold dishes from at most 3 restaurants' };

      // registered customers must present their saved 5-digit token; guests pay on delivery
      const { rows: [u] } = await q.query("select pay_token_hash from users where status = 'active' and (phone = $1 or phone2 = $1) limit 1", [phone]);
      if (u) {
        const { rows: [{ n }] } = await q.query("select count(*)::int n from roots.token_attempts where phone = $1 and at > now() - interval '1 hour'", [phone]);
        if (n >= 5) return { code: 429, error: 'Too many wrong codes. Try again in an hour.' };
        if (!u.pay_token_hash || !token || !(await bcrypt.compare(token, u.pay_token_hash))) {
          failedToken = true;
          return { code: 401, error: 'Payment token does not match' };
        }
      }

      const { rows: [{ b }] } = await q.query('select gen_random_uuid() b');
      // IST timestamp + 4 hex chars of the batch id, so two checkouts in the same second never share an order number
      const prefix = 'M' + new Date(Date.now() + 5.5 * 3600e3).toISOString().replace(/\D/g, '').slice(2, 14) + b.slice(0, 4).toUpperCase();
      const nos = [];
      for (const [idx, rid] of restIds.entries()) {
        const lines = items.filter((i) => byId.get(i.dishId).restaurant_id === rid).map((i) => {
          const d = byId.get(i.dishId);
          return { dish_id: d.id, name: d.name, qty: i.qty, price: toLocal(d.price_inr, region, s.aud_per_100) };
        });
        const total = lines.reduce((a, l) => a + l.qty * l.price, 0);
        const fee = idx === 0 ? (region === 'IN' ? s.fee_in : s.fee_au) : 0; // flat fee once, on the first receipt
        const no = `${prefix}-${String.fromCharCode(65 + idx)}`;
        await q.query(
          `insert into roots.orders(order_no, batch, restaurant_id, items, item_total, fee, region, phone, payment)
           values ($1,$2,$3,$4::jsonb,$5,$6,$7,$8,$9)`,
          [no, b, rid, JSON.stringify(lines), total, fee, region, phone, u ? 'Saved token' : 'On delivery']);
        nos.push(no);
      }
      await q.query("insert into notifications(roles, text, link) values ('{kitchen,rider,manager}', $1, '/roots/orders')",
        [`New Mannin Roots order ${prefix}: ${nos.length} kitchen receipt(s)`]);
      return { batch: b, orders: nos };
    }).catch((e) => {
      req.log.error(e);
      return { code: 500, error: 'Could not place the order' };
    });

    // record the wrong guess outside the (rolled-back-free) checkout so the lockout counts it
    if (failedToken) await db.query('insert into roots.token_attempts(phone) values ($1)', [phone]);
    if (out.error) return reply.code(out.code).send({ error: out.error });
    return reply.code(201).send(out);
  });

  const select = 'select o.*, r.name restaurant from roots.orders o join roots.restaurants r on r.id = o.restaurant_id';

  // guests read back only their own checkout batches (random, unguessable ids)
  app.get('/orders', async (req) => {
    const batches = String(req.query.batches || '').split(',').filter((x) => /^[0-9a-f-]{36}$/i.test(x)).slice(0, 50);
    if (!batches.length) return [];
    const { rows } = await db.query(`${select} where o.batch = any($1::uuid[]) order by o.created_at desc`, [batches]);
    return rows.map(orderOut);
  });

  app.get('/orders/all', { preHandler: app.requireRole(...STAFF) }, async () => {
    const { rows } = await db.query(`${select} order by o.created_at desc limit 200`);
    return rows.map(orderOut);
  });

  // orders only move forward: New -> Preparing -> Out for delivery -> Delivered
  app.patch('/orders/:id/advance', { preHandler: app.requireRole(...STAFF) }, async (req, reply) => {
    if (!/^[0-9a-f-]{36}$/i.test(req.params.id)) return reply.code(404).send({ error: 'Order not found' });
    const { rows: [o] } = await db.query('select * from roots.orders where id = $1', [req.params.id]);
    if (!o) return reply.code(404).send({ error: 'Order not found' });
    const next = NEXT[o.status];
    if (!next) return reply.code(409).send({ error: 'Order is already delivered' });
    await db.query('update roots.orders set status = $1 where id = $2', [next, o.id]);
    await db.query('insert into audit_log(actor, action, detail) values ($1,$2,$3)', [req.user.sub, 'Roots order advanced', `${o.order_no}: ${o.status} -> ${next}`]);
    return { id: o.id, status: next };
  });
}

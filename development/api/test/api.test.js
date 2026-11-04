import test from 'node:test';
import assert from 'node:assert/strict';
import { connect, migrate } from '../src/db.js';
import { seed } from '../src/seed.js';
import { buildApp } from '../src/app.js';

const PW = 'Test-pass-123';
const db = await connect(''); // PGlite
await migrate(db);
await migrate(db); // idempotent
await seed(db, { password: PW });
const app = await buildApp({ db, jwtSecret: 'test-secret' });
test.after(async () => { await app.close(); await db.close(); });

const inject = (method, url, payload, cookie) => app.inject({ method, url, payload, headers: cookie ? { cookie } : {} });
const login = async (email) => {
  const r = await inject('POST', '/api/auth/login', { email, password: PW });
  return { r, cookie: (r.headers['set-cookie'] || '').split(';')[0] };
};
const catalog = async () => (await inject('GET', '/api/roots/catalog')).json();

test('health and plan totals match the prototype', async () => {
  assert.equal((await inject('GET', '/api/health')).json().ok, true);
  const plans = (await inject('GET', '/api/plans')).json();
  assert.deepEqual(plans.map((p) => p.total), [700, 2700, 7200, 13500, 23700]);
  assert.equal((await inject('GET', '/api/menu')).json().length, 10);
});

test('login: good, wrong password, unknown email give right codes and no leak', async () => {
  assert.equal((await login('admin@mannin.test')).r.statusCode, 200);
  const bad = await inject('POST', '/api/auth/login', { email: 'admin@mannin.test', password: 'nope' });
  const unk = await inject('POST', '/api/auth/login', { email: 'ghost@mannin.test', password: 'nope' });
  assert.equal(bad.statusCode, 401);
  assert.equal(bad.body, unk.body);
  const { cookie } = await login('admin@mannin.test');
  const me = (await inject('GET', '/api/auth/me', undefined, cookie)).json();
  assert.equal(me.user.role, 'admin');
  assert.equal(JSON.stringify(me).includes('password'), false);
  assert.equal((await inject('GET', '/api/auth/me')).statusCode, 401);
});

test('suspended account cannot sign in', async () => {
  await db.query("update users set status='suspended' where email='rider@mannin.test'");
  assert.equal((await login('rider@mannin.test')).r.statusCode, 403);
  await db.query("update users set status='active' where email='rider@mannin.test'");
});

test('Roots: guest order splits per restaurant, flat Rs 50 fee once, server prices', async () => {
  const { restaurants } = await catalog();
  const items = restaurants.slice(0, 3).map((r) => ({ dishId: r.dishes[0].id, qty: 2 }));
  const r = await inject('POST', '/api/roots/orders', { phone: '9000000001', region: 'IN', items });
  assert.equal(r.statusCode, 201);
  const { batch, orders } = r.json();
  assert.equal(orders.length, 3);
  const mine = (await inject('GET', `/api/roots/orders?batches=${batch}`)).json();
  assert.equal(mine.length, 3);
  assert.deepEqual(mine.map((o) => o.fee).sort(), [0, 0, 50]);
  assert.ok(mine.every((o) => o.payment === 'On delivery'));
  assert.equal((await inject('GET', '/api/roots/orders?batches=00000000-0000-0000-0000-000000000000')).json().length, 0);
});

test('Roots: 4th restaurant refused, unknown dish refused, bad phone refused', async () => {
  const { restaurants } = await catalog();
  const four = restaurants.slice(0, 4).map((r) => ({ dishId: r.dishes[0].id, qty: 1 }));
  assert.equal((await inject('POST', '/api/roots/orders', { phone: '9000000002', region: 'IN', items: four })).statusCode, 422);
  const fake = [{ dishId: '11111111-1111-4111-8111-111111111111', qty: 1 }];
  assert.equal((await inject('POST', '/api/roots/orders', { phone: '9000000002', region: 'IN', items: fake })).statusCode, 409);
  assert.equal((await inject('POST', '/api/roots/orders', { phone: '123', region: 'IN', items: four.slice(0, 1) })).statusCode, 400);
});

test('Roots: registered number needs the right token; 5 wrong guesses lock out', async () => {
  const { restaurants } = await catalog();
  const items = [{ dishId: restaurants[0].dishes[0].id, qty: 1 }];
  const phone = '9840011122';
  assert.equal((await inject('POST', '/api/roots/orders', { phone, region: 'IN', items })).statusCode, 401);
  const ok = await inject('POST', '/api/roots/orders', { phone, region: 'IN', items, token: '48213' });
  assert.equal(ok.statusCode, 201);
  const o = (await inject('GET', `/api/roots/orders?batches=${ok.json().batch}`)).json()[0];
  assert.equal(o.payment, 'Saved token');
  for (let i = 0; i < 4; i++) await inject('POST', '/api/roots/orders', { phone, region: 'IN', items, token: '00000' });
  assert.equal((await inject('POST', '/api/roots/orders', { phone, region: 'IN', items, token: '48213' })).statusCode, 429);
});

test('Roots: AU paused until a rate is set, then $0.50 rounding and $10 fee', async () => {
  const { restaurants } = await catalog();
  const d = restaurants[0].dishes.find((x) => x.priceInr === 90); // Ghee Pongal
  const items = [{ dishId: d.id, qty: 1 }];
  assert.equal((await inject('POST', '/api/roots/orders', { phone: '9000000003', region: 'AU', items })).statusCode, 409);
  await db.query('update roots.settings set aud_per_100 = 1.80');
  const r = await inject('POST', '/api/roots/orders', { phone: '9000000003', region: 'AU', items });
  assert.equal(r.statusCode, 201);
  const [o] = (await inject('GET', `/api/roots/orders?batches=${r.json().batch}`)).json();
  assert.equal(o.itemTotal, 1.5); // 90 * 1.80 / 100 = 1.62 -> nearest 0.50
  assert.equal(o.fee, 10);
});

test('Roots: staff orders need a staff role and only advance forward', async () => {
  assert.equal((await inject('GET', '/api/roots/orders/all')).statusCode, 401);
  const cust = await login('customer@mannin.test');
  assert.equal((await inject('GET', '/api/roots/orders/all', undefined, cust.cookie)).statusCode, 403);
  const kitchen = await login('kitchen@mannin.test');
  const all = (await inject('GET', '/api/roots/orders/all', undefined, kitchen.cookie)).json();
  assert.ok(all.length > 0);
  const id = all.find((o) => o.status === 'New').id;
  const seen = [];
  for (let i = 0; i < 4; i++) {
    const r = await inject('PATCH', `/api/roots/orders/${id}/advance`, undefined, kitchen.cookie);
    seen.push(r.statusCode === 200 ? r.json().status : r.statusCode);
  }
  assert.deepEqual(seen, ['Preparing', 'Out for delivery', 'Delivered', 409]);
});

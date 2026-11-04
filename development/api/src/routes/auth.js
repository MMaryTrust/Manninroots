import bcrypt from 'bcryptjs';
import { z } from 'zod';

const Login = z.object({ email: z.string().email(), password: z.string().min(1).max(200) });
const Change = z.object({ password: z.string().min(8).max(200) });
const pub = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, mustChange: u.must_change, financeAdmin: u.finance_admin });

export default async function (app) {
  const { db } = app;
  const cookieOpts = { path: '/', httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 12 * 3600 };

  app.post('/login', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (req, reply) => {
    const p = Login.safeParse(req.body);
    if (!p.success) return reply.code(400).send({ error: 'Enter your email and password' });
    const { rows } = await db.query('select * from users where lower(email) = lower($1)', [p.data.email]);
    const u = rows[0];
    // same message for unknown email and wrong password
    if (!u || !(await bcrypt.compare(p.data.password, u.password_hash))) return reply.code(401).send({ error: 'Email or password is incorrect' });
    if (u.status !== 'active') return reply.code(403).send({ error: 'This account is suspended' });
    await db.query('insert into audit_log(actor, action, detail) values ($1,$2,$3)', [u.email, 'Sign in', u.role]);
    reply.setCookie('mannin_token', app.jwt.sign({ sub: u.id, role: u.role, fin: u.finance_admin }), cookieOpts);
    return { user: pub(u) };
  });

  app.get('/me', { preHandler: app.auth }, async (req, reply) => {
    const { rows } = await db.query('select * from users where id = $1', [req.user.sub]);
    if (!rows[0] || rows[0].status !== 'active') return reply.code(401).send({ error: 'Sign in required' });
    return { user: pub(rows[0]) };
  });

  app.post('/logout', async (_req, reply) => {
    reply.clearCookie('mannin_token', { path: '/' });
    return { ok: true };
  });

  app.post('/change-password', { preHandler: app.auth }, async (req, reply) => {
    const p = Change.safeParse(req.body);
    if (!p.success) return reply.code(400).send({ error: 'Password must be at least 8 characters' });
    await db.query('update users set password_hash = $1, must_change = false where id = $2', [await bcrypt.hash(p.data.password, 10), req.user.sub]);
    return { ok: true };
  });
}

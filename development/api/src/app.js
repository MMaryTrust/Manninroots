import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import authRoutes from './routes/auth.js';
import publicRoutes from './routes/public.js';
import rootsRoutes from './routes/roots.js';
import adminRoutes from './routes/admin.js';

export async function buildApp({ db, jwtSecret = process.env.JWT_SECRET, logger = false } = {}) {
  if (!jwtSecret) throw new Error('JWT_SECRET is required');
  const app = Fastify({ logger });
  app.decorate('db', db);
  await app.register(cors, { origin: (process.env.WEB_ORIGIN || 'http://localhost:5174').split(','), credentials: true });
  await app.register(cookie);
  await app.register(jwt, { secret: jwtSecret, cookie: { cookieName: 'mannin_token', signed: false }, sign: { expiresIn: '12h' } });
  await app.register(rateLimit, { global: false });

  app.decorate('auth', async (req, reply) => {
    try {
      await req.jwtVerify();
    } catch {
      return reply.code(401).send({ error: 'Sign in required' });
    }
  });
  app.decorate('requireRole', (...roles) => async (req, reply) => {
    await app.auth(req, reply);
    if (reply.sent) return;
    if (!roles.includes(req.user.role)) return reply.code(403).send({ error: 'Not allowed for your role' });
  });

  app.get('/api/health', async () => ({ ok: true, db: db.kind }));
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(publicRoutes, { prefix: '/api' });
  await app.register(rootsRoutes, { prefix: '/api/roots' });
  await app.register(adminRoutes, { prefix: '/api/admin' });
  return app;
}

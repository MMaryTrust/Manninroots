import { connect, migrate } from '../src/db.js';
import { seed } from '../src/seed.js';

if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL (see api/.env.example)');
if (!process.env.SEED_PASSWORD) throw new Error('Set SEED_PASSWORD: the password for all demo logins');
const db = await connect();
await migrate(db);
await seed(db);
console.log('Seeded plans, menu, Roots restaurants and demo logins.');
await db.close();

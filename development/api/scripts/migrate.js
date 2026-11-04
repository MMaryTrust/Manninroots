import { connect, migrate } from '../src/db.js';

if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL (see api/.env.example)');
const db = await connect();
await migrate(db);
console.log('Schema applied.');
await db.close();

import { connect, migrate } from './db.js';
import { buildApp } from './app.js';
import { seed } from './seed.js';

const db = await connect();
if (process.env.AUTO_MIGRATE !== '0') await migrate(db);
// DEV_SEED=1 loads the demo data (needs SEED_PASSWORD). Intended for PGlite / a fresh dev database.
if (process.env.DEV_SEED === '1') await seed(db);
const app = await buildApp({ db, logger: true });
const port = Number(process.env.PORT || 3001);
await app.listen({ port, host: '127.0.0.1' });
app.log.info(`Mannin API on http://127.0.0.1:${port} (${db.kind})`);

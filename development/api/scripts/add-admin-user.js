// Script to add a new admin user to the database
// Usage: SEED_PASSWORD=admin123 node --env-file=.env scripts/add-admin-user.js

import { connect, migrate } from '../src/db.js';
import bcrypt from 'bcryptjs';

const EMAIL = 'admin@manninsuvai.com';
const NAME = 'Mannin Admin';
const PASSWORD = 'admin123';

async function addAdmin() {
  const db = await connect();
  try {
    await migrate(db);
    const hash = await bcrypt.hash(PASSWORD, 10);

    const { rows } = await db.query(
      `insert into users(name, email, password_hash, role, status)
       values ($1, $2, $3, $4, $5)
       on conflict (email) do update
       set password_hash = $3, role = $4, status = $5
       returning id, name, email, role`,
      [NAME, EMAIL, hash, 'admin', 'active']
    );

    console.log('✅ Admin user created/updated successfully:');
    console.log(JSON.stringify(rows[0], null, 2));
    console.log(`\nLogin credentials:`);
    console.log(`Email: ${EMAIL}`);
    console.log(`Password: ${PASSWORD}`);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    if (db.close) await db.close();
  }
}

addAdmin();

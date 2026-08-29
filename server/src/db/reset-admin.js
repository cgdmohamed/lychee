// Force-sets the admin login to the current SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD env vars,
// creating the account if it doesn't exist yet or updating its password if it does. Unlike
// seed.js (which only creates the admin once and never touches it again, so self-service
// password changes made from the admin UI survive container restarts), this is an explicit,
// manual reset for when you're locked out — e.g. a stale/duplicate row from an earlier deploy
// attempt. Run it with: node src/db/reset-admin.js (or `npm run reset-admin`).
import bcrypt from 'bcryptjs';
import { db } from './index.js';

const adminEmail = (process.env.SEED_ADMIN_EMAIL || 'admin@lycheesaudi.com').trim().toLowerCase();
const adminPassword = (process.env.SEED_ADMIN_PASSWORD || 'lychee-admin-2026').trim();

const hash = bcrypt.hashSync(adminPassword, 10);
const existing = db.prepare('SELECT id FROM admin_users WHERE email = ?').get(adminEmail);

if (existing) {
  db.prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?').run(hash, existing.id);
  console.log(`Reset password for existing admin ${adminEmail}.`);
} else {
  db.prepare('INSERT INTO admin_users (email, password_hash) VALUES (?, ?)').run(adminEmail, hash);
  console.log(`Created admin user ${adminEmail}.`);
}

const allAdmins = db.prepare('SELECT id, email, created_at FROM admin_users').all();
console.log('All admin accounts currently in the database:');
console.table(allAdmins);

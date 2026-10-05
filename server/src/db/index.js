import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = process.env.DB_PATH || path.join(dataDir, 'lychee.db');
export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
db.exec(schema);

// CREATE TABLE IF NOT EXISTS above only covers brand-new databases — an already-deployed
// items table needs its new column added explicitly. Guarded by table_info so this is a
// no-op (not an error) once the column exists.
const itemColumns = db.prepare("PRAGMA table_info(items)").all().map(c => c.name);
if (!itemColumns.includes('nutrition_enabled')) {
  db.exec('ALTER TABLE items ADD COLUMN nutrition_enabled INTEGER NOT NULL DEFAULT 1');
}

// The social links were hardcoded in the client until the admin-editable settings
// were added. Seed them once (INSERT OR IGNORE — a no-op once the row exists) so an
// already-deployed site keeps showing its current footer links by default, instead of
// them silently disappearing the moment this code ships, while still letting the admin
// blank a field afterwards to genuinely hide that platform.
const seedSettingDefault = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
seedSettingDefault.run('social_instagram', 'https://www.instagram.com/lycheesaudi');
seedSettingDefault.run('social_tiktok', 'https://www.tiktok.com/@lycheesaudi');
seedSettingDefault.run('social_snapchat', 'https://www.snapchat.com/add/lycheesaudi');

// brand_name was a single shared-language field before it became brand_name_en/brand_name_ar.
// Carry over whatever an admin had already typed into both, rather than silently reverting
// to the shipped defaults; INSERT OR IGNORE means this only ever has an effect once.
const oldBrandName = db.prepare("SELECT value FROM settings WHERE key = 'brand_name'").get();
if (oldBrandName && oldBrandName.value) {
  seedSettingDefault.run('brand_name_en', oldBrandName.value);
  seedSettingDefault.run('brand_name_ar', oldBrandName.value);
}

// Before named per-branch/ad QR codes existed, the single generated QR always pointed
// at ?src=qr. Seed it as a "General" entry so an already-printed sticker keeps
// attributing its scans to a named row instead of losing attribution the moment this
// ships; INSERT OR IGNORE means this only ever has an effect once.
db.prepare('INSERT OR IGNORE INTO qr_codes (label, slug) VALUES (?, ?)').run('General', 'qr');

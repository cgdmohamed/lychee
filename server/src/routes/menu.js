import { Router } from 'express';
import { getFullMenu } from '../db/serialize.js';
import { db } from '../db/index.js';

const router = Router();

router.get('/', (req, res) => {
  const settingsRows = db.prepare('SELECT key, value FROM settings').all();
  const settings = Object.fromEntries(settingsRows.map(r => [r.key, r.value]));
  res.json({ categories: getFullMenu(), settings });
});

export default router;

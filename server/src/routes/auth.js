import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';
import { signToken, requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  const admin = db.prepare('SELECT * FROM admin_users WHERE email = ?').get(email);
  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(401).json({ error: 'invalid credentials' });
  }
  res.json({ token: signToken(admin), email: admin.email });
});

router.post('/change-password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'currentPassword and newPassword (min 8 chars) required' });
  }
  const admin = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(req.admin.sub);
  if (!admin || !bcrypt.compareSync(currentPassword, admin.password_hash)) {
    return res.status(401).json({ error: 'current password incorrect' });
  }
  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?').run(hash, admin.id);
  res.json({ ok: true });
});

export default router;

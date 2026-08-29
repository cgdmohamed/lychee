import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { db } from '../db/index.js';
import { signToken, requireAuth } from '../middleware/auth.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too many attempts — try again in a few minutes' },
});

// Compared against when no account matches, so bcrypt always runs and a wrong
// email can't be distinguished from a wrong password by response time.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

router.post('/login', authLimiter, (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  const normalizedEmail = email.trim().toLowerCase();
  const admin = db.prepare('SELECT * FROM admin_users WHERE email = ?').get(normalizedEmail);
  const passwordMatches = bcrypt.compareSync(password, admin ? admin.password_hash : DUMMY_HASH);
  if (!admin || !passwordMatches) {
    return res.status(401).json({ error: 'invalid credentials' });
  }
  res.json({ token: signToken(admin), email: admin.email });
});

router.post('/change-password', authLimiter, requireAuth, (req, res) => {
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

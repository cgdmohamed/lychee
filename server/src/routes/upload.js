import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { requireAuth } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

// SVG deliberately excluded: it can embed <script>, which executes if the uploaded
// file is opened directly in a browser tab — stored XSS via an otherwise-ordinary
// "photo" upload field.
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const EXT_BY_TYPE = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = EXT_BY_TYPE[file.mimetype] || path.extname(file.originalname) || '';
    cb(null, crypto.randomUUID() + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.has(file.mimetype)) {
      const err = new Error('unsupported file type — use JPEG, PNG, WebP, or GIF');
      err.status = 400;
      return cb(err);
    }
    cb(null, true);
  },
});

const router = Router();

router.post('/', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no file uploaded' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

// eslint-disable-next-line no-unused-vars
router.use((err, req, res, next) => {
  // Multer's own errors (LIMIT_FILE_SIZE, etc.) and the fileFilter rejection above
  // are both client input problems, not server failures.
  res.status(err.status || 400).json({ error: err.message || 'upload failed' });
});

export default router;

import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { requireAuth } from '../middleware/auth.js';
import { compressToWebp } from '../lib/image.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

// SVG deliberately excluded: it can embed <script>, which executes if the uploaded
// file is opened directly in a browser tab — stored XSS via an otherwise-ordinary
// "photo" upload field.
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
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

router.post('/', requireAuth, upload.single('image'), async (req, res, next) => {
  if (!req.file) return res.status(400).json({ error: 'no file uploaded' });
  try {
    const webp = await compressToWebp(req.file.buffer, req.file.mimetype === 'image/gif' ? 'gif' : undefined);
    const filename = `${crypto.randomUUID()}.webp`;
    await fs.promises.writeFile(path.join(uploadsDir, filename), webp);
    res.json({ url: `/uploads/${filename}` });
  } catch (err) {
    next(err);
  }
});

// eslint-disable-next-line no-unused-vars
router.use((err, req, res, next) => {
  // Multer's own errors (LIMIT_FILE_SIZE, etc.), the fileFilter rejection above, and
  // a malformed image sharp can't decode are all client input problems, not server
  // failures.
  res.status(err.status || 400).json({ error: err.message || 'upload failed' });
});

export default router;

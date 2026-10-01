import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { db } from '../db/index.js';

const EVENT_TYPES = new Set(['page_view', 'item_view', 'whatsapp_click']);

// Generous enough for a real visitor browsing the menu (one event per item they open),
// tight enough to block trivial scripted abuse of an endpoint that's deliberately public.
const eventLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too many events' },
});

const insertEvent = db.prepare(
  'INSERT INTO analytics_events (type, item_id, category_id, source) VALUES (?, ?, ?, ?)'
);

function toNullableInt(value) {
  return Number.isFinite(value) ? Math.trunc(value) : null;
}

const router = Router();

router.post('/event', eventLimiter, (req, res) => {
  const { type, itemId, categoryId, source } = req.body || {};
  if (!EVENT_TYPES.has(type)) return res.status(400).json({ error: 'invalid event type' });

  insertEvent.run(
    type,
    toNullableInt(itemId),
    toNullableInt(categoryId),
    typeof source === 'string' ? source.slice(0, 40) : null
  );
  res.status(204).end();
});

export default router;

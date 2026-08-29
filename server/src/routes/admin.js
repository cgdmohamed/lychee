import { Router } from 'express';
import { db } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { serializeCategory, serializeItem, getFullMenu } from '../db/serialize.js';

const router = Router();
router.use(requireAuth);

function nextSortOrder(table, whereCol, whereVal) {
  const row = whereVal === undefined
    ? db.prepare(`SELECT COALESCE(MAX(sort_order), -1) AS m FROM ${table}`).get()
    : db.prepare(`SELECT COALESCE(MAX(sort_order), -1) AS m FROM ${table} WHERE ${whereCol} = ?`).get(whereVal);
  return row.m + 1;
}

// ---- Categories ----

router.get('/categories', (req, res) => {
  res.json(getFullMenu());
});

router.post('/categories', (req, res) => {
  const { key, nameEn, nameAr, iconImage } = req.body || {};
  if (!key || !nameEn || !nameAr) return res.status(400).json({ error: 'key, nameEn, nameAr required' });
  try {
    const sortOrder = nextSortOrder('categories');
    const result = db.prepare(
      'INSERT INTO categories (key, name_en, name_ar, icon_image, sort_order) VALUES (?, ?, ?, ?, ?)'
    ).run(key, nameEn, nameAr, iconImage || null, sortOrder);
    const cat = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(serializeCategory(cat));
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) return res.status(409).json({ error: 'category key already exists' });
    throw err;
  }
});

router.put('/categories/:id', (req, res) => {
  const cat = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  if (!cat) return res.status(404).json({ error: 'not found' });
  const { nameEn, nameAr, iconImage } = req.body || {};
  db.prepare('UPDATE categories SET name_en = ?, name_ar = ?, icon_image = ? WHERE id = ?').run(
    nameEn ?? cat.name_en,
    nameAr ?? cat.name_ar,
    iconImage !== undefined ? iconImage : cat.icon_image,
    cat.id
  );
  res.json(serializeCategory(db.prepare('SELECT * FROM categories WHERE id = ?').get(cat.id)));
});

router.put('/categories/reorder', (req, res) => {
  const { orderedIds } = req.body || {};
  if (!Array.isArray(orderedIds)) return res.status(400).json({ error: 'orderedIds array required' });
  const stmt = db.prepare('UPDATE categories SET sort_order = ? WHERE id = ?');
  const tx = db.transaction(ids => ids.forEach((id, idx) => stmt.run(idx, id)));
  tx(orderedIds);
  res.json(getFullMenu());
});

router.delete('/categories/:id', (req, res) => {
  const result = db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'not found' });
  res.status(204).end();
});

// ---- Items ----

router.post('/items', (req, res) => {
  const { categoryId, nameEn, nameAr, descEn, descAr, price, spicy, isNew, collabEn, collabAr } = req.body || {};
  if (!categoryId || !nameEn || !nameAr || price === undefined) {
    return res.status(400).json({ error: 'categoryId, nameEn, nameAr, price required' });
  }
  const category = db.prepare('SELECT id FROM categories WHERE id = ?').get(categoryId);
  if (!category) return res.status(400).json({ error: 'invalid categoryId' });

  const sortOrder = nextSortOrder('items', 'category_id', categoryId);
  const result = db.prepare(
    `INSERT INTO items (category_id, name_en, name_ar, desc_en, desc_ar, price, spicy, is_new, collab_en, collab_ar, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(categoryId, nameEn, nameAr, descEn || null, descAr || null, Number(price), spicy ? 1 : 0, isNew ? 1 : 0, collabEn || null, collabAr || null, sortOrder);

  res.status(201).json(serializeItem(db.prepare('SELECT * FROM items WHERE id = ?').get(result.lastInsertRowid)));
});

router.put('/items/:id', (req, res) => {
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'not found' });
  const b = req.body || {};
  db.prepare(
    `UPDATE items SET name_en=?, name_ar=?, desc_en=?, desc_ar=?, price=?, image=?, spicy=?, is_new=?,
       collab_en=?, collab_ar=?, cal=?, protein=?, carbs=?, fat=? WHERE id=?`
  ).run(
    b.nameEn ?? item.name_en,
    b.nameAr ?? item.name_ar,
    b.descEn !== undefined ? b.descEn : item.desc_en,
    b.descAr !== undefined ? b.descAr : item.desc_ar,
    b.price !== undefined ? Number(b.price) : item.price,
    b.image !== undefined ? b.image : item.image,
    b.spicy !== undefined ? (b.spicy ? 1 : 0) : item.spicy,
    b.isNew !== undefined ? (b.isNew ? 1 : 0) : item.is_new,
    b.collabEn !== undefined ? b.collabEn : item.collab_en,
    b.collabAr !== undefined ? b.collabAr : item.collab_ar,
    b.cal !== undefined ? b.cal : item.cal,
    b.protein !== undefined ? b.protein : item.protein,
    b.carbs !== undefined ? b.carbs : item.carbs,
    b.fat !== undefined ? b.fat : item.fat,
    item.id
  );
  res.json(serializeItem(db.prepare('SELECT * FROM items WHERE id = ?').get(item.id)));
});

router.put('/items/reorder', (req, res) => {
  const { orderedIds } = req.body || {};
  if (!Array.isArray(orderedIds)) return res.status(400).json({ error: 'orderedIds array required' });
  const stmt = db.prepare('UPDATE items SET sort_order = ? WHERE id = ?');
  const tx = db.transaction(ids => ids.forEach((id, idx) => stmt.run(idx, id)));
  tx(orderedIds);
  res.json(getFullMenu());
});

router.delete('/items/:id', (req, res) => {
  const result = db.prepare('DELETE FROM items WHERE id = ?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'not found' });
  res.status(204).end();
});

// ---- Build config (steps + options) — replace-all for the item ----

router.put('/items/:id/build', (req, res) => {
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'not found' });
  const { steps } = req.body || {};
  if (!Array.isArray(steps)) return res.status(400).json({ error: 'steps array required' });

  const insertStep = db.prepare(
    `INSERT INTO build_steps (item_id, step_key, type, note, label_en, label_ar, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  const insertOption = db.prepare(
    'INSERT INTO build_options (step_id, label_en, label_ar, sort_order) VALUES (?, ?, ?, ?)'
  );

  const tx = db.transaction(() => {
    db.prepare('DELETE FROM build_steps WHERE item_id = ?').run(item.id);
    steps.forEach((step, stepIdx) => {
      if (!step.key || !step.type || !step.labelEn || !step.labelAr) throw new Error('invalid step');
      const stepResult = insertStep.run(item.id, step.key, step.type, step.note ? 1 : 0, step.labelEn, step.labelAr, stepIdx);
      (step.options || []).forEach((opt, optIdx) => {
        if (!opt.en || !opt.ar) throw new Error('invalid option');
        insertOption.run(stepResult.lastInsertRowid, opt.en, opt.ar, optIdx);
      });
    });
  });

  try {
    tx();
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
  res.json(serializeItem(db.prepare('SELECT * FROM items WHERE id = ?').get(item.id)));
});

router.delete('/items/:id/build', (req, res) => {
  const result = db.prepare('DELETE FROM build_steps WHERE item_id = ?').run(req.params.id);
  res.json({ removed: result.changes });
});

// ---- Settings (e.g. hero image) ----

router.get('/settings', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  res.json(Object.fromEntries(rows.map(r => [r.key, r.value])));
});

router.put('/settings/:key', (req, res) => {
  const { value } = req.body || {};
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .run(req.params.key, value ?? null);
  res.json({ key: req.params.key, value: value ?? null });
});

export default router;

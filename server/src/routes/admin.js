import { Router } from 'express';
import multer from 'multer';
import { db } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { serializeCategory, serializeItem, getFullMenu } from '../db/serialize.js';
import { toCSV, parseCSV, parseBoolCell } from '../lib/csv.js';

const router = Router();
router.use(requireAuth);

const fileUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

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
  const numericPrice = Number(price);
  if (!Number.isFinite(numericPrice) || numericPrice < 0) {
    return res.status(400).json({ error: 'price must be a non-negative number' });
  }
  const category = db.prepare('SELECT id FROM categories WHERE id = ?').get(categoryId);
  if (!category) return res.status(400).json({ error: 'invalid categoryId' });

  const sortOrder = nextSortOrder('items', 'category_id', categoryId);
  const result = db.prepare(
    `INSERT INTO items (category_id, name_en, name_ar, desc_en, desc_ar, price, spicy, is_new, collab_en, collab_ar, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(categoryId, nameEn, nameAr, descEn || null, descAr || null, numericPrice, spicy ? 1 : 0, isNew ? 1 : 0, collabEn || null, collabAr || null, sortOrder);

  res.status(201).json(serializeItem(db.prepare('SELECT * FROM items WHERE id = ?').get(result.lastInsertRowid)));
});

router.put('/items/:id', (req, res) => {
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'not found' });
  const b = req.body || {};
  if (b.price !== undefined) {
    const numericPrice = Number(b.price);
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      return res.status(400).json({ error: 'price must be a non-negative number' });
    }
  }
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

// ---- Bulk import / export ----

const ITEM_CSV_COLUMNS = [
  'id', 'category_key', 'name_en', 'name_ar', 'desc_en', 'desc_ar', 'price',
  'spicy', 'is_new', 'collab_en', 'collab_ar', 'cal', 'protein', 'carbs', 'fat', 'image',
];

router.get('/export/items.csv', (req, res) => {
  const rows = [];
  getFullMenu().forEach(cat => {
    cat.items.forEach(item => {
      rows.push({
        id: item.id,
        category_key: cat.key,
        name_en: item.nameEn,
        name_ar: item.nameAr,
        desc_en: item.descEn || '',
        desc_ar: item.descAr || '',
        price: item.price,
        spicy: item.spicy ? 'yes' : 'no',
        is_new: item.isNew ? 'yes' : 'no',
        collab_en: item.collabEn || '',
        collab_ar: item.collabAr || '',
        cal: item.nutrition.cal || '',
        protein: item.nutrition.protein || '',
        carbs: item.nutrition.carbs || '',
        fat: item.nutrition.fat || '',
        image: item.image || '',
      });
    });
  });
  const csv = '﻿' + toCSV(rows, ITEM_CSV_COLUMNS);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="lychee-menu-items.csv"');
  res.send(csv);
});

router.post('/import/items.csv', fileUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no file uploaded (field name "file")' });
  const text = req.file.buffer.toString('utf-8').replace(/^﻿/, '');
  let rows;
  try {
    rows = parseCSV(text);
  } catch {
    return res.status(400).json({ error: 'could not parse CSV' });
  }

  const categories = db.prepare('SELECT id, key FROM categories').all();
  const catIdByKey = Object.fromEntries(categories.map(c => [c.key, c.id]));

  const updateStmt = db.prepare(
    `UPDATE items SET category_id=@categoryId, name_en=@nameEn, name_ar=@nameAr, desc_en=@descEn, desc_ar=@descAr,
       price=@price, spicy=@spicy, is_new=@isNew, collab_en=@collabEn, collab_ar=@collabAr,
       cal=@cal, protein=@protein, carbs=@carbs, fat=@fat, image=@image WHERE id=@id`
  );
  const insertStmt = db.prepare(
    `INSERT INTO items (category_id, name_en, name_ar, desc_en, desc_ar, price, spicy, is_new, collab_en, collab_ar, cal, protein, carbs, fat, image, sort_order)
     VALUES (@categoryId,@nameEn,@nameAr,@descEn,@descAr,@price,@spicy,@isNew,@collabEn,@collabAr,@cal,@protein,@carbs,@fat,@image,@sortOrder)`
  );
  const findByCategoryAndName = db.prepare('SELECT id FROM items WHERE category_id = ? AND name_en = ?');
  const findById = db.prepare('SELECT id FROM items WHERE id = ?');

  const result = { created: 0, updated: 0, errors: [] };

  const tx = db.transaction(() => {
    rows.forEach((row, idx) => {
      const line = idx + 2; // header is line 1
      const categoryKey = (row.category_key || '').trim();
      const nameEn = (row.name_en || '').trim();
      const nameAr = (row.name_ar || '').trim();
      const priceRaw = (row.price || '').trim();

      if (!categoryKey || !nameEn || !nameAr || priceRaw === '') {
        result.errors.push({ line, message: 'missing required field (category_key, name_en, name_ar, price)' });
        return;
      }
      const categoryId = catIdByKey[categoryKey];
      if (!categoryId) {
        result.errors.push({ line, message: `unknown category_key "${categoryKey}"` });
        return;
      }
      const price = Number(priceRaw);
      if (!Number.isFinite(price)) {
        result.errors.push({ line, message: `invalid price "${priceRaw}"` });
        return;
      }

      const fields = {
        categoryId,
        nameEn,
        nameAr,
        descEn: row.desc_en || null,
        descAr: row.desc_ar || null,
        price,
        spicy: parseBoolCell(row.spicy) ? 1 : 0,
        isNew: parseBoolCell(row.is_new) ? 1 : 0,
        collabEn: row.collab_en || null,
        collabAr: row.collab_ar || null,
        cal: row.cal || null,
        protein: row.protein || null,
        carbs: row.carbs || null,
        fat: row.fat || null,
        image: row.image || null,
      };

      const idCell = (row.id || '').trim();
      let existingId = null;
      if (idCell) {
        const existing = findById.get(idCell);
        if (!existing) { result.errors.push({ line, message: `item id ${idCell} not found` }); return; }
        existingId = existing.id;
      } else {
        const existing = findByCategoryAndName.get(categoryId, nameEn);
        if (existing) existingId = existing.id;
      }

      if (existingId) {
        updateStmt.run({ ...fields, id: existingId });
        result.updated++;
      } else {
        const sortOrder = nextSortOrder('items', 'category_id', categoryId);
        insertStmt.run({ ...fields, sortOrder });
        result.created++;
      }
    });
  });
  tx();

  res.json(result);
});

router.get('/export/menu.json', (req, res) => {
  const settingsRows = db.prepare('SELECT key, value FROM settings').all();
  const payload = {
    exportedAt: new Date().toISOString(),
    categories: getFullMenu(),
    settings: Object.fromEntries(settingsRows.map(r => [r.key, r.value])),
  };
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="lychee-menu-backup.json"');
  res.send(JSON.stringify(payload, null, 2));
});

router.post('/import/menu.json', fileUpload.single('file'), (req, res) => {
  let payload;
  try {
    const text = req.file ? req.file.buffer.toString('utf-8') : JSON.stringify(req.body);
    payload = JSON.parse(text);
  } catch {
    return res.status(400).json({ error: 'invalid JSON' });
  }
  if (!payload || !Array.isArray(payload.categories)) {
    return res.status(400).json({ error: 'expected { categories: [...] } shape (as produced by the export)' });
  }

  const result = { categoriesCreated: 0, categoriesUpdated: 0, itemsCreated: 0, itemsUpdated: 0, errors: [] };

  const insertStep = db.prepare(
    'INSERT INTO build_steps (item_id, step_key, type, note, label_en, label_ar, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const insertOption = db.prepare(
    'INSERT INTO build_options (step_id, label_en, label_ar, sort_order) VALUES (?, ?, ?, ?)'
  );

  const tx = db.transaction(() => {
    payload.categories.forEach((cat, catIdx) => {
      if (!cat.key || !cat.nameEn || !cat.nameAr) {
        result.errors.push({ category: cat.key || `#${catIdx}`, message: 'missing key/nameEn/nameAr' });
        return;
      }
      const existingCat = db.prepare('SELECT * FROM categories WHERE key = ?').get(cat.key);
      let categoryId;
      if (existingCat) {
        db.prepare('UPDATE categories SET name_en=?, name_ar=?, icon_image=? WHERE id=?').run(
          cat.nameEn, cat.nameAr, cat.iconImage ?? existingCat.icon_image, existingCat.id
        );
        categoryId = existingCat.id;
        result.categoriesUpdated++;
      } else {
        const sortOrder = nextSortOrder('categories');
        const r = db.prepare('INSERT INTO categories (key, name_en, name_ar, icon_image, sort_order) VALUES (?, ?, ?, ?, ?)')
          .run(cat.key, cat.nameEn, cat.nameAr, cat.iconImage || null, sortOrder);
        categoryId = r.lastInsertRowid;
        result.categoriesCreated++;
      }

      (cat.items || []).forEach((it, itemIdx) => {
        if (!it.nameEn || !it.nameAr || it.price === undefined) {
          result.errors.push({ category: cat.key, item: it.nameEn || `#${itemIdx}`, message: 'missing nameEn/nameAr/price' });
          return;
        }
        let itemRow = it.id ? db.prepare('SELECT * FROM items WHERE id = ?').get(it.id) : null;
        if (!itemRow) itemRow = db.prepare('SELECT * FROM items WHERE category_id = ? AND name_en = ?').get(categoryId, it.nameEn);

        const fields = {
          categoryId,
          nameEn: it.nameEn,
          nameAr: it.nameAr,
          descEn: it.descEn ?? null,
          descAr: it.descAr ?? null,
          price: Number(it.price),
          image: it.image ?? null,
          spicy: it.spicy ? 1 : 0,
          isNew: it.isNew ? 1 : 0,
          collabEn: it.collabEn ?? null,
          collabAr: it.collabAr ?? null,
          cal: it.nutrition ? (it.nutrition.cal ?? null) : null,
          protein: it.nutrition ? (it.nutrition.protein ?? null) : null,
          carbs: it.nutrition ? (it.nutrition.carbs ?? null) : null,
          fat: it.nutrition ? (it.nutrition.fat ?? null) : null,
        };

        let itemId;
        if (itemRow) {
          db.prepare(
            `UPDATE items SET category_id=@categoryId, name_en=@nameEn, name_ar=@nameAr, desc_en=@descEn, desc_ar=@descAr,
               price=@price, image=@image, spicy=@spicy, is_new=@isNew, collab_en=@collabEn, collab_ar=@collabAr,
               cal=@cal, protein=@protein, carbs=@carbs, fat=@fat WHERE id=@id`
          ).run({ ...fields, id: itemRow.id });
          itemId = itemRow.id;
          result.itemsUpdated++;
        } else {
          const sortOrder = nextSortOrder('items', 'category_id', categoryId);
          const r = db.prepare(
            `INSERT INTO items (category_id,name_en,name_ar,desc_en,desc_ar,price,image,spicy,is_new,collab_en,collab_ar,cal,protein,carbs,fat,sort_order)
             VALUES (@categoryId,@nameEn,@nameAr,@descEn,@descAr,@price,@image,@spicy,@isNew,@collabEn,@collabAr,@cal,@protein,@carbs,@fat,@sortOrder)`
          ).run({ ...fields, sortOrder });
          itemId = r.lastInsertRowid;
          result.itemsCreated++;
        }

        if (Array.isArray(it.buildConfig)) {
          db.prepare('DELETE FROM build_steps WHERE item_id = ?').run(itemId);
          it.buildConfig.forEach((step, stepIdx) => {
            if (!step.key || !step.type || !step.labelEn || !step.labelAr) return;
            const stepResult = insertStep.run(itemId, step.key, step.type, step.note ? 1 : 0, step.labelEn, step.labelAr, stepIdx);
            (step.options || []).forEach((opt, optIdx) => {
              if (!opt.en || !opt.ar) return;
              insertOption.run(stepResult.lastInsertRowid, opt.en, opt.ar, optIdx);
            });
          });
        }
      });
    });
  });
  tx();

  res.json(result);
});

export default router;

import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import QRCode from 'qrcode';
import { db } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { serializeCategory, serializeItem, getFullMenu } from '../db/serialize.js';
import { toCSV, parseCSV, parseBoolCell } from '../lib/csv.js';
import { compressToWebp } from '../lib/image.js';
import { uploadsDir } from './upload.js';

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

// `key` is an internal stable identifier (used by CSV import/export to match rows to
// existing categories) — not something an admin should have to think up or see when
// just adding a category, so it's generated here from the English name instead.
function slugify(text) {
  return String(text || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function uniqueCategoryKey(nameEn) {
  const base = slugify(nameEn) || 'category';
  const exists = db.prepare('SELECT 1 FROM categories WHERE key = ?');
  let key = base;
  let suffix = 2;
  while (exists.get(key)) {
    key = `${base}-${suffix}`;
    suffix++;
  }
  return key;
}

router.get('/categories', (req, res) => {
  res.json(getFullMenu());
});

router.post('/categories', (req, res) => {
  const { nameEn, nameAr, iconImage } = req.body || {};
  if (!nameEn || !nameAr) return res.status(400).json({ error: 'nameEn, nameAr required' });
  try {
    const key = uniqueCategoryKey(nameEn);
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
  const { categoryId, nameEn, nameAr, descEn, descAr, price, spicy, isNew, collabEn, collabAr, nutritionEnabled } = req.body || {};
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
    `INSERT INTO items (category_id, name_en, name_ar, desc_en, desc_ar, price, spicy, is_new, collab_en, collab_ar, nutrition_enabled, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    categoryId, nameEn, nameAr, descEn || null, descAr || null, numericPrice, spicy ? 1 : 0, isNew ? 1 : 0,
    collabEn || null, collabAr || null, nutritionEnabled === false ? 0 : 1, sortOrder
  );

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
       collab_en=?, collab_ar=?, cal=?, protein=?, carbs=?, fat=?, nutrition_enabled=? WHERE id=?`
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
    b.nutritionEnabled !== undefined ? (b.nutritionEnabled ? 1 : 0) : item.nutrition_enabled,
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
  'spicy', 'is_new', 'collab_en', 'collab_ar', 'nutrition_enabled', 'cal', 'protein', 'carbs', 'fat', 'image',
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
        nutrition_enabled: item.nutritionEnabled ? 'yes' : 'no',
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
  const insertCategory = db.prepare('INSERT INTO categories (key, name_en, name_ar, sort_order) VALUES (?, ?, ?, ?)');

  // The CSV format's only way to identify a category is its key (no display-name
  // columns), so a key this file hasn't seen before gets created on the fly — the
  // import's whole point is bulk-loading a menu that doesn't exist in the admin yet,
  // and requiring every category to be hand-created first would defeat that. The
  // display name is just title-cased from the key (e.g. "hot-drinks" -> "Hot Drinks")
  // as a starting point; rename it from the Menu tab afterward if needed — the
  // Arabic name in particular is a placeholder, since there's nothing to translate it
  // from here.
  let categoriesCreated = 0;
  function getOrCreateCategoryId(categoryKey) {
    if (catIdByKey[categoryKey]) return catIdByKey[categoryKey];
    const name = categoryKey.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || categoryKey;
    const sortOrder = nextSortOrder('categories');
    const result = insertCategory.run(categoryKey, name, name, sortOrder);
    catIdByKey[categoryKey] = result.lastInsertRowid;
    categoriesCreated++;
    return result.lastInsertRowid;
  }

  const updateStmt = db.prepare(
    `UPDATE items SET category_id=@categoryId, name_en=@nameEn, name_ar=@nameAr, desc_en=@descEn, desc_ar=@descAr,
       price=@price, spicy=@spicy, is_new=@isNew, collab_en=@collabEn, collab_ar=@collabAr, nutrition_enabled=@nutritionEnabled,
       cal=@cal, protein=@protein, carbs=@carbs, fat=@fat, image=@image WHERE id=@id`
  );
  const insertStmt = db.prepare(
    `INSERT INTO items (category_id, name_en, name_ar, desc_en, desc_ar, price, spicy, is_new, collab_en, collab_ar, nutrition_enabled, cal, protein, carbs, fat, image, sort_order)
     VALUES (@categoryId,@nameEn,@nameAr,@descEn,@descAr,@price,@spicy,@isNew,@collabEn,@collabAr,@nutritionEnabled,@cal,@protein,@carbs,@fat,@image,@sortOrder)`
  );
  const findByCategoryAndName = db.prepare('SELECT id FROM items WHERE category_id = ? AND name_en = ?');
  const findById = db.prepare('SELECT id, category_id FROM items WHERE id = ?');

  // errors: the row was skipped, nothing imported for it. notes: the row still
  // imported successfully, just not exactly as literally specified (e.g. redirected
  // away from a colliding id) — worth surfacing, but not a failure.
  const result = { created: 0, updated: 0, errors: [], notes: [] };

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
      const categoryId = getOrCreateCategoryId(categoryKey);
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
        // Blank cell or a column absent entirely (e.g. re-importing a CSV exported
        // before this field existed) defaults to enabled rather than silently
        // hiding nutrition facts; write "no" explicitly to disable.
        nutritionEnabled: (row.nutrition_enabled || '').trim() === '' ? 1 : (parseBoolCell(row.nutrition_enabled) ? 1 : 0),
        cal: row.cal || null,
        protein: row.protein || null,
        carbs: row.carbs || null,
        fat: row.fat || null,
        image: row.image || null,
      };

      // A CSV from somewhere other than this menu's own export (a different POS, a
      // hand-built file) typically has its own `id` column — row numbering from its
      // source, with no relation to this database. Trusting it blindly is dangerous
      // two ways: a number that happens to already belong to an unrelated item here
      // would get silently overwritten, and — far more commonly for a brand-new
      // import — numbers that don't exist here *at all* yet would wrongly reject
      // every single row instead of just creating them. So the id is only ever used
      // to match when it points to an item already in this row's resolved category
      // (a genuine re-import of a file this app exported itself); anything else,
      // including no match at all, falls back to matching by name within the
      // category — which creates a new item when that doesn't match either.
      const idCell = (row.id || '').trim();
      let existingId = null;
      if (idCell) {
        const existing = findById.get(idCell);
        if (existing && existing.category_id === categoryId) {
          existingId = existing.id;
        } else if (existing) {
          result.notes.push({ line, message: `item id ${idCell} belongs to a different category — matched by name instead to avoid overwriting it` });
        }
      }
      if (existingId === null) {
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

  res.json({ ...result, categoriesCreated });
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
          nutritionEnabled: it.nutritionEnabled !== undefined ? (it.nutritionEnabled ? 1 : 0) : 1,
          cal: it.nutrition ? (it.nutrition.cal ?? null) : null,
          protein: it.nutrition ? (it.nutrition.protein ?? null) : null,
          carbs: it.nutrition ? (it.nutrition.carbs ?? null) : null,
          fat: it.nutrition ? (it.nutrition.fat ?? null) : null,
        };

        let itemId;
        if (itemRow) {
          db.prepare(
            `UPDATE items SET category_id=@categoryId, name_en=@nameEn, name_ar=@nameAr, desc_en=@descEn, desc_ar=@descAr,
               price=@price, image=@image, spicy=@spicy, is_new=@isNew, collab_en=@collabEn, collab_ar=@collabAr, nutrition_enabled=@nutritionEnabled,
               cal=@cal, protein=@protein, carbs=@carbs, fat=@fat WHERE id=@id`
          ).run({ ...fields, id: itemRow.id });
          itemId = itemRow.id;
          result.itemsUpdated++;
        } else {
          const sortOrder = nextSortOrder('items', 'category_id', categoryId);
          const r = db.prepare(
            `INSERT INTO items (category_id,name_en,name_ar,desc_en,desc_ar,price,image,spicy,is_new,collab_en,collab_ar,nutrition_enabled,cal,protein,carbs,fat,sort_order)
             VALUES (@categoryId,@nameEn,@nameAr,@descEn,@descAr,@price,@image,@spicy,@isNew,@collabEn,@collabAr,@nutritionEnabled,@cal,@protein,@carbs,@fat,@sortOrder)`
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

// ---- Optimize existing images (compress + convert to WebP) ----
//
// The upload endpoint compresses new uploads automatically, but images uploaded
// before that existed are still sitting on disk as full-size JPEGs/PNGs. This
// reprocesses those in place: only files actually referenced by an item, category,
// or the hero setting are touched; already-WebP files are skipped (safe to re-run);
// the old file is only deleted after the new one is written *and* every DB row
// pointing at it has been repointed, so a failure partway through never leaves a
// dangling reference or data loss. One bad file doesn't abort the rest of the batch.
router.post('/optimize-images', async (req, res) => {
  const itemRefs = db.prepare("SELECT id, image AS url FROM items WHERE image IS NOT NULL AND image != ''").all()
    .map(r => ({ table: 'items', id: r.id, url: r.url }));
  const categoryRefs = db.prepare("SELECT id, icon_image AS url FROM categories WHERE icon_image IS NOT NULL AND icon_image != ''").all()
    .map(r => ({ table: 'categories', id: r.id, url: r.url }));
  const heroSetting = db.prepare("SELECT value FROM settings WHERE key = 'heroImage'").get();
  const settingRefs = heroSetting && heroSetting.value ? [{ table: 'settings', id: 'heroImage', url: heroSetting.value }] : [];

  const byUrl = new Map();
  for (const ref of [...itemRefs, ...categoryRefs, ...settingRefs]) {
    if (!byUrl.has(ref.url)) byUrl.set(ref.url, []);
    byUrl.get(ref.url).push(ref);
  }

  const updateItem = db.prepare('UPDATE items SET image = ? WHERE id = ?');
  const updateCategory = db.prepare('UPDATE categories SET icon_image = ? WHERE id = ?');
  const updateSetting = db.prepare('UPDATE settings SET value = ? WHERE key = ?');

  const result = { optimized: 0, alreadyOptimized: 0, skippedExternal: 0, bytesBefore: 0, bytesAfter: 0, errors: [] };

  for (const [url, refs] of byUrl) {
    if (!url.startsWith('/uploads/')) { result.skippedExternal++; continue; }
    const filename = url.slice('/uploads/'.length);
    if (path.extname(filename).toLowerCase() === '.webp') { result.alreadyOptimized++; continue; }

    try {
      const filePath = path.join(uploadsDir, filename);
      const originalBuffer = await fs.promises.readFile(filePath);
      const sourceFormat = path.extname(filename).toLowerCase() === '.gif' ? 'gif' : undefined;
      const optimizedBuffer = await compressToWebp(originalBuffer, sourceFormat);

      const newFilename = `${crypto.randomUUID()}.webp`;
      await fs.promises.writeFile(path.join(uploadsDir, newFilename), optimizedBuffer);
      const newUrl = `/uploads/${newFilename}`;

      const tx = db.transaction(() => {
        for (const ref of refs) {
          if (ref.table === 'items') updateItem.run(newUrl, ref.id);
          else if (ref.table === 'categories') updateCategory.run(newUrl, ref.id);
          else if (ref.table === 'settings') updateSetting.run(newUrl, ref.id);
        }
      });
      tx();

      await fs.promises.unlink(filePath).catch(() => {});

      result.optimized++;
      result.bytesBefore += originalBuffer.length;
      result.bytesAfter += optimizedBuffer.length;
    } catch (err) {
      result.errors.push({ url, message: err.message });
    }
  }

  res.json(result);
});

// ---- Analytics ----

router.get('/analytics', (req, res) => {
  const countByType = type => db.prepare('SELECT COUNT(*) AS c FROM analytics_events WHERE type = ?').get(type).c;
  const totals = {
    pageViews: countByType('page_view'),
    itemViews: countByType('item_view'),
    whatsappClicks: countByType('whatsapp_click'),
    qrScans: db.prepare("SELECT COUNT(*) AS c FROM analytics_events WHERE source = 'qr'").get().c,
  };

  const topItems = db.prepare(`
    SELECT items.id, items.name_en AS nameEn, items.name_ar AS nameAr,
      SUM(CASE WHEN analytics_events.type = 'item_view' THEN 1 ELSE 0 END) AS views,
      SUM(CASE WHEN analytics_events.type = 'whatsapp_click' THEN 1 ELSE 0 END) AS whatsappClicks
    FROM analytics_events
    JOIN items ON items.id = analytics_events.item_id
    WHERE analytics_events.item_id IS NOT NULL
    GROUP BY items.id
    ORDER BY views DESC, whatsappClicks DESC
    LIMIT 20
  `).all();

  res.json({ totals, topItems });
});

// ---- QR code (links to the public menu, tagged so scans are attributable in analytics) ----

router.get('/qr-code', async (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const targetUrl = `${baseUrl}/?src=qr`;
  try {
    const dataUrl = await QRCode.toDataURL(targetUrl, {
      width: 512,
      margin: 2,
      color: { dark: '#004438', light: '#fffffc' },
    });
    res.json({ targetUrl, dataUrl });
  } catch {
    res.status(500).json({ error: 'failed to generate QR code' });
  }
});

export default router;

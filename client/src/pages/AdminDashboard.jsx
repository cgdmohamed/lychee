import { useEffect, useState } from 'react';
import CategoryHeader from '../components/admin/CategoryHeader.jsx';
import AdminHeader from '../components/admin/AdminHeader.jsx';
import { api } from '../api';
import ImageSlot from '../components/ImageSlot.jsx';
import ItemEditor from '../components/admin/ItemEditor.jsx';
import ImportExportPanel from '../components/admin/ImportExportPanel.jsx';
import { colors, font, headingFont, field, label, fieldGroup, button, card, sectionTitle } from '../admin/theme';

export default function AdminDashboard() {
  const [categories, setCategories] = useState(null);
  const [error, setError] = useState('');
  const [selectedCatId, setSelectedCatId] = useState(null);
  const [newCat, setNewCat] = useState({ key: '', nameEn: '', nameAr: '' });
  const [addingCat, setAddingCat] = useState(false);
  const [newItem, setNewItem] = useState({ nameEn: '', nameAr: '', price: '' });
  const [addingItem, setAddingItem] = useState(false);
  const [settings, setSettings] = useState({});

  function load() {
    Promise.all([api.adminGetCategories(), api.getSettings()])
      .then(([cats, s]) => {
        setCategories(cats);
        setSettings(s);
        setSelectedCatId(prev => prev ?? (cats[0] && cats[0].id));
      })
      .catch(err => setError(err.message));
  }

  useEffect(load, []);

  async function guarded(fn) {
    setError('');
    try {
      await fn();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }

  if (error && !categories) {
    return <div style={{ padding: 40, fontFamily: font, color: colors.danger }}>Error: {error}</div>;
  }
  if (!categories) {
    return <div style={{ padding: 40, fontFamily: font, color: colors.muted }}>Loading…</div>;
  }

  const selectedCat = categories.find(c => c.id === selectedCatId);

  async function addCategory(e) {
    e.preventDefault();
    if (!newCat.key || !newCat.nameEn || !newCat.nameAr) return;
    setAddingCat(true);
    await guarded(async () => {
      const cat = await api.createCategory(newCat);
      setNewCat({ key: '', nameEn: '', nameAr: '' });
      setCategories(prev => [...prev, { ...cat, items: [] }]);
      setSelectedCatId(cat.id);
    });
    setAddingCat(false);
  }

  function updateCategoryField(cat, patch) {
    return guarded(async () => {
      const updated = await api.updateCategory(cat.id, patch);
      setCategories(prev => prev.map(c => (c.id === cat.id ? { ...c, ...updated, items: c.items } : c)));
    });
  }

  function deleteCategory(cat) {
    if (!confirm(`Delete category "${cat.nameEn}" and all its items?`)) return;
    return guarded(async () => {
      await api.deleteCategory(cat.id);
      setCategories(prev => prev.filter(c => c.id !== cat.id));
      if (selectedCatId === cat.id) setSelectedCatId(null);
    });
  }

  function moveCategory(cat, direction) {
    const idx = categories.findIndex(c => c.id === cat.id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= categories.length) return;
    const ids = categories.map(c => c.id);
    [ids[idx], ids[swapIdx]] = [ids[swapIdx], ids[idx]];
    return guarded(async () => {
      const updated = await api.reorderCategories(ids);
      setCategories(updated);
    });
  }

  async function addItem(e) {
    e.preventDefault();
    if (!selectedCat || !newItem.nameEn || !newItem.nameAr || newItem.price === '') return;
    setAddingItem(true);
    await guarded(async () => {
      const item = await api.createItem({ categoryId: selectedCat.id, ...newItem, price: Number(newItem.price) });
      setNewItem({ nameEn: '', nameAr: '', price: '' });
      setCategories(prev => prev.map(c => (c.id === selectedCat.id ? { ...c, items: [...c.items, item] } : c)));
    });
    setAddingItem(false);
  }

  function onItemChanged(updated) {
    setCategories(prev => prev.map(c => (
      c.id === selectedCat.id ? { ...c, items: c.items.map(i => (i.id === updated.id ? updated : i)) } : c
    )));
  }

  function onItemDeleted(itemId) {
    if (!confirm('Delete this item?')) return;
    return guarded(async () => {
      await api.deleteItem(itemId);
      setCategories(prev => prev.map(c => (
        c.id === selectedCat.id ? { ...c, items: c.items.filter(i => i.id !== itemId) } : c
      )));
    });
  }

  function moveItem(item, direction) {
    const items = selectedCat.items;
    const idx = items.findIndex(i => i.id === item.id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= items.length) return;
    const ids = items.map(i => i.id);
    [ids[idx], ids[swapIdx]] = [ids[swapIdx], ids[idx]];
    return guarded(async () => {
      const updated = await api.reorderItems(ids);
      setCategories(updated);
    });
  }

  function uploadHero(url) {
    return guarded(async () => {
      await api.setSetting('heroImage', url);
      setSettings(prev => ({ ...prev, heroImage: url }));
    });
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, fontFamily: font, color: colors.ink }}>
      <AdminHeader />

      {error ? (
        <div className="admin-fade-in" style={{
          margin: '16px 28px 0', padding: '10px 16px', background: 'rgba(178,59,59,0.08)',
          border: '1px solid rgba(178,59,59,0.25)', borderRadius: 10, color: colors.danger, fontSize: 13,
          display: 'flex', justifyContent: 'space-between', gap: 12,
        }}>
          <span>{error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: colors.danger, cursor: 'pointer', fontWeight: 700 }}>✕</button>
        </div>
      ) : null}

      <div style={{ display: 'flex', gap: 24, padding: 24, alignItems: 'flex-start', maxWidth: 1280, margin: '0 auto' }}>
        {/* Sidebar */}
        <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ImportExportPanel onImported={load} />

          <div style={card()} className="admin-card">
            <div style={sectionTitle()}>hero photo</div>
            <ImageSlot src={settings.heroImage} editable onUploaded={uploadHero} placeholder="hero image" shape="rect" style={{ width: '100%', height: 110, borderRadius: 12 }} />
          </div>

          <div style={card()} className="admin-card">
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={sectionTitle({ marginBottom: 0 })}>categories</div>
              <span style={{ fontSize: 11, color: colors.faint }}>{categories.length}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 14 }}>
              {categories.map((cat, idx) => (
                <div
                  key={cat.id}
                  className="admin-row"
                  onClick={() => setSelectedCatId(cat.id)}
                  style={{
                    padding: '8px 8px 8px 10px', borderRadius: 10, cursor: 'pointer', fontSize: 13,
                    background: cat.id === selectedCatId ? colors.cream : 'transparent',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span style={{ fontWeight: cat.id === selectedCatId ? 700 : 500 }}>{cat.nameEn}</span>{' '}
                    <span style={{ color: colors.faint }}>({cat.items.length})</span>
                  </span>
                  <span style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                    <button
                      type="button"
                      title="move up"
                      onClick={e => { e.stopPropagation(); moveCategory(cat, -1); }}
                      disabled={idx === 0}
                      className="admin-btn"
                      style={button('icon')}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      title="move down"
                      onClick={e => { e.stopPropagation(); moveCategory(cat, 1); }}
                      disabled={idx === categories.length - 1}
                      className="admin-btn"
                      style={button('icon')}
                    >
                      ↓
                    </button>
                  </span>
                </div>
              ))}
            </div>

            <form onSubmit={addCategory} style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 12, borderTop: `1px solid ${colors.border}` }}>
              <div style={sectionTitle({ fontSize: 11, marginBottom: 2 })}>add category</div>
              <div style={fieldGroup()}>
                <label style={label()}>key (unique)</label>
                <input className="admin-field" value={newCat.key} onChange={e => setNewCat({ ...newCat, key: e.target.value })} style={field()} />
              </div>
              <div style={fieldGroup()}>
                <label style={label()}>name (EN)</label>
                <input className="admin-field" value={newCat.nameEn} onChange={e => setNewCat({ ...newCat, nameEn: e.target.value })} style={field()} />
              </div>
              <div style={fieldGroup()}>
                <label style={label()}>name (AR)</label>
                <input className="admin-field" value={newCat.nameAr} onChange={e => setNewCat({ ...newCat, nameAr: e.target.value })} style={{ ...field(), direction: 'rtl' }} />
              </div>
              <button type="submit" disabled={addingCat} className="admin-btn" style={button('primary', { marginTop: 4 })}>
                {addingCat ? 'adding…' : '+ add category'}
              </button>
            </form>
          </div>
        </div>

        {/* Main panel */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {selectedCat ? (
            <>
              <CategoryHeader
                category={selectedCat}
                onSave={patch => updateCategoryField(selectedCat, patch)}
                onIconUploaded={url => updateCategoryField(selectedCat, { iconImage: url })}
                onDelete={() => deleteCategory(selectedCat)}
              />

              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontFamily: headingFont, fontWeight: 700, fontSize: 20 }}>items</div>
                <span style={{ fontSize: 12, color: colors.faint }}>{selectedCat.items.length} in this category</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {selectedCat.items.map((item, idx) => (
                  <ItemEditor
                    key={item.id}
                    item={item}
                    onChanged={onItemChanged}
                    onDeleted={onItemDeleted}
                    onMoveUp={() => moveItem(item, -1)}
                    onMoveDown={() => moveItem(item, 1)}
                    canMoveUp={idx > 0}
                    canMoveDown={idx < selectedCat.items.length - 1}
                  />
                ))}
                {selectedCat.items.length === 0 ? (
                  <div style={{ ...card(), textAlign: 'center', color: colors.faint, fontSize: 13 }}>
                    no items yet — add the first one below
                  </div>
                ) : null}
              </div>

              <form onSubmit={addItem} style={{ ...card(), display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }} className="admin-card">
                <div style={fieldGroup({ flex: '1 1 160px' })}>
                  <label style={label()}>name (EN)</label>
                  <input className="admin-field" value={newItem.nameEn} onChange={e => setNewItem({ ...newItem, nameEn: e.target.value })} style={field()} />
                </div>
                <div style={fieldGroup({ flex: '1 1 160px' })}>
                  <label style={label()}>name (AR)</label>
                  <input className="admin-field" value={newItem.nameAr} onChange={e => setNewItem({ ...newItem, nameAr: e.target.value })} style={{ ...field(), direction: 'rtl' }} />
                </div>
                <div style={fieldGroup({ width: 100 })}>
                  <label style={label()}>price</label>
                  <input className="admin-field" type="number" step="0.5" value={newItem.price} onChange={e => setNewItem({ ...newItem, price: e.target.value })} style={field()} />
                </div>
                <button type="submit" disabled={addingItem} className="admin-btn" style={button('primary')}>
                  {addingItem ? 'adding…' : '+ add item'}
                </button>
              </form>
            </>
          ) : (
            <div style={{ ...card(), color: colors.faint, textAlign: 'center' }}>Select or create a category to manage its items.</div>
          )}
        </div>
      </div>
    </div>
  );
}

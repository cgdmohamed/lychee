import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken } from '../api';
import ImageSlot from '../components/ImageSlot.jsx';
import ItemEditor from '../components/admin/ItemEditor.jsx';

export default function AdminDashboard() {
  const [categories, setCategories] = useState(null);
  const [error, setError] = useState('');
  const [selectedCatId, setSelectedCatId] = useState(null);
  const [newCat, setNewCat] = useState({ key: '', nameEn: '', nameAr: '' });
  const [newItem, setNewItem] = useState({ nameEn: '', nameAr: '', price: '' });
  const [settings, setSettings] = useState({});
  const navigate = useNavigate();

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

  function logout() {
    setToken(null);
    navigate('/admin/login', { replace: true });
  }

  if (error) {
    return <div style={{ padding: 40, fontFamily: 'sans-serif', color: '#b23b3b' }}>Error: {error}</div>;
  }
  if (!categories) {
    return <div style={{ padding: 40, fontFamily: 'sans-serif' }}>Loading…</div>;
  }

  const selectedCat = categories.find(c => c.id === selectedCatId);

  async function addCategory(e) {
    e.preventDefault();
    if (!newCat.key || !newCat.nameEn || !newCat.nameAr) return;
    const cat = await api.createCategory(newCat);
    setNewCat({ key: '', nameEn: '', nameAr: '' });
    setCategories(prev => [...prev, { ...cat, items: [] }]);
    setSelectedCatId(cat.id);
  }

  async function updateCategoryField(cat, patch) {
    const updated = await api.updateCategory(cat.id, patch);
    setCategories(prev => prev.map(c => (c.id === cat.id ? { ...c, ...updated, items: c.items } : c)));
  }

  async function deleteCategory(cat) {
    if (!confirm(`Delete category "${cat.nameEn}" and all its items?`)) return;
    await api.deleteCategory(cat.id);
    setCategories(prev => prev.filter(c => c.id !== cat.id));
    if (selectedCatId === cat.id) setSelectedCatId(null);
  }

  async function addItem(e) {
    e.preventDefault();
    if (!selectedCat || !newItem.nameEn || !newItem.nameAr || newItem.price === '') return;
    const item = await api.createItem({ categoryId: selectedCat.id, ...newItem, price: Number(newItem.price) });
    setNewItem({ nameEn: '', nameAr: '', price: '' });
    setCategories(prev => prev.map(c => (c.id === selectedCat.id ? { ...c, items: [...c.items, item] } : c)));
  }

  function onItemChanged(updated) {
    setCategories(prev => prev.map(c => (
      c.id === selectedCat.id ? { ...c, items: c.items.map(i => (i.id === updated.id ? updated : i)) } : c
    )));
  }

  async function onItemDeleted(itemId) {
    if (!confirm('Delete this item?')) return;
    await api.deleteItem(itemId);
    setCategories(prev => prev.map(c => (
      c.id === selectedCat.id ? { ...c, items: c.items.filter(i => i.id !== itemId) } : c
    )));
  }

  async function uploadHero(url) {
    await api.setSetting('heroImage', url);
    setSettings(prev => ({ ...prev, heroImage: url }));
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fffffc', fontFamily: "'Nunito Sans', sans-serif", color: '#171a18' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img src="/assets/logo.svg" alt="lychee's" style={{ height: 20 }} />
          <span style={{ fontWeight: 700 }}>admin</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/" target="_blank" rel="noopener" style={{ fontSize: 13 }}>view menu ↗</a>
          <button onClick={logout} style={{ background: 'none', border: '1px solid rgba(0,0,0,0.2)', borderRadius: 999, padding: '6px 14px', fontSize: 12, cursor: 'pointer' }}>
            log out
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, padding: 24, alignItems: 'flex-start' }}>
        {/* Sidebar */}
        <div style={{ width: 260, flexShrink: 0 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>hero photo</div>
            <ImageSlot src={settings.heroImage} editable onUploaded={uploadHero} placeholder="hero image" shape="rect" style={{ width: '100%', height: 100, borderRadius: 12 }} />
          </div>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>categories</div>
          {categories.map(cat => (
            <div
              key={cat.id}
              onClick={() => setSelectedCatId(cat.id)}
              style={{
                padding: '8px 10px', borderRadius: 8, cursor: 'pointer', marginBottom: 4, fontSize: 13,
                background: cat.id === selectedCatId ? '#f3f0df' : 'transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
            >
              <span>{cat.nameEn} <span style={{ color: '#8a8f8a' }}>({cat.items.length})</span></span>
            </div>
          ))}
          <form onSubmit={addCategory} style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input placeholder="key (unique)" value={newCat.key} onChange={e => setNewCat({ ...newCat, key: e.target.value })} style={inputStyle('100%')} />
            <input placeholder="name (EN)" value={newCat.nameEn} onChange={e => setNewCat({ ...newCat, nameEn: e.target.value })} style={inputStyle('100%')} />
            <input placeholder="name (AR)" value={newCat.nameAr} onChange={e => setNewCat({ ...newCat, nameAr: e.target.value })} style={{ ...inputStyle('100%'), direction: 'rtl' }} />
            <button type="submit" style={primaryBtn}>+ add category</button>
          </form>
        </div>

        {/* Main panel */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {selectedCat ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <input
                  value={selectedCat.nameEn}
                  onChange={e => updateCategoryField(selectedCat, { nameEn: e.target.value })}
                  style={{ ...inputStyle(220), fontWeight: 700, fontSize: 16 }}
                />
                <input
                  value={selectedCat.nameAr}
                  onChange={e => updateCategoryField(selectedCat, { nameAr: e.target.value })}
                  style={{ ...inputStyle(220), fontWeight: 700, fontSize: 16, direction: 'rtl' }}
                />
                <ImageSlot
                  src={selectedCat.iconImage}
                  editable
                  onUploaded={url => updateCategoryField(selectedCat, { iconImage: url })}
                  shape="circle"
                  placeholder="icon"
                  style={{ width: 44, height: 44 }}
                />
                <button onClick={() => deleteCategory(selectedCat)} style={dangerBtn}>delete category</button>
              </div>

              {selectedCat.items.map(item => (
                <ItemEditor key={item.id} item={item} onChanged={onItemChanged} onDeleted={onItemDeleted} />
              ))}

              <form onSubmit={addItem} style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <input placeholder="name (EN)" value={newItem.nameEn} onChange={e => setNewItem({ ...newItem, nameEn: e.target.value })} style={inputStyle(180)} />
                <input placeholder="name (AR)" value={newItem.nameAr} onChange={e => setNewItem({ ...newItem, nameAr: e.target.value })} style={{ ...inputStyle(180), direction: 'rtl' }} />
                <input type="number" step="0.5" placeholder="price" value={newItem.price} onChange={e => setNewItem({ ...newItem, price: e.target.value })} style={inputStyle(90)} />
                <button type="submit" style={primaryBtn}>+ add item</button>
              </form>
            </>
          ) : (
            <div style={{ color: '#8a8f8a' }}>Select or create a category to manage its items.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function inputStyle(width) {
  return { width, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.2)', fontSize: 13 };
}
const primaryBtn = { background: '#004438', color: '#fff', border: 'none', borderRadius: 999, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' };
const dangerBtn = { background: 'none', color: '#b23b3b', border: '1px solid #b23b3b', borderRadius: 999, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' };

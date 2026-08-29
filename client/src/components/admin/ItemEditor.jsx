import { useEffect, useState } from 'react';
import { api } from '../../api';
import ImageSlot from '../ImageSlot.jsx';
import BuildConfigEditor from './BuildConfigEditor.jsx';

function fieldsFromItem(item) {
  return {
    nameEn: item.nameEn, nameAr: item.nameAr, descEn: item.descEn || '', descAr: item.descAr || '',
    price: item.price, spicy: item.spicy, isNew: item.isNew, collabEn: item.collabEn || '', collabAr: item.collabAr || '',
    cal: item.nutrition.cal || '', protein: item.nutrition.protein || '', carbs: item.nutrition.carbs || '', fat: item.nutrition.fat || '',
  };
}

export default function ItemEditor({ item, onChanged, onDeleted }) {
  const [form, setForm] = useState(() => fieldsFromItem(item));
  const [saving, setSaving] = useState(false);
  const [showBuilder, setShowBuilder] = useState(!!item.buildConfig);
  const [buildSaving, setBuildSaving] = useState(false);

  // Re-sync local form state whenever the item changes from outside this component's
  // own save calls — e.g. a bulk CSV/JSON import updating this item in the background.
  useEffect(() => {
    setForm(fieldsFromItem(item));
  }, [item]);

  function set(k, v) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  async function save() {
    setSaving(true);
    try {
      const updated = await api.updateItem(item.id, form);
      onChanged(updated);
    } finally {
      setSaving(false);
    }
  }

  async function uploadedImage(url) {
    const updated = await api.updateItem(item.id, { image: url });
    onChanged(updated);
  }

  async function saveBuild(steps) {
    setBuildSaving(true);
    try {
      const updated = await api.setBuildConfig(item.id, steps);
      onChanged(updated);
    } finally {
      setBuildSaving(false);
    }
  }

  async function removeBuild() {
    const updated = await api.clearBuildConfig(item.id).then(() => api.updateItem(item.id, {}));
    setShowBuilder(false);
    onChanged(updated);
  }

  return (
    <div style={{ border: '1px solid rgba(0,0,0,0.12)', borderRadius: 14, padding: 14, marginBottom: 12, display: 'flex', gap: 14 }}>
      <ImageSlot src={item.image} shape="rounded" radius={12} editable placeholder="item photo" onUploaded={uploadedImage} style={{ width: 80, height: 80, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <input placeholder="name (EN)" value={form.nameEn} onChange={e => set('nameEn', e.target.value)} style={inputStyle(180)} />
          <input placeholder="name (AR)" value={form.nameAr} onChange={e => set('nameAr', e.target.value)} style={{ ...inputStyle(180), direction: 'rtl' }} />
          <input type="number" step="0.5" placeholder="price" value={form.price} onChange={e => set('price', e.target.value)} style={inputStyle(80)} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <input placeholder="description (EN)" value={form.descEn} onChange={e => set('descEn', e.target.value)} style={inputStyle(280)} />
          <input placeholder="description (AR)" value={form.descAr} onChange={e => set('descAr', e.target.value)} style={{ ...inputStyle(280), direction: 'rtl' }} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <input placeholder="collab credit (EN)" value={form.collabEn} onChange={e => set('collabEn', e.target.value)} style={inputStyle(180)} />
          <input placeholder="collab credit (AR)" value={form.collabAr} onChange={e => set('collabAr', e.target.value)} style={{ ...inputStyle(180), direction: 'rtl' }} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
            <input type="checkbox" checked={form.spicy} onChange={e => set('spicy', e.target.checked)} /> spicy
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
            <input type="checkbox" checked={form.isNew} onChange={e => set('isNew', e.target.checked)} /> new
          </label>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          {['cal', 'protein', 'carbs', 'fat'].map(k => (
            <input key={k} placeholder={k} value={form[k]} onChange={e => set(k, e.target.value)} style={inputStyle(80)} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={save} disabled={saving} style={primaryBtn}>{saving ? 'saving…' : 'save item'}</button>
          <button onClick={() => setShowBuilder(v => !v)} style={secondaryBtn}>
            {showBuilder ? 'hide builder' : 'add build-your-own'}
          </button>
          <button onClick={() => onDeleted(item.id)} style={dangerBtn}>delete item</button>
        </div>
        {showBuilder ? (
          <BuildConfigEditor initialSteps={item.buildConfig} onSave={saveBuild} onRemove={removeBuild} saving={buildSaving} />
        ) : null}
      </div>
    </div>
  );
}

function inputStyle(width) {
  return { width, padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(0,0,0,0.2)', fontSize: 12 };
}
const primaryBtn = { background: '#004438', color: '#fff', border: 'none', borderRadius: 999, padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' };
const secondaryBtn = { background: '#f3f0df', color: '#171a18', border: 'none', borderRadius: 999, padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' };
const dangerBtn = { background: 'none', color: '#b23b3b', border: '1px solid #b23b3b', borderRadius: 999, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' };

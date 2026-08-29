import { useEffect, useState } from 'react';
import { api } from '../../api';
import ImageSlot from '../ImageSlot.jsx';
import BuildConfigEditor from './BuildConfigEditor.jsx';
import { colors, font, field, label, fieldGroup, button } from '../../admin/theme';

function fieldsFromItem(item) {
  return {
    nameEn: item.nameEn, nameAr: item.nameAr, descEn: item.descEn || '', descAr: item.descAr || '',
    price: item.price, spicy: item.spicy, isNew: item.isNew, collabEn: item.collabEn || '', collabAr: item.collabAr || '',
    cal: item.nutrition.cal || '', protein: item.nutrition.protein || '', carbs: item.nutrition.carbs || '', fat: item.nutrition.fat || '',
  };
}

function Toggle({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="admin-btn"
      style={button(active ? 'accent' : 'secondary', { padding: '7px 13px', fontSize: 11.5 })}
    >
      {children}
    </button>
  );
}

export default function ItemEditor({ item, onChanged, onDeleted, onMoveUp, onMoveDown, canMoveUp, canMoveDown }) {
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState(() => fieldsFromItem(item));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
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
    setSaveError('');
    try {
      const updated = await api.updateItem(item.id, form);
      onChanged(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function uploadedImage(url) {
    try {
      const updated = await api.updateItem(item.id, { image: url });
      onChanged(updated);
    } catch (err) {
      setSaveError(err.message);
    }
  }

  async function saveBuild(steps) {
    setBuildSaving(true);
    try {
      const updated = await api.setBuildConfig(item.id, steps);
      onChanged(updated);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setBuildSaving(false);
    }
  }

  async function removeBuild() {
    try {
      await api.clearBuildConfig(item.id);
      const updated = await api.updateItem(item.id, {});
      setShowBuilder(false);
      onChanged(updated);
    } catch (err) {
      setSaveError(err.message);
    }
  }

  const badges = [];
  if (item.spicy) badges.push('spicy');
  if (item.isNew) badges.push('new');
  if (item.buildConfig) badges.push('build-your-own');

  return (
    <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 14, overflow: 'hidden' }} className="admin-card">
      {/* Summary row — always visible */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', cursor: 'pointer' }}
        onClick={() => setExpanded(v => !v)}
      >
        <ImageSlot src={item.image} shape="rounded" radius={10} placeholder="" style={{ width: 44, height: 44, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{item.nameEn}</span>
            <span style={{ color: colors.faint, fontSize: 12.5, direction: 'rtl' }}>{item.nameAr}</span>
          </div>
          {badges.length > 0 && (
            <div style={{ display: 'flex', gap: 5, marginTop: 3, flexWrap: 'wrap' }}>
              {badges.map(b => (
                <span key={b} style={{
                  fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
                  color: colors.accent, background: 'rgba(111,160,136,0.12)', padding: '1px 7px', borderRadius: 999,
                }}>
                  {b}
                </span>
              ))}
            </div>
          )}
        </div>
        <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', flexShrink: 0 }}>{item.price} SAR</div>
        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <button type="button" title="move up" onClick={onMoveUp} disabled={!canMoveUp} className="admin-btn" style={button('icon')}>↑</button>
          <button type="button" title="move down" onClick={onMoveDown} disabled={!canMoveDown} className="admin-btn" style={button('icon')}>↓</button>
        </div>
        <span style={{ color: colors.faint, fontSize: 12, flexShrink: 0, transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform .15s ease' }}>
          ▾
        </span>
      </div>

      {expanded && (
        <div className="admin-fade-in" style={{ padding: '4px 14px 16px', borderTop: `1px solid ${colors.border}`, display: 'flex', gap: 14 }}>
          <ImageSlot src={item.image} shape="rounded" radius={12} editable placeholder="item photo" onUploaded={uploadedImage} style={{ width: 88, height: 88, flexShrink: 0, marginTop: 14 }} />
          <div style={{ flex: 1, minWidth: 0, paddingTop: 14 }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
              <div style={fieldGroup({ flex: '1 1 160px' })}>
                <label style={label()}>name (EN)</label>
                <input className="admin-field" value={form.nameEn} onChange={e => set('nameEn', e.target.value)} style={field()} />
              </div>
              <div style={fieldGroup({ flex: '1 1 160px' })}>
                <label style={label()}>name (AR)</label>
                <input className="admin-field" value={form.nameAr} onChange={e => set('nameAr', e.target.value)} style={{ ...field(), direction: 'rtl' }} />
              </div>
              <div style={fieldGroup({ width: 90 })}>
                <label style={label()}>price</label>
                <input className="admin-field" type="number" step="0.5" value={form.price} onChange={e => set('price', e.target.value)} style={field()} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
              <div style={fieldGroup({ flex: '1 1 220px' })}>
                <label style={label()}>description (EN)</label>
                <input className="admin-field" value={form.descEn} onChange={e => set('descEn', e.target.value)} style={field()} />
              </div>
              <div style={fieldGroup({ flex: '1 1 220px' })}>
                <label style={label()}>description (AR)</label>
                <input className="admin-field" value={form.descAr} onChange={e => set('descAr', e.target.value)} style={{ ...field(), direction: 'rtl' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={fieldGroup({ flex: '1 1 160px' })}>
                <label style={label()}>collab credit (EN)</label>
                <input className="admin-field" value={form.collabEn} onChange={e => set('collabEn', e.target.value)} style={field()} />
              </div>
              <div style={fieldGroup({ flex: '1 1 160px' })}>
                <label style={label()}>collab credit (AR)</label>
                <input className="admin-field" value={form.collabAr} onChange={e => set('collabAr', e.target.value)} style={{ ...field(), direction: 'rtl' }} />
              </div>
              <Toggle active={form.spicy} onClick={() => set('spicy', !form.spicy)}>🌶 spicy</Toggle>
              <Toggle active={form.isNew} onClick={() => set('isNew', !form.isNew)}>new</Toggle>
            </div>

            <div style={fieldGroup({ marginBottom: 12 })}>
              <label style={label()}>nutrition (approx., per serving)</label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {['cal', 'protein', 'carbs', 'fat'].map(k => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: colors.faint, textTransform: 'capitalize', width: 42 }}>{k}</span>
                    <input className="admin-field" value={form[k]} onChange={e => set(k, e.target.value)} style={field(80)} />
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button onClick={save} disabled={saving} className="admin-btn" style={button('primary')}>
                {saving ? 'saving…' : saved ? 'saved ✓' : 'save item'}
              </button>
              <button onClick={() => setShowBuilder(v => !v)} className="admin-btn" style={button('secondary')}>
                {showBuilder ? 'hide builder' : 'add build-your-own'}
              </button>
              <button onClick={() => onDeleted(item.id)} className="admin-btn" style={button('danger')}>delete item</button>
              {saveError && <span style={{ color: colors.danger, fontSize: 12, fontFamily: font }}>{saveError}</span>}
            </div>

            {showBuilder && (
              <BuildConfigEditor initialSteps={item.buildConfig} onSave={saveBuild} onRemove={removeBuild} saving={buildSaving} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

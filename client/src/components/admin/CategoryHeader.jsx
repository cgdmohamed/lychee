import { useEffect, useState } from 'react';
import ImageSlot from '../ImageSlot.jsx';
import { colors, field, label, fieldGroup, button, card } from '../../admin/theme';

export default function CategoryHeader({ category, onSave, onIconUploaded, onDelete }) {
  const [draft, setDraft] = useState({ nameEn: category.nameEn, nameAr: category.nameAr });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft({ nameEn: category.nameEn, nameAr: category.nameAr });
    setSaved(false);
  }, [category.id, category.nameEn, category.nameAr]);

  const dirty = draft.nameEn !== category.nameEn || draft.nameAr !== category.nameAr;

  async function save() {
    setSaving(true);
    try {
      const ok = await onSave(draft);
      if (ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 1800);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ ...card(), marginBottom: 16, display: 'flex', alignItems: 'flex-end', gap: 14, flexWrap: 'wrap' }} className="admin-card">
      <ImageSlot
        src={category.iconImage}
        editable
        onUploaded={onIconUploaded}
        shape="circle"
        placeholder="icon"
        style={{ width: 48, height: 48, flexShrink: 0 }}
      />
      <div style={fieldGroup({ flex: '1 1 160px', minWidth: 140 })}>
        <label style={label()}>name (EN)</label>
        <input
          className="admin-field"
          value={draft.nameEn}
          onChange={e => setDraft(d => ({ ...d, nameEn: e.target.value }))}
          style={{ ...field(), fontWeight: 700, fontSize: 15 }}
        />
      </div>
      <div style={fieldGroup({ flex: '1 1 160px', minWidth: 140 })}>
        <label style={label()}>name (AR)</label>
        <input
          className="admin-field"
          value={draft.nameAr}
          onChange={e => setDraft(d => ({ ...d, nameAr: e.target.value }))}
          style={{ ...field(), fontWeight: 700, fontSize: 15, direction: 'rtl' }}
        />
      </div>
      <button
        type="button"
        onClick={save}
        disabled={!dirty || saving}
        className="admin-btn"
        style={button(dirty ? 'primary' : 'ghost')}
      >
        {saving ? 'saving…' : saved ? 'saved ✓' : 'save'}
      </button>
      <button type="button" onClick={onDelete} className="admin-btn" style={button('danger')}>
        delete category
      </button>
    </div>
  );
}

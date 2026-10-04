import { useState } from 'react';
import { api } from '../../api';
import { colors, button, card, sectionTitle } from '../../admin/theme';

export default function NutritionFactsPanel({ settings, onSaved }) {
  const [enabled, setEnabled] = useState(settings.nutrition_global_enabled !== '0');
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState('');

  const dirty = enabled !== (settings.nutrition_global_enabled !== '0');

  async function save() {
    setSaving(true);
    setError('');
    try {
      await api.setSetting('nutrition_global_enabled', enabled ? '1' : '0');
      onSaved({ nutrition_global_enabled: enabled ? '1' : '0' });
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={card()} className="admin-card">
      <div style={sectionTitle()}>nutrition facts</div>
      <div style={{ fontSize: 11.5, color: colors.faint, lineHeight: 1.4, marginBottom: 12 }}>
        A sitewide switch for nutrition facts. Turning this off hides them everywhere, even for
        items individually marked as shown — turn it back on and each item's own setting (in its
        editor below) takes over again.
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={() => setEnabled(v => !v)}
          className="admin-btn"
          style={button(enabled ? 'accent' : 'secondary', { flex: 1 })}
        >
          {enabled ? 'shown on menu' : 'hidden on menu'}
        </button>
        <button onClick={save} disabled={!dirty || saving} className="admin-btn" style={button(dirty ? 'primary' : 'ghost')}>
          {saving ? 'saving…' : justSaved ? 'saved ✓' : 'save'}
        </button>
      </div>
      {error ? <div style={{ marginTop: 10, fontSize: 12, color: colors.danger }}>{error}</div> : null}
    </div>
  );
}

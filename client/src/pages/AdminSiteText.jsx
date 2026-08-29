import { useEffect, useState } from 'react';
import { api } from '../api';
import AdminHeader from '../components/admin/AdminHeader.jsx';
import { TEXT_GROUPS, settingKeyFor } from '../textFields.js';
import { colors, font, headingFont, field, label, fieldGroup, button, card, sectionTitle } from '../admin/theme';

export default function AdminSiteText() {
  const [saved, setSaved] = useState(null); // settings as last loaded/saved from the server
  const [draft, setDraft] = useState(null); // local edits
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    api.getSettings()
      .then(s => {
        setSaved(s);
        setDraft(s);
      })
      .catch(err => setError(err.message));
  }, []);

  if (error) {
    return <div style={{ padding: 40, fontFamily: font, color: colors.danger }}>Error: {error}</div>;
  }
  if (!draft) {
    return <div style={{ padding: 40, fontFamily: font, color: colors.muted }}>Loading…</div>;
  }

  const dirtyKeys = Object.keys(draft).filter(k => (draft[k] || '') !== (saved[k] || ''));
  const dirty = dirtyKeys.length > 0;

  function setField(fieldKey, lang, value) {
    setDraft(prev => ({ ...prev, [settingKeyFor(fieldKey, lang)]: value }));
    setJustSaved(false);
  }

  function resetField(fieldKey) {
    setDraft(prev => ({ ...prev, [settingKeyFor(fieldKey, 'en')]: '', [settingKeyFor(fieldKey, 'ar')]: '' }));
    setJustSaved(false);
  }

  async function saveAll() {
    setSaving(true);
    setError('');
    try {
      await Promise.all(dirtyKeys.map(k => api.setSetting(k, draft[k] || '')));
      setSaved(draft);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, fontFamily: font, color: colors.ink }}>
      <AdminHeader />

      <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontFamily: headingFont, fontWeight: 700, fontSize: 22 }}>site text</div>
          <button
            onClick={saveAll}
            disabled={!dirty || saving}
            className="admin-btn"
            style={button(dirty ? 'primary' : 'ghost')}
          >
            {saving ? 'saving…' : justSaved ? 'saved ✓' : dirty ? `save ${dirtyKeys.length} change${dirtyKeys.length === 1 ? '' : 's'}` : 'saved'}
          </button>
        </div>
        <p style={{ fontSize: 12.5, color: colors.faint, margin: '0 0 20px' }}>
          Every label, note, and button on the public menu that isn't a menu item — the hero
          tagline, nutrition disclaimer, build-your-own copy. Leave a field blank to use the
          default shown as its placeholder.
        </p>

        {TEXT_GROUPS.map(group => (
          <div key={group.title} style={{ ...card(), marginBottom: 14 }} className="admin-card">
            <div style={sectionTitle()}>{group.title}</div>
            {group.fields.map((f, idx) => {
              const enKey = settingKeyFor(f.key, 'en');
              const arKey = settingKeyFor(f.key, 'ar');
              const isOverridden = !!(draft[enKey] || draft[arKey]);
              return (
                <div
                  key={f.key}
                  style={{
                    display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap',
                    paddingTop: idx > 0 ? 12 : 0, marginTop: idx > 0 ? 12 : 0,
                    borderTop: idx > 0 ? `1px solid ${colors.border}` : 'none',
                  }}
                >
                  <div style={fieldGroup({ flex: '1 1 240px' })}>
                    <label style={label()}>{f.label} (EN)</label>
                    <input
                      className="admin-field"
                      value={draft[enKey] || ''}
                      placeholder={f.defaultEn}
                      onChange={e => setField(f.key, 'en', e.target.value)}
                      style={field()}
                    />
                  </div>
                  <div style={fieldGroup({ flex: '1 1 240px' })}>
                    <label style={label()}>{f.label} (AR)</label>
                    <input
                      className="admin-field"
                      value={draft[arKey] || ''}
                      placeholder={f.defaultAr}
                      onChange={e => setField(f.key, 'ar', e.target.value)}
                      style={{ ...field(), direction: 'rtl' }}
                    />
                  </div>
                  {isOverridden ? (
                    <button
                      type="button"
                      onClick={() => resetField(f.key)}
                      className="admin-btn"
                      style={button('ghost', { padding: '9px 12px', fontSize: 11.5 })}
                      title="clear override, use default"
                    >
                      reset
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

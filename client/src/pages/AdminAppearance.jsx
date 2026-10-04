import { useEffect, useState } from 'react';
import { api } from '../api';
import AdminHeader from '../components/admin/AdminHeader.jsx';
import { colors, font, headingFont, label, fieldGroup, button, card, sectionTitle } from '../admin/theme';

function ColorField({ labelText, value, onChange }) {
  return (
    <div style={fieldGroup({ flex: '1 1 200px' })}>
      <label style={label()}>{labelText}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ width: 44, height: 38, border: `1px solid ${colors.borderStrong}`, borderRadius: 8, padding: 2, cursor: 'pointer', background: '#fff' }}
        />
        <span style={{ fontFamily: 'monospace', fontSize: 13, color: colors.muted }}>{value}</span>
      </div>
    </div>
  );
}

export default function AdminAppearance() {
  const [settings, setSettings] = useState(null);
  const [primary, setPrimary] = useState(colors.primary);
  const [accent, setAccent] = useState(colors.accent);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getSettings()
      .then(s => {
        setSettings(s);
        setPrimary(s.theme_primary || colors.primary);
        setAccent(s.theme_accent || colors.accent);
      })
      .catch(err => setError(err.message));
  }, []);

  const dirty = !!settings && (
    primary !== (settings.theme_primary || colors.primary) ||
    accent !== (settings.theme_accent || colors.accent)
  );

  async function save() {
    setSaving(true);
    setError('');
    try {
      await Promise.all([
        api.setSetting('theme_primary', primary),
        api.setSetting('theme_accent', accent),
      ]);
      setSettings(prev => ({ ...prev, theme_primary: primary, theme_accent: accent }));
      // Reflect immediately in this tab too, not just on the public menu's next load.
      document.documentElement.style.setProperty('--brand-primary', primary);
      document.documentElement.style.setProperty('--brand-accent', accent);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function resetToDefault() {
    setPrimary(colors.primary);
    setAccent(colors.accent);
  }

  if (error && !settings) {
    return <div style={{ padding: 40, fontFamily: font, color: colors.danger }}>Error: {error}</div>;
  }
  if (!settings) {
    return <div style={{ padding: 40, fontFamily: font, color: colors.muted }}>Loading…</div>;
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, fontFamily: font, color: colors.ink }}>
      <AdminHeader />

      <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
        <div style={{ fontFamily: headingFont, fontWeight: 700, fontSize: 22, marginBottom: 16 }}>appearance</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={card()} className="admin-card">
            <div style={sectionTitle()}>brand colors</div>
            <p style={{ fontSize: 12.5, color: colors.faint, margin: '0 0 14px' }}>
              These two colors drive the public menu's buttons, badges, and highlights — and this
              admin dashboard's own buttons and active tab too, so pick something you can still
              read white text on.
            </p>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <ColorField labelText="primary" value={primary} onChange={setPrimary} />
              <ColorField labelText="accent" value={accent} onChange={setAccent} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
              <button onClick={save} disabled={!dirty || saving} className="admin-btn" style={button(dirty ? 'primary' : 'ghost')}>
                {saving ? 'saving…' : justSaved ? 'saved ✓' : 'save'}
              </button>
              <button type="button" onClick={resetToDefault} className="admin-btn" style={button('ghost')}>
                reset to default
              </button>
            </div>
            {error ? <div style={{ marginTop: 10, fontSize: 12, color: colors.danger }}>{error}</div> : null}
          </div>

          <div style={card()} className="admin-card">
            <div style={sectionTitle()}>preview</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{
                fontWeight: 700, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase',
                background: primary, color: '#fffffc', borderRadius: 999, padding: '10px 18px',
              }}>
                english
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                color: primary, border: `1px solid ${primary}`, borderRadius: 999, padding: '2px 8px',
              }}>
                new
              </span>
              <span style={{ fontStyle: 'italic', fontSize: 13, color: accent }}>with chef mohamed</span>
              <span style={{
                fontSize: 12, fontWeight: 700, color: '#fffffc', background: accent,
                border: 'none', borderRadius: 999, padding: '8px 14px',
              }}>
                build your own
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

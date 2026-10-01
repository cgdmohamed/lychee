import { useEffect, useState } from 'react';
import { api } from '../api';
import AdminHeader from '../components/admin/AdminHeader.jsx';
import ImageSlot from '../components/ImageSlot.jsx';
import { colors, font, headingFont, field, label, fieldGroup, button, card, sectionTitle } from '../admin/theme';

const DEFAULT_BRAND_NAME = "lychee's";

const SOCIAL_PLATFORMS = [
  { key: 'instagram', label: 'Instagram', placeholder: 'https://www.instagram.com/yourhandle' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://www.tiktok.com/@yourhandle' },
  { key: 'snapchat', label: 'Snapchat', placeholder: 'https://www.snapchat.com/add/yourhandle' },
];

function BrandIdentity({ settings, onSaved }) {
  const [name, setName] = useState(settings.brand_name || '');
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState('');

  const dirty = name !== (settings.brand_name || '');

  async function saveName() {
    setSaving(true);
    setError('');
    try {
      await api.setSetting('brand_name', name.trim());
      onSaved({ brand_name: name.trim() });
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function uploadedLogo(url) {
    try {
      await api.setSetting('logoImage', url);
      onSaved({ logoImage: url });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={card()} className="admin-card">
      <div style={sectionTitle()}>brand identity</div>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={fieldGroup({ flex: '1 1 240px' })}>
          <label style={label()}>brand name</label>
          <input
            className="admin-field"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={DEFAULT_BRAND_NAME}
            style={field()}
          />
        </div>
        <button onClick={saveName} disabled={!dirty || saving} className="admin-btn" style={button(dirty ? 'primary' : 'ghost')}>
          {saving ? 'saving…' : justSaved ? 'saved ✓' : 'save'}
        </button>
      </div>
      <p style={{ fontSize: 12, color: colors.faint, margin: '8px 0 14px' }}>
        Shown on the logo's alt text and in the WhatsApp order message. Leave blank to use the
        default, "{DEFAULT_BRAND_NAME}".
      </p>
      <div>
        <label style={label()}>logo</label>
        <ImageSlot
          src={settings.logoImage}
          editable
          onUploaded={uploadedLogo}
          placeholder="click to upload logo"
          shape="rect"
          style={{ width: 220, height: 64, borderRadius: 10 }}
        />
        <p style={{ fontSize: 11.5, color: colors.faint, margin: '8px 0 0' }}>
          Shown in the public menu's header and footer. Leave unset to use the default logo.
        </p>
      </div>
      {error ? <div style={{ marginTop: 10, fontSize: 12, color: colors.danger }}>{error}</div> : null}
    </div>
  );
}

function SocialLinksSettings({ settings, onSaved }) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(SOCIAL_PLATFORMS.map(p => [p.key, settings[`social_${p.key}`] || '']))
  );
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState('');

  const dirty = SOCIAL_PLATFORMS.some(p => values[p.key] !== (settings[`social_${p.key}`] || ''));

  async function save() {
    setSaving(true);
    setError('');
    try {
      await Promise.all(SOCIAL_PLATFORMS.map(p => api.setSetting(`social_${p.key}`, values[p.key].trim())));
      onSaved(Object.fromEntries(SOCIAL_PLATFORMS.map(p => [`social_${p.key}`, values[p.key].trim()])));
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
      <div style={sectionTitle()}>social media</div>
      <p style={{ fontSize: 12.5, color: colors.faint, margin: '0 0 14px' }}>
        Shown as icon links in the public menu's footer. Leave a field blank to hide that platform.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {SOCIAL_PLATFORMS.map(p => (
          <div key={p.key} style={fieldGroup()}>
            <label style={label()}>{p.label}</label>
            <input
              className="admin-field"
              value={values[p.key]}
              onChange={e => setValues(prev => ({ ...prev, [p.key]: e.target.value }))}
              placeholder={p.placeholder}
              style={field()}
            />
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14 }}>
        <button onClick={save} disabled={!dirty || saving} className="admin-btn" style={button(dirty ? 'primary' : 'ghost')}>
          {saving ? 'saving…' : justSaved ? 'saved ✓' : 'save'}
        </button>
      </div>
      {error ? <div style={{ marginTop: 10, fontSize: 12, color: colors.danger }}>{error}</div> : null}
    </div>
  );
}

function WhatsappSettings({ settings, onSaved }) {
  const [enabled, setEnabled] = useState(settings.whatsapp_enabled === '1');
  const [number, setNumber] = useState(settings.whatsapp_number || '');
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState('');

  const dirty = enabled !== (settings.whatsapp_enabled === '1') || number !== (settings.whatsapp_number || '');

  async function save() {
    setSaving(true);
    setError('');
    try {
      await Promise.all([
        api.setSetting('whatsapp_enabled', enabled ? '1' : '0'),
        api.setSetting('whatsapp_number', number.trim()),
      ]);
      onSaved({ whatsapp_enabled: enabled ? '1' : '0', whatsapp_number: number.trim() });
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
      <div style={sectionTitle()}>whatsapp ordering</div>
      <p style={{ fontSize: 12.5, color: colors.faint, margin: '0 0 14px' }}>
        When enabled, every item's detail popup shows an "order on WhatsApp" button that opens a
        chat pre-filled with the item name and price — no cart or checkout page, the customer just
        sends the message.
      </p>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setEnabled(v => !v)}
          className="admin-btn"
          style={button(enabled ? 'accent' : 'secondary', { minWidth: 110 })}
        >
          {enabled ? 'enabled' : 'disabled'}
        </button>
        <div style={fieldGroup({ flex: '1 1 220px' })}>
          <label style={label()}>whatsapp number (with country code, e.g. 9665XXXXXXXX)</label>
          <input
            className="admin-field"
            value={number}
            onChange={e => setNumber(e.target.value)}
            placeholder="9665XXXXXXXX"
            style={field()}
          />
        </div>
        <button onClick={save} disabled={!dirty || saving} className="admin-btn" style={button(dirty ? 'primary' : 'ghost')}>
          {saving ? 'saving…' : justSaved ? 'saved ✓' : 'save'}
        </button>
      </div>
      {enabled && !number.trim() ? (
        <div style={{ marginTop: 10, fontSize: 12, color: colors.danger }}>
          Enabled but no number set — the order button won't appear until you add one.
        </div>
      ) : null}
      {error ? <div style={{ marginTop: 10, fontSize: 12, color: colors.danger }}>{error}</div> : null}
    </div>
  );
}

export default function AdminBrand() {
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getSettings().then(setSettings).catch(err => setError(err.message));
  }, []);

  function patch(update) {
    setSettings(prev => ({ ...prev, ...update }));
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
        <div style={{ fontFamily: headingFont, fontWeight: 700, fontSize: 22, marginBottom: 16 }}>brand</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <BrandIdentity settings={settings} onSaved={patch} />
          <SocialLinksSettings settings={settings} onSaved={patch} />
          <WhatsappSettings settings={settings} onSaved={patch} />
        </div>
      </div>
    </div>
  );
}

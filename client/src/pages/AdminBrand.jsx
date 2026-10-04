import { useEffect, useState } from 'react';
import { api } from '../api';
import AdminHeader from '../components/admin/AdminHeader.jsx';
import ImageSlot from '../components/ImageSlot.jsx';
import { colors, font, headingFont, field, label, fieldGroup, button, card, sectionTitle } from '../admin/theme';
import { applyFavicon } from '../siteSettings.js';

const DEFAULT_BRAND_NAME_EN = "lychee's";
const DEFAULT_BRAND_NAME_AR = 'لايتشي';

const SOCIAL_PLATFORMS = [
  { key: 'instagram', label: 'Instagram', placeholder: 'https://www.instagram.com/yourhandle' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://www.tiktok.com/@yourhandle' },
  { key: 'snapchat', label: 'Snapchat', placeholder: 'https://www.snapchat.com/add/yourhandle' },
  { key: 'facebook', label: 'Facebook', placeholder: 'https://www.facebook.com/yourpage' },
  { key: 'x', label: 'X (Twitter)', placeholder: 'https://x.com/yourhandle' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://www.youtube.com/@yourhandle' },
  { key: 'threads', label: 'Threads', placeholder: 'https://www.threads.net/@yourhandle' },
];

function BrandIdentity({ settings, onSaved }) {
  const [nameEn, setNameEn] = useState(settings.brand_name_en || '');
  const [nameAr, setNameAr] = useState(settings.brand_name_ar || '');
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState('');

  const dirty = nameEn !== (settings.brand_name_en || '') || nameAr !== (settings.brand_name_ar || '');

  async function saveName() {
    setSaving(true);
    setError('');
    try {
      await Promise.all([
        api.setSetting('brand_name_en', nameEn.trim()),
        api.setSetting('brand_name_ar', nameAr.trim()),
      ]);
      onSaved({ brand_name_en: nameEn.trim(), brand_name_ar: nameAr.trim() });
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

  async function uploadedFavicon(url) {
    try {
      await api.setSetting('faviconImage', url);
      onSaved({ faviconImage: url });
      // Reflect immediately in this tab too — RequireAuth only applies it once, on
      // the first mount of each admin route, so it wouldn't otherwise pick up a
      // favicon change until the next navigation or reload.
      applyFavicon({ faviconImage: url });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={card()} className="admin-card">
      <div style={sectionTitle()}>brand identity</div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <div style={fieldGroup({ flex: '1 1 200px' })}>
          <label style={label()}>brand name (EN)</label>
          <input
            className="admin-field"
            value={nameEn}
            onChange={e => setNameEn(e.target.value)}
            placeholder={DEFAULT_BRAND_NAME_EN}
            style={field()}
          />
        </div>
        <div style={fieldGroup({ flex: '1 1 200px' })}>
          <label style={label()}>brand name (AR)</label>
          <input
            className="admin-field"
            value={nameAr}
            onChange={e => setNameAr(e.target.value)}
            placeholder={DEFAULT_BRAND_NAME_AR}
            style={{ ...field(), direction: 'rtl' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button onClick={saveName} disabled={!dirty || saving} className="admin-btn" style={button(dirty ? 'primary' : 'ghost')}>
            {saving ? 'saving…' : justSaved ? 'saved ✓' : 'save'}
          </button>
        </div>
      </div>
      <p style={{ fontSize: 12, color: colors.faint, margin: '0 0 14px' }}>
        Shown on the logo's alt text and in the WhatsApp order message, per language. Leave a
        field blank to use its default.
      </p>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div>
          <label style={label()}>logo</label>
          <ImageSlot
            src={settings.logoImage}
            editable
            onUploaded={uploadedLogo}
            placeholder="click to upload logo"
            shape="rect"
            fit="contain"
            style={{ width: 220, height: 64, borderRadius: 10 }}
          />
          <p style={{ fontSize: 11.5, color: colors.faint, margin: '8px 0 0', maxWidth: 220 }}>
            Shown in the public menu's header and footer. Leave unset to use the default logo.
          </p>
        </div>
        <div>
          <label style={label()}>favicon</label>
          <ImageSlot
            src={settings.faviconImage}
            editable
            onUploaded={uploadedFavicon}
            placeholder="upload"
            shape="rounded"
            fit="contain"
            style={{ width: 64, height: 64, borderRadius: 10 }}
          />
          <p style={{ fontSize: 11.5, color: colors.faint, margin: '8px 0 0', maxWidth: 160 }}>
            The browser tab icon. Leave unset to use the default logo mark.
          </p>
        </div>
      </div>
      {error ? <div style={{ marginTop: 10, fontSize: 12, color: colors.danger }}>{error}</div> : null}
    </div>
  );
}

function DefaultLanguageSettings({ settings, onSaved }) {
  const [lang, setLang] = useState(settings.default_lang === 'ar' ? 'ar' : 'en');
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState('');

  const currentDefault = settings.default_lang === 'ar' ? 'ar' : 'en';
  const dirty = lang !== currentDefault;

  async function save() {
    setSaving(true);
    setError('');
    try {
      await api.setSetting('default_lang', lang);
      onSaved({ default_lang: lang });
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
      <div style={sectionTitle()}>default language</div>
      <p style={{ fontSize: 12.5, color: colors.faint, margin: '0 0 14px' }}>
        Which language the public menu opens in before a visitor picks their own.
      </p>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setLang('en')}
          className="admin-btn"
          style={button(lang === 'en' ? 'accent' : 'secondary', { minWidth: 100 })}
        >
          English
        </button>
        <button
          type="button"
          onClick={() => setLang('ar')}
          className="admin-btn"
          style={button(lang === 'ar' ? 'accent' : 'secondary', { minWidth: 100 })}
        >
          العربية
        </button>
        <button onClick={save} disabled={!dirty || saving} className="admin-btn" style={button(dirty ? 'primary' : 'ghost')}>
          {saving ? 'saving…' : justSaved ? 'saved ✓' : 'save'}
        </button>
      </div>
      {error ? <div style={{ marginTop: 10, fontSize: 12, color: colors.danger }}>{error}</div> : null}
    </div>
  );
}

function CurrencySettings({ settings, onSaved }) {
  const [symbol, setSymbol] = useState(settings.currency_symbol || '');
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState('');

  const dirty = symbol !== (settings.currency_symbol || '');

  async function save() {
    setSaving(true);
    setError('');
    try {
      await api.setSetting('currency_symbol', symbol.trim());
      onSaved({ currency_symbol: symbol.trim() });
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
      <div style={sectionTitle()}>currency</div>
      <p style={{ fontSize: 12.5, color: colors.faint, margin: '0 0 14px' }}>
        Shown next to every price. Leave blank to keep the official Saudi Riyal symbol icon;
        set a value (e.g. "$", "AED", "USD") to show that text instead.
      </p>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={fieldGroup({ width: 140 })}>
          <label style={label()}>currency symbol</label>
          <input
            className="admin-field"
            value={symbol}
            onChange={e => setSymbol(e.target.value)}
            placeholder="SAR"
            style={field()}
          />
        </div>
        <button onClick={save} disabled={!dirty || saving} className="admin-btn" style={button(dirty ? 'primary' : 'ghost')}>
          {saving ? 'saving…' : justSaved ? 'saved ✓' : 'save'}
        </button>
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

const DEFAULT_WHATSAPP_MESSAGE_EN = "Hi! I'd like to order: {item} ({price} {currency}) — from the {brand} menu";
const DEFAULT_WHATSAPP_MESSAGE_AR = 'مرحباً! أرغب بطلب: {item} ({price} {currency}) — من قائمة {brand}';

function WhatsappSettings({ settings, onSaved }) {
  const [enabled, setEnabled] = useState(settings.whatsapp_enabled === '1');
  const [number, setNumber] = useState(settings.whatsapp_number || '');
  const [messageEn, setMessageEn] = useState(settings.whatsapp_message_en || '');
  const [messageAr, setMessageAr] = useState(settings.whatsapp_message_ar || '');
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState('');

  const dirty = enabled !== (settings.whatsapp_enabled === '1')
    || number !== (settings.whatsapp_number || '')
    || messageEn !== (settings.whatsapp_message_en || '')
    || messageAr !== (settings.whatsapp_message_ar || '');

  async function save() {
    setSaving(true);
    setError('');
    try {
      await Promise.all([
        api.setSetting('whatsapp_enabled', enabled ? '1' : '0'),
        api.setSetting('whatsapp_number', number.trim()),
        api.setSetting('whatsapp_message_en', messageEn.trim()),
        api.setSetting('whatsapp_message_ar', messageAr.trim()),
      ]);
      onSaved({
        whatsapp_enabled: enabled ? '1' : '0',
        whatsapp_number: number.trim(),
        whatsapp_message_en: messageEn.trim(),
        whatsapp_message_ar: messageAr.trim(),
      });
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
        chat pre-filled with the message below — no cart or checkout page, the customer just
        sends it.
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
      </div>
      {enabled && !number.trim() ? (
        <div style={{ marginTop: 10, fontSize: 12, color: colors.danger }}>
          Enabled but no number set — the order button won't appear until you add one.
        </div>
      ) : null}

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={fieldGroup()}>
          <label style={label()}>order message (EN)</label>
          <textarea
            className="admin-field"
            value={messageEn}
            onChange={e => setMessageEn(e.target.value)}
            placeholder={DEFAULT_WHATSAPP_MESSAGE_EN}
            rows={2}
            style={{ ...field(), minHeight: 56, resize: 'vertical', fontFamily: 'inherit' }}
          />
        </div>
        <div style={fieldGroup()}>
          <label style={label()}>order message (AR)</label>
          <textarea
            className="admin-field"
            value={messageAr}
            onChange={e => setMessageAr(e.target.value)}
            placeholder={DEFAULT_WHATSAPP_MESSAGE_AR}
            rows={2}
            style={{ ...field(), minHeight: 56, resize: 'vertical', fontFamily: 'inherit', direction: 'rtl' }}
          />
        </div>
        <p style={{ fontSize: 11, color: colors.faint, margin: 0 }}>
          Placeholders: <code>{'{item}'}</code> item name, <code>{'{price}'}</code> price,{' '}
          <code>{'{currency}'}</code> currency, <code>{'{brand}'}</code> brand name. Leave a field
          blank to use its default message.
        </p>
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
          <DefaultLanguageSettings settings={settings} onSaved={patch} />
          <CurrencySettings settings={settings} onSaved={patch} />
          <SocialLinksSettings settings={settings} onSaved={patch} />
          <WhatsappSettings settings={settings} onSaved={patch} />
        </div>
      </div>
    </div>
  );
}

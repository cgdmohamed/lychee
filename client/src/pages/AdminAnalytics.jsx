import { useEffect, useState } from 'react';
import { api } from '../api';
import AdminHeader from '../components/admin/AdminHeader.jsx';
import { colors, font, headingFont, field, label, fieldGroup, button, card, sectionTitle } from '../admin/theme';

function StatTile({ value, label: tileLabel }) {
  return (
    <div style={{ ...card(), textAlign: 'center', flex: '1 1 140px' }} className="admin-card">
      <div style={{ fontFamily: headingFont, fontWeight: 700, fontSize: 28, color: colors.primary }}>{value}</div>
      <div style={{ fontSize: 11.5, color: colors.faint, marginTop: 2 }}>{tileLabel}</div>
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

function QrCodePanel() {
  const [qr, setQr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getQrCode()
      .then(setQr)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={card()} className="admin-card">
      <div style={sectionTitle()}>qr code</div>
      <p style={{ fontSize: 12.5, color: colors.faint, margin: '0 0 14px' }}>
        Print this on a table tent, flyer, or your storefront. Scans are tracked separately from
        other visits (see "QR scans" above) so you can tell how much traffic it's driving.
      </p>
      {loading ? (
        <div style={{ fontSize: 12.5, color: colors.faint }}>generating…</div>
      ) : error ? (
        <div style={{ fontSize: 12.5, color: colors.danger }}>{error}</div>
      ) : (
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <img src={qr.dataUrl} alt="QR code linking to the menu" style={{ width: 160, height: 160, borderRadius: 12, border: `1px solid ${colors.border}` }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: '1 1 200px', minWidth: 180 }}>
            <div style={{ fontSize: 12, color: colors.muted, wordBreak: 'break-all' }}>{qr.targetUrl}</div>
            <a
              href={qr.dataUrl}
              download="lychee-menu-qr.png"
              className="admin-btn"
              style={{ ...button('secondary'), textAlign: 'center', textDecoration: 'none', width: 'fit-content' }}
            >
              ↓ download PNG
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminAnalytics() {
  const [settings, setSettings] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState('');

  function load() {
    Promise.all([api.getSettings(), api.getAnalytics()])
      .then(([s, a]) => {
        setSettings(s);
        setAnalytics(a);
      })
      .catch(err => setError(err.message));
  }

  useEffect(load, []);

  if (error) {
    return <div style={{ padding: 40, fontFamily: font, color: colors.danger }}>Error: {error}</div>;
  }
  if (!settings || !analytics) {
    return <div style={{ padding: 40, fontFamily: font, color: colors.muted }}>Loading…</div>;
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, fontFamily: font, color: colors.ink }}>
      <AdminHeader />

      <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
        <div style={{ fontFamily: headingFont, fontWeight: 700, fontSize: 22, marginBottom: 16 }}>analytics</div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <StatTile value={analytics.totals.pageViews} label="page views" />
          <StatTile value={analytics.totals.itemViews} label="item views" />
          <StatTile value={analytics.totals.whatsappClicks} label="whatsapp clicks" />
          <StatTile value={analytics.totals.qrScans} label="QR scans" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <WhatsappSettings settings={settings} onSaved={patch => setSettings(prev => ({ ...prev, ...patch }))} />
          <QrCodePanel />

          <div style={card()} className="admin-card">
            <div style={sectionTitle()}>top items</div>
            {analytics.topItems.length === 0 ? (
              <div style={{ fontSize: 12.5, color: colors.faint }}>no item views yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {analytics.topItems.map(item => (
                  <div
                    key={item.id}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 4px', borderBottom: `1px solid ${colors.border}`, fontSize: 13 }}
                  >
                    <span>{item.nameEn}</span>
                    <span style={{ color: colors.faint, fontSize: 12, whiteSpace: 'nowrap' }}>
                      {item.views} view{item.views === 1 ? '' : 's'} · {item.whatsappClicks} whatsapp
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

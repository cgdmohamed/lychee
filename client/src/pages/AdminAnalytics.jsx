import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import AdminHeader from '../components/admin/AdminHeader.jsx';
import { colors, brand, font, headingFont, button, card, sectionTitle, field, label, fieldGroup } from '../admin/theme';

const RANGE_PRESETS = [
  { key: 'today', text: 'today', days: 0 },
  { key: '7d', text: '7 days', days: 7 },
  { key: '30d', text: '30 days', days: 30 },
  { key: '90d', text: '90 days', days: 90 },
  { key: 'all', text: 'all time', days: null },
];

// analytics_events.created_at is stored as SQLite's `datetime('now')` format — UTC,
// space-separated, second precision, no "T"/"Z" — which a plain `.toISOString()`
// string would sort *after* even for the same instant, silently failing every
// `created_at >= @from` comparison. Match the stored format exactly instead.
function toSqliteDatetime(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

function presetFrom(days) {
  if (days == null) return undefined;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return toSqliteDatetime(d);
}

function StatTile({ value, label: tileLabel }) {
  return (
    <div style={{ ...card(), textAlign: 'center', flex: '1 1 140px' }} className="admin-card">
      <div style={{ fontFamily: headingFont, fontWeight: 700, fontSize: 28, color: brand.primary }}>{value}</div>
      <div style={{ fontSize: 11.5, color: colors.faint, marginTop: 2 }}>{tileLabel}</div>
    </div>
  );
}

function selectStyle() {
  return { ...field(), minHeight: 36, padding: '7px 10px', cursor: 'pointer' };
}

function QrCodesPanel({ from, codes, loading, error, onCreated, onDeleted }) {
  const [newLabel, setNewLabel] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  async function handleCreate(e) {
    e.preventDefault();
    if (!newLabel.trim()) return;
    setCreating(true);
    setCreateError('');
    try {
      const created = await api.createQrCode(newLabel.trim());
      onCreated(created);
      setNewLabel('');
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(code) {
    if (!confirm(`Delete the "${code.label}" QR code? Its past scans stay in the stats above, just no longer labeled.`)) return;
    try {
      await api.deleteQrCode(code.id);
      onDeleted(code.id);
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div style={card()} className="admin-card">
      <div style={sectionTitle()}>qr codes & links</div>
      <p style={{ fontSize: 12.5, color: colors.faint, margin: '0 0 14px' }}>
        Generate a separate QR code (or just share its link) per branch, table tent, or ad
        campaign — each tracks its own scans, item views, and WhatsApp clicks below
        {from ? ', over the selected time range' : ''}. Print one on a flyer, paste another in an
        Instagram bio link, and compare which one actually drives traffic.
      </p>

      <form onSubmit={handleCreate} style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          className="admin-field"
          value={newLabel}
          onChange={e => setNewLabel(e.target.value)}
          placeholder="e.g. Downtown branch, Instagram ad"
          style={{ ...field(), flex: '1 1 220px' }}
        />
        <button type="submit" disabled={creating || !newLabel.trim()} className="admin-btn" style={button('primary')}>
          {creating ? 'generating…' : '+ generate'}
        </button>
      </form>
      {createError ? <div style={{ fontSize: 12, color: colors.danger, marginBottom: 12 }}>{createError}</div> : null}

      {loading ? (
        <div style={{ fontSize: 12.5, color: colors.faint }}>loading…</div>
      ) : error ? (
        <div style={{ fontSize: 12.5, color: colors.danger }}>{error}</div>
      ) : codes.length === 0 ? (
        <div style={{ fontSize: 12.5, color: colors.faint }}>no QR codes yet — generate one above</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {codes.map(qr => (
            <div key={qr.id} style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', paddingTop: 14, borderTop: `1px solid ${colors.border}` }}>
              <img src={qr.dataUrl} alt={`QR code for ${qr.label}`} style={{ width: 84, height: 84, borderRadius: 10, border: `1px solid ${colors.border}`, flexShrink: 0 }} />
              <div style={{ flex: '1 1 200px', minWidth: 160 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{qr.label}</div>
                <div style={{ fontSize: 11.5, color: colors.muted, wordBreak: 'break-all', margin: '2px 0 6px' }}>{qr.targetUrl}</div>
                <div style={{ fontSize: 12, color: colors.faint }}>
                  {qr.scans} scan{qr.scans === 1 ? '' : 's'} · {qr.itemViews} item view{qr.itemViews === 1 ? '' : 's'} · {qr.whatsappClicks} whatsapp
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                <a
                  href={qr.dataUrl}
                  download={`lychee-qr-${qr.slug}.png`}
                  className="admin-btn"
                  style={{ ...button('secondary'), textAlign: 'center', textDecoration: 'none' }}
                >
                  ↓ download
                </a>
                <button onClick={() => handleDelete(qr)} className="admin-btn" style={button('danger')}>
                  delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminAnalytics() {
  const [range, setRange] = useState('30d');
  const [source, setSource] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [qrCodes, setQrCodes] = useState([]);
  const [qrLoading, setQrLoading] = useState(true);
  const [qrError, setQrError] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState('');

  const from = useMemo(() => presetFrom(RANGE_PRESETS.find(p => p.key === range)?.days), [range]);

  useEffect(() => {
    api.adminGetCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setQrLoading(true);
    setQrError('');
    api.getQrCodes({ from })
      .then(setQrCodes)
      .catch(err => setQrError(err.message))
      .finally(() => setQrLoading(false));
  }, [from]);

  useEffect(() => {
    setError('');
    api.getAnalytics({ from, source, categoryId })
      .then(setAnalytics)
      .catch(err => setError(err.message));
  }, [from, source, categoryId]);

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, fontFamily: font, color: colors.ink }}>
      <AdminHeader />

      <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
        <div style={{ fontFamily: headingFont, fontWeight: 700, fontSize: 22, marginBottom: 16 }}>analytics</div>

        <div style={{ ...card(), marginBottom: 16, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }} className="admin-card">
          <div style={fieldGroup({ flex: '0 0 auto' })}>
            <span style={label()}>duration</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {RANGE_PRESETS.map(p => (
                <button
                  key={p.key}
                  onClick={() => setRange(p.key)}
                  className="admin-btn"
                  style={button(range === p.key ? 'accent' : 'secondary', { padding: '7px 12px', fontSize: 12 })}
                >
                  {p.text}
                </button>
              ))}
            </div>
          </div>
          <div style={fieldGroup({ flex: '1 1 180px' })}>
            <label style={label()}>source</label>
            <select value={source} onChange={e => setSource(e.target.value)} style={selectStyle()}>
              <option value="">all sources</option>
              {qrCodes.map(qr => (
                <option key={qr.slug} value={qr.slug}>{qr.label}</option>
              ))}
            </select>
          </div>
          <div style={fieldGroup({ flex: '1 1 180px' })}>
            <label style={label()}>category (top items)</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} style={selectStyle()}>
              <option value="">all categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nameEn}</option>
              ))}
            </select>
          </div>
        </div>

        {error ? (
          <div style={{ fontSize: 12.5, color: colors.danger, marginBottom: 16 }}>Error: {error}</div>
        ) : !analytics ? (
          <div style={{ fontSize: 12.5, color: colors.muted, marginBottom: 16 }}>loading…</div>
        ) : (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <StatTile value={analytics.totals.pageViews} label="page views" />
            <StatTile value={analytics.totals.itemViews} label="item views" />
            <StatTile value={analytics.totals.whatsappClicks} label="whatsapp clicks" />
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <QrCodesPanel
            from={from}
            codes={qrCodes}
            loading={qrLoading}
            error={qrError}
            onCreated={created => setQrCodes(prev => [created, ...prev])}
            onDeleted={id => setQrCodes(prev => prev.filter(c => c.id !== id))}
          />

          <div style={card()} className="admin-card">
            <div style={sectionTitle()}>top items</div>
            {!analytics ? null : analytics.topItems.length === 0 ? (
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

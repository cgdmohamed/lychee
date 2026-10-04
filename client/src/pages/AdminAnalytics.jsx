import { useEffect, useState } from 'react';
import { api } from '../api';
import AdminHeader from '../components/admin/AdminHeader.jsx';
import { colors, brand, font, headingFont, button, card, sectionTitle } from '../admin/theme';

function StatTile({ value, label: tileLabel }) {
  return (
    <div style={{ ...card(), textAlign: 'center', flex: '1 1 140px' }} className="admin-card">
      <div style={{ fontFamily: headingFont, fontWeight: 700, fontSize: 28, color: brand.primary }}>{value}</div>
      <div style={{ fontSize: 11.5, color: colors.faint, marginTop: 2 }}>{tileLabel}</div>
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
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getAnalytics().then(setAnalytics).catch(err => setError(err.message));
  }, []);

  if (error) {
    return <div style={{ padding: 40, fontFamily: font, color: colors.danger }}>Error: {error}</div>;
  }
  if (!analytics) {
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

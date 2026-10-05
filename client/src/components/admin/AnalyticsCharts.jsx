import { useState } from 'react';
import { colors, font } from '../../admin/theme';

// Validated categorical slots 1-3 (blue/orange/aqua) from the dataviz palette — passes
// every adjacent-pair CVD/contrast gate for a 3-series line chart in light mode. Kept
// as literal hex (not the brand CSS vars) since a restaurant's brand accent isn't
// necessarily colorblind-safe or legible as a chart series.
const SERIES_DEFS = [
  { key: 'pageViews', label: 'page views', color: '#2a78d6' },
  { key: 'itemViews', label: 'item views', color: '#eb6834' },
  { key: 'whatsappClicks', label: 'whatsapp clicks', color: '#1baf7a' },
];

const CHART_W = 640;
const CHART_H = 220;
const PAD = { top: 16, right: 12, bottom: 24, left: 34 };

function niceMax(value) {
  if (value <= 0) return 4;
  const pow = 10 ** Math.floor(Math.log10(value));
  const n = value / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

function formatDay(iso) {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

// Fills every calendar day between the series' own bounds (or [from, today] when an
// explicit lower bound is known) with zero activity, so the line doesn't silently
// skip — and visually compress — days with no events.
export function fillDailyGaps(series, fromIso) {
  if (!series.length && !fromIso) return [];
  const byDay = new Map(series.map(row => [row.day, row]));
  const start = fromIso ? fromIso.slice(0, 10) : series[0].day;
  const end = series.length ? series[series.length - 1].day : new Date().toISOString().slice(0, 10);
  const todayIso = new Date().toISOString().slice(0, 10);
  const last = end > todayIso ? todayIso : end;

  const out = [];
  for (let d = new Date(`${start}T00:00:00Z`); d <= new Date(`${last}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 1)) {
    const day = d.toISOString().slice(0, 10);
    const row = byDay.get(day);
    out.push({
      date: day,
      pageViews: row?.pageViews || 0,
      itemViews: row?.itemViews || 0,
      whatsappClicks: row?.whatsappClicks || 0,
    });
  }
  return out;
}

function Legend() {
  return (
    <div style={{ display: 'flex', gap: 16, marginBottom: 10, flexWrap: 'wrap' }}>
      {SERIES_DEFS.map(s => (
        <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: colors.muted, fontFamily: font }}>
          <span style={{ width: 14, height: 2, background: s.color, display: 'inline-block', borderRadius: 1 }} />
          {s.label}
        </div>
      ))}
    </div>
  );
}

export function TrendChart({ series }) {
  const [hoverIdx, setHoverIdx] = useState(null);
  const [showTable, setShowTable] = useState(false);
  const n = series.length;
  const plotW = CHART_W - PAD.left - PAD.right;
  const plotH = CHART_H - PAD.top - PAD.bottom;
  const maxVal = Math.max(1, ...series.flatMap(d => SERIES_DEFS.map(s => d[s.key])));
  const yMax = niceMax(maxVal);
  const xStep = n > 1 ? plotW / (n - 1) : 0;

  const xAt = i => PAD.left + i * xStep;
  const yAt = v => PAD.top + plotH - (v / yMax) * plotH;
  const pathFor = key => series.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(1)} ${yAt(d[key]).toFixed(1)}`).join(' ');
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(yMax * f));

  function handleMove(e) {
    if (n === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CHART_W;
    const idx = xStep ? Math.round((x - PAD.left) / xStep) : 0;
    setHoverIdx(Math.min(n - 1, Math.max(0, idx)));
  }

  const hovered = hoverIdx != null ? series[hoverIdx] : null;
  const tooltipPct = hoverIdx != null ? (xAt(hoverIdx) / CHART_W) * 100 : 0;
  const tooltipAlignEnd = tooltipPct > 65;

  return (
    <div>
      <Legend />
      {n === 0 ? (
        <div style={{ fontSize: 12.5, color: colors.faint, padding: '24px 0', textAlign: 'center' }}>no data for this range</div>
      ) : (
        <div style={{ position: 'relative' }}>
          <svg
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            style={{ width: '100%', height: 'auto', display: 'block', cursor: 'crosshair' }}
            onMouseMove={handleMove}
            onMouseLeave={() => setHoverIdx(null)}
          >
            {ticks.map(t => (
              <g key={t}>
                <line x1={PAD.left} x2={CHART_W - PAD.right} y1={yAt(t)} y2={yAt(t)} stroke="#e1e0d9" strokeWidth="1" />
                <text x={PAD.left - 6} y={yAt(t) + 3} textAnchor="end" fontSize="10" fill="#898781">{t}</text>
              </g>
            ))}
            <line x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={CHART_H - PAD.bottom} stroke="#c3c2b7" strokeWidth="1" />
            <line x1={PAD.left} x2={CHART_W - PAD.right} y1={CHART_H - PAD.bottom} y2={CHART_H - PAD.bottom} stroke="#c3c2b7" strokeWidth="1" />

            <text x={PAD.left} y={CHART_H - 6} fontSize="10" fill="#898781" textAnchor="start">{formatDay(series[0].date)}</text>
            {n > 1 ? <text x={CHART_W - PAD.right} y={CHART_H - 6} fontSize="10" fill="#898781" textAnchor="end">{formatDay(series[n - 1].date)}</text> : null}

            {SERIES_DEFS.map(s => (
              <path key={s.key} d={pathFor(s.key)} fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            ))}
            {SERIES_DEFS.map(s => (
              <circle key={s.key} cx={xAt(n - 1)} cy={yAt(series[n - 1][s.key])} r="4" fill={s.color} stroke="#fffffc" strokeWidth="2" />
            ))}

            {hovered ? (
              <>
                <line x1={xAt(hoverIdx)} x2={xAt(hoverIdx)} y1={PAD.top} y2={CHART_H - PAD.bottom} stroke="#c3c2b7" strokeWidth="1" />
                {SERIES_DEFS.map(s => (
                  <circle key={s.key} cx={xAt(hoverIdx)} cy={yAt(hovered[s.key])} r="4" fill={s.color} stroke="#fffffc" strokeWidth="2" />
                ))}
              </>
            ) : null}
          </svg>

          {hovered ? (
            <div
              style={{
                position: 'absolute', top: 4, [tooltipAlignEnd ? 'right' : 'left']: `${tooltipAlignEnd ? 100 - tooltipPct : tooltipPct}%`,
                transform: tooltipAlignEnd ? 'translateX(8px)' : 'translateX(-8px)',
                background: '#fff', border: `1px solid ${colors.borderStrong}`, borderRadius: 8, padding: '8px 10px',
                fontSize: 11.5, fontFamily: font, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 1,
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{formatDay(hovered.date)}</div>
              {SERIES_DEFS.map(s => (
                <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 2, background: s.color, display: 'inline-block' }} />
                  <span style={{ fontWeight: 700 }}>{hovered[s.key]}</span>
                  <span style={{ color: colors.faint }}>{s.label}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {n > 0 ? (
        <button
          onClick={() => setShowTable(v => !v)}
          style={{ background: 'none', border: 'none', color: colors.muted, fontSize: 11.5, cursor: 'pointer', padding: '8px 0 0', textDecoration: 'underline' }}
        >
          {showTable ? 'hide table' : 'view as table'}
        </button>
      ) : null}
      {showTable ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginTop: 6 }}>
          <thead>
            <tr>
              <th style={thStyle()}>date</th>
              {SERIES_DEFS.map(s => <th key={s.key} style={thStyle()}>{s.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {series.map(row => (
              <tr key={row.date}>
                <td style={tdStyle()}>{formatDay(row.date)}</td>
                {SERIES_DEFS.map(s => <td key={s.key} style={tdStyle()}>{row[s.key]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}

function thStyle() {
  return { textAlign: 'left', fontWeight: 700, color: colors.faint, padding: '4px 8px', borderBottom: `1px solid ${colors.border}`, fontFamily: font };
}
function tdStyle() {
  return { padding: '4px 8px', borderBottom: `1px solid ${colors.border}`, fontFamily: font };
}

const BAR_COLOR = '#2a78d6';

export function TopItemsChart({ items }) {
  const [hoverId, setHoverId] = useState(null);
  if (items.length === 0) return null;
  const maxViews = Math.max(1, ...items.map(i => i.views));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
      {items.slice(0, 8).map(item => {
        const pct = Math.max(2, (item.views / maxViews) * 100);
        const hovered = hoverId === item.id;
        return (
          <div
            key={item.id}
            onMouseEnter={() => setHoverId(item.id)}
            onMouseLeave={() => setHoverId(null)}
            style={{ position: 'relative' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 3, fontFamily: font }}>
              <span>{item.nameEn}</span>
              <span style={{ fontWeight: 700, color: colors.ink }}>{item.views}</span>
            </div>
            <div style={{ height: 10, background: colors.cream, borderRadius: 5, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: BAR_COLOR, borderRadius: 5, transition: 'width .2s ease', opacity: hovered ? 0.85 : 1 }} />
            </div>
            {hovered ? (
              <div style={{
                position: 'absolute', top: -26, left: 0, background: '#fff', border: `1px solid ${colors.borderStrong}`,
                borderRadius: 6, padding: '4px 8px', fontSize: 11, fontFamily: font, boxShadow: '0 4px 12px rgba(0,0,0,0.12)', whiteSpace: 'nowrap', zIndex: 1,
              }}>
                {item.views} view{item.views === 1 ? '' : 's'} · {item.whatsappClicks} whatsapp
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

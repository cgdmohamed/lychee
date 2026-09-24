import { useState } from 'react';
import { api } from '../../api';
import { colors, button, card, sectionTitle } from '../../admin/theme';

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ImageOptimizePanel({ onOptimized }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function run() {
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const summary = await api.optimizeImages();
      setResult(summary);
      if (summary.optimized > 0) onOptimized();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const savedBytes = result ? result.bytesBefore - result.bytesAfter : 0;
  const savedPct = result && result.bytesBefore > 0 ? Math.round((savedBytes / result.bytesBefore) * 100) : 0;

  return (
    <div style={card()} className="admin-card">
      <div style={sectionTitle()}>optimize images</div>
      <div style={{ fontSize: 11.5, color: colors.faint, lineHeight: 1.4, marginBottom: 12 }}>
        Compress and convert to WebP any item, category, or hero photo uploaded before this
        existed. New uploads are already optimized automatically — safe to run anytime,
        already-optimized images are skipped.
      </div>
      <button onClick={run} disabled={busy} className="admin-btn" style={button('secondary', { width: '100%' })}>
        {busy ? 'optimizing…' : 'optimize now'}
      </button>

      {error ? (
        <div className="admin-fade-in" style={{ marginTop: 12, fontSize: 12, color: colors.danger, background: 'rgba(178,59,59,0.08)', border: '1px solid rgba(178,59,59,0.25)', borderRadius: 8, padding: '8px 10px' }}>
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="admin-fade-in" style={{ marginTop: 12, fontSize: 12, background: colors.cream, borderRadius: 10, padding: '10px 12px' }}>
          {result.optimized === 0 ? (
            <div>✓ nothing to optimize — every image is already WebP</div>
          ) : (
            <div>
              ✓ optimized {result.optimized} image{result.optimized === 1 ? '' : 's'} — {formatBytes(result.bytesBefore)} → {formatBytes(result.bytesAfter)}
              {savedPct > 0 ? ` (${savedPct}% smaller)` : ''}
            </div>
          )}
          {result.errors.length > 0 && (
            <ul style={{ margin: '8px 0 0', paddingInlineStart: 18, color: colors.danger }}>
              {result.errors.slice(0, 10).map((e, i) => (
                <li key={i}>{e.url}: {e.message}</li>
              ))}
              {result.errors.length > 10 ? <li>…and {result.errors.length - 10} more</li> : null}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

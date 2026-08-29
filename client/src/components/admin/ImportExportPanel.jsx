import { useRef, useState } from 'react';
import { api } from '../../api';
import { colors, button, card, sectionTitle } from '../../admin/theme';

export default function ImportExportPanel({ onImported }) {
  const csvInputRef = useRef(null);
  const jsonInputRef = useRef(null);
  const [busy, setBusy] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function run(label, fn) {
    setBusy(label);
    setError('');
    setResult(null);
    try {
      await fn();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  }

  function handleCsvFile(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    run('import-csv', async () => {
      const summary = await api.importItemsCsv(file);
      setResult({ type: 'csv', ...summary });
      onImported();
    });
  }

  function handleJsonFile(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    run('import-json', async () => {
      const summary = await api.importMenuJson(file);
      setResult({ type: 'json', ...summary });
      onImported();
    });
  }

  return (
    <div style={card()} className="admin-card">
      <div style={sectionTitle()}>bulk import / export</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        <div style={{ fontSize: 11.5, color: colors.faint, lineHeight: 1.4 }}>
          items CSV — bulk-edit names, prices, badges &amp; nutrition in a spreadsheet
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => run('export-csv', api.exportItemsCsv)} disabled={!!busy} className="admin-btn" style={button('secondary', { flex: 1 })}>
            {busy === 'export-csv' ? 'exporting…' : '↓ export CSV'}
          </button>
          <button onClick={() => csvInputRef.current.click()} disabled={!!busy} className="admin-btn" style={button('secondary', { flex: 1 })}>
            {busy === 'import-csv' ? 'importing…' : '↑ import CSV'}
          </button>
          <input ref={csvInputRef} type="file" accept=".csv,text/csv" onChange={handleCsvFile} style={{ display: 'none' }} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 12, borderTop: `1px solid ${colors.border}` }}>
        <div style={{ fontSize: 11.5, color: colors.faint, lineHeight: 1.4 }}>
          full backup JSON — categories, items, build-your-own configs
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => run('export-json', api.exportMenuJson)} disabled={!!busy} className="admin-btn" style={button('secondary', { flex: 1 })}>
            {busy === 'export-json' ? 'exporting…' : '↓ export backup'}
          </button>
          <button onClick={() => jsonInputRef.current.click()} disabled={!!busy} className="admin-btn" style={button('secondary', { flex: 1 })}>
            {busy === 'import-json' ? 'importing…' : '↑ restore backup'}
          </button>
          <input ref={jsonInputRef} type="file" accept=".json,application/json" onChange={handleJsonFile} style={{ display: 'none' }} />
        </div>
      </div>

      {error ? (
        <div className="admin-fade-in" style={{ marginTop: 12, fontSize: 12, color: colors.danger, background: 'rgba(178,59,59,0.08)', border: '1px solid rgba(178,59,59,0.25)', borderRadius: 8, padding: '8px 10px' }}>
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="admin-fade-in" style={{ marginTop: 12, fontSize: 12, background: colors.cream, borderRadius: 10, padding: '10px 12px' }}>
          {result.type === 'csv' ? (
            <div>✓ created {result.created}, updated {result.updated}{result.errors.length ? `, ${result.errors.length} error(s)` : ''}</div>
          ) : (
            <div>
              ✓ categories +{result.categoriesCreated}/{result.categoriesUpdated} updated · items +{result.itemsCreated}/{result.itemsUpdated} updated
              {result.errors.length ? `, ${result.errors.length} error(s)` : ''}
            </div>
          )}
          {result.errors.length > 0 && (
            <ul style={{ margin: '8px 0 0', paddingInlineStart: 18, color: colors.danger }}>
              {result.errors.slice(0, 10).map((e, i) => (
                <li key={i}>
                  {'line' in e ? `line ${e.line}` : `${e.category}${e.item ? ' / ' + e.item : ''}`}: {e.message}
                </li>
              ))}
              {result.errors.length > 10 ? <li>…and {result.errors.length - 10} more</li> : null}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

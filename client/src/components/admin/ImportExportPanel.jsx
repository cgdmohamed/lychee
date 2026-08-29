import { useRef, useState } from 'react';
import { api } from '../../api';

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
    <div style={{ marginBottom: 20, padding: 12, border: '1px solid rgba(0,0,0,0.1)', borderRadius: 12 }}>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>bulk import / export</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: '#8a8f8a' }}>
          items CSV — bulk-edit names/prices/badges/nutrition in a spreadsheet
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => run('export-csv', api.exportItemsCsv)} disabled={!!busy} style={secondaryBtn}>
            {busy === 'export-csv' ? 'exporting…' : 'export CSV'}
          </button>
          <button onClick={() => csvInputRef.current.click()} disabled={!!busy} style={secondaryBtn}>
            {busy === 'import-csv' ? 'importing…' : 'import CSV'}
          </button>
          <input ref={csvInputRef} type="file" accept=".csv,text/csv" onChange={handleCsvFile} style={{ display: 'none' }} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 11, color: '#8a8f8a' }}>
          full backup JSON — categories, items, build-your-own configs
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => run('export-json', api.exportMenuJson)} disabled={!!busy} style={secondaryBtn}>
            {busy === 'export-json' ? 'exporting…' : 'export backup'}
          </button>
          <button onClick={() => jsonInputRef.current.click()} disabled={!!busy} style={secondaryBtn}>
            {busy === 'import-json' ? 'importing…' : 'restore backup'}
          </button>
          <input ref={jsonInputRef} type="file" accept=".json,application/json" onChange={handleJsonFile} style={{ display: 'none' }} />
        </div>
      </div>

      {error ? <div style={{ marginTop: 10, fontSize: 12, color: '#b23b3b' }}>{error}</div> : null}

      {result ? (
        <div style={{ marginTop: 10, fontSize: 12, background: '#f3f0df', borderRadius: 8, padding: 10 }}>
          {result.type === 'csv' ? (
            <div>created {result.created}, updated {result.updated}{result.errors.length ? `, ${result.errors.length} error(s)` : ''}</div>
          ) : (
            <div>
              categories: +{result.categoriesCreated}/{result.categoriesUpdated} updated · items: +{result.itemsCreated}/{result.itemsUpdated} updated
              {result.errors.length ? `, ${result.errors.length} error(s)` : ''}
            </div>
          )}
          {result.errors.length > 0 && (
            <ul style={{ margin: '6px 0 0', paddingInlineStart: 18, color: '#b23b3b' }}>
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

const secondaryBtn = { background: '#f3f0df', color: '#171a18', border: 'none', borderRadius: 999, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' };

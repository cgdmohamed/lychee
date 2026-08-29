function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

export function toCSV(rows, columns) {
  const header = columns.join(',');
  const lines = rows.map(row => columns.map(col => csvEscape(row[col])).join(','));
  return [header, ...lines].join('\r\n') + '\r\n';
}

// Minimal RFC4180-ish parser: handles quoted fields, embedded commas/quotes/newlines,
// and both \n and \r\n line endings. Returns an array of objects keyed by the header row.
export function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  const n = text.length;

  while (i < n) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += c; i++; continue;
    }
    if (c === '"') { inQuotes = true; i++; continue; }
    if (c === ',') { row.push(field); field = ''; i++; continue; }
    if (c === '\r') { i++; continue; }
    if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
    field += c; i++;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  if (!rows.length) return [];

  const header = rows[0].map(h => h.trim());
  return rows.slice(1)
    .filter(r => !(r.length === 1 && r[0].trim() === ''))
    .map(r => Object.fromEntries(header.map((h, idx) => [h, r[idx] !== undefined ? r[idx] : ''])));
}

export function parseBoolCell(value) {
  return /^(1|true|yes|y)$/i.test(String(value || '').trim());
}

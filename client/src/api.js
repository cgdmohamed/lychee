const TOKEN_KEY = 'lychee_admin_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

// A stale/expired JWT surfaces as a 401 from any admin endpoint, often minutes or
// hours into a session (the token's 12h expiry, or a server restart with a new
// secret) — long after the login form is out of view. Rather than every admin page
// having to notice this itself and show a dead-end error, handle it once here: drop
// the bad token and bounce to the login screen, preserving the page so a re-login
// lands back where the admin was.
function handleUnauthorized() {
  setToken(null);
  if (!window.location.pathname.startsWith('/admin/login')) {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/admin/login?next=${next}`;
  }
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 && auth) handleUnauthorized();
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error((data && data.error) || `request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  getMenu: () => request('/menu'),
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  changePassword: (currentPassword, newPassword) =>
    request('/auth/change-password', { method: 'POST', auth: true, body: { currentPassword, newPassword } }),

  adminGetCategories: () => request('/admin/categories', { auth: true }),
  createCategory: data => request('/admin/categories', { method: 'POST', auth: true, body: data }),
  updateCategory: (id, data) => request(`/admin/categories/${id}`, { method: 'PUT', auth: true, body: data }),
  reorderCategories: orderedIds => request('/admin/categories/reorder', { method: 'PUT', auth: true, body: { orderedIds } }),
  deleteCategory: id => request(`/admin/categories/${id}`, { method: 'DELETE', auth: true }),

  createItem: data => request('/admin/items', { method: 'POST', auth: true, body: data }),
  updateItem: (id, data) => request(`/admin/items/${id}`, { method: 'PUT', auth: true, body: data }),
  reorderItems: orderedIds => request('/admin/items/reorder', { method: 'PUT', auth: true, body: { orderedIds } }),
  deleteItem: id => request(`/admin/items/${id}`, { method: 'DELETE', auth: true }),

  setBuildConfig: (itemId, steps) => request(`/admin/items/${itemId}/build`, { method: 'PUT', auth: true, body: { steps } }),
  clearBuildConfig: itemId => request(`/admin/items/${itemId}/build`, { method: 'DELETE', auth: true }),

  getSettings: () => request('/admin/settings', { auth: true }),
  setSetting: (key, value) => request(`/admin/settings/${key}`, { method: 'PUT', auth: true, body: { value } }),

  exportItemsCsv: () => downloadFile('/admin/export/items.csv', 'lychee-menu-items.csv'),
  importItemsCsv: file => uploadFile('/admin/import/items.csv', file),
  exportMenuJson: () => downloadFile('/admin/export/menu.json', 'lychee-menu-backup.json'),
  importMenuJson: file => uploadFile('/admin/import/menu.json', file),

  optimizeImages: () => request('/admin/optimize-images', { method: 'POST', auth: true }),

  getAnalytics: () => request('/admin/analytics', { auth: true }),
  getQrCode: () => request('/admin/qr-code', { auth: true }),
};

// Fire-and-forget: a tracking call failing (network hiccup, rate limit) should
// never break the page for the person using it.
export function logEvent(type, { itemId, categoryId, source } = {}) {
  fetch('/api/analytics/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, itemId, categoryId, source }),
    keepalive: true,
  }).catch(() => {});
}

export async function uploadImage(file) {
  const data = await uploadFile('/admin/upload', file, 'image');
  return data.url;
}

async function uploadFile(path, file, fieldName = 'file') {
  const token = getToken();
  const form = new FormData();
  form.append(fieldName, file);
  const res = await fetch(`/api${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (res.status === 401) handleUnauthorized();
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data && data.error) || 'upload failed');
  return data;
}

async function downloadFile(path, filename) {
  const token = getToken();
  const res = await fetch(`/api${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (res.status === 401) handleUnauthorized();
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error((data && data.error) || `download failed (${res.status})`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

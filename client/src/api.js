const TOKEN_KEY = 'lychee_admin_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
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
};

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
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data && data.error) || 'upload failed');
  return data;
}

async function downloadFile(path, filename) {
  const token = getToken();
  const res = await fetch(`/api${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
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

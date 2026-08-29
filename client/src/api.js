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
};

export async function uploadImage(file) {
  const token = getToken();
  const form = new FormData();
  form.append('image', file);
  const res = await fetch('/api/admin/upload', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data && data.error) || 'upload failed');
  return data.url;
}

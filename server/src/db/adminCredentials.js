// Shared by seed.js and reset-admin.js so both refuse the same way in production
// rather than silently falling back to a password that's now public in this repo's
// git history.
export function resolveAdminCredentials() {
  const email = (process.env.SEED_ADMIN_EMAIL || 'admin@lycheesaudi.com').trim().toLowerCase();
  if (!process.env.SEED_ADMIN_PASSWORD && process.env.NODE_ENV === 'production') {
    throw new Error('SEED_ADMIN_PASSWORD must be set when NODE_ENV=production — refusing to create/reset the admin account with a known, public fallback password.');
  }
  const password = (process.env.SEED_ADMIN_PASSWORD || 'lychee-admin-2026').trim();
  return { email, password };
}

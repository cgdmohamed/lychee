import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import authRoutes from './routes/auth.js';
import menuRoutes from './routes/menu.js';
import adminRoutes from './routes/admin.js';
import uploadRoutes from './routes/upload.js';
import analyticsRoutes from './routes/analytics.js';
import { uploadsDir } from './routes/upload.js';
import { db } from './db/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Behind Coolify's Traefik (a single reverse-proxy hop): trust its X-Forwarded-*
// headers so req.protocol/req.ip reflect the real client, not the proxy. Without
// this, QR codes would encode "http://" even on an https deployment, and the auth
// rate limiter would see every visitor as the same IP (the proxy's).
app.set('trust proxy', 1);

// contentSecurityPolicy/crossOriginEmbedderPolicy off: the client loads Google Fonts
// cross-origin, and a default CSP would block that without extra tuning. The rest of
// helmet's defaults (nosniff, frameguard, HSTS, etc.) apply as-is.
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
// No cors() here: the client is always same-origin (served by this process in
// production, proxied by Vite in dev), so there's no cross-origin request to allow.
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/upload', uploadRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Serve the built React client (app/client/dist) when present, e.g. inside the
// Docker image. In local dev the client runs separately under Vite, so this
// block is a no-op there.
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  // index.html itself isn't served by the static middleware below (index: false) —
  // it's templated per-request instead, so the tab title and favicon are already
  // correct in the very first response. Client-side JS (MenuPage, RequireAuth) also
  // sets these after fetching settings, which is what used to be the *only*
  // mechanism — on a hard page load, that left a brief flash of the shipped default
  // ("lychee's menu" / the default logo) before the real values loaded over the
  // network. Baking them into the HTML here closes that gap; the client-side update
  // stays in place for in-app navigation and for settings that change live.
  app.use(express.static(clientDist, { index: false }));

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  const indexHtmlTemplate = fs.readFileSync(path.join(clientDist, 'index.html'), 'utf-8');

  app.get(/^(?!\/api|\/uploads).*/, (req, res) => {
    const settingsRows = db.prepare(
      "SELECT key, value FROM settings WHERE key IN ('brand_name_en','brand_name_ar','default_lang','faviconImage')"
    ).all();
    const settings = Object.fromEntries(settingsRows.map(r => [r.key, r.value]));
    const isAr = settings.default_lang === 'ar';
    const brandName = isAr ? (settings.brand_name_ar || 'لايتشي') : (settings.brand_name_en || "lychee's");
    const title = isAr ? `${brandName} — القائمة` : `${brandName} menu`;
    const faviconHref = settings.faviconImage || '/assets/logo.svg';

    const html = indexHtmlTemplate
      .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
      .replace(/(<link id="favicon-link"[^>]*href=")[^"]*(")/, `$1${escapeHtml(faviconHref)}$2`);

    res.set('Content-Type', 'text/html; charset=utf-8').send(html);
  });
}

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  // Routes that deliberately throw set `.status` (400s, 404s) with a safe, specific
  // message. Anything else is an unexpected exception — don't echo its message
  // (could be a stack trace, a SQL error, a file path) back to the client.
  const status = err.status || 500;
  res.status(status).json({ error: err.status ? err.message : 'internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Lychee menu server listening on :${PORT}`);
});

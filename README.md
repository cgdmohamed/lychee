# Lychee's Menu

A bilingual (EN/AR) digital restaurant menu with an admin CMS.

## Stack

- **Server**: Node.js + Express + SQLite (`better-sqlite3`), JWT auth, `multer` for image uploads.
- **Client**: React + Vite. Public menu at `/`, admin CMS at `/admin`.

## What's implemented

- **Public menu API** (`GET /api/menu`) — categories, items, prices, descriptions, spicy/new/collab
  badges, nutrition facts, and build-your-own configs, all bilingual, served from SQLite (seeded
  from the original menu data).
- **Admin CMS** (`/admin`, JWT-protected) — create/edit/delete categories and items, edit
  nutrition facts, toggle spicy/new badges, toggle whether an item's nutrition facts are shown
  to customers at all (per item — useful for items where the values aren't meaningful or
  haven't been measured yet; enabled by default), edit build-your-own steps & options, upload photos
  (category icons, item thumbnails, hero image) to local disk storage. Every upload is
  auto-compressed and re-encoded to WebP server-side (capped at 1920px on the longest side) —
  a typical multi-MB phone photo lands well under 100KB with no visible quality loss. Applies
  to new uploads only; files already on disk are never touched. An "optimize images" button
  in the sidebar retroactively compresses any pre-existing (non-WebP) photos in place —
  repointing the DB to the new file and removing the old one only once that succeeds, so a
  failure partway through can't leave a broken reference; safe to run repeatedly since
  already-optimized images are skipped.
- **Bulk import / export** (in the admin dashboard) — download all items as a CSV for
  spreadsheet editing (names, descriptions, prices, badges, nutrition) and re-import to
  upsert by id or by category+name; or export/restore a full JSON backup (categories, items,
  build-your-own configs, settings). See `server/src/routes/admin.js`'s `/export/*` and
  `/import/*` routes.
- **Public menu UI** — pixel-matched to the design: sticky header with EN/AR toggle, hero image,
  circular scrollable category nav, item list with popup (photo + nutrition facts grid),
  interactive build-your-own panel (step chips + dressing-amount slider), footer with social links.
  Full RTL layout swap when Arabic is active.
- **Site text editor** (`/admin/text`) — every bilingual UI string on the public menu that
  isn't menu-item data (hero tagline & heading, nutrition panel copy, badge/button labels,
  build-your-own copy, the VAT note) is editable per-language, backed by the `settings`
  table. Registry lives in `client/src/textFields.js`; leaving a field blank falls back to
  its shipped default.
- **Appearance / brand colors** (`/admin/appearance`) — a primary and accent color picker that
  recolors the public menu's buttons, badges, and highlights (`theme_primary`/`theme_accent`
  settings, applied as CSS custom properties on page load). The admin dashboard's own colors
  are intentionally hardcoded and never follow this setting, so a brand choice here can't make
  the dashboard itself unreadable.
- **Analytics** (`/admin/analytics`) — page views, item views, WhatsApp-order clicks, and QR
  scans are logged (fire-and-forget, rate-limited, no PII) as customers browse the public
  menu, and summarized on this tab alongside a "top items" breakdown by views/clicks. Events
  reference items/categories by id without a foreign key, so deleting a menu item later never
  blocks or cascade-deletes its historical analytics.
- **QR code with scan tracking** (`/admin/analytics`) — generates a QR code pointing at the
  public menu (tagged `?src=qr`), downloadable as a PNG for table tents/flyers. A scan is
  logged as its own analytics event and the tag is stripped from the URL on load, so QR
  traffic is distinguishable from other visits without leaving a stray query param behind
  if the link gets shared further.
- **WhatsApp ordering** (`/admin/analytics`) — an admin-only toggle plus a destination number;
  when enabled, every item's detail popup shows an "order on WhatsApp" button that opens a
  chat pre-filled with the item name and price via the `wa.me` click-to-chat link — no cart
  or checkout page, no WhatsApp Business API setup required. Disabled by default.

## Running locally

```bash
# 1. Server
cd server
cp .env.example .env   # edit JWT_SECRET and admin password
npm install
npm run seed            # creates SQLite DB + seeds menu data + admin user
npm run dev              # http://localhost:4000

# 2. Client (separate terminal)
cd client
npm install
npm run dev               # http://localhost:5173 (proxies /api and /uploads to :4000)
```

Default admin login (change immediately, or set `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`
before seeding): `admin@lycheesaudi.com` / `lychee-admin-2026`.

### Locked out of admin?

The seed script only ever creates the admin account once — it deliberately never touches an
existing row again, so a password you change from the admin UI survives restarts/redeploys.
That means if an earlier deploy attempt already wrote an admin row with different credentials
(easy to hit while you're still dialing in env vars in Coolify), the *current* `SEED_ADMIN_*`
values won't take effect on their own. Force it with:

```bash
# local
npm run reset-admin

# Docker / Coolify — exec into the running container
docker exec -it <container> node server/src/db/reset-admin.js
```

This creates the admin if missing, or resets its password to the current `SEED_ADMIN_PASSWORD`
if it already exists — unlike the seed script, it's meant to be run on demand.

## Production build (without Docker)

```bash
cd client && npm run build   # outputs client/dist
cd server && NODE_ENV=production JWT_SECRET=... SEED_ADMIN_PASSWORD=... npm start
```

The server auto-detects `client/dist` and serves it as a single-page app (with `/admin`
client-side routing falling back to `index.html`), so in production there's just one process
and one port — no separate reverse-proxy config needed for the two apps.

**`JWT_SECRET` and `SEED_ADMIN_PASSWORD` are required when `NODE_ENV=production`** — the
process refuses to start without them, rather than silently falling back to the placeholder
values in `.env.example` (those are now public, in this repo's history). This check is
Docker-independent; it applies to any production deployment, not just the compose file's
`:?` requirement.

## Docker

A single multi-stage `Dockerfile` builds the client, installs server deps (compiling
`better-sqlite3`'s native module), then produces one small runtime image that serves both
the API and the built client on port 4000.

```bash
cp .env.example .env   # set JWT_SECRET and SEED_ADMIN_PASSWORD
docker compose up --build
```

This starts one `app` service, seeds the SQLite DB on first boot (idempotent — safe on every
restart), and persists data across restarts via two named volumes:

- `lychee-data` → `/app/server/data` (the SQLite database)
- `lychee-uploads` → `/app/server/uploads` (uploaded photos)

A container healthcheck hits `/api/health`.

### Deploying on Coolify

1. New Resource → **Docker Compose**, point it at this repo (repo root — no Base Directory needed).
2. Coolify will pick up `docker-compose.yaml` and `Dockerfile` as-is. (It must be `.yaml`, not
   `.yml` — Coolify's compose file detection doesn't reliably recognize the `.yml` extension.)
3. In the app's Environment Variables, set `JWT_SECRET` and `SEED_ADMIN_PASSWORD` (both are
   required — the container refuses to start without them) and optionally `SEED_ADMIN_EMAIL`.
4. Add **Persistent Storage** mounts for `/app/server/data` and `/app/server/uploads` if Coolify
   doesn't already pick up the named volumes from the compose file, so uploads/DB survive
   redeploys.
5. Domain/HTTPS is automatic: the compose file declares `SERVICE_FQDN_APP_4000` (Coolify's
   "magic" env var convention), which Coolify replaces with a real generated domain and wires
   through its built-in Traefik proxy to port 4000 — enable/replace it with your own domain
   under the app's General settings. (Plain `docker compose up` outside Coolify ignores that
   var and just uses the regular `ports` mapping instead.)
6. Deploy. First boot runs the seed script automatically.

## Data model

SQLite tables: `categories`, `items`, `build_steps`, `build_options`, `settings` (key/value,
e.g. `heroImage`), `admin_users`, `analytics_events`. See `server/src/db/schema.sql`.

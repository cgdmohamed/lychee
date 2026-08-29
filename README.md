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
  nutrition facts, toggle spicy/new badges, edit build-your-own steps & options, upload photos
  (category icons, item thumbnails, hero image) to local disk storage.
- **Bulk import / export** (in the admin dashboard) — download all items as a CSV for
  spreadsheet editing (names, descriptions, prices, badges, nutrition) and re-import to
  upsert by id or by category+name; or export/restore a full JSON backup (categories, items,
  build-your-own configs, settings). See `server/src/routes/admin.js`'s `/export/*` and
  `/import/*` routes.
- **Public menu UI** — pixel-matched to the design: sticky header with EN/AR toggle, hero image,
  circular scrollable category nav, item list with popup (photo + nutrition facts grid),
  interactive build-your-own panel (step chips + dressing-amount slider), footer with social links.
  Full RTL layout swap when Arabic is active.

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
cd server && npm start        # serves the API *and* client/dist on one port (see index.js)
```

The server auto-detects `client/dist` and serves it as a single-page app (with `/admin`
client-side routing falling back to `index.html`), so in production there's just one process
and one port — no separate reverse-proxy config needed for the two apps.

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
2. Coolify will pick up `docker-compose.yaml` and `Dockerfile` as-is.
3. In the app's Environment Variables, set `JWT_SECRET` and `SEED_ADMIN_PASSWORD` (both are
   required — the container refuses to start without them) and optionally `SEED_ADMIN_EMAIL`.
4. Add **Persistent Storage** mounts for `/app/server/data` and `/app/server/uploads` if Coolify
   doesn't already pick up the named volumes from the compose file, so uploads/DB survive
   redeploys.
5. Set the domain/proxy to point at container port `4000` (the `ports` mapping in
   `docker-compose.yaml` also works for a plain `docker compose up` outside Coolify).
6. Deploy. First boot runs the seed script automatically.

## Data model

SQLite tables: `categories`, `items`, `build_steps`, `build_options`, `settings` (key/value,
e.g. `heroImage`), `admin_users`. See `server/src/db/schema.sql`.

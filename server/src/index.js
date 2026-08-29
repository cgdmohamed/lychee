import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import authRoutes from './routes/auth.js';
import menuRoutes from './routes/menu.js';
import adminRoutes from './routes/admin.js';
import uploadRoutes from './routes/upload.js';
import { uploadsDir } from './routes/upload.js';
import './db/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/upload', uploadRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Serve the built React client (app/client/dist) when present, e.g. inside the
// Docker image. In local dev the client runs separately under Vite, so this
// block is a no-op there.
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api|\/uploads).*/, (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'internal error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Lychee menu server listening on :${PORT}`);
});

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import authRouter from './routes/auth.js';
import founderRouter from './routes/founder.js';
import { pool } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Healthcheck endpoint for Railway & container supervisors
app.get(['/healthz', '/api/health'], async (_req, res) => {
  try {
    await pool.query('SELECT 1;');
    res.status(200).json({ status: 'HEALTHY', database: 'CONNECTED', uptime: process.uptime() });
  } catch (err: any) {
    res.status(503).json({ status: 'DEGRADED', database: err.message });
  }
});

// Mount C-Level API Routes
app.use('/api/auth', authRouter);
app.use('/api/founder', founderRouter);

// Serve static frontend assets in production
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  // Fallback if built in different relative directory structure
  const altDistPath = path.resolve(__dirname, '../client/dist');
  if (fs.existsSync(altDistPath)) {
    app.use(express.static(altDistPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(altDistPath, 'index.html'));
    });
  }
}

app.listen(PORT, () => {
  console.log(`👑 [Founder & CEO Executive Suite] Live and listening on port ${PORT}`);
});

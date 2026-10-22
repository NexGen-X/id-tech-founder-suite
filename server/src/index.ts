import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import authRouter from './routes/auth.js';
import founderRouter from './routes/founder.js';
import { pool } from './db.js';
import { securityHeadersMiddleware } from './middleware/securityHeaders.js';
import { globalApiRateLimiter } from './middleware/rateLimiter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// 1. Trust proxy for accurate client IP resolution behind Caddy reverse proxy
app.set('trust proxy', 1);

// 2. Disable Express fingerprinting header
app.disable('x-powered-by');

// 3. Defense-in-depth HTTP security headers (HSTS, CSP, nosniff, frame denial)
app.use(securityHeadersMiddleware);

// 4. Strict Whitelisted CORS Policy
const ALLOWED_ORIGINS = [
  'https://founder.id-tech.cloud',
  'https://app.id-tech.cloud',
  'https://id-tech.cloud',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS Policy: Origin ${origin} tidak diizinkan mengakses Founder Suite.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Founder-Pin', 'X-Requested-With']
}));

// 5. Payload size limiter (Prevent memory exhaustion attacks)
app.use(express.json({ limit: '2mb' }));

// 6. Global DoS & flood protection rate limiter
app.use('/api', globalApiRateLimiter);

// 7. Healthcheck endpoint for Railway & container supervisors
app.get(['/healthz', '/api/health'], async (_req, res) => {
  try {
    await pool.query('SELECT 1;');
    res.status(200).json({ status: 'HEALTHY', database: 'CONNECTED', uptime: process.uptime() });
  } catch (err: any) {
    res.status(503).json({ status: 'DEGRADED', database: 'UNHEALTHY' });
  }
});

// 8. Mount C-Level API Routes
app.use('/api/auth', authRouter);
app.use('/api/founder', founderRouter);

// 9. Serve static frontend assets in production
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

// 10. Global Error Handler — Masks internal errors, prevents information disclosure
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Founder Server Error]', err);
  const status = err.status || 500;
  res.status(status).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? (err.message?.startsWith('CORS') ? err.message : 'Terjadi kendala pada sistem internal server.')
        : err.message
    }
  });
});

app.listen(PORT, () => {
  console.log(`👑 [Founder & CEO Executive Suite] Live and listening on port ${PORT} with Zero-Trust Security`);
});

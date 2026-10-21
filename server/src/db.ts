import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || 'postgres://routex:a8ad6064dad32fc6ec79f0378d6b8c1e@127.0.0.1:5432/ai_center?sslmode=disable';

export const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[Founder DB] Unexpected error on idle client:', err.message);
});

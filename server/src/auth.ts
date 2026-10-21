import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { pool } from './db.js';

const ITERATIONS = 100000;
const KEY_LEN = 64;
const DIGEST = 'sha512';

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, originalHash] = storedHash.split(':');
    if (!salt || !originalHash) return false;
    const computedHash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(originalHash, 'hex'));
  } catch {
    return false;
  }
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export interface AuthenticatedFounderRequest extends Request {
  user?: {
    id: string;
    email: string;
    displayName: string;
    role: string;
  };
}

export async function requireFounderAuth(req: AuthenticatedFounderRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : (req.query.auth_token as string | undefined);

  if (!token) {
    return res.status(401).json({ error: { message: 'Akses ditolak: Token otentikasi Founder diperlukan.' } });
  }

  try {
    const result = await pool.query(`
      SELECT id, email, display_name as "displayName", role, must_change_password as "mustChangePassword"
      FROM human_users
      WHERE session_token = $1;
    `, [token]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: { message: 'Sesi kedaluwarsa atau token tidak valid.' } });
    }

    const user = result.rows[0];
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: { message: 'Akses terlarang: Hak otorisasi Level 5 (ADMIN / FOUNDER) diperlukan.' } });
    }

    req.user = user;
    next();
  } catch (err: any) {
    res.status(500).json({ error: { message: 'Verifikasi otentikasi gagal: ' + err.message } });
  }
}

import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { pool } from './db.js';

const ITERATIONS = 100000;
const KEY_LEN = 64;
const DIGEST = 'sha512';

// Pre-computed dummy hash to run on non-existent users for timing attack mitigation
const DUMMY_HASH = 'e7828599f7ec9a35a504c769023161ee:ef92c0b98d4d738144266fbd9b6731f458eddaa37756f56e8430214c520bf8db8eec02218e90c0e2ef72a71be7f597fe22f1f385dc7c1d4b3c12429f688c7e48';

// Executive Level 5 Master PIN (Configurable via environment, default provided)
const FOUNDER_MASTER_PIN = process.env.FOUNDER_MASTER_PIN || '992817';

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

/**
 * Executes a dummy password verification to guarantee constant-time execution
 * and defeat timing attack enumeration when an email is not registered.
 */
export function executeDummyHashVerification(dummyPassword: string = 'DummyPassword123!') {
  try {
    verifyPassword(dummyPassword, DUMMY_HASH);
  } catch {}
}

/**
 * Validates the Executive Step-Up PIN (Dual-Factor) in constant time
 */
export function verifyFounderMasterPin(candidatePin: string): boolean {
  if (!candidatePin || typeof candidatePin !== 'string') return false;
  try {
    const bufA = Buffer.from(candidatePin.trim());
    const bufB = Buffer.from(FOUNDER_MASTER_PIN.trim());
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
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
    mustChangePassword?: boolean;
  };
}

/**
 * Asynchronously record a security event into PostgreSQL activities ledger
 */
export async function recordSecurityAudit(event: {
  actorType: 'FOUNDER' | 'SYSTEM' | 'SECURITY';
  actorName: string;
  eventType: string;
  summary: string;
  targetType?: string;
  targetId?: string;
  workspaceId?: string;
}) {
  try {
    const id = `sec-${crypto.randomBytes(8).toString('hex')}`;
    await pool.query(`
      INSERT INTO activities (id, workspace_id, actor_type, actor_name, event_type, summary, target_type, target_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
    `, [
      id,
      event.workspaceId || 'ws-default-command-center',
      event.actorType,
      event.actorName,
      event.eventType,
      event.summary,
      event.targetType || 'SECURITY_LEDGER',
      event.targetId || id
    ]);
  } catch (err: any) {
    console.error('[Security Audit Failure]', err.message);
  }
}

/**
 * Strict Level 5 Founder Authentication Middleware
 * Enforces session validity, 24h inactivity ceiling, and ADMIN role
 */
export async function requireFounderAuth(req: AuthenticatedFounderRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : (req.query.auth_token as string | undefined);

  if (!token) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Akses ditolak: Token otentikasi Founder diperlukan.'
      }
    });
  }

  try {
    const result = await pool.query(`
      SELECT 
        id, email, display_name as "displayName", role, 
        must_change_password as "mustChangePassword",
        last_login_at as "lastLoginAt"
      FROM human_users
      WHERE session_token = $1;
    `, [token]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: {
          code: 'INVALID_SESSION',
          message: 'Sesi kedaluwarsa atau token otentikasi tidak valid. Silakan login kembali.'
        }
      });
    }

    const user = result.rows[0];

    // Enforce Level 5 Clearance (Role must be ADMIN / FOUNDER)
    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Akses terlarang: Hak otorisasi Level 5 (ADMIN / FOUNDER) diperlukan.'
        }
      });
    }

    // Inactivity timeout check (24 hours ceiling)
    if (user.lastLoginAt) {
      const lastLoginTime = new Date(user.lastLoginAt).getTime();
      const sessionAgeMs = Date.now() - lastLoginTime;
      const MAX_SESSION_AGE = 24 * 60 * 60 * 1000; // 24 Hours

      if (sessionAgeMs > MAX_SESSION_AGE) {
        // Invalidate stale session
        await pool.query('UPDATE human_users SET session_token = NULL WHERE id = $1;', [user.id]);
        return res.status(401).json({
          error: {
            code: 'SESSION_EXPIRED',
            message: 'Sesi login telah melebihi batas 24 jam demi keamanan. Silakan login ulang.'
          }
        });
      }
    }

    req.user = user;
    next();
  } catch (err: any) {
    res.status(500).json({ error: { message: 'Verifikasi otentikasi gagal: ' + err.message } });
  }
}

/**
 * Step-Up Authentication Guard for Destructive Actions
 * Validates Founder Executive Master PIN
 */
export function requireExecutivePin(req: AuthenticatedFounderRequest, res: Response, next: NextFunction) {
  const pinHeader = req.headers['x-founder-pin'] || req.body?.founderPin;
  if (!pinHeader) {
    return res.status(403).json({
      error: {
        code: 'STEP_UP_PIN_REQUIRED',
        message: 'Aksi eksekutif berisiko tinggi. Sertakan Master Security PIN (x-founder-pin) untuk otorisasi.'
      }
    });
  }

  const isValid = verifyFounderMasterPin(String(pinHeader));
  if (!isValid) {
    recordSecurityAudit({
      actorType: 'SECURITY',
      actorName: req.user?.displayName || 'Unknown Founder',
      eventType: 'security.pin_failed',
      summary: `Percobaan eksekusi aksi sensitif gagal: Master Security PIN salah dari IP ${(req.ip || 'unknown')}.`
    });

    return res.status(403).json({
      error: {
        code: 'INVALID_MASTER_PIN',
        message: 'Master Security PIN salah. Aksi dibatalkan demi keamanan zero-trust.'
      }
    });
  }

  next();
}

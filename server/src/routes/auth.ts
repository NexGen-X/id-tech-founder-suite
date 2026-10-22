import { Router, Request, Response } from 'express';
import { pool } from '../db.js';
import {
  verifyPassword,
  generateSessionToken,
  requireFounderAuth,
  AuthenticatedFounderRequest,
  executeDummyHashVerification,
  recordSecurityAudit,
  verifyFounderMasterPin
} from '../auth.js';
import { authRateLimiter, accountLockoutGuard } from '../middleware/rateLimiter.js';

const router = Router();

// POST /api/auth/login — Founder Clearance Level 5 Authentication with Anti-Brute-Force
router.post('/login', authRateLimiter, async (req: Request, res: Response) => {
  const clientIp = (
    req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
    req.headers['x-real-ip']?.toString().trim() ||
    req.socket.remoteAddress ||
    'unknown'
  );
  const userAgent = req.headers['user-agent'] || 'unknown';

  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: { message: 'Email dan password wajib diisi.' } });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Account Lockout Protection (Anti-Credential Stuffing)
    const lockoutStatus = accountLockoutGuard.isLocked(normalizedEmail);
    if (lockoutStatus.locked) {
      await recordSecurityAudit({
        actorType: 'SECURITY',
        actorName: 'Security Shield',
        eventType: 'auth.account_locked',
        summary: `Percobaan login pada akun terkunci: ${normalizedEmail} dari IP ${clientIp}.`
      });

      return res.status(423).json({
        error: {
          code: 'ACCOUNT_TEMPORARILY_LOCKED',
          message: `Akun ini terkunci sementara karena terlalu banyak kegagalan sandi. Silakan coba ${lockoutStatus.remainingSeconds} detik lagi.`,
          retryAfterSeconds: lockoutStatus.remainingSeconds
        }
      });
    }

    // 2. Query User
    const result = await pool.query(`
      SELECT id, email, display_name, role, password_hash, must_change_password
      FROM human_users
      WHERE email = $1;
    `, [normalizedEmail]);

    // 3. User Not Found — Timing Attack Mitigation
    if (result.rows.length === 0) {
      executeDummyHashVerification(password);
      accountLockoutGuard.recordFailure(normalizedEmail);

      await recordSecurityAudit({
        actorType: 'SECURITY',
        actorName: normalizedEmail,
        eventType: 'auth.login.failed',
        summary: `Percobaan login gagal (email tidak terdaftar) dari IP ${clientIp} [${userAgent.slice(0, 80)}].`
      });

      return res.status(401).json({ error: { message: 'Email atau password salah.' } });
    }

    const user = result.rows[0];

    // 4. Role Requirement Check
    if (user.role !== 'ADMIN') {
      executeDummyHashVerification(password);
      await recordSecurityAudit({
        actorType: 'SECURITY',
        actorName: user.display_name,
        eventType: 'auth.login.denied_role',
        summary: `Akses ditolak ke Founder Portal: Akun "${user.email}" memiliki peran "${user.role}" (bukan ADMIN) dari IP ${clientIp}.`
      });

      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Akses ditolak: Akun ini tidak memiliki hak otorisasi Level 5 (ADMIN / FOUNDER).'
        }
      });
    }

    // 5. Password Verification
    const isValid = user.password_hash && verifyPassword(password, user.password_hash);
    if (!isValid) {
      accountLockoutGuard.recordFailure(normalizedEmail);

      await recordSecurityAudit({
        actorType: 'SECURITY',
        actorName: user.display_name,
        eventType: 'auth.login.failed',
        summary: `Kata sandi salah untuk akun ${user.email} dari IP ${clientIp}.`
      });

      return res.status(401).json({ error: { message: 'Email atau password salah.' } });
    }

    // 6. Login Success — Reset Failure Counter & Issue Session Token
    accountLockoutGuard.resetFailure(normalizedEmail);

    const token = generateSessionToken();
    await pool.query(`
      UPDATE human_users
      SET session_token = $1, last_login_at = CURRENT_TIMESTAMP
      WHERE id = $2;
    `, [token, user.id]);

    await recordSecurityAudit({
      actorType: 'FOUNDER',
      actorName: user.display_name,
      eventType: 'auth.login.success',
      summary: `Autentikasi Founder Level 5 berhasil: ${user.email} terhubung dari IP ${clientIp}.`
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        role: user.role,
        mustChangePassword: Boolean(user.must_change_password)
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: 'Terjadi kesalahan sistem internal.' } });
  }
});

// POST /api/auth/verify-pin — Step-up PIN Verification
router.post('/verify-pin', requireFounderAuth, (req: AuthenticatedFounderRequest, res: Response) => {
  const { pin } = req.body;
  if (!pin) {
    return res.status(400).json({ error: { message: 'PIN otorisasi wajib disertakan.' } });
  }

  const isValid = verifyFounderMasterPin(String(pin));
  if (!isValid) {
    return res.status(403).json({
      success: false,
      error: { message: 'Master Security PIN salah. Otorisasi dual-factor ditolak.' }
    });
  }

  res.json({
    success: true,
    message: 'Master Security PIN terverifikasi. Izin eksekutif diberikan.'
  });
});

// GET /api/auth/me — Validate active session
router.get('/me', requireFounderAuth, (req: AuthenticatedFounderRequest, res: Response) => {
  res.json({
    authenticated: true,
    user: req.user
  });
});

// POST /api/auth/logout — Explicit Session Revocation
router.post('/logout', requireFounderAuth, async (req: AuthenticatedFounderRequest, res: Response) => {
  try {
    if (req.user?.id) {
      await pool.query('UPDATE human_users SET session_token = NULL WHERE id = $1;', [req.user.id]);
      await recordSecurityAudit({
        actorType: 'FOUNDER',
        actorName: req.user.displayName,
        eventType: 'auth.logout',
        summary: `Sesi login Founder untuk ${req.user.email} telah ditutup secara aman.`
      });
    }
    res.json({ success: true, message: 'Sesi Founder berhasil ditutup.' });
  } catch (err: any) {
    res.status(500).json({ error: { message: 'Gagal menutup sesi: ' + err.message } });
  }
});

export default router;

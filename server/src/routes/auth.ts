import { Router, Request, Response } from 'express';
import { pool } from '../db.js';
import { verifyPassword, generateSessionToken, requireFounderAuth, AuthenticatedFounderRequest } from '../auth.js';

const router = Router();

// POST /api/auth/login — Founder Clearance Level 5 Authentication
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: { message: 'Email dan password wajib diisi.' } });
    }

    const result = await pool.query(`
      SELECT id, email, display_name, role, password_hash, must_change_password
      FROM human_users
      WHERE email = $1;
    `, [email.toLowerCase().trim()]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: { message: 'Kredensial salah atau tidak terdaftar sebagai Founder.' } });
    }

    const user = result.rows[0];
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: { message: 'Akses ditolak: Akun ini bukan level Founder/Admin.' } });
    }

    const isValid = user.password_hash && verifyPassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: { message: 'Email atau password salah.' } });
    }

    const token = generateSessionToken();
    await pool.query(`
      UPDATE human_users
      SET session_token = $1, last_login_at = CURRENT_TIMESTAMP
      WHERE id = $2;
    `, [token, user.id]);

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
    res.status(500).json({ error: { message: err.message } });
  }
});

// GET /api/auth/me — Validate active session
router.get('/me', requireFounderAuth, (req: AuthenticatedFounderRequest, res: Response) => {
  res.json({
    authenticated: true,
    user: req.user
  });
});

// POST /api/auth/logout
router.post('/logout', requireFounderAuth, async (req: AuthenticatedFounderRequest, res: Response) => {
  try {
    if (req.user?.id) {
      await pool.query('UPDATE human_users SET session_token = NULL WHERE id = $1', [req.user.id]);
    }
    res.json({ success: true, message: 'Sesi Founder berhasil ditutup.' });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

export default router;

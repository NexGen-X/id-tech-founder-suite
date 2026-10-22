import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

interface AccountLockoutRecord {
  failedAttempts: number;
  lockedUntil: number;
}

// In-Memory store for IP-based rate limiting
const ipHits = new Map<string, RateLimitRecord>();

// In-Memory store for Account-based lockout protection (Anti-Credential Stuffing)
const accountLocks = new Map<string, AccountLockoutRecord>();

// Garbage collector for stale rate-limit records every 60s
const gcInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, record] of ipHits.entries()) {
    if (now > record.resetAt) {
      ipHits.delete(key);
    }
  }
  for (const [email, record] of accountLocks.entries()) {
    if (now > record.lockedUntil && record.failedAttempts === 0) {
      accountLocks.delete(email);
    }
  }
}, 60000);
gcInterval.unref();

/**
 * Factory to create custom sliding-window rate limiters
 */
export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
  code?: string;
}) {
  const {
    windowMs,
    max,
    message = 'Terlalu banyak permintaan keamanan. Silakan coba beberapa saat lagi.',
    code = 'RATE_LIMIT_EXCEEDED'
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const clientIp = (
      req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
      req.headers['x-real-ip']?.toString().trim() ||
      req.socket.remoteAddress ||
      'unknown'
    );

    const key = `${clientIp}:${req.baseUrl || req.path}`;
    const now = Date.now();
    const existing = ipHits.get(key);

    if (!existing || now > existing.resetAt) {
      ipHits.set(key, { count: 1, resetAt: now + windowMs });
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', max - 1);
      res.setHeader('X-RateLimit-Reset', Math.ceil((now + windowMs) / 1000));
      return next();
    }

    if (existing.count >= max) {
      const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
      res.setHeader('Retry-After', retryAfterSec);
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', Math.ceil(existing.resetAt / 1000));

      return res.status(429).json({
        error: {
          code,
          message,
          retryAfterSeconds: retryAfterSec
        }
      });
    }

    existing.count += 1;
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - existing.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(existing.resetAt / 1000));
    next();
  };
}

/**
 * Account Lockout Guard — Protects against distributed credential stuffing on specific accounts
 */
export const accountLockoutGuard = {
  isLocked(email: string): { locked: boolean; remainingSeconds?: number } {
    const key = email.toLowerCase().trim();
    const record = accountLocks.get(key);
    if (!record) return { locked: false };

    const now = Date.now();
    if (now < record.lockedUntil) {
      const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
      return { locked: true, remainingSeconds };
    }

    return { locked: false };
  },

  recordFailure(email: string) {
    const key = email.toLowerCase().trim();
    const now = Date.now();
    const existing = accountLocks.get(key) || { failedAttempts: 0, lockedUntil: 0 };

    existing.failedAttempts += 1;
    if (existing.failedAttempts >= 5) {
      // Lock for 15 minutes after 5 consecutive failures
      existing.lockedUntil = now + (15 * 60 * 1000);
    }

    accountLocks.set(key, existing);
  },

  resetFailure(email: string) {
    const key = email.toLowerCase().trim();
    accountLocks.delete(key);
  }
};

// Rate Limiter Presets
export const globalApiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  message: 'Batas frekuensi permintaan API terlampaui. Perlindungan DoS aktif.'
});

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Terlalu banyak percobaan autentikasi Founder dari IP ini. Silakan tunggu 15 menit.'
});

export const sensitiveOpsRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 15,
  message: 'Batas operasi eksekutif sensitif terlampaui demi keamanan zero-trust.'
});

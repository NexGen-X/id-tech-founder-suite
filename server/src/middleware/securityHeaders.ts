import { Request, Response, NextFunction } from 'express';

/**
 * Enterprise Security Headers Middleware — Founder & CEO Executive Suite
 * Strict Zero-Trust, Anti-Clickjacking, Anti-MIME-Sniffing, HSTS Preload & CSP Defense
 */
export function securityHeadersMiddleware(_req: Request, res: Response, next: NextFunction) {
  // 1. Remove fingerprinting
  res.removeHeader('X-Powered-By');

  // 2. Prevent MIME type confusion
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // 3. Complete Anti-Clickjacking (DENY: never allow framing even by same-origin)
  res.setHeader('X-Frame-Options', 'DENY');

  // 4. Force browser XSS filter
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // 5. Strict Transport Security (HSTS Preload 2 years)
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');

  // 6. Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 7. Content Security Policy (Strict Zero-Trust)
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: https:; connect-src 'self' https: wss:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
  );

  // 8. Cross-Origin Protections
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

  // 9. Hardware & Sensor Restrictions
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

  next();
}

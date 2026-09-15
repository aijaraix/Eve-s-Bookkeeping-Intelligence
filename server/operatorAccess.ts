import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

/** Reuse the existing Zeabur application password. This grants operator access,
 * never a licensed-practitioner identity or a professional approval. */
export function operatorAccess(req: Request, res: Response, next: NextFunction): void {
  if (process.env.NODE_ENV !== 'production') { next(); return; }
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  if (req.path === '/api/health' && req.method === 'GET') { next(); return; }
  const password = process.env.PASSWORD;
  if (!password) { res.status(503).json({ error: 'OPERATOR_ACCESS_NOT_CONFIGURED' }); return; }
  const header = req.get('authorization') || '';
  let supplied = '';
  let username = '';
  if (header.startsWith('Basic ')) {
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
    const split = decoded.indexOf(':');
    if (split >= 0) { username = decoded.slice(0, split); supplied = decoded.slice(split + 1); }
  }
  const digest = (value: string) => crypto.createHash('sha256').update(value).digest();
  if (username !== (process.env.EVE_OPERATOR_USERNAME || 'eve') ||
      !crypto.timingSafeEqual(digest(supplied), digest(password))) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Eve Bookkeeping operator", charset="UTF-8"');
    res.status(401).json({ error: 'OPERATOR_SIGN_IN_REQUIRED' }); return;
  }
  // Protect even legacy GET routes with side effects from cross-site requests.
  const origin = req.get('origin');
  let sameOrigin = true;
  if (origin) {
    try { sameOrigin = new URL(origin).origin === `https://${req.get('host')}`; } catch { sameOrigin = false; }
  }
  if (!sameOrigin || req.get('sec-fetch-site') === 'cross-site') {
    res.status(403).json({ error: 'CROSS_ORIGIN_OPERATOR_REQUEST_REJECTED' }); return;
  }
  // Do not populate req.user/auth: professional authority is separately verified.
  next();
}

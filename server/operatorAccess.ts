import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

const COOKIE_NAME = 'eve_operator_session';
const SESSION_TTL_SECONDS = 12 * 60 * 60;
const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000;
const MAX_LOGIN_BODY_BYTES = 4096;
const attempts = new Map<string, { count: number; resetAt: number }>();

function operatorSecret(): string {
  return (process.env.PASSWORD || process.env.EVE_OPERATOR_PIN || '').trim();
}

export function deriveDevelopmentPin(secret: string): string {
  if (!secret) return '';
  const bytes = crypto.createHmac('sha256', secret).update('eve-development-owner-pin:v1').digest();
  return String(bytes.readUInt32BE(0) % 1_000_000).padStart(6, '0');
}

function operatorPin(): string {
  const explicit = (process.env.EVE_OPERATOR_PIN || '').trim();
  if (explicit) return explicit;
  const protectedSecret = (process.env.PASSWORD || '').trim();
  return deriveDevelopmentPin(protectedSecret);
}

function digest(value: string): Buffer {
  return crypto.createHash('sha256').update(value).digest();
}

function safeEqual(a: string, b: string): boolean {
  return crypto.timingSafeEqual(digest(a), digest(b));
}

function sessionSignature(secret: string, expiresAt: number): string {
  return crypto.createHmac('sha256', secret).update(`eve-operator:${expiresAt}`).digest('hex');
}

function createSession(secret: string): string {
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  return `${expiresAt}.${sessionSignature(secret, expiresAt)}`;
}

function readCookie(header: string | undefined, name: string): string {
  if (!header) return '';
  for (const chunk of header.split(';')) {
    const [key, ...rest] = chunk.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return '';
}

function validSession(cookieHeader: string | undefined, secret: string): boolean {
  const raw = readCookie(cookieHeader, COOKIE_NAME);
  const split = raw.indexOf('.');
  if (split < 1) return false;
  const expiresAt = Number(raw.slice(0, split));
  const supplied = raw.slice(split + 1);
  if (!Number.isFinite(expiresAt) || Date.now() >= expiresAt) return false;
  return safeEqual(supplied, sessionSignature(secret, expiresAt));
}

function cleanNext(value: unknown): string {
  const next = typeof value === 'string' ? value : '/';
  return next.startsWith('/') && !next.startsWith('//') ? next : '/';
}

function clientKey(req: Request): string {
  return req.socket?.remoteAddress || 'unknown';
}

function isRateLimited(req: Request): boolean {
  const key = clientKey(req);
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || now >= current.resetAt) return false;
  return current.count >= MAX_ATTEMPTS;
}

function recordFailure(req: Request): void {
  const key = clientKey(req);
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || now >= current.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + ATTEMPT_WINDOW_MS });
    return;
  }
  current.count += 1;
}

function clearFailures(req: Request): void {
  attempts.delete(clientKey(req));
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function page(error = '', next = '/'): string {
  const safeNext = escapeHtml(cleanNext(next));
  const safeError = escapeHtml(error);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="robots" content="noindex,nofollow" />
<title>Eve Bookkeeping — Development Access</title>
<style>
  :root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#172033;background:#f6f8fb}
  *{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at top,#fff 0,#f6f8fb 55%,#edf1f7 100%)}
  .card{width:min(100%,420px);background:#fff;border:1px solid #e5eaf1;border-radius:22px;padding:32px;box-shadow:0 18px 55px rgba(23,32,51,.10)}
  .brand{font-size:13px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#62708a;margin-bottom:18px}.mark{width:44px;height:44px;border-radius:13px;background:#172033;color:#fff;display:grid;place-items:center;font-weight:800;margin-bottom:20px}
  h1{font-size:28px;line-height:1.1;margin:0 0 10px}p{color:#667085;line-height:1.55;margin:0 0 22px}.error{background:#fff4f2;color:#b42318;border:1px solid #fecdca;border-radius:12px;padding:10px 12px;margin-bottom:16px;font-size:14px}
  label{display:block;font-weight:700;margin-bottom:8px}input{width:100%;font-size:22px;letter-spacing:.18em;padding:14px 16px;border:1px solid #cfd7e4;border-radius:12px;outline:none}input:focus{border-color:#667085;box-shadow:0 0 0 3px rgba(102,112,133,.12)}
  button{width:100%;margin-top:14px;border:0;border-radius:12px;padding:14px 16px;background:#172033;color:#fff;font-weight:800;font-size:16px;cursor:pointer}.note{font-size:12px;margin-top:18px;margin-bottom:0;color:#98a2b3}
</style>
</head>
<body>
  <main class="card">
    <div class="mark">E</div>
    <div class="brand">Eve Bookkeeping</div>
    <h1>Development access</h1>
    <p>Enter the temporary owner PIN to open the bookkeeping dashboard.</p>
    ${safeError ? `<div class="error">${safeError}</div>` : ''}
    <form method="post" action="/operator-login" autocomplete="off">
      <input type="hidden" name="next" value="${safeNext}" />
      <label for="pin">Owner PIN</label>
      <input id="pin" name="pin" type="password" inputmode="numeric" pattern="[0-9]*" autocomplete="one-time-code" autofocus required />
      <button type="submit">Open dashboard</button>
    </form>
    <p class="note">Temporary development gate only. Professional approvals and accounting controls remain separate.</p>
  </main>
</body>
</html>`;
}

export function operatorLoginPage(req: Request, res: Response): void {
  if (process.env.NODE_ENV !== 'production') { res.redirect('/'); return; }
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).type('html').send(page('', cleanNext(req.query?.next)));
}

export function operatorLogin(req: Request, res: Response): void {
  if (process.env.NODE_ENV !== 'production') { res.redirect(cleanNext(req.body?.next)); return; }
  res.setHeader('Cache-Control', 'no-store');
  const secret = operatorSecret();
  const expectedPin = operatorPin();
  if (!secret || !expectedPin) { res.status(503).type('html').send(page('Owner PIN is not configured.', cleanNext(req.body?.next))); return; }
  if (isRateLimited(req)) { res.status(429).type('html').send(page('Too many attempts. Try again in a few minutes.', cleanNext(req.body?.next))); return; }
  const supplied = String(req.body?.pin || '').trim();
  if (!supplied || !safeEqual(supplied, expectedPin)) {
    recordFailure(req);
    res.status(401).type('html').send(page('That PIN was not accepted.', cleanNext(req.body?.next)));
    return;
  }
  clearFailures(req);
  const session = createSession(secret);
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${encodeURIComponent(session)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}`);
  res.redirect(303, cleanNext(req.body?.next));
}

export function operatorLogout(_req: Request, res: Response): void {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
  res.redirect(303, '/operator-login');
}

function handleRawLogin(req: Request, res: Response): void {
  let raw = '';
  let tooLarge = false;
  req.setEncoding('utf8');
  req.on('data', (chunk: string) => {
    raw += chunk;
    if (raw.length > MAX_LOGIN_BODY_BYTES) tooLarge = true;
  });
  req.on('end', () => {
    if (tooLarge) { res.status(413).type('html').send(page('Login request was too large.')); return; }
    const params = new URLSearchParams(raw);
    (req as Request & { body?: Record<string, string> }).body = Object.fromEntries(params.entries());
    operatorLogin(req, res);
  });
  req.on('error', () => res.status(400).type('html').send(page('Unable to read the login request.')));
}

/** Temporary owner-development gate. It protects operator access only and never
 * establishes a licensed-practitioner identity or professional approval. */
export function operatorAccess(req: Request, res: Response, next: NextFunction): void {
  if (process.env.NODE_ENV !== 'production') { next(); return; }
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');

  if (req.path === '/api/health' && req.method === 'GET') { next(); return; }
  if (req.path === '/operator-login') {
    if (req.method === 'GET') { operatorLoginPage(req, res); return; }
    if (req.method === 'POST') { handleRawLogin(req, res); return; }
    res.status(405).setHeader('Allow', 'GET, POST').end();
    return;
  }
  if (req.path === '/operator-logout') { operatorLogout(req, res); return; }

  if ((req as any).eveIdentity && ['OWNER', 'PLATFORM_ADMIN', 'INTERNAL_OPERATOR'].includes((req as any).eveIdentity.user.role)) { next(); return; }
  const customerUpload = (req as any).eveCustomerUpload;
  const customerIdentity = (req as any).eveIdentity;
  if (req.path === '/api/documents/upload' && req.method === 'POST' && customerUpload && customerIdentity?.user &&
      customerIdentity.user.tenantId === customerUpload.tenantId &&
      ['CLIENT_ADMIN', 'CLIENT_USER'].includes(customerIdentity.user.role) &&
      Array.isArray(customerUpload.workspaceIds) && customerUpload.workspaceIds.length > 0) {
    next(); return;
  }

  const secret = operatorSecret();
  if (!secret) { res.status(503).json({ error: 'OPERATOR_ACCESS_NOT_CONFIGURED' }); return; }
  if (!validSession(req.get('cookie'), secret)) {
    if (req.method === 'GET' && !req.path.startsWith('/api/')) {
      res.redirect(302, `/operator-login?next=${encodeURIComponent(cleanNext(req.originalUrl || req.path))}`);
      return;
    }
    res.status(401).json({ error: 'OPERATOR_SIGN_IN_REQUIRED', login: '/operator-login' });
    return;
  }

  const origin = req.get('origin');
  let sameOrigin = true;
  if (origin) {
    try { sameOrigin = new URL(origin).origin === `https://${req.get('host')}`; } catch { sameOrigin = false; }
  }
  if (!sameOrigin || req.get('sec-fetch-site') === 'cross-site') {
    res.status(403).json({ error: 'CROSS_ORIGIN_OPERATOR_REQUEST_REJECTED' }); return;
  }
  // Operator access is not professional approval; never populate req.user/auth here.
  next();
}

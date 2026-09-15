import assert from 'node:assert/strict';
import { operatorAccess, operatorLogin } from '../operatorAccess.js';

process.env.NODE_ENV = 'production';
process.env.EVE_OPERATOR_PIN = '48273195';
delete process.env.PASSWORD;

function responseProbe() {
  const result: any = { status: 200, headers: {}, body: undefined, redirect: undefined };
  const res: any = {
    setHeader: (k: string, v: string) => { result.headers[k] = v; return res; },
    status: (n: number) => { result.status = n; return res; },
    type: (_v: string) => res,
    send: (v: any) => { result.body = v; return res; },
    json: (v: any) => { result.body = v; return res; },
    redirect: (a: number | string, b?: string) => {
      result.status = typeof a === 'number' ? a : 302;
      result.redirect = typeof a === 'number' ? b : a;
      return res;
    },
    end: () => res
  };
  return { result, res };
}

function probe(headers: Record<string, string>, path = '/api/workspaces') {
  const { result, res } = responseProbe();
  result.next = false;
  const req: any = {
    path,
    originalUrl: path,
    method: 'GET',
    query: {},
    socket: { remoteAddress: '127.0.0.1' },
    get: (name: string) => headers[name]
  };
  operatorAccess(req, res, () => { result.next = true; });
  assert.equal(req.user, undefined);
  return result;
}

function login(pin: string) {
  const { result, res } = responseProbe();
  const req: any = {
    body: { pin, next: '/' },
    socket: { remoteAddress: '127.0.0.2' },
    get: () => undefined
  };
  operatorLogin(req, res);
  return result;
}

assert.equal(probe({}).status, 401);
assert.equal(probe({}, '/').status, 302);
assert.match(probe({}, '/').redirect, /^\/operator-login\?next=/);
assert.equal(login('wrong-pin').status, 401);

const accepted = login('48273195');
assert.equal(accepted.status, 303);
assert.equal(accepted.redirect, '/');
assert.match(accepted.headers['Set-Cookie'], /^eve_operator_session=/);
assert.match(accepted.headers['Set-Cookie'], /HttpOnly/);
assert.match(accepted.headers['Set-Cookie'], /Secure/);
assert.match(accepted.headers['Set-Cookie'], /SameSite=Lax/);

const cookie = String(accepted.headers['Set-Cookie']).split(';')[0];
assert.equal(probe({ cookie, host: 'example.test', origin: 'https://other.test' }).status, 403);
assert.equal(probe({ cookie, 'sec-fetch-site': 'cross-site' }).status, 403);
assert.equal(probe({ cookie, host: 'example.test', origin: 'https://example.test' }).next, true);
assert.equal(probe({}, '/api/health').next, true);

delete process.env.EVE_OPERATOR_PIN;
assert.equal(probe({}).status, 503);

console.log('operatorAccess: PIN login, secure session cookie, unauthenticated redirect/API denial, cross-site rejection, health bypass and missing configuration checks passed; no professional principal granted');

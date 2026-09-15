import assert from 'node:assert/strict';
import { operatorAccess } from '../operatorAccess.js';
process.env.NODE_ENV = 'production';
process.env.PASSWORD = 'isolated-test-password';
const auth = 'Basic ' + Buffer.from('eve:isolated-test-password').toString('base64');
function probe(headers: Record<string, string>, path = '/api/workspaces') {
  const result: any = { status: 200, next: false, headers: {} };
  const req: any = { path, method: 'GET', get: (name: string) => headers[name] };
  const res: any = { setHeader: (k: string, v: string) => result.headers[k] = v, status: (n: number) => { result.status = n; return res; }, json: (v: any) => result.body = v };
  operatorAccess(req, res, () => result.next = true);
  assert.equal(req.user, undefined);
  return result;
}
assert.equal(probe({}).status, 401);
assert.equal(probe({ authorization: 'Basic ' + Buffer.from('eve:wrong').toString('base64') }).status, 401);
assert.equal(probe({ authorization: auth, host: 'example.test', origin: 'https://other.test' }).status, 403);
assert.equal(probe({ authorization: auth, 'sec-fetch-site': 'cross-site' }).status, 403);
assert.equal(probe({ authorization: auth, host: 'example.test', origin: 'https://example.test' }).next, true);
assert.equal(probe({}, '/api/health').next, true);
delete process.env.PASSWORD;
assert.equal(probe({}).status, 503);
console.log('operatorAccess: unauthenticated, wrong-secret, cross-site, valid operator and missing configuration checks passed; no professional principal granted');

import http from 'node:http';

// Shared helpers for the API and browser tests. The servers must already be running:
//   API  http://localhost:4000   (npm run server)
//   Web  http://localhost:3000   (npm run dev)
export const API_PORT = Number(process.env.API_PORT || 4000);
export const WEB = process.env.WEB_URL || 'http://localhost:3000';
export const DEMO = 'multisarv';
export const hostFor = (sub) => `${sub}.localhost:3000`;

/** HTTP call with a custom Host header (fetch can't set one). Resolves { status, body }. */
export function call(path, { method = 'GET', host, token, body } = {}) {
  return new Promise((resolve, reject) => {
    const data = body === undefined ? undefined : JSON.stringify(body);
    const headers = { ...(host ? { Host: host } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(data ? { 'content-type': 'application/json', 'content-length': Buffer.byteLength(data) } : {}) };
    const req = http.request({ host: '127.0.0.1', port: API_PORT, path: `/api${path}`, method, headers }, (res) => {
      let raw = '';
      res.on('data', (c) => (raw += c));
      res.on('end', () => { let parsed = raw; try { parsed = raw ? JSON.parse(raw) : null; } catch { /* not json */ } resolve({ status: res.statusCode, body: parsed }); });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

export async function login(sub, identity, password) {
  const r = await call('/auth/login', { method: 'POST', host: hostFor(sub), body: { identity, password } });
  if (r.status !== 200) throw new Error(`login ${sub}/${identity} -> ${r.status} ${JSON.stringify(r.body)}`);
  return r.body.token;
}

export const adminToken = () => login(DEMO, 'ss', 'sss');

let counter = 0;
export const uniqueSub = (tag = '') => `qa${Date.now().toString().slice(-7)}${++counter}${tag}`;

export async function createTenant(sub, plan = 'Growth Hub') {
  const r = await call('/tenants', { method: 'POST', body: { companyName: `QA ${sub}`, subdomain: sub, plan, admin: { name: 'QA Owner', email: `owner@${sub}.test`, username: 'owner', password: 'secret12' } } });
  if (r.status !== 201) throw new Error(`createTenant ${sub} -> ${r.status} ${JSON.stringify(r.body)}`);
  return r.body;
}

/** The demo company ships with setupCompleted=false; mark it done so the CRM opens straight away. */
export async function finishDemoSetup() {
  const t = await adminToken();
  const profile = await call('/companyProfile', { host: hostFor(DEMO), token: t });
  const name = profile.body[0].name;
  await call(`/companyProfile/${encodeURIComponent(name)}`, { method: 'PUT', host: hostFor(DEMO), token: t, body: { setupCompleted: true } });
  return t;
}

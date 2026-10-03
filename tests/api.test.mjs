import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { call, login, adminToken, createTenant, uniqueSub, hostFor, DEMO } from './helpers.mjs';

const H = hostFor(DEMO);

describe('server basics', () => {
  test('health', async () => assert.equal((await call('/health')).status, 200));
  test('bare host has no company -> 400', async () => assert.equal((await call('/auth/workspace', { host: 'localhost:3000' })).status, 400));
  test('www is not a company -> 400', async () => assert.equal((await call('/auth/workspace', { host: 'www.realtysarv.com' })).status, 400));
  test('unknown company -> 404', async () => assert.equal((await call('/auth/workspace', { host: hostFor('nobody-here-xyz') })).status, 404));
  test('workspace info for the demo company', async () => {
    const r = await call('/auth/workspace', { host: H });
    assert.equal(r.status, 200);
    assert.equal(r.body.subdomain, DEMO);
    assert.equal(r.body.plan, 'Ultimate Stack');
    assert.equal(r.body.allowSignup, false);
  });
});

describe('workspace addresses', () => {
  test('exists: demo yes, stranger no', async () => {
    assert.equal((await call(`/tenants/exists?subdomain=${DEMO}`)).body.exists, true);
    assert.equal((await call('/tenants/exists?subdomain=nobody-here-xyz')).body.exists, false);
  });
  test('check: taken / reserved / invalid / free', async () => {
    assert.equal((await call(`/tenants/check?subdomain=${DEMO}`)).body.available, false);
    assert.equal((await call('/tenants/check?subdomain=admin')).body.available, false);
    assert.equal((await call('/tenants/check?subdomain=Bad_Name!')).body.available, false);
    assert.equal((await call(`/tenants/check?subdomain=${uniqueSub()}`)).body.available, true);
  });
});

describe('creating a company', () => {
  const body = (sub, over = {}) => ({ companyName: 'QA Co', subdomain: sub, plan: 'Growth Hub', admin: { email: `o@${sub}.test`, username: 'o', password: 'secret12' }, ...over });
  test('validation: missing/invalid plan, weak password, reserved address, bad email', async () => {
    const sub = uniqueSub();
    assert.equal((await call('/tenants', { method: 'POST', body: body(sub, { plan: undefined }) })).status, 400);
    assert.equal((await call('/tenants', { method: 'POST', body: body(sub, { plan: 'Free' }) })).status, 400);
    assert.equal((await call('/tenants', { method: 'POST', body: body(sub, { admin: { email: 'a@b.co', password: '123' } }) })).status, 400);
    assert.equal((await call('/tenants', { method: 'POST', body: body('admin') })).status, 400);
    assert.equal((await call('/tenants', { method: 'POST', body: body(sub, { admin: { email: 'nope', password: 'secret12' } }) })).status, 400);
  });
  test('create, then a duplicate is refused', async () => {
    const sub = uniqueSub();
    const r = await call('/tenants', { method: 'POST', body: body(sub) });
    assert.equal(r.status, 201);
    assert.ok(r.body.handoff);
    assert.equal((await call('/tenants', { method: 'POST', body: body(sub) })).status, 409);
  });
  test('the new company starts empty with its master data and one admin', async () => {
    const sub = uniqueSub(); await createTenant(sub);
    const t = await login(sub, 'owner', 'secret12'); const h = hostFor(sub);
    assert.equal((await call('/leads', { host: h, token: t })).body.length, 0);
    assert.equal((await call('/users', { host: h, token: t })).body.length, 1);
    assert.ok((await call('/leadStatusTypes', { host: h, token: t })).body.length > 0);
    assert.equal((await call('/auth/me', { host: h, token: t })).body.user.role, 'Admin');
  });
});

describe('sign in', () => {
  test('username and email both work; wrong password / unknown user / empty are refused', async () => {
    assert.equal((await call('/auth/login', { method: 'POST', host: H, body: { identity: 'ss', password: 'sss' } })).status, 200);
    assert.equal((await call('/auth/login', { method: 'POST', host: H, body: { identity: 'sandeep@multisarv.com', password: 'sss' } })).status, 200);
    assert.equal((await call('/auth/login', { method: 'POST', host: H, body: { identity: 'ss', password: 'nope' } })).status, 401);
    assert.equal((await call('/auth/login', { method: 'POST', host: H, body: { identity: 'ghost', password: 'x' } })).status, 401);
    assert.equal((await call('/auth/login', { method: 'POST', host: H, body: {} })).status, 400);
  });
  test('no token / garbage token are refused', async () => {
    assert.equal((await call('/leads', { host: H })).status, 401);
    assert.equal((await call('/leads', { host: H, token: 'abc.def.ghi' })).status, 401);
  });
  test('self sign-up is off by default', async () => {
    assert.equal((await call('/auth/register', { method: 'POST', host: H, body: { email: 'x@y.com', password: 'secret12' } })).status, 403);
  });
});

describe('company isolation', () => {
  let tA, tB, subB;
  before(async () => { subB = uniqueSub(); await createTenant(subB); tA = await adminToken(); tB = await login(subB, 'owner', 'secret12'); });
  test("one company's token is rejected on another company's address", async () => {
    assert.equal((await call('/leads', { host: H, token: tB })).status, 401);
    assert.equal((await call('/leads', { host: hostFor(subB), token: tA })).status, 401);
  });
  test("a user can't sign in to another company", async () => {
    assert.equal((await call('/auth/login', { method: 'POST', host: hostFor(subB), body: { identity: 'ss', password: 'sss' } })).status, 401);
  });
  test("data written in one company is invisible in the other", async () => {
    await call('/leads/qa-iso', { method: 'PUT', host: hostFor(subB), token: tB, body: { name: 'Secret' } });
    assert.equal((await call('/leads/qa-iso', { host: H, token: tA })).status, 404);
  });
});

describe('roles and permissions', () => {
  let admin, sales, salesId;
  before(async () => {
    admin = await adminToken();
    salesId = `qa-sales-${Date.now()}`;
    await call('/users', { method: 'POST', host: H, token: admin, body: { id: salesId, name: 'QA Sales', username: salesId, email: `${salesId}@x.com`, password: 'pw123456', role: 'Sales', isActive: true } });
    sales = await login(DEMO, salesId, 'pw123456');
  });
  test('sales can read and write leads', async () => {
    assert.equal((await call('/leads', { host: H, token: sales })).status, 200);
    assert.equal((await call('/leads/qa-sales-lead', { method: 'PUT', host: H, token: sales, body: { name: 'QA' } })).status, 200);
    await call('/leads/qa-sales-lead', { method: 'DELETE', host: H, token: admin });
  });
  test('sales cannot clear a collection, promote themselves, create or delete users', async () => {
    assert.equal((await call('/leads', { method: 'DELETE', host: H, token: sales })).status, 403);
    assert.equal((await call(`/users/${salesId}`, { method: 'PUT', host: H, token: sales, body: { role: 'Admin' } })).status, 403);
    assert.equal((await call('/users', { method: 'POST', host: H, token: sales, body: { id: 'evil', name: 'e' } })).status, 403);
    assert.equal((await call('/users/user-1', { method: 'DELETE', host: H, token: sales })).status, 403);
  });
  test('admin edits a user without a password: login still works; disabling blocks login', async () => {
    assert.equal((await call(`/users/${salesId}`, { method: 'PUT', host: H, token: admin, body: { name: 'Renamed' } })).status, 200);
    assert.equal((await call('/auth/login', { method: 'POST', host: H, body: { identity: salesId, password: 'pw123456' } })).status, 200);
    await call(`/users/${salesId}`, { method: 'PUT', host: H, token: admin, body: { isActive: false } });
    assert.equal((await call('/auth/login', { method: 'POST', host: H, body: { identity: salesId, password: 'pw123456' } })).status, 403);
    await call(`/users/${salesId}`, { method: 'DELETE', host: H, token: admin });
  });
  test('password hashes are never returned', async () => {
    assert.equal(JSON.stringify((await call('/users', { host: H, token: admin })).body).includes('passwordHash'), false);
  });
});

describe('query safety and writes', () => {
  let t;
  before(async () => { t = await adminToken(); });
  test('operator filters are rejected; plain filters and safe sorts work', async () => {
    assert.equal((await call('/leads?id[$ne]=x', { host: H, token: t })).status, 400);
    assert.equal((await call('/leads?leadStatus=New', { host: H, token: t })).status, 200);
    assert.equal((await call('/auditTrails?sort=-timestamp', { host: H, token: t })).status, 200);
    assert.equal((await call('/leads?sort=$where', { host: H, token: t })).status, 200);
  });
  test('unknown collection 404, missing doc 404, missing key 400, duplicate 409', async () => {
    assert.equal((await call('/nope', { host: H, token: t })).status, 404);
    assert.equal((await call('/leads/does-not-exist', { host: H, token: t })).status, 404);
    assert.equal((await call('/vendors', { method: 'POST', host: H, token: t, body: { firmName: 'x' } })).status, 400);
    await call('/leads/qa-dup', { method: 'PUT', host: H, token: t, body: { name: 'a' } });
    assert.equal((await call('/leads', { method: 'POST', host: H, token: t, body: { id: 'qa-dup', name: 'b' } })).status, 409);
    await call('/leads/qa-dup', { method: 'DELETE', host: H, token: t });
  });
  test('bulk upsert, partial update merges, delete removes', async () => {
    assert.equal((await call('/sources/bulk', { method: 'PUT', host: H, token: t, body: [{ id: 'qa-s1', name: 'A' }, { id: 'qa-s2', name: 'B' }] })).body.count, 2);
    await call('/sources/qa-s1', { method: 'PUT', host: H, token: t, body: { description: 'merged' } });
    const s1 = (await call('/sources/qa-s1', { host: H, token: t })).body;
    assert.equal(s1.name, 'A'); assert.equal(s1.description, 'merged');
    await call('/sources/qa-s1', { method: 'DELETE', host: H, token: t }); await call('/sources/qa-s2', { method: 'DELETE', host: H, token: t });
    assert.equal((await call('/sources/qa-s1', { host: H, token: t })).status, 404);
  });
  test('a 1 MB document is accepted', async () => {
    assert.equal((await call('/leads/qa-big', { method: 'PUT', host: H, token: t, body: { id: 'qa-big', blob: 'x'.repeat(1_000_000) } })).status, 200);
    await call('/leads/qa-big', { method: 'DELETE', host: H, token: t });
  });
});

describe('plans: Growth Hub vs Ultimate Stack', () => {
  let sub, t, h;
  before(async () => { sub = uniqueSub('g'); await createTenant(sub, 'Growth Hub'); t = await login(sub, 'owner', 'secret12'); h = hostFor(sub); });
  test('plan, modules and user limit are reported', async () => {
    const w = (await call('/auth/workspace', { host: h })).body;
    assert.equal(w.plan, 'Growth Hub'); assert.equal(w.modules.erp, false); assert.equal(w.maxUsers, 10);
  });
  test('Growth Hub is blocked from ProjectSarv and FinanceSarv data', async () => {
    for (const c of ['vendors', 'purchaseOrders', 'ledgerAccounts', 'vouchers', 'boqs', 'auditTrails']) assert.equal((await call(`/${c}`, { host: h, token: t })).status, 403, c);
    assert.equal((await call('/vendors/x', { method: 'PUT', host: h, token: t, body: { firmName: 'x' } })).status, 403);
    assert.equal((await call('/leads', { host: h, token: t })).status, 200);
  });
  test('10 active users allowed, the 11th refused; inactive users are free; freeing a seat works', async () => {
    const u = (i, active = true) => ({ id: `u${i}`, name: `U${i}`, username: `u${i}`, email: `u${i}@x.com`, password: 'pw123456', role: 'Sales', isActive: active });
    assert.equal((await call('/users/bulk', { method: 'PUT', host: h, token: t, body: Array.from({ length: 9 }, (_, i) => u(i + 1)) })).status, 200);
    const eleventh = await call('/users', { method: 'POST', host: h, token: t, body: u(10) });
    assert.equal(eleventh.status, 403); assert.match(eleventh.body.message, /10 active users/);
    assert.equal((await call('/users', { method: 'POST', host: h, token: t, body: u(11, false) })).status, 201);
    assert.equal((await call('/users/u11', { method: 'PUT', host: h, token: t, body: { isActive: true } })).status, 403);
    assert.equal((await call('/users/u1', { method: 'PUT', host: h, token: t, body: { name: 'Renamed' } })).status, 200);
    await call('/users/u2', { method: 'PUT', host: h, token: t, body: { isActive: false } });
    assert.equal((await call('/users/u11', { method: 'PUT', host: h, token: t, body: { isActive: true } })).status, 200);
  });
  test('Ultimate Stack has every module and no user cap', async () => {
    const t0 = await adminToken();
    assert.equal((await call('/vendors', { host: H, token: t0 })).status, 200);
    assert.equal((await call('/ledgerAccounts', { host: H, token: t0 })).status, 200);
    assert.equal((await call('/auth/workspace', { host: H })).body.maxUsers, null);
  });
});

describe('install hand-off (auto sign-in after creating a company)', () => {
  let sub, handoff;
  before(async () => { sub = uniqueSub('h'); handoff = (await createTenant(sub, 'Ultimate Stack')).handoff; });
  test('exchange works on the right address only', async () => {
    assert.equal((await call('/auth/exchange', { method: 'POST', host: hostFor(sub), body: { token: handoff } })).status, 200);
    assert.equal((await call('/auth/exchange', { method: 'POST', host: H, body: { token: handoff } })).status, 401);
    assert.equal((await call('/auth/exchange', { method: 'POST', host: hostFor(sub), body: { token: 'abc' } })).status, 401);
  });
  test('the pass is not a session token', async () => {
    assert.equal((await call('/leads', { host: hostFor(sub), token: handoff })).status, 401);
  });
});

describe('demo data', () => {
  test('every CRM menu and tab is populated', async () => {
    const t = await adminToken();
    const leads = (await call('/leads', { host: H, token: t })).body;
    const today = new Date().toISOString().split('T')[0];
    const booked = (l) => l.bookingStatus === 'Booked', token = (l) => l.tokenAmount > 0 && l.bookingStatus === 'Pending', done = (l) => l.siteVisits.some((v) => v.status === 'Completed');
    const general = leads.filter((l) => !booked(l) && !token(l) && !done(l));
    assert.equal(leads.length, 126);
    assert.ok(general.some((l) => l.tasks.some((x) => x.title.startsWith('Follow-up:') && x.status === 'Pending')), 'follow-ups');
    assert.ok(general.some((l) => l.leadStatus === 'Unqualified'), 'inactive');
    const visits = general.flatMap((l) => l.siteVisits);
    assert.ok(visits.some((v) => v.status === 'Visit Scheduled' && v.date >= today), 'visits scheduled');
    assert.ok(visits.some((v) => v.status === 'Visit Scheduled' && v.date < today), 'visits pending');
    assert.ok(leads.some((l) => done(l) && !token(l) && !booked(l)), 'visits completed');
    assert.ok(leads.some(token), 'tokens');
    const count = (a, f) => a.filter(f).length;
    // every tab holds at least 10 records
    assert.ok(count(general, (l) => l.tasks.some((x) => x.title.startsWith('Follow-up:') && x.status === 'Pending')) >= 10, 'follow-up tab');
    assert.ok(count(general, (l) => l.leadStatus === 'Unqualified') >= 10, 'inactive tab');
    assert.ok(count(visits, (v) => v.status === 'Visit Scheduled' && v.date >= today) >= 10, 'visits scheduled');
    assert.ok(count(visits, (v) => v.status === 'Visit Scheduled' && v.date < today) >= 10, 'visits pending');
    assert.ok(count(leads, (l) => done(l) && !token(l) && !booked(l)) >= 10, 'visits completed');
    assert.ok(count(leads, token) >= 10, 'token bookings');
    for (const s of ['Drafted', 'Signature', 'ATS', 'Registered']) assert.ok(count(leads, (l) => booked(l) && l.agreementStatus === s) >= 10, `agreement ${s} has 10+`);
    for (const s of ['Pending', 'Scheduled', 'Handed Over']) assert.ok(count(leads, (l) => booked(l) && l.possessionStatus === s) >= 10, `possession ${s} has 10+`);
    for (const s of ['Drafted', 'Signature', 'ATS', 'Registered']) assert.ok(leads.some((l) => booked(l) && l.agreementStatus === s), `agreement ${s}`);
    for (const s of ['Pending', 'Scheduled', 'Handed Over']) assert.ok(leads.some((l) => booked(l) && l.possessionStatus === s), `possession ${s}`);
  });
  test('projects have inventory and booked units are marked Booked', async () => {
    const t = await adminToken();
    const projects = (await call('/projects', { host: H, token: t })).body;
    assert.ok(projects.every((p) => p.inventory.length > 0 && p.parkingInventory.length > 0));
    assert.ok(projects.every((p) => p.inventory.some((u) => u.status === 'Booked')));
  });
});

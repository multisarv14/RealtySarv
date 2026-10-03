import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { toClient, toDoc } from '../models';
import { COLLECTIONS } from '../config/collections';
import { TenantRequest } from '../middleware/tenant';
import { ERP_COLLECTIONS, PLAN_SPECS } from '../config/plans';
import { AuthedRequest, requireAdmin } from '../middleware/auth';

// Generic REST surface that mirrors the Dexie table API the frontend already uses:
//   GET /:c   POST /:c   PUT /:c/bulk   DELETE /:c   GET|PUT|DELETE /:c/:id
const router = Router();

// Anyone signed in may read and edit business data, but only Admins may clear a collection
// or write to `users` (otherwise a Sales login could promote itself to Admin).
router.use('/:collection', (req, res, next) => {
  const name = req.params.collection;
  // Plans without the ERP module (Growth Hub) can't use ProjectSarv / FinanceSarv data.
  const tenant = (req as TenantRequest).tenant;
  if (ERP_COLLECTIONS.has(name) && tenant?.modules && tenant.modules.erp === false) {
    return res.status(403).json({ message: `ProjectSarv ERP and FinanceSarv aren’t included in your ${tenant.plan ?? 'current'} plan. Upgrade to Ultimate Stack to use them.` });
  }
  const isWrite = req.method !== 'GET';
  const isClear = req.method === 'DELETE' && req.path === '/';
  if (isWrite && (name === 'users' || isClear)) return requireAdmin(req as AuthedRequest, res, next);
  next();
});

const M = (req: Request, name: string) => (req as TenantRequest).models![name];

router.param('collection', (req, res, next, name) => {
  if (!COLLECTIONS[name]) return res.status(404).json({ message: `Unknown collection "${name}"` });
  next();
});

// users carry a password hash; accept a plain `password` from admin forms and hash it.
async function prepare(name: string, body: any) {
  const doc = toDoc(name, body);
  if (name === 'users') {
    if (doc.password) doc.passwordHash = await bcrypt.hash(String(doc.password), 10);
    delete doc.password;
    if (doc.email) doc.email = String(doc.email).trim().toLowerCase();
  }
  return doc;
}

// Active-user cap of the tenant's plan. Returns an error message when the write would exceed it.
async function userLimitMessage(req: Request, docs: any[]): Promise<string | null> {
  const t = (req as TenantRequest).tenant!;
  const max = PLAN_SPECS[t.plan ?? '']?.maxUsers;
  if (max == null) return null;
  const changing = docs.map((d) => d._id);
  const others = await M(req, 'users').countDocuments({ _id: { $nin: changing }, isActive: { $ne: false } });
  const incoming = docs.filter((d) => d.isActive !== false).length;
  return others + incoming > max
    ? `Your ${t.plan} plan includes up to ${max} active users. Deactivate a user, or upgrade to Ultimate Stack for unlimited users.`
    : null;
}

const handle = (fn: (req: Request, res: Response) => Promise<any>) => (req: Request, res: Response) =>
  fn(req, res).catch((e) => {
    console.error(`${req.method} ${req.originalUrl}:`, e.message);
    res.status(e.message?.startsWith('Missing') ? 400 : 500).json({ message: e.message || 'Server error' });
  });

router.get('/:collection', handle(async (req, res) => {
  const name = req.params.collection;
  const { limit, skip, sort, ...rest } = req.query;
  // Equality filters only: reject operator objects like ?id[$ne]=x (NoSQL injection).
  const filter: Record<string, string> = {};
  for (const [k, v] of Object.entries(rest)) {
    if (typeof v !== 'string' || k.startsWith('$')) return res.status(400).json({ message: `Invalid filter "${k}"` });
    filter[k] = v;
  }
  let q = M(req, name).find(filter);
  if (typeof sort === 'string' && /^-?[A-Za-z_][\w.]*$/.test(sort)) q = q.sort(sort);
  if (typeof skip === 'string') q = q.skip(Number(skip));
  if (typeof limit === 'string') q = q.limit(Number(limit));
  res.json((await q.lean()).map((d) => toClient(name, d)));
}));

router.post('/:collection', handle(async (req, res) => {
  const name = req.params.collection;
  const doc = await prepare(name, req.body);
  if (await M(req, name).exists({ _id: doc._id })) return res.status(409).json({ message: 'Already exists' });
  if (name === 'users') { const msg = await userLimitMessage(req, [doc]); if (msg) return res.status(403).json({ message: msg }); }
  res.status(201).json(toClient(name, await M(req, name).create(doc)));
}));

// Upsert many (Dexie bulkPut / bulkAdd)
router.put('/:collection/bulk', handle(async (req, res) => {
  const name = req.params.collection;
  const items: any[] = Array.isArray(req.body) ? req.body : [];
  const docs = await Promise.all(items.map((i) => prepare(name, i)));
  if (name === 'users') { const msg = await userLimitMessage(req, docs); if (msg) return res.status(403).json({ message: msg }); }
  if (docs.length) {
    await M(req, name).bulkWrite(docs.map((d) => ({ replaceOne: { filter: { _id: d._id }, replacement: d, upsert: true } })));
  }
  res.json({ count: docs.length });
}));

router.delete('/:collection', handle(async (req, res) => {
  const r = await M(req, req.params.collection).deleteMany({});
  res.json({ deleted: r.deletedCount });
}));

router.get('/:collection/:id', handle(async (req, res) => {
  const d = await M(req, req.params.collection).findById(req.params.id).lean();
  d ? res.json(toClient(req.params.collection, d)) : res.status(404).json({ message: 'Not found' });
}));

// Upsert one (Dexie put). A partial body is merged, so it also covers Dexie update().
router.put('/:collection/:id', handle(async (req, res) => {
  const name = req.params.collection;
  const existing = await M(req, name).findById(req.params.id).lean();
  const keyField = COLLECTIONS[name].keyField;
  const doc = await prepare(name, { ...(existing ? toClient(name, existing) : {}), ...req.body, [keyField]: req.params.id });
  const prevHash = (existing as any)?.passwordHash;
  if (name === 'users' && !doc.passwordHash && prevHash) doc.passwordHash = prevHash;
  if (name === 'users') { const msg = await userLimitMessage(req, [doc]); if (msg) return res.status(403).json({ message: msg }); }
  await M(req, name).replaceOne({ _id: doc._id }, doc, { upsert: true });
  res.json(toClient(name, doc));
}));

router.delete('/:collection/:id', handle(async (req, res) => {
  await M(req, req.params.collection).deleteOne({ _id: req.params.id });
  res.status(204).end();
}));

export default router;

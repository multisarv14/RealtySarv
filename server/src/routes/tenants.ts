import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { Tenant } from '../models/master';
import { modelsFor, tenantDb } from '../models';
import { seedTenant } from '../seedData';
import jwt from 'jsonwebtoken';
import { RESERVED_SUBDOMAINS, SUBDOMAIN_RE } from '../middleware/tenant';
import { JWT_SECRET } from '../middleware/auth';

// What each plan includes. The modules are derived from the plan so the two can never disagree.
const PLANS: Record<string, { crm: boolean; erp: boolean }> = {
  'Growth Hub': { crm: true, erp: false },
  'Ultimate Stack': { crm: true, erp: true },
};

// Public endpoints used by the main site (realtysarv.com): check a workspace address, create a company.
const router = Router();

const clean = (v: unknown) => String(v ?? '').trim().toLowerCase();

function subdomainProblem(sub: string): string | null {
  if (!SUBDOMAIN_RE.test(sub)) return 'Use 3–30 letters, numbers or hyphens (no hyphen at the start or end).';
  if (RESERVED_SUBDOMAINS.has(sub)) return 'That address is reserved. Please choose another.';
  return null;
}

// Creating a company creates a database, so cap it per IP (in-memory; use a shared store if you run several servers).
const hits = new Map<string, number[]>();
function tooMany(ip: string, max = 5, windowMs = 60 * 60 * 1000): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > max;
}

// Does this workspace exist? (used by the sign-in "find your workspace" screen)
router.get('/exists', async (req: Request, res: Response) => {
  const sub = clean(req.query.subdomain);
  const t = SUBDOMAIN_RE.test(sub) ? await Tenant.findById(sub).lean() : null;
  res.json({ exists: !!t && t.status === 'active', companyName: t?.companyName });
});

// Is this address free? (live check in the install wizard)
router.get('/check', async (req: Request, res: Response) => {
  const sub = clean(req.query.subdomain);
  const problem = subdomainProblem(sub);
  if (problem) return res.json({ available: false, reason: problem });
  const taken = await Tenant.exists({ _id: sub });
  res.json({ available: !taken, reason: taken ? 'That address is already taken.' : undefined });
});

router.post('/', async (req: Request, res: Response) => {
  if (tooMany(req.ip || 'unknown')) return res.status(429).json({ message: 'Too many workspaces created from this network. Try again later.' });

  const { admin, companyName, subdomain, plan } = req.body || {};
  const sub = clean(subdomain);
  const mail = clean(admin?.email);
  const problem = subdomainProblem(sub);
  if (problem) return res.status(400).json({ message: problem });
  if (!PLANS[String(plan)]) return res.status(400).json({ message: 'Please choose a plan.' });
  if (!String(companyName ?? '').trim()) return res.status(400).json({ message: 'Company name is required.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) return res.status(400).json({ message: 'A valid admin email is required.' });
  if (String(admin?.password ?? '').length < 6) return res.status(400).json({ message: 'Admin password must be at least 6 characters.' });

  const dbName = `rs_${sub}`;
  try {
    await Tenant.create({ _id: sub, companyName: String(companyName).trim(), dbName, status: 'active', plan, modules: PLANS[String(plan)] });
  } catch (e: any) {
    if (e?.code === 11000) return res.status(409).json({ message: 'That address is already taken.' });
    throw e;
  }

  let adminId = '';
  try {
    const models = modelsFor(tenantDb(dbName));
    await seedTenant(models, { demo: false });
    const id = randomUUID();
    adminId = id;
    await models.users.create({
      _id: id, id, name: admin.name || 'Workspace Admin', username: clean(admin.username || mail.split('@')[0]),
      email: mail, phone: admin.phone || '', role: 'Admin', isActive: true, assignedProjectIds: [],
      passwordHash: await bcrypt.hash(String(admin.password), 10),
    });
    // Replace the template company profile with this client's details; the owner finishes it in the setup wizard.
    const name = String(companyName).trim();
    await models.companyProfile.deleteMany({});
    await models.companyProfile.create({
      _id: name, name, address: '', phone: admin.phone || '', website: '', setupCompleted: false, customData: { subdomain: sub },
    });
  } catch (e) {
    // Don't leave a half-built workspace holding the address.
    await tenantDb(dbName).dropDatabase().catch(() => {});
    await Tenant.deleteOne({ _id: sub });
    throw e;
  }
  // Short-lived one-time-style pass so the owner lands signed in on the new address (exchanged at POST /auth/exchange).
  const handoff = jwt.sign({ sub: adminId, role: 'Admin', tenant: sub, purpose: 'handoff' }, JWT_SECRET(), { expiresIn: '2m' });
  res.status(201).json({ subdomain: sub, handoff });
});

export default router;

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { toClient } from '../models';
import { AuthedRequest, JWT_SECRET, requireAuth } from '../middleware/auth';
import { TenantRequest } from '../middleware/tenant';

const router = Router();
// Off by default: a company owner adds their team in Admin -> Users. Set ALLOW_SELF_SIGNUP=true to let people sign themselves up.
const signupAllowed = () => process.env.ALLOW_SELF_SIGNUP === 'true';
const Users = (req: Request) => (req as TenantRequest).models!.users;

const sign = (req: Request, u: any) => jwt.sign({ sub: u._id, role: u.role, tenant: (req as TenantRequest).tenant!._id }, JWT_SECRET(), { expiresIn: '7d' });

// Sign in with email OR username.
router.post('/login', async (req: Request, res: Response) => {
  const identity = String(req.body?.identity ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');
  if (!identity || !password) return res.status(400).json({ message: 'Email/username and password are required' });

  const user = await Users(req).findOne({ $or: [{ email: identity }, { username: identity }] });
  if (!user || !user.get('passwordHash') || !(await bcrypt.compare(password, user.get('passwordHash')))) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }
  if (user.get('isActive') === false) return res.status(403).json({ message: 'Account is disabled' });
  res.json({ token: sign(req, user), user: toClient('users', user) });
});

// Self-service signup (only when ALLOW_SELF_SIGNUP=true). New accounts are Sales.
router.post('/register', async (req: Request, res: Response) => {
  if (!signupAllowed()) return res.status(403).json({ message: 'Self-service signup is disabled. Ask your workspace admin to create your account.' });
  const { name, email, password, phone, username } = req.body || {};
  const mail = String(email ?? '').trim().toLowerCase();
  if (!mail || String(password ?? '').length < 6) return res.status(400).json({ message: 'Valid email and a password of 6+ characters are required' });
  if (await Users(req).exists({ email: mail })) return res.status(409).json({ message: 'This email already has an account. Please sign in instead.' });

  const id = randomUUID();
  const user = await Users(req).create({
    _id: id, id, name: name || mail.split('@')[0], username: (username || mail.split('@')[0]).toLowerCase(),
    email: mail, phone: phone || '', role: 'Sales', isActive: true, assignedProjectIds: [],
    passwordHash: await bcrypt.hash(String(password), 10),
  });
  res.status(201).json({ token: sign(req, user), user: toClient('users', user) });
});

// Public: lets the sign-in screen show which workspace this is.
router.get('/workspace', async (req: Request, res: Response) => {
  const t = req as TenantRequest;
  const p: any = await t.models!.companyProfile.findOne().lean();
  res.json({ name: p?.name ?? t.tenant!.companyName, subdomain: t.tenant!._id, setupCompleted: !!p?.setupCompleted, allowSignup: signupAllowed() });
});

// Trade the short-lived handoff pass from the install wizard for a normal session on this company's address.
router.post('/exchange', async (req: Request, res: Response) => {
  const t = req as TenantRequest;
  try {
    const p = jwt.verify(String(req.body?.token ?? ''), JWT_SECRET()) as { sub: string; tenant: string; purpose?: string };
    if (p.purpose !== 'handoff' || p.tenant !== t.tenant!._id) throw new Error('bad');
    const user = await Users(req).findById(p.sub);
    if (!user) throw new Error('bad');
    res.json({ token: sign(req, user), user: toClient('users', user) });
  } catch {
    res.status(401).json({ message: 'This sign-in link has expired. Please sign in with your email and password.' });
  }
});

router.get('/me', requireAuth, async (req: AuthedRequest, res: Response) => {
  const user = await Users(req).findById(req.userId);
  if (!user) return res.status(401).json({ message: 'User no longer exists' });
  res.json({ user: toClient('users', user) });
});

export default router;

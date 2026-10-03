import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export const JWT_SECRET = (): string => {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET is not set');
  return s;
};

import { TenantRequest } from './tenant';

export type AuthedRequest = TenantRequest;

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ message: 'Missing token' });
  try {
    const payload = jwt.verify(token, JWT_SECRET()) as { sub: string; role: string; tenant?: string; purpose?: string };
    if (payload.purpose) return res.status(401).json({ message: 'Invalid or expired token' }); // handoff passes are not sessions
    // A token is only valid on the company address it was issued for.
    if (!req.tenant || payload.tenant !== req.tenant._id) return res.status(401).json({ message: 'Invalid or expired token' });
    // Use the account as it is now: a deactivated user, or one whose role changed, must not keep the old session's powers.
    const user: any = await req.models!.users.findById(payload.sub).select('role isActive').lean();
    if (!user || user.isActive === false) return res.status(401).json({ message: 'This account is no longer active' });
    req.userId = payload.sub;
    req.role = user.role;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// Admin-only: wiping a whole collection, or touching user accounts/roles.
export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  if (req.role !== 'Admin') return res.status(403).json({ message: 'Admin access required' });
  next();
}

import { NextFunction, Request, Response } from 'express';
import { Tenant } from '../models/master';
import { modelsFor, tenantDb, TenantModels } from '../models';

export interface TenantRequest extends Request {
  tenant?: { _id: string; companyName: string; dbName: string; status: string };
  models?: TenantModels;
  userId?: string;
  role?: string;
}

// Names that can never be a client workspace.
export const RESERVED_SUBDOMAINS = new Set([
  'www', 'app', 'api', 'admin', 'root', 'mail', 'smtp', 'ftp', 'static', 'assets', 'cdn', 'status', 'support', 'help',
  'docs', 'blog', 'dashboard', 'login', 'signin', 'signup', 'billing', 'portal', 'console', 'dev', 'test', 'staging', 'localhost',
]);
export const SUBDOMAIN_RE = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/;

/** "acme.realtysarv.com" -> "acme"; "acme.localhost:3000" -> "acme"; the bare/main site -> null. */
export function subdomainFromHost(hostHeader: string | undefined): string | null {
  const host = (hostHeader || '').toLowerCase().split(':')[0];
  const base = (process.env.BASE_DOMAIN || 'realtysarv.com').toLowerCase();
  for (const suffix of ['.localhost', `.${base}`]) {
    if (host.endsWith(suffix)) {
      const label = host.slice(0, -suffix.length);
      if (label && !label.includes('.') && !RESERVED_SUBDOMAINS.has(label)) return label;
    }
  }
  return null;
}

/** Dev/testing fallback for hosts that can't have subdomains (Codespaces, IPs): the X-Workspace header. Off by default. */
function workspaceFromHeader(req: TenantRequest): string | null {
  if (process.env.ALLOW_WORKSPACE_HEADER !== 'true') return null;
  const v = String(req.headers['x-workspace'] ?? '').trim().toLowerCase();
  return SUBDOMAIN_RE.test(v) && !RESERVED_SUBDOMAINS.has(v) ? v : null;
}

/** Resolve the client company from the address the browser used (the Host header). */
export async function resolveTenant(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    const sub = subdomainFromHost(req.headers.host) ?? workspaceFromHeader(req);
    if (!sub) return res.status(400).json({ message: 'Open your company address, e.g. yourcompany.realtysarv.com' });
    const tenant = await Tenant.findById(sub).lean();
    if (!tenant || tenant.status !== 'active') return res.status(404).json({ message: 'Workspace not found' });
    req.tenant = tenant as any;
    req.models = modelsFor(tenantDb(tenant.dbName));
    next();
  } catch (e) { next(e); }
}

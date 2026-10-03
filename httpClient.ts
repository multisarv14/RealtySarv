// Thin client for the RealtySarv Express/MongoDB API (proxied to :4000 by Vite in dev).
import { workspaceViaHeader } from './tenant';

const BASE = '/api';
const TOKEN_KEY = 'realtySarvToken';

export const getToken = (): string => {
  try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
};
export const setToken = (t: string) => {
  try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* storage blocked */ }
};

type UnauthorizedListener = () => void;
const unauthorizedListeners = new Set<UnauthorizedListener>();
export const onUnauthorized = (fn: UnauthorizedListener) => {
  unauthorizedListeners.add(fn);
  return () => { unauthorizedListeners.delete(fn); };
};

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function http<T = any>(method: string, path: string, body?: unknown, opts: { auth?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const ws = workspaceViaHeader();
  if (ws) headers['X-Workspace'] = ws;
  const token = getToken();
  if (token && opts.auth !== false) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(BASE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // A 401 on a protected call means the session ended; the login call itself handles its own 401.
    if (res.status === 401 && opts.auth !== false && token) { setToken(''); unauthorizedListeners.forEach((f) => f()); }
    throw new ApiError(res.status, data?.message || `Request failed (${res.status})`);
  }
  return data as T;
}

export const authApi = {
  login: (identity: string, password: string) => http('POST', '/auth/login', { identity, password }, { auth: false }),
  register: (body: { name?: string; email: string; password: string; phone?: string }) => http('POST', '/auth/register', body, { auth: false }),
  workspace: () => http<{ integrations?: { telephony: boolean; whatsapp: boolean }; name: string; subdomain: string; setupCompleted: boolean; allowSignup?: boolean; plan?: string | null; modules?: { crm?: boolean; erp?: boolean }; maxUsers?: number | null }>('GET', '/auth/workspace', undefined, { auth: false }),
  me: () => http('GET', '/auth/me'),
  exchange: (token: string) => http<{ token: string; user: any }>('POST', '/auth/exchange', { token }, { auth: false }),
};

// Calling and WhatsApp through the company's providers. The customer's number stays on the server.
export const integrationsApi = {
  startCall: (leadId: string) => http<import('./types').CallLog>('POST', '/calls', { leadId }),
  sendWhatsApp: (body: { leadId: string; text?: string; templateId?: string; params?: string[] }) => http<import('./types').Message>('POST', '/whatsapp/send', body),
  whatsappWindow: (leadId: string) => http<{ enabled: boolean; enforced?: boolean; open: boolean; until: string | null }>('GET', `/whatsapp/window/${encodeURIComponent(leadId)}`),
  simulateReply: (leadId: string, text: string) => http('POST', '/simulator/whatsapp/incoming', { leadId, text }),
};

/** Live updates from the server (a call changed state, a WhatsApp message arrived). Returns a function that closes it. */
export function openEvents(onEvent: (e: { type: 'call' | 'lead'; [k: string]: unknown }) => void): () => void {
  const ws = workspaceViaHeader();
  const es = new EventSource(`${BASE}/events?token=${encodeURIComponent(getToken())}${ws ? `&workspace=${encodeURIComponent(ws)}` : ''}`);
  es.onmessage = (m) => { try { onEvent(JSON.parse(m.data)); } catch { /* ignore a malformed event */ } };
  return () => es.close();
}

// Main-site endpoints (no company yet).
export const tenantApi = {
  exists: (subdomain: string) => http<{ exists: boolean; companyName?: string }>('GET', `/tenants/exists?subdomain=${encodeURIComponent(subdomain)}`, undefined, { auth: false }),
  check: (subdomain: string) => http<{ available: boolean; reason?: string }>('GET', `/tenants/check?subdomain=${encodeURIComponent(subdomain)}`, undefined, { auth: false }),
  create: (body: unknown) => http<{ subdomain: string; handoff: string }>('POST', '/tenants', body, { auth: false }),
};

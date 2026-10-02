// Which company's workspace is this browser tab on?
//  - acme.realtysarv.com / acme.localhost:3000  -> "acme"   (normal: a subdomain per company)
//  - any other host without wildcard DNS (a Codespace, a plain IP, a preview URL) -> "?workspace=acme" fallback
// The bare domain (realtysarv.com / localhost) is the main site: landing page, install wizard, "find your workspace".
const BASE_DOMAIN: string = (import.meta as any).env?.VITE_BASE_DOMAIN || 'realtysarv.com';
const RESERVED = new Set(['www', 'app', 'api', 'admin']);
const WS_KEY = 'realtySarvWorkspace';
const NAME_RE = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/;

const host = () => window.location.hostname.toLowerCase();
const isLocal = () => host() === 'localhost' || host().endsWith('.localhost');
const inBaseDomain = () => host() === BASE_DOMAIN || host().endsWith(`.${BASE_DOMAIN}`);
/** True when company subdomains can work on this host (localhost or your real domain). */
const subdomainsWork = () => isLocal() || inBaseDomain();

/** Company chosen via ?workspace=acme on hosts that can't have subdomains (remembered for the session). */
function fallbackWorkspace(): string | null {
  if (subdomainsWork()) return null;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.has('workspace')) {
      const v = (params.get('workspace') || '').toLowerCase();
      if (NAME_RE.test(v)) localStorage.setItem(WS_KEY, v); else localStorage.removeItem(WS_KEY);
    }
    const stored = localStorage.getItem(WS_KEY);
    return stored && NAME_RE.test(stored) ? stored : null;
  } catch { return null; }
}

/** The company subdomain of the current address, or null on the main site. */
export function currentTenant(): string | null {
  const h = host();
  for (const suffix of ['.localhost', `.${BASE_DOMAIN}`]) {
    if (h.endsWith(suffix)) {
      const label = h.slice(0, -suffix.length);
      if (label && !label.includes('.') && !RESERVED.has(label)) return label;
    }
  }
  return fallbackWorkspace();
}

/** Set only in fallback mode: sent to the API as X-Workspace because there is no subdomain to read. */
export const workspaceViaHeader = (): string | null => fallbackWorkspace();

const rootHost = () => (isLocal() ? 'localhost' : BASE_DOMAIN);
const portPart = () => (window.location.port ? `:${window.location.port}` : '');

/** Full URL of a company's workspace, e.g. https://acme.realtysarv.com */
export const tenantUrl = (sub: string, handoff?: string) =>
  (subdomainsWork()
    ? `${window.location.protocol}//${sub}.${rootHost()}${portPart()}`
    : `${window.location.origin}/?workspace=${encodeURIComponent(sub)}`) + (handoff ? `#handoff=${handoff}` : '');

/** Full URL of the main site (optionally with a #hash). */
export const mainSiteUrl = (hash = '') =>
  subdomainsWork()
    ? `${window.location.protocol}//${rootHost()}${portPart()}/${hash}`
    : `${window.location.origin}/?workspace=${hash}`;

export const workspaceHostSuffix = () => `.${rootHost()}`;

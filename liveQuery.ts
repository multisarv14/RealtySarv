import { useEffect, useRef, useState } from 'react';
import { getToken } from './httpClient';

// Minimal stand-in for dexie-react-hooks' useLiveQuery. A query re-runs when any table it read
// from changes (writes made through db.* call notifyChange) or when `deps` change.
type Listener = (table: string) => void;
const listeners = new Set<Listener>();
let collector: Set<string> | null = null;

export const notifyChange = (table: string) => listeners.forEach((l) => l(table));
/** Re-run every live query (used on login/logout). */
export const notifyAll = () => listeners.forEach((l) => l('*'));
export const track = (table: string) => { collector?.add(table); };

export function useLiveQuery<T>(querier: () => Promise<T> | T, deps: unknown[] = []): T | undefined {
  const [value, setValue] = useState<T | undefined>(undefined);
  const [tick, setTick] = useState(0);
  const tables = useRef<Set<string>>(new Set());
  const querierRef = useRef(querier);
  querierRef.current = querier;

  useEffect(() => {
    const l: Listener = (t) => { if (t === '*' || tables.current.size === 0 || tables.current.has(t)) setTick((n) => n + 1); };
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);

  useEffect(() => {
    if (!getToken()) return; // signed out: nothing to load (login calls notifyAll)
    let alive = true;
    const seen = new Set<string>();
    collector = seen; // tables are touched synchronously when the querier starts
    let p: Promise<T>;
    try { p = Promise.resolve(querierRef.current()); } finally { collector = null; }
    tables.current = seen;
    p.then((v) => { if (alive) setValue(v); }).catch(() => { /* keep previous value; 401s are handled by the auth layer */ });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return value;
}

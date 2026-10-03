import { Response } from 'express';

// A tiny per-company "push" channel (Server-Sent Events): the browser keeps one connection open and the server tells it when a
// call changes state or a WhatsApp message arrives, so screens update without refreshing.
const clients = new Map<string, Set<Response>>();

export function subscribe(tenantId: string, res: Response): () => void {
  let set = clients.get(tenantId);
  if (!set) clients.set(tenantId, (set = new Set()));
  set.add(res);
  return () => { set!.delete(res); if (!set!.size) clients.delete(tenantId); };
}

export function publish(tenantId: string, event: Record<string, unknown>): void {
  for (const res of clients.get(tenantId) || []) res.write(`data: ${JSON.stringify(event)}\n\n`);
}

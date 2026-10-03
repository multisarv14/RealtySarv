import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { TenantRequest } from '../middleware/tenant';
import { requireAdmin, AuthedRequest } from '../middleware/auth';
import { toClient } from '../models';
import { subscribe } from '../integrations/events';
import { telephonyFor, whatsappFor } from '../integrations/registry';
import { applyCallEvent, applyWhatsAppEvent } from '../integrations/handlers';
import { IntegrationSettings } from '../integrations/types';

// Click-to-call and WhatsApp sending for signed-in users. The customer's number never leaves the server: the app only says "call this lead".
const router = Router();
const M = (req: Request) => (req as TenantRequest).models!;
const T = (req: Request) => (req as TenantRequest).tenant!._id;
const hhmm = () => new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });

export async function integrationSettings(models: TenantRequest['models']): Promise<IntegrationSettings | null> {
  const d: any = await models!.integrationSettings.findById('main').lean();
  return d ? ({ ...d, id: 'main' } as IntegrationSettings) : null;
}

router.post('/calls', async (req: Request, res: Response) => {
  const cfg = await integrationSettings(M(req));
  if (!cfg?.telephony?.enabled) return res.status(400).json({ message: 'Calling from the system is not switched on. Ask an Admin to set it up under Integrations.' });
  const lead: any = await M(req).leads.findById(String(req.body?.leadId || '')).lean();
  if (!lead) return res.status(404).json({ message: 'Lead not found' });
  const agent: any = await M(req).users.findById((req as AuthedRequest).userId).lean();
  if (!String(agent?.phone || '').replace(/\D/g, '')) return res.status(400).json({ message: 'Your phone number is missing. An Admin can add it under Users.' });
  if (!String(lead.phone || '').replace(/\D/g, '')) return res.status(400).json({ message: 'This lead has no mobile number.' });

  const id = randomUUID();
  const base = { _id: id, id, leadId: lead._id, userId: agent._id, status: 'initiated', startedAt: new Date().toISOString(), provider: cfg.telephony.provider, logged: false };
  await M(req).callLogs.create(base);
  try {
    const { providerCallId } = await telephonyFor(cfg.telephony.provider).startCall({
      callId: id, agentPhone: agent.phone, customerPhone: lead.phone,
      emit: (e) => { applyCallEvent(M(req), T(req), e).catch((err) => console.error('call event', err.message)); },
    });
    await M(req).callLogs.updateOne({ _id: id }, { $set: { providerCallId } });
  } catch (e: any) {
    await M(req).callLogs.updateOne({ _id: id }, { $set: { status: 'failed', endedAt: new Date().toISOString(), error: e.message } });
    return res.status(502).json({ message: e.message || 'The call could not be started.' });
  }
  res.status(201).json(toClient('callLogs', await M(req).callLogs.findById(id).lean()));
});

/** Free-form WhatsApp is allowed for 24 hours after the customer's last message; after that only an approved template. */
async function windowFor(models: TenantRequest['models'], leadId: string) {
  const lead: any = await models!.leads.findById(leadId).select('messages').lean();
  const lastIn = ((lead?.messages || []) as any[]).filter((m) => m.sender === 'received' && m.kind === 'whatsapp' && m.at).map((m) => m.at as string).sort().pop();
  const until = lastIn ? new Date(new Date(lastIn).getTime() + 24 * 3600 * 1000) : null;
  return { open: !!until && until.getTime() > Date.now(), until: until?.toISOString() || null };
}

router.get('/whatsapp/window/:leadId', async (req: Request, res: Response) => {
  const cfg = await integrationSettings(M(req));
  if (!cfg?.whatsapp?.enabled) return res.json({ enabled: false, open: false, until: null });
  const w = await windowFor(M(req), req.params.leadId);
  res.json({ enabled: true, enforced: cfg.whatsapp.enforceWindow !== false, ...w });
});

router.post('/whatsapp/send', async (req: Request, res: Response) => {
  const cfg = await integrationSettings(M(req));
  if (!cfg?.whatsapp?.enabled) return res.status(400).json({ message: 'WhatsApp is not switched on. Ask an Admin to set it up under Integrations.' });
  const lead: any = await M(req).leads.findById(String(req.body?.leadId || '')).lean();
  if (!lead) return res.status(404).json({ message: 'Lead not found' });
  if (!String(lead.phone || '').replace(/\D/g, '')) return res.status(400).json({ message: 'This lead has no mobile number.' });

  let text = String(req.body?.text || '').trim();
  let templateId: string | undefined;
  if (req.body?.templateId) {
    const tpl: any = await M(req).whatsappTemplates.findById(String(req.body.templateId)).lean();
    if (!tpl) return res.status(404).json({ message: 'Template not found' });
    const params: string[] = Array.isArray(req.body.params) ? req.body.params.map(String) : [];
    text = String(tpl.body).replace(/\{\{(\d+)\}\}/g, (_m: string, n: string) => params[Number(n) - 1] ?? '');
    templateId = tpl._id;
  } else if (cfg.whatsapp.enforceWindow !== false && !(await windowFor(M(req), lead._id)).open) {
    return res.status(409).json({ code: 'window-closed', message: 'The customer has not written in the last 24 hours, so WhatsApp only allows an approved template message.' });
  }
  if (!text) return res.status(400).json({ message: 'Write the message first.' });

  let waId: string;
  try {
    ({ waId } = await whatsappFor(cfg.whatsapp.provider).send({
      to: lead.phone, text, autoReply: !!cfg.whatsapp.simulatorAutoReply,
      emit: (e) => { applyWhatsAppEvent(M(req), T(req), e).catch((err) => console.error('whatsapp event', err.message)); },
    }));
  } catch (e: any) { return res.status(502).json({ message: e.message || 'The message could not be sent.' }); }

  const message = { id: randomUUID(), content: text, time: hhmm(), sender: 'sent', kind: 'whatsapp', waId, waStatus: 'sent', ...(templateId ? { templateId } : {}), serverOrigin: true, at: new Date().toISOString() };
  await M(req).leads.updateOne({ _id: lead._id }, { $push: { messages: message }, $set: { lastMessage: text, time: message.time } });
  res.status(201).json(message);
});

// Admin test button: pretend the customer wrote back.
router.post('/simulator/whatsapp/incoming', requireAdmin, async (req: Request, res: Response) => {
  const lead: any = await M(req).leads.findById(String(req.body?.leadId || '')).lean();
  if (!lead) return res.status(404).json({ message: 'Lead not found' });
  await applyWhatsAppEvent(M(req), T(req), { type: 'inbound', from: lead.phone, text: String(req.body?.text || 'Hello, I would like to know more.'), waId: 'wamid.sim.' + randomUUID().slice(0, 10) });
  res.status(202).json({ ok: true });
});

// Live updates for the open browser tab. EventSource cannot send headers, so the session token is accepted in the query for this one route.
export function eventsHandler(req: Request, res: Response) {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
  res.flushHeaders?.();
  res.write(': connected\n\n');
  const unsubscribe = subscribe(T(req), res);
  const ping = setInterval(() => res.write(': ping\n\n'), 25000);
  req.on('close', () => { clearInterval(ping); unsubscribe(); });
}

export default router;

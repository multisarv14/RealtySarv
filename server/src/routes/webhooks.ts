import { Router, Request, Response } from 'express';
import { Tenant } from '../models/master';
import { modelsFor, tenantDb } from '../models';
import { applyCallEvent, applyWhatsAppEvent } from '../integrations/handlers';
import { CallEvent, WhatsAppEvent } from '../integrations/types';
import { simulatorRecording } from '../integrations/simulator';
import { integrationSettings } from './integrations';

// Vendors call these addresses, so they are public; the long secret in the address is what proves the call is for this company.
//   /api/webhooks/<company>/<secret>/telephony   /api/webhooks/<company>/<secret>/whatsapp
// Each vendor sends its own format; its adapter turns that into the shared events (the simulator sends them directly).
const router = Router();

async function company(req: Request, res: Response) {
  const t: any = await Tenant.findById(req.params.tenant).lean();
  if (!t || t.status !== 'active') { res.status(404).json({ message: 'Unknown company' }); return null; }
  const models = modelsFor(tenantDb(t.dbName));
  const cfg = await integrationSettings(models);
  if (!cfg || cfg.webhookSecret !== req.params.secret) { res.status(401).json({ message: 'Invalid webhook address' }); return null; }
  return { models, tenantId: String(t._id), cfg };
}

router.post('/:tenant/:secret/telephony', async (req: Request, res: Response) => {
  const c = await company(req, res); if (!c) return;
  const e = req.body as CallEvent;
  if (!e?.providerCallId || !e?.status) return res.status(400).json({ message: 'providerCallId and status are required' });
  await applyCallEvent(c.models, c.tenantId, e);
  res.json({ ok: true });
});

router.post('/:tenant/:secret/whatsapp', async (req: Request, res: Response) => {
  const c = await company(req, res); if (!c) return;
  const e = req.body as WhatsAppEvent;
  if (!e?.type) return res.status(400).json({ message: 'type is required' });
  await applyWhatsAppEvent(c.models, c.tenantId, e);
  res.json({ ok: true });
});

// The simulator's "recording".
export const recordingRoute = (req: Request, res: Response) => { res.type('audio/wav').send(simulatorRecording()); };

export default router;

import { randomUUID } from 'crypto';
import { TenantModels, toClient } from '../models';
import { publish } from './events';
import { CallEvent, WhatsAppEvent } from './types';

const last10 = (s?: string) => String(s || '').replace(/\D/g, '').slice(-10);
const hhmm = () => new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });

/** A call changed state at the vendor: record it and tell the browsers. Same path for webhooks and the simulator. */
export async function applyCallEvent(models: TenantModels, tenantId: string, e: CallEvent): Promise<void> {
  const log: any = await models.callLogs.findOne({ providerCallId: e.providerCallId });
  if (!log) return;
  const now = new Date().toISOString();
  const set: Record<string, unknown> = { status: e.status };
  if (e.status === 'answered') set.answeredAt = now;
  if (['completed', 'no-answer', 'busy', 'failed'].includes(e.status)) set.endedAt = now;
  if (e.durationSec != null) set.durationSec = e.durationSec;
  if (e.recordingUrl) set.recordingUrl = e.recordingUrl;
  await models.callLogs.updateOne({ _id: log._id }, { $set: set });
  const fresh = await models.callLogs.findById(log._id).lean();
  publish(tenantId, { type: 'call', callLog: toClient('callLogs', fresh) });
}

/** A WhatsApp message arrived or changed state: store it on the matching lead and tell the browsers. */
export async function applyWhatsAppEvent(models: TenantModels, tenantId: string, e: WhatsAppEvent): Promise<void> {
  if (e.type === 'status') {
    const lead: any = await models.leads.findOne({ 'messages.waId': e.waId }).select('_id').lean();
    if (!lead) return;
    await models.leads.updateOne({ _id: lead._id }, { $set: { 'messages.$[m].waStatus': e.status } }, { arrayFilters: [{ 'm.waId': e.waId }] });
    publish(tenantId, { type: 'lead', id: String(lead._id) });
    return;
  }
  const key = last10(e.from);
  if (key.length < 10) return;
  const candidates: any[] = await models.leads.find({}).select('phone').lean();
  const match = candidates.find((l) => last10(l.phone) === key);
  if (!match) return;
  const message = { id: randomUUID(), content: e.text, time: hhmm(), sender: 'received', kind: 'whatsapp', waId: e.waId, serverOrigin: true, at: new Date().toISOString() };
  await models.leads.updateOne({ _id: match._id }, { $push: { messages: message }, $set: { lastMessage: e.text, time: message.time, read: false } });
  publish(tenantId, { type: 'lead', id: String(match._id) });
}

import React from 'react';
import { Lead, IntegrationSettings } from '../../types';
import { db } from '../../db';
import { useLiveQuery } from '../../liveQuery';
import { currentTenant } from '../../tenant';
import { integrationsApi } from '../../httpClient';
import { inputCls } from '../ui/Modal';
import { toast } from '../ui/Toast';
import { confirmDialog } from '../ui/Confirm';

const newSecret = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
const TELEPHONY = [['simulator', 'Built-in simulator (for testing)'], ['exotel', 'Exotel (coming soon)'], ['knowlarity', 'Knowlarity (coming soon)'], ['ozonetel', 'Ozonetel (coming soon)'], ['myoperator', 'MyOperator (coming soon)']];
const WHATSAPP = [['simulator', 'Built-in simulator (for testing)'], ['meta', 'WhatsApp Business API, Meta (coming soon)'], ['gupshup', 'Gupshup (coming soon)'], ['interakt', 'Interakt (coming soon)']];

const Switch: React.FC<{ on: boolean; label: string; onChange: (v: boolean) => void }> = ({ on, label, onChange }) => (
  <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${on ? 'bg-[var(--primary-color)]' : 'bg-[var(--light-bg)]'}`}>
    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${on ? 'left-[1.15rem]' : 'left-0.5'}`}></span>
  </button>
);

const Copy: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">{label}</label>
    <div className="flex gap-2">
      <input readOnly value={value} aria-label={label} className={`${inputCls()} font-mono text-xs`} onFocus={e => e.currentTarget.select()} />
      <button type="button" onClick={() => { navigator.clipboard?.writeText(value); toast.info('Copied.'); }} className="h-10 px-3 rounded-lg border border-[var(--border-color)] text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--light-bg)] shrink-0">Copy</button>
    </div>
  </div>
);

/** Switch calling and WhatsApp on, pick the provider, and get the addresses the provider has to call back. */
const AdminLiveConnections: React.FC<{ leads: Lead[] }> = ({ leads }) => {
  const rows = useLiveQuery(() => db.integrationSettings.toArray(), []);
  const templates = useLiveQuery(() => db.whatsappTemplates.toArray(), []);
  const cfg: IntegrationSettings | undefined = rows?.[0];
  const [replyLead, setReplyLead] = React.useState('');
  const [replyText, setReplyText] = React.useState('Hello, I would like to know more about the project.');

  const save = async (patch: Partial<IntegrationSettings>) => { if (cfg) await db.integrationSettings.put({ ...cfg, ...patch } as IntegrationSettings); };
  const setUp = async () => {
    await db.integrationSettings.put({ id: 'main', webhookSecret: newSecret(), telephony: { enabled: false, provider: 'simulator' }, whatsapp: { enabled: false, provider: 'simulator', enforceWindow: true, simulatorAutoReply: false } });
    toast.success('Ready. Switch calling and WhatsApp on below.');
  };
  const sub = currentTenant() || '';
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const base = cfg ? `${origin}/api/webhooks/${sub}/${cfg.webhookSecret}` : '';
  const withPhone = React.useMemo(() => (leads || []).filter(l => l.phone).slice(0, 60), [leads]);

  if (!rows) return null;
  if (!cfg) {
    return (
      <div className="p-4 border border-[var(--light-bg)] rounded-lg" data-testid="live-connections">
        <h4 className="text-sm font-bold text-[var(--text-primary)] mb-1">Calling and WhatsApp from the system</h4>
        <p className="text-sm text-[var(--text-secondary)] mb-3">Call customers and send WhatsApp messages without leaving the lead, with the call and the chat saved on the lead automatically. Start with the built-in simulator to see how it works, then connect your own provider.</p>
        <button onClick={setUp} className="px-4 py-2 rounded-md bg-[var(--primary-color)] text-white text-sm font-medium hover:brightness-110">Set up</button>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="live-connections">
      <div className="p-4 border border-[var(--light-bg)] rounded-lg">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div><h4 className="text-sm font-bold text-[var(--text-primary)]"><i className="fas fa-phone-alt text-[var(--primary-color)] mr-2" aria-hidden="true"></i>Calling from the system</h4><p className="text-xs text-[var(--text-secondary)] mt-0.5">The provider rings the salesperson first, then the customer. The call length and recording come back by themselves.</p></div>
          <Switch on={cfg.telephony.enabled} label="Calling from the system" onChange={v => save({ telephony: { ...cfg.telephony, enabled: v } })} />
        </div>
        <label htmlFor="tel-provider" className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Provider</label>
        <select id="tel-provider" value={cfg.telephony.provider} onChange={e => save({ telephony: { ...cfg.telephony, provider: e.target.value } })} className={inputCls()}>
          {TELEPHONY.map(([v, l]) => <option key={v} value={v} disabled={v !== 'simulator'}>{l}</option>)}
        </select>
        <p className="mt-2 text-xs text-[var(--text-secondary)]">Each salesperson needs a phone number on their profile (Users, Edit).</p>
      </div>

      <div className="p-4 border border-[var(--light-bg)] rounded-lg">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div><h4 className="text-sm font-bold text-[var(--text-primary)]"><i className="fab fa-whatsapp text-green-500 mr-2" aria-hidden="true"></i>WhatsApp from the system</h4><p className="text-xs text-[var(--text-secondary)] mt-0.5">Messages go out from the lead; replies and delivery ticks come back and appear in the chat.</p></div>
          <Switch on={cfg.whatsapp.enabled} label="WhatsApp from the system" onChange={v => save({ whatsapp: { ...cfg.whatsapp, enabled: v } })} />
        </div>
        <label htmlFor="wa-provider" className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Provider</label>
        <select id="wa-provider" value={cfg.whatsapp.provider} onChange={e => save({ whatsapp: { ...cfg.whatsapp, provider: e.target.value } })} className={inputCls()}>
          {WHATSAPP.map(([v, l]) => <option key={v} value={v} disabled={v !== 'simulator'}>{l}</option>)}
        </select>
        <label className="mt-3 flex items-start gap-2 text-sm cursor-pointer"><input type="checkbox" checked={cfg.whatsapp.enforceWindow !== false} onChange={e => save({ whatsapp: { ...cfg.whatsapp, enforceWindow: e.target.checked } })} className="mt-1 h-4 w-4 accent-[var(--primary-color)]" /><span>Follow WhatsApp's 24-hour rule<span className="block text-xs text-[var(--text-secondary)]">Free text only within 24 hours of the customer's last message; otherwise an approved template.</span></span></label>
        {cfg.whatsapp.provider === 'simulator' && (
          <label className="mt-2 flex items-start gap-2 text-sm cursor-pointer"><input type="checkbox" checked={!!cfg.whatsapp.simulatorAutoReply} onChange={e => save({ whatsapp: { ...cfg.whatsapp, simulatorAutoReply: e.target.checked } })} className="mt-1 h-4 w-4 accent-[var(--primary-color)]" /><span>Simulator: the customer replies a few seconds after each message</span></label>
        )}
      </div>

      <div className="p-4 border border-[var(--light-bg)] rounded-lg space-y-3">
        <h4 className="text-sm font-bold text-[var(--text-primary)]">Addresses your provider has to call</h4>
        <p className="text-xs text-[var(--text-secondary)]">Paste these into the provider's dashboard so it can tell us about calls and incoming messages. Keep them private: the long code in them is the password.</p>
        <Copy label="Calls" value={`${base}/telephony`} />
        <Copy label="WhatsApp" value={`${base}/whatsapp`} />
        <button type="button" onClick={async () => { if (await confirmDialog({ title: 'Make new addresses?', message: 'The old addresses stop working. Update them in the provider dashboard.', confirmLabel: 'Make new' })) { await save({ webhookSecret: newSecret() }); toast.success('New addresses are ready.'); } }} className="text-xs font-semibold text-[var(--primary-color)] hover:underline">Make new addresses</button>
      </div>

      {cfg.whatsapp.enabled && cfg.whatsapp.provider === 'simulator' && (
        <div className="p-4 border border-dashed border-[var(--light-bg)] rounded-lg space-y-3" data-testid="simulate-reply">
          <h4 className="text-sm font-bold text-[var(--text-primary)]">Try it: pretend a customer wrote on WhatsApp</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select aria-label="Customer" value={replyLead} onChange={e => setReplyLead(e.target.value)} className={inputCls()}><option value="">Choose a lead</option>{withPhone.map(l => <option key={l.id} value={l.id}>{l.name} · {l.leadProject}</option>)}</select>
            <input aria-label="Message" value={replyText} onChange={e => setReplyText(e.target.value)} className={inputCls()} />
          </div>
          <button type="button" disabled={!replyLead || !replyText.trim()} onClick={async () => { try { await integrationsApi.simulateReply(replyLead, replyText.trim()); toast.success('The reply is on its way to that lead.'); } catch (e: any) { toast.error(e?.message || 'Could not simulate.'); } }} className="px-3 py-1.5 rounded-lg border border-[var(--border-color)] text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--light-bg)] disabled:opacity-50">Simulate a reply</button>
        </div>
      )}

      <div className="p-4 border border-[var(--light-bg)] rounded-lg">
        <h4 className="text-sm font-bold text-[var(--text-primary)] mb-2">WhatsApp templates</h4>
        <ul className="divide-y divide-[var(--light-bg)] text-sm">
          {(templates || []).map(t => <li key={t.id} className="py-2"><p className="font-semibold text-[var(--text-primary)]">{t.name}</p><p className="text-xs text-[var(--text-secondary)]">{t.body}</p></li>)}
          {(templates || []).length === 0 && <li className="py-2 text-[var(--text-secondary)]">No templates yet.</li>}
        </ul>
        <p className="mt-2 text-xs text-[var(--text-secondary)]">With a real WhatsApp provider the template names and texts must match the ones approved by WhatsApp.</p>
      </div>
    </div>
  );
};

export default AdminLiveConnections;

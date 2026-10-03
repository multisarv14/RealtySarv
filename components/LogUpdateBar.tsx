import React from 'react';
import { CallLog, Lead, LeadStatus, Task, WhatsAppTemplate } from '../types';
import { integrationsApi } from '../httpClient';
import { Chips, inputCls } from './ui/Modal';
import { friendlyDate, openWhatsApp, time12, todayISO } from './leadUi';

export type LogKind = 'note' | 'call' | 'whatsapp' | 'meeting';
export interface LogUpdatePayload {
  kind: LogKind; text: string; outcome?: string; status: LeadStatus;
  /** The follow-up this contact completes. */
  completeTaskId?: string;
  next?: { type: 'Call' | 'Meeting' | 'Email'; date: string; time: string };
  /** WhatsApp only: did we write, or did the customer reply? */
  direction?: 'sent' | 'received';
  recordingUrl?: string; recordingName?: string;
  /** The call from the system that this update is about: its length and recording are filled in by the server. */
  callLogId?: string; durationSec?: number;
  /** The message was already sent through the WhatsApp API (the server stored it); only the status and follow-up are saved here. */
  skipMessage?: boolean;
  /** Unqualified: nothing more to chase, so every other open follow-up is closed too. */
  closeOpenFollowUps?: boolean;
}

interface LogUpdateBarProps {
  lead: Lead;
  /** Set when the user pressed Done on a follow-up in the Timeline. */
  focusTaskId?: string | null;
  /** The header's Call / WhatsApp buttons ask for that type to be ready (n changes on every press). */
  preset?: { kind: LogKind; n: number } | null;
  /** The latest finished call from the system that has not been written up yet. */
  callLog?: CallLog | null;
  /** Calling / WhatsApp go through the company's providers when these are on. */
  integrations?: { telephony: boolean; whatsapp: boolean };
  templates?: WhatsAppTemplate[];
  /** For filling template blanks: your name and the company's. */
  userName?: string;
  companyName?: string;
  /** Sends through the WhatsApp API; resolves when the server has stored the message. */
  onSendWhatsApp?: (body: { text?: string; templateId?: string; params?: string[] }) => Promise<void>;
  onClearFocus: () => void;
  onSave: (payload: LogUpdatePayload) => void;
}

const KINDS: { key: LogKind; label: string; icon: string }[] = [
  { key: 'call', label: 'Call', icon: 'fas fa-phone-alt' },
  { key: 'whatsapp', label: 'WhatsApp', icon: 'fab fa-whatsapp' },
  { key: 'meeting', label: 'Meeting', icon: 'fas fa-handshake' },
  { key: 'note', label: 'Note', icon: 'fas fa-sticky-note' },
];
const OUTCOMES = ['Spoke', 'No answer', 'Call back later', 'Not interested'];
const STATUSES: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Unqualified', 'Converted'];
const addDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0]; };
const QUICK: [string, number][] = [['Today', 0], ['Tomorrow', 1], ['In 3 days', 3], ['Next week', 7]];
const followUpTime = (t: Task) => (t.description || '').match(/Scheduled for (\d{1,2}:\d{2})/)?.[1];

/** The bar at the bottom of Activity: what happened, the status now, and what comes next, saved in one go. */
const MAX_AUDIO = 2 * 1024 * 1024;

const LogUpdateBar: React.FC<LogUpdateBarProps> = ({ lead, focusTaskId, preset, callLog, integrations, templates = [], userName, companyName, onSendWhatsApp, onClearFocus, onSave }) => {
  const pending = React.useMemo(() => (lead.tasks || []).filter(t => t.status === 'Pending' && t.title.startsWith('Follow-up:'))
    .sort((a, b) => (a.dueDate + (followUpTime(a) || '')).localeCompare(b.dueDate + (followUpTime(b) || ''))), [lead.tasks]);
  const target = pending.find(t => t.id === focusTaskId) || pending[0];

  const [kind, setKind] = React.useState<LogKind>('note');
  const [text, setText] = React.useState('');
  const [outcome, setOutcome] = React.useState('');
  const [status, setStatus] = React.useState<LeadStatus>(lead.leadStatus);
  const [done, setDone] = React.useState(true);
  const [nextDate, setNextDate] = React.useState('');
  const [nextTime, setNextTime] = React.useState('11:00');
  const [nextType, setNextType] = React.useState<'Call' | 'Meeting' | 'Email'>('Call');
  const [direction, setDirection] = React.useState<'sent' | 'received'>('sent');
  const [sending, setSending] = React.useState(false);
  const [sendError, setSendError] = React.useState('');
  const [win, setWin] = React.useState<{ enabled: boolean; enforced?: boolean; open: boolean; until: string | null } | null>(null);
  const [tplId, setTplId] = React.useState('');
  const [tplParams, setTplParams] = React.useState<string[]>([]);
  const [recUrl, setRecUrl] = React.useState('');
  const [recName, setRecName] = React.useState('');
  const [recError, setRecError] = React.useState('');
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [showErrors, setShowErrors] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // A different lead, or Done pressed on a follow-up: start fresh (and open, so the next steps are in view).
  React.useEffect(() => {
    setKind('note'); setText(''); setOutcome(''); setStatus(lead.leadStatus); setDone(true); setNextDate(''); setNextTime('11:00'); setShowErrors(false); setOpen(false); setDirection('sent'); setRecUrl(''); setRecName(''); setRecError(''); setTplId(''); setTplParams([]); setSendError(''); setWin(null);
  }, [lead.id]);
  React.useEffect(() => {
    if (!preset) return;
    setKind(preset.kind); setOpen(true);
    window.setTimeout(() => inputRef.current?.focus(), 50);
  }, [preset?.n]);
  React.useEffect(() => {
    if (!focusTaskId) return;
    const t = pending.find(x => x.id === focusTaskId);
    setKind(t?.title.includes('Meeting') ? 'meeting' : 'call'); setDone(true); setOpen(true);
    window.setTimeout(() => inputRef.current?.focus(), 50);
  }, [focusTaskId]);

  const sendMode = kind === 'whatsapp' && !!integrations?.whatsapp;
  React.useEffect(() => {
    if (!sendMode) return;
    let alive = true;
    integrationsApi.whatsappWindow(lead.id).then(w => { if (alive) setWin(w); }).catch(() => { if (alive) setWin(null); });
    return () => { alive = false; };
  }, [sendMode, lead.id, lead.messages?.length]);
  const tpl = templates.find(t => t.id === tplId);
  const mustUseTemplate = sendMode && !!win?.enforced && !win.open;
  // Fill the blanks from what we know: the customer's first name, your name, the company, the project.
  const guess = (label: string) => /customer|name$/i.test(label) && /customer/i.test(label) ? lead.name.split(' ')[0] : /your/i.test(label) ? (userName || '') : /company/i.test(label) ? (companyName || '') : /project/i.test(label) ? (lead.leadProject !== 'Not Assigned' ? lead.leadProject : '') : '';
  const pickTemplate = (id: string) => { setTplId(id); const t = templates.find(x => x.id === id); setTplParams((t?.params || []).map(guess)); };
  const renderedTemplate = tpl ? tpl.body.replace(/\{\{(\d+)\}\}/g, (_m, n) => tplParams[Number(n) - 1] || `{{${n}}}`) : '';
  const booked = lead.bookingStatus === 'Booked';
  const unqualified = status === 'Unqualified';
  const nextRequired = !booked && status !== 'Converted' && !unqualified;
  const wroteSomething = !!text.trim() || !!outcome || (sendMode && !!tpl);
  const errors = {
    text: wroteSomething ? '' : sendMode ? 'Write the message, or pick a template.' : 'Write what happened, or pick an outcome.',
    template: mustUseTemplate && !tpl ? 'WhatsApp only allows an approved template now. Pick one.' : mustUseTemplate && tplParams.some(p => !p.trim()) ? 'Fill in every blank of the template.' : '',
    next: nextRequired && !(nextDate && nextTime) ? 'Pick the date and time of the next follow-up.' : '',
    recording: recUrl && !/^(https?:\/\/|data:audio\/)/i.test(recUrl) ? 'The recording link must start with http:// or https://' : '',
  };
  const readAudio = (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('audio/')) { setRecError('Choose an audio file.'); return; }
    if (file.size > MAX_AUDIO) { setRecError('That file is over 2 MB. Paste a link to the recording instead.'); return; }
    const r = new FileReader();
    r.onload = () => { setRecUrl(String(r.result)); setRecName(file.name); setRecError(''); };
    r.readAsDataURL(file);
  };

  const save = async () => {
    if (errors.text || errors.next || errors.recording || errors.template) { setShowErrors(true); setOpen(true); return; }
    if (sendMode && onSendWhatsApp) {
      setSending(true); setSendError('');
      try { await onSendWhatsApp(mustUseTemplate || tpl ? { templateId: tplId, params: tplParams } : { text: text.trim() }); }
      catch (e: any) { setSendError(e?.message || 'The message could not be sent.'); setSending(false); setOpen(true); return; }
      setSending(false);
    }
    const viaCall = kind === 'call' && !!callLog;
    onSave({
      kind, text: sendMode ? '' : text.trim(), outcome: outcome || undefined, status, completeTaskId: done && target ? target.id : undefined,
      next: !unqualified && nextDate && nextTime ? { type: nextType, date: nextDate, time: nextTime } : undefined,
      direction: kind === 'whatsapp' && !sendMode ? direction : undefined,
      recordingUrl: viaCall ? callLog!.recordingUrl : kind === 'call' && recUrl ? recUrl : undefined,
      recordingName: viaCall ? (callLog!.recordingUrl ? 'Call recording' : undefined) : kind === 'call' && recUrl ? (recName || 'Call recording') : undefined,
      callLogId: viaCall ? callLog!.id : undefined, durationSec: viaCall ? callLog!.durationSec : undefined,
      skipMessage: sendMode || undefined,
      closeOpenFollowUps: unqualified,
    });
    setText(''); setOutcome(''); setNextDate(''); setShowErrors(false); setOpen(false); setKind('note'); setRecUrl(''); setRecName(''); setRecError(''); setDirection('sent'); setTplId(''); setTplParams([]); onClearFocus();
  };
  const pickQuick = (label: string) => { setNextDate(addDays(QUICK.find(q => q[0] === label)![1])); };
  const quickValue = QUICK.find(([, n]) => addDays(n) === nextDate)?.[0] || '';

  return (
    <div className="border-t border-[var(--border-color)] bg-[var(--medium-bg)] flex-shrink-0" data-testid="log-update">
      {open && (
        <div className="px-3 py-2 flex flex-wrap lg:flex-nowrap items-center gap-x-2 gap-y-2 border-b border-[var(--border-color)] animate-fadeIn max-h-[40vh] overflow-y-auto [&_input]:!h-8 [&_select]:!h-8 [&_input]:!text-xs [&_select]:!text-xs [&_[role=radio]]:!h-7 [&_[role=radio]]:!px-2.5">
          {kind !== 'note' && !sendMode && (
            <div>
              <select aria-label="Outcome" value={outcome} onChange={e => setOutcome(e.target.value)} className={`${inputCls()} !w-auto`}><option value="">How did it go?</option>{OUTCOMES.map(o => <option key={o}>{o}</option>)}</select>
            </div>
          )}
          {kind === 'whatsapp' && sendMode && (
            <div data-testid="whatsapp-window" className="flex flex-wrap items-center gap-2">
              {(mustUseTemplate || tpl || !win?.open) && (
                <div className="contents">
                  <label htmlFor="wa-template" className="sr-only">Template message</label>
                  <select id="wa-template" value={tplId} onChange={e => pickTemplate(e.target.value)} className={`${inputCls(showErrors && !!errors.template)} !w-auto`}>
                    <option value="">{mustUseTemplate ? 'Choose a template (24h passed)' : 'No template (write a normal message)'}</option>
                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  {tpl && (
                    <div className="contents">
                      {tpl.params.map((label, i) => (
                        guess(label) ? null : <input key={i} aria-label={label} placeholder={label} value={tplParams[i] || ''} onChange={e => setTplParams(p => p.map((v, j) => (j === i ? e.target.value : v)))} className={inputCls(showErrors && !(tplParams[i] || '').trim())} />
                      ))}
                      <p className="basis-full order-last text-xs text-[var(--text-secondary)] bg-[var(--dark-bg)] rounded-lg p-2.5 border border-[var(--border-color)]" data-testid="wa-preview">{renderedTemplate}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {kind === 'whatsapp' && !sendMode && (
            <div>
              <p className="text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">Whose message is this?</p>
              <div className="flex flex-wrap items-center gap-2">
                <Chips label="Direction" options={['We sent', 'Customer replied']} value={direction === 'sent' ? 'We sent' : 'Customer replied'} onChange={(v: string) => setDirection(v === 'We sent' ? 'sent' : 'received')} />
                {lead.phone && <button type="button" onClick={() => openWhatsApp(lead.phone, text.trim() || undefined)} className="h-8 px-3 rounded-full text-xs font-semibold border border-green-500/50 text-green-500 hover:bg-green-500/10"><i className="fab fa-whatsapp mr-1.5" aria-hidden="true"></i>Open WhatsApp{text.trim() ? ' with this message' : ''}</button>}
              </div>
            </div>
          )}
          {kind === 'call' && callLog && (
            <p className="text-xs text-[var(--text-primary)] bg-[var(--dark-bg)] rounded-lg p-2.5 border border-[var(--border-color)] flex items-center gap-2" data-testid="call-captured">
              <i className="fas fa-phone-alt text-[var(--primary-color)]" aria-hidden="true"></i>
              <span>This call was captured by the system{callLog.durationSec ? `: ${Math.floor(callLog.durationSec / 60)}m ${callLog.durationSec % 60}s` : ''}{callLog.recordingUrl ? ', recording attached' : ''}.</span>
            </p>
          )}
          {kind === 'call' && !callLog && (
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <input ref={fileRef} type="file" accept="audio/*" className="hidden" aria-label="Recording file" onChange={e => { readAudio(e.target.files?.[0]); e.target.value = ''; }} />
                <button type="button" onClick={() => fileRef.current?.click()} className="h-8 px-2.5 rounded-lg text-xs font-semibold border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--light-bg)]"><i className="fas fa-paperclip mr-1.5" aria-hidden="true"></i>Attach audio</button>
                {recUrl.startsWith('data:') && <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5"><i className="fas fa-microphone" aria-hidden="true"></i>{recName}<button type="button" aria-label="Remove recording" onClick={() => { setRecUrl(''); setRecName(''); }} className="hover:text-[var(--text-primary)]"><i className="fas fa-times" aria-hidden="true"></i></button></span>}
              </div>
              {(recError || (showErrors && errors.recording)) && <p role="alert" className="mt-1 text-xs text-red-500">{recError || errors.recording}</p>}
            </div>
          )}
          <div className="contents">
            <div className="flex items-center gap-1.5">
              <label htmlFor="log-status" className="text-[11px] font-semibold text-[var(--text-secondary)]">Status</label>
              <select id="log-status" value={status} onChange={e => setStatus(e.target.value as LeadStatus)} className={`${inputCls()} !w-auto`}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            {target && (
              <label className="flex items-center gap-2 text-xs cursor-pointer" title="Closes the follow-up you are updating">
                <input type="checkbox" checked={done} onChange={e => setDone(e.target.checked)} className="!h-4 w-4 accent-[var(--primary-color)]" />
                <span><b className="text-[var(--text-primary)] whitespace-nowrap">Mark done</b><span className="hidden">{target.title.replace('Follow-up:', '')} · {friendlyDate(target.dueDate)}{followUpTime(target) ? `, ${time12(followUpTime(target))}` : ''}{target.dueDate < todayISO() ? ' (overdue)' : ''}</span></span>
              </label>
            )}
          </div>
          {unqualified ? (
            <p className="text-xs text-[var(--text-secondary)]"><i className="fas fa-info-circle mr-1.5" aria-hidden="true"></i>No next follow-up is needed for an unqualified lead. Any follow-up still open for this lead will be closed.</p>
          ) : (
          <div className="lg:flex-1 min-w-0">
            <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
              <span className="text-[11px] font-semibold text-[var(--text-secondary)] whitespace-nowrap" title="Next follow-up">Next{nextRequired ? <span className="text-red-500"> *</span> : <span className="font-normal"> (opt.)</span>}</span>
              <select aria-label="Quick date" value={quickValue} onChange={e => e.target.value && pickQuick(e.target.value)} className={`${inputCls()} !w-auto`}><option value="">Pick a day</option>{QUICK.map(q => <option key={q[0]}>{q[0]}</option>)}</select>
              <input type="date" aria-label="Next follow-up date" min={todayISO()} value={nextDate} onChange={e => setNextDate(e.target.value)} className={`${inputCls(showErrors && !!errors.next && !nextDate)} !w-auto`} />
              <input type="time" aria-label="Next follow-up time" value={nextTime} onChange={e => setNextTime(e.target.value)} className={`${inputCls(showErrors && !!errors.next && !nextTime)} !w-auto`} />
              <select aria-label="Next follow-up type" value={nextType} onChange={e => setNextType(e.target.value as 'Call' | 'Meeting' | 'Email')} className={`${inputCls()} !w-auto`}><option>Call</option><option>Meeting</option><option>Email</option></select>
            </div>
          </div>
          )}
          {((showErrors && (errors.text || errors.next || errors.template)) || sendError) && <p role="alert" className="text-xs text-red-500"><i className="fas fa-exclamation-circle mr-1" aria-hidden="true"></i>{sendError || errors.text || errors.template || errors.next}</p>}
        </div>
      )}
      <div className="px-3 flex items-center gap-2 md:h-[64px] py-2 md:py-0">
        <div role="group" aria-label="Type of update" className="flex items-center gap-1 shrink-0">
          {KINDS.map(k => (
            <button key={k.key} type="button" aria-pressed={kind === k.key} title={k.key === 'whatsapp' ? (integrations?.whatsapp ? 'WhatsApp: send a message to the customer' : 'WhatsApp: record a message') : k.key === 'note' ? 'Note for your team' : `${k.label}: record it for your team`} aria-label={k.label} onClick={() => { setKind(k.key); setOpen(true); inputRef.current?.focus(); }}
              className={`h-8 w-8 rounded-full flex items-center justify-center text-xs transition-colors ${kind === k.key ? 'bg-[var(--primary-color)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--light-bg)] hover:text-[var(--text-primary)]'}`}><i className={k.icon} aria-hidden="true"></i></button>
          ))}
        </div>
        <input ref={inputRef} type="text" aria-label="Add a note" value={text} onChange={e => setText(e.target.value)} onFocus={() => setOpen(true)} onKeyDown={e => { if (e.key === 'Enter') void save(); }}
          placeholder={kind === 'note' ? 'Note for your team (not sent to the customer)' : kind === 'call' ? 'What was discussed on the call? (team only)' : kind === 'whatsapp' ? (sendMode ? 'Message to send to the customer on WhatsApp' : 'Record a WhatsApp message (not sent from here)') : 'What was decided in the meeting? (team only)'}
          className="flex-1 min-w-0 h-10 bg-[var(--input-bg)] rounded-full px-4 text-sm border border-[var(--border-color)] text-[var(--text-primary)] outline-none focus:border-[var(--primary-color)]" />
        <button type="button" onClick={() => setOpen(o => !o)} aria-label={open ? 'Hide next steps' : 'Show next steps'} aria-expanded={open} title="Status and next follow-up" className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--light-bg)]"><i className={`fas fa-chevron-${open ? 'down' : 'up'} text-xs`} aria-hidden="true"></i></button>
        <button onClick={() => void save()} disabled={sending} aria-label={sendMode ? 'Send WhatsApp and save' : 'Save update'} title={sendMode ? 'Send to the customer on WhatsApp, and save' : 'Save for your team (not sent to the customer)'} className={`${sendMode ? 'bg-green-600' : 'bg-[var(--primary-color)]'} disabled:opacity-60 w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-white transition-opacity hover:opacity-90`}><i className={`fas ${sendMode ? 'fa-paper-plane' : 'fa-check'} text-sm`} aria-hidden="true"></i></button>
      </div>
    </div>
  );
};

export default LogUpdateBar;

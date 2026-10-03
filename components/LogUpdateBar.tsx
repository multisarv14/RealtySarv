import React from 'react';
import { Lead, LeadStatus, Task } from '../types';
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
  /** Unqualified: nothing more to chase, so every other open follow-up is closed too. */
  closeOpenFollowUps?: boolean;
}

interface LogUpdateBarProps {
  lead: Lead;
  /** Set when the user pressed Done on a follow-up in the Timeline. */
  focusTaskId?: string | null;
  /** The header's Call / WhatsApp buttons ask for that type to be ready (n changes on every press). */
  preset?: { kind: LogKind; n: number } | null;
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

const LogUpdateBar: React.FC<LogUpdateBarProps> = ({ lead, focusTaskId, preset, onClearFocus, onSave }) => {
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
  const [recUrl, setRecUrl] = React.useState('');
  const [recName, setRecName] = React.useState('');
  const [recError, setRecError] = React.useState('');
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [showErrors, setShowErrors] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // A different lead, or Done pressed on a follow-up: start fresh (and open, so the next steps are in view).
  React.useEffect(() => {
    setKind('note'); setText(''); setOutcome(''); setStatus(lead.leadStatus); setDone(true); setNextDate(''); setNextTime('11:00'); setShowErrors(false); setOpen(false); setDirection('sent'); setRecUrl(''); setRecName(''); setRecError('');
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

  const booked = lead.bookingStatus === 'Booked';
  const unqualified = status === 'Unqualified';
  const nextRequired = !booked && status !== 'Converted' && !unqualified;
  const wroteSomething = !!text.trim() || !!outcome;
  const errors = {
    text: wroteSomething ? '' : 'Write what happened, or pick an outcome.',
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

  const save = () => {
    if (errors.text || errors.next || errors.recording) { setShowErrors(true); setOpen(true); return; }
    onSave({
      kind, text: text.trim(), outcome: outcome || undefined, status, completeTaskId: done && target ? target.id : undefined,
      next: !unqualified && nextDate && nextTime ? { type: nextType, date: nextDate, time: nextTime } : undefined,
      direction: kind === 'whatsapp' ? direction : undefined,
      recordingUrl: kind === 'call' && recUrl ? recUrl : undefined, recordingName: kind === 'call' && recUrl ? (recName || 'Call recording') : undefined,
      closeOpenFollowUps: unqualified,
    });
    setText(''); setOutcome(''); setNextDate(''); setShowErrors(false); setOpen(false); setKind('note'); setRecUrl(''); setRecName(''); setRecError(''); setDirection('sent'); onClearFocus();
  };
  const pickQuick = (label: string) => { setNextDate(addDays(QUICK.find(q => q[0] === label)![1])); };
  const quickValue = QUICK.find(([, n]) => addDays(n) === nextDate)?.[0] || '';

  return (
    <div className="border-t border-[var(--border-color)] bg-[var(--medium-bg)] flex-shrink-0" data-testid="log-update">
      {open && (
        <div className="px-3 pt-3 pb-2 space-y-3 border-b border-[var(--border-color)] animate-fadeIn">
          {kind !== 'note' && (
            <div>
              <p className="text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">How did it go?</p>
              <Chips label="Outcome" options={OUTCOMES} value={outcome} onChange={(v: string) => setOutcome(outcome === v ? '' : v)} />
            </div>
          )}
          {kind === 'whatsapp' && (
            <div>
              <p className="text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">Whose message is this?</p>
              <div className="flex flex-wrap items-center gap-2">
                <Chips label="Direction" options={['We sent', 'Customer replied']} value={direction === 'sent' ? 'We sent' : 'Customer replied'} onChange={(v: string) => setDirection(v === 'We sent' ? 'sent' : 'received')} />
                {lead.phone && <button type="button" onClick={() => openWhatsApp(lead.phone, text.trim() || undefined)} className="h-8 px-3 rounded-full text-xs font-semibold border border-green-500/50 text-green-500 hover:bg-green-500/10"><i className="fab fa-whatsapp mr-1.5" aria-hidden="true"></i>Open WhatsApp{text.trim() ? ' with this message' : ''}</button>}
              </div>
            </div>
          )}
          {kind === 'call' && (
            <div>
              <p className="text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">Call recording <span className="font-normal">(optional)</span></p>
              <div className="flex flex-wrap items-center gap-2">
                <input type="url" aria-label="Recording link" placeholder="Paste the recording link" value={recUrl.startsWith('data:') ? '' : recUrl} onChange={e => { setRecUrl(e.target.value); setRecName(''); setRecError(''); }} className={`${inputCls(showErrors && !!errors.recording)} !w-64`} />
                <input ref={fileRef} type="file" accept="audio/*" className="hidden" aria-label="Recording file" onChange={e => { readAudio(e.target.files?.[0]); e.target.value = ''; }} />
                <button type="button" onClick={() => fileRef.current?.click()} className="h-10 px-3 rounded-lg text-xs font-semibold border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--light-bg)]"><i className="fas fa-paperclip mr-1.5" aria-hidden="true"></i>Attach audio</button>
                {recUrl.startsWith('data:') && <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5"><i className="fas fa-microphone" aria-hidden="true"></i>{recName}<button type="button" aria-label="Remove recording" onClick={() => { setRecUrl(''); setRecName(''); }} className="hover:text-[var(--text-primary)]"><i className="fas fa-times" aria-hidden="true"></i></button></span>}
              </div>
              {(recError || (showErrors && errors.recording)) && <p role="alert" className="mt-1 text-xs text-red-500">{recError || errors.recording}</p>}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <label htmlFor="log-status" className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">Lead status now</label>
              <select id="log-status" value={status} onChange={e => setStatus(e.target.value as LeadStatus)} className={inputCls()}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            {target && (
              <label className="flex items-start gap-2 text-xs cursor-pointer sm:mt-6">
                <input type="checkbox" checked={done} onChange={e => setDone(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--primary-color)]" />
                <span><b className="text-[var(--text-primary)]">Mark follow-up done</b><span className="block text-[var(--text-secondary)]">{target.title.replace('Follow-up:', '')} · {friendlyDate(target.dueDate)}{followUpTime(target) ? `, ${time12(followUpTime(target))}` : ''}{target.dueDate < todayISO() ? ' (overdue)' : ''}</span></span>
              </label>
            )}
          </div>
          {unqualified ? (
            <p className="text-xs text-[var(--text-secondary)]"><i className="fas fa-info-circle mr-1.5" aria-hidden="true"></i>No next follow-up is needed for an unqualified lead. Any follow-up still open for this lead will be closed.</p>
          ) : (
          <div>
            <p className="text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">Next follow-up{nextRequired ? <span className="text-red-500"> *</span> : <span className="font-normal"> (optional)</span>}</p>
            <div className="flex flex-wrap items-center gap-2">
              <Chips label="Quick date" options={QUICK.map(q => q[0])} value={quickValue} onChange={pickQuick} />
              <input type="date" aria-label="Next follow-up date" min={todayISO()} value={nextDate} onChange={e => setNextDate(e.target.value)} className={`${inputCls(showErrors && !!errors.next && !nextDate)} !w-auto`} />
              <input type="time" aria-label="Next follow-up time" value={nextTime} onChange={e => setNextTime(e.target.value)} className={`${inputCls(showErrors && !!errors.next && !nextTime)} !w-auto`} />
              <select aria-label="Next follow-up type" value={nextType} onChange={e => setNextType(e.target.value as 'Call' | 'Meeting' | 'Email')} className={`${inputCls()} !w-auto`}><option>Call</option><option>Meeting</option><option>Email</option></select>
            </div>
          </div>
          )}
          {showErrors && (errors.text || errors.next) && <p role="alert" className="text-xs text-red-500"><i className="fas fa-exclamation-circle mr-1" aria-hidden="true"></i>{errors.text || errors.next}</p>}
        </div>
      )}
      <div className="px-3 flex items-center gap-2 md:h-[64px] py-2 md:py-0">
        <div role="group" aria-label="Type of update" className="flex items-center gap-1 shrink-0">
          {KINDS.map(k => (
            <button key={k.key} type="button" aria-pressed={kind === k.key} title={k.label} aria-label={k.label} onClick={() => { setKind(k.key); setOpen(true); inputRef.current?.focus(); }}
              className={`h-8 w-8 rounded-full flex items-center justify-center text-xs transition-colors ${kind === k.key ? 'bg-[var(--primary-color)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--light-bg)] hover:text-[var(--text-primary)]'}`}><i className={k.icon} aria-hidden="true"></i></button>
          ))}
        </div>
        <input ref={inputRef} type="text" aria-label="Add a note" value={text} onChange={e => setText(e.target.value)} onFocus={() => setOpen(true)} onKeyDown={e => { if (e.key === 'Enter') save(); }}
          placeholder={kind === 'note' ? 'Add a note or update…' : kind === 'call' ? 'What did you discuss on the call?' : kind === 'whatsapp' ? 'What was said on WhatsApp?' : 'What was decided in the meeting?'}
          className="flex-1 min-w-0 h-10 bg-[var(--input-bg)] rounded-full px-4 text-sm border border-[var(--border-color)] text-[var(--text-primary)] outline-none focus:border-[var(--primary-color)]" />
        <button type="button" onClick={() => setOpen(o => !o)} aria-label={open ? 'Hide next steps' : 'Show next steps'} aria-expanded={open} title="Status and next follow-up" className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--light-bg)]"><i className={`fas fa-chevron-${open ? 'down' : 'up'} text-xs`} aria-hidden="true"></i></button>
        <button onClick={save} aria-label="Save update" title="Save update" className="bg-[var(--primary-color)] w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-white transition-opacity hover:opacity-90"><i className="fas fa-paper-plane text-sm" aria-hidden="true"></i></button>
      </div>
    </div>
  );
};

export default LogUpdateBar;

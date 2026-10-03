import React from 'react';
import { NewFollowUpData, User } from '../types';
import { Modal, Field, Chips, inputCls, textareaCls } from './ui/Modal';
import { todayISO } from './leadUi';

type FollowUpContext = 'Leads' | 'Visits' | 'Booking' | 'Agreement' | 'Possession';

interface FollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFollowUp: (followUpData: NewFollowUpData) => void;
  users: User[];
  context?: FollowUpContext;
  leadName?: string;
  /** Name preselected as the owner (the signed-in user). */
  defaultAssignee?: string;
}

const addDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0]; };
const QUICK: [string, number][] = [['Today', 0], ['Tomorrow', 1], ['In 3 days', 3], ['Next week', 7]];

const FollowUpModal: React.FC<FollowUpModalProps> = ({ isOpen, onClose, onAddFollowUp, users, context = 'Leads', leadName, defaultAssignee }) => {
  const [type, setType] = React.useState<'Call' | 'Email' | 'Meeting'>('Call');
  const [date, setDate] = React.useState('');
  const [time, setTime] = React.useState('');
  const [assignedTo, setAssignedTo] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    setType('Call'); setDate(''); setTime(''); setNotes(''); setSubmitted(false);
    setAssignedTo(users.find(u => u.name === defaultAssignee)?.name || users[0]?.name || defaultAssignee || '');
  }, [isOpen, users, defaultAssignee]);

  const errors = { date: !date ? 'Pick a due date.' : '', time: !time ? 'Pick a time.' : '' };
  const show = (k: keyof typeof errors) => (submitted && errors[k]) || null;
  const quickValue = QUICK.find(([, n]) => addDays(n) === date)?.[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (errors.date || errors.time) return;
    onAddFollowUp({ type, date, time, assignedTo, notes: notes.trim() || undefined });
    onClose();
  };

  const subtitle = [leadName, context !== 'Leads' ? `${context} stage` : ''].filter(Boolean).join(' · ');

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" title="Schedule follow-up" subtitle={subtitle} onSubmit={handleSubmit} submitLabel="Set reminder">
      <Field label="What" htmlFor="followUpType"><Chips label="Follow-up type" options={['Call', 'Meeting', 'Email']} value={type} onChange={setType} /></Field>
      <div>
        <Field label="When" htmlFor="followUpDate" required error={show('date')}>
          <div className="mb-2"><Chips label="Quick date" options={QUICK.map(q => q[0])} value={quickValue || ''} onChange={(label: string) => setDate(addDays(QUICK.find(q => q[0] === label)![1]))} /></div>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <input id="followUpDate" type="date" min={todayISO()} value={date} onChange={e => setDate(e.target.value)} className={inputCls(!!show('date'))} aria-label="Due date" aria-invalid={!!show('date')} />
          </div>
          <div>
            <input id="followUpTime" type="time" value={time} onChange={e => setTime(e.target.value)} className={inputCls(!!show('time'))} aria-label="Time" aria-invalid={!!show('time')} />
            {show('time') && <p role="alert" className="mt-1 text-xs text-red-500">{show('time')}</p>}
          </div>
        </div>
      </div>
      <Field label="Assign to" htmlFor="followUpAssignedTo">
        <select id="followUpAssignedTo" value={assignedTo} onChange={e => setAssignedTo(e.target.value)} className={inputCls()}>
          {users.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
        </select>
      </Field>
      <Field label="Notes" htmlFor="followUpNotes" hint="Optional: what to discuss or achieve.">
        <textarea id="followUpNotes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className={textareaCls()} />
      </Field>
    </Modal>
  );
};

export default FollowUpModal;

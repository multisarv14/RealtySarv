import React from 'react';
import { Lead } from '../../types';
import { Modal, Field, inputCls } from '../ui/Modal';

interface AtsLineupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { office: string; date: string; time: string }) => void;
  lead: Lead;
}

const AtsLineupModal: React.FC<AtsLineupModalProps> = ({ isOpen, onClose, onSave, lead }) => {
  const [office, setOffice] = React.useState('');
  const [date, setDate] = React.useState('');
  const [time, setTime] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);

  React.useEffect(() => { if (isOpen) { setOffice('Sub-Registrar Office'); setDate(''); setTime(''); setSubmitted(false); } }, [isOpen]);

  const err = (v: string, msg: string) => (submitted && !v.trim() ? msg : null);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); setSubmitted(true);
    if (!office.trim() || !date || !time) return;
    onSave({ office: office.trim(), date, time }); onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" title="Schedule ATS lineup" subtitle={lead.name} onSubmit={handleSubmit} submitLabel="Save appointment">
      <Field label="Sub-registrar office" htmlFor="atsOffice" required error={err(office, 'Enter the office name.')}>
        <input id="atsOffice" value={office} onChange={e => setOffice(e.target.value)} className={inputCls(!!err(office, 'x'))} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Appointment date" htmlFor="atsDate" required error={err(date, 'Pick a date.')}>
          <input id="atsDate" type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls(!!err(date, 'x'))} />
        </Field>
        <Field label="Time" htmlFor="atsTime" required error={err(time, 'Pick a time.')}>
          <input id="atsTime" type="time" value={time} onChange={e => setTime(e.target.value)} className={inputCls(!!err(time, 'x'))} />
        </Field>
      </div>
    </Modal>
  );
};

export default AtsLineupModal;

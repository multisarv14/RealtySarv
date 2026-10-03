import React from 'react';
import { Lead } from '../../types';
import { Modal, Field, inputCls } from '../ui/Modal';

interface RegistrationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { regNumber: string; bookNumber: string; volume: string; regDate: string }) => void;
  lead: Lead;
}

const RegistrationDetailsModal: React.FC<RegistrationDetailsModalProps> = ({ isOpen, onClose, onSave, lead }) => {
  const [regNumber, setRegNumber] = React.useState('');
  const [bookNumber, setBookNumber] = React.useState('Book 1');
  const [volume, setVolume] = React.useState('');
  const [regDate, setRegDate] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);

  React.useEffect(() => { if (isOpen) { setRegNumber(''); setBookNumber('Book 1'); setVolume(''); setRegDate(new Date().toISOString().split('T')[0]); setSubmitted(false); } }, [isOpen]);

  const regErr = submitted && !regNumber.trim() ? 'Enter the registration / serial number.' : null;
  const dateErr = submitted && !regDate ? 'Pick the registration date.' : null;
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); setSubmitted(true);
    if (!regNumber.trim() || !regDate) return;
    onSave({ regNumber: regNumber.trim(), bookNumber, volume, regDate }); onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" title="Registration details" subtitle={`${lead.name} · from the Sub-Registrar records`} onSubmit={handleSubmit} submitLabel="Mark registered">
      <Field label="Registration / serial number" htmlFor="regNumber" required error={regErr}>
        <input id="regNumber" value={regNumber} onChange={e => setRegNumber(e.target.value)} placeholder="e.g. 1234/2026" className={inputCls(!!regErr)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Registration date" htmlFor="regDate" required error={dateErr}><input id="regDate" type="date" value={regDate} onChange={e => setRegDate(e.target.value)} className={inputCls(!!dateErr)} /></Field>
        <Field label="Book number" htmlFor="bookNumber"><input id="bookNumber" value={bookNumber} onChange={e => setBookNumber(e.target.value)} className={inputCls()} /></Field>
      </div>
      <Field label="Volume / page" htmlFor="regVolume" hint="Optional"><input id="regVolume" value={volume} onChange={e => setVolume(e.target.value)} className={inputCls()} /></Field>
    </Modal>
  );
};

export default RegistrationDetailsModal;

import React from 'react';
import { PaymentRecord, PaymentPlanMilestone } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { Modal, Field, inputCls, textareaCls } from '../ui/Modal';
import { todayISO } from '../leadUi';

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payment: PaymentRecord) => void;
  milestones: PaymentPlanMilestone[];
}

const MODES = ['NEFT', 'RTGS', 'UPI', 'Cheque', 'Cash', 'Other'];

const AddPaymentModal: React.FC<AddPaymentModalProps> = ({ isOpen, onClose, onSave, milestones }) => {
  const [amount, setAmount] = React.useState('');
  const [date, setDate] = React.useState('');
  const [mode, setMode] = React.useState('NEFT');
  const [transactionId, setTransactionId] = React.useState('');
  const [bankName, setBankName] = React.useState('');
  const [milestoneName, setMilestoneName] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    setAmount(''); setDate(todayISO()); setMode('NEFT'); setTransactionId(''); setBankName(''); setMilestoneName(''); setNotes(''); setSubmitted(false);
  }, [isOpen]);

  const value = parseFloat(amount);
  const amountErr = submitted && !(value > 0) ? 'Enter the amount received.' : null;
  const dateErr = submitted && !date ? 'Pick the payment date.' : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); setSubmitted(true);
    if (!(value > 0) || !date) return;
    onSave({ id: uuidv4(), amount: value, date, mode, transactionId: transactionId.trim(), bankName: bankName.trim(), milestoneName: milestoneName || undefined, notes: notes.trim() });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title="Record payment" subtitle="Add a receipt against this booking" onSubmit={handleSubmit} submitLabel="Add payment">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
        <Field label="Amount received" htmlFor="payAmount" required error={amountErr} hint={value > 0 ? `₹ ${value.toLocaleString('en-IN')}` : undefined}>
          <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-secondary)]" aria-hidden="true">₹</span>
            <input id="payAmount" type="number" inputMode="numeric" min={1} value={amount} onChange={e => setAmount(e.target.value)} className={`${inputCls(!!amountErr)} pl-7`} aria-invalid={!!amountErr} /></div>
        </Field>
        <Field label="Date" htmlFor="payDate" required error={dateErr}><input id="payDate" type="date" max={todayISO()} value={date} onChange={e => setDate(e.target.value)} className={inputCls(!!dateErr)} aria-invalid={!!dateErr} /></Field>
        <Field label="Mode" htmlFor="payMode"><select id="payMode" value={mode} onChange={e => setMode(e.target.value)} className={inputCls()}>{MODES.map(m => <option key={m} value={m}>{m}</option>)}</select></Field>
        <Field label="Transaction ID / cheque no." htmlFor="payTxn"><input id="payTxn" value={transactionId} onChange={e => setTransactionId(e.target.value)} className={inputCls()} /></Field>
        <Field label="Bank" htmlFor="payBank"><input id="payBank" value={bankName} onChange={e => setBankName(e.target.value)} className={inputCls()} /></Field>
        <Field label="Against milestone" htmlFor="payMilestone" hint="Optional">
          <select id="payMilestone" value={milestoneName} onChange={e => setMilestoneName(e.target.value)} className={inputCls()}>
            <option value="">None</option>{milestones.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Notes" htmlFor="payNotes"><textarea id="payNotes" value={notes} onChange={e => setNotes(e.target.value)} rows={2} className={textareaCls()} /></Field>
    </Modal>
  );
};

export default AddPaymentModal;

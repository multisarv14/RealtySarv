import React from 'react';
import { Lead } from '../types';
import { Modal, Field, inputCls } from './ui/Modal';

interface TokenEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmToken: (leadId: string, tokenAmount: number) => void;
  lead: Lead | null;
}

const TokenEntryModal: React.FC<TokenEntryModalProps> = ({ isOpen, onClose, onConfirmToken, lead }) => {
  const [amount, setAmount] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) { setAmount(lead?.tokenAmount ? String(lead.tokenAmount) : ''); setSubmitted(false); }
  }, [isOpen, lead]);

  const value = parseFloat(amount);
  const valid = !isNaN(value) && value > 0;
  const error = submitted && !valid ? 'Enter the token amount in rupees.' : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!lead || !valid) return;
    onConfirmToken(lead.id, value);
    onClose();
  };

  if (!lead) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" title="Take token" subtitle={[lead.name, lead.leadProject].filter(Boolean).join(' · ')} onSubmit={handleSubmit} submitLabel="Confirm token">
      <Field label="Token amount" htmlFor="tokenAmount" required error={error} hint={valid ? `₹ ${value.toLocaleString('en-IN')}` : undefined}>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-secondary)]" aria-hidden="true">₹</span>
          <input id="tokenAmount" type="number" inputMode="numeric" min={1} value={amount} onChange={e => setAmount(e.target.value)} placeholder="51000" className={`${inputCls(!!error)} pl-7`} aria-invalid={!!error} />
        </div>
      </Field>
    </Modal>
  );
};

export default TokenEntryModal;

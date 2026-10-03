import React from 'react';
import { ChannelPartner, NewChannelPartnerData } from '../../types';
import { Modal, Field, Section, inputCls } from '../ui/Modal';

interface NewChannelPartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: NewChannelPartnerData) => void;
  /** When set, the dialog edits this partner and calls onSave instead of onAdd. */
  initial?: ChannelPartner | null;
  onSave?: (data: NewChannelPartnerData) => void;
  /** Used to refuse a RERA number that is already registered. */
  existing?: ChannelPartner[];
}

const EMPTY: NewChannelPartnerData = { firmName: '', contactPerson: '', email: '', phone: '', reraNumber: '', commissionRate: 2.0 };

const NewChannelPartnerModal: React.FC<NewChannelPartnerModalProps> = ({ isOpen, onClose, onAdd, initial, onSave, existing = [] }) => {
  const [formData, setFormData] = React.useState<NewChannelPartnerData>(EMPTY);
  const [submitted, setSubmitted] = React.useState(false);

  React.useEffect(() => { if (isOpen) { setFormData(initial ? { firmName: initial.firmName, contactPerson: initial.contactPerson, email: initial.email, phone: initial.phone, reraNumber: initial.reraNumber, commissionRate: initial.commissionRate } : EMPTY); setSubmitted(false); } }, [isOpen]);

  const set = (name: keyof NewChannelPartnerData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData(prev => ({ ...prev, [name]: name === 'commissionRate' ? parseFloat(e.target.value) || 0 : e.target.value }));

  const errors = {
    firmName: formData.firmName.trim() ? '' : 'Enter the firm name.',
    contactPerson: formData.contactPerson.trim() ? '' : 'Enter the contact person.',
    email: /^\S+@\S+\.\S+$/.test(formData.email.trim()) ? '' : 'Enter a valid email.',
    phone: formData.phone.replace(/\D/g, '').length >= 10 ? '' : 'Enter a 10-digit phone number.',
    reraNumber: !formData.reraNumber.trim() ? 'Enter the broker RERA number.'
      : existing.some(c => c.id !== initial?.id && c.reraNumber.trim().toLowerCase() === formData.reraNumber.trim().toLowerCase()) ? 'This RERA number is already registered.' : '',
  };
  const err = (k: keyof typeof errors) => (submitted && errors[k]) || null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.values(errors).some(Boolean)) return;
    const data = { ...formData, firmName: formData.firmName.trim(), contactPerson: formData.contactPerson.trim(), email: formData.email.trim(), reraNumber: formData.reraNumber.trim() };
    if (initial && onSave) onSave(data); else onAdd(data);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title={initial ? 'Edit channel partner' : 'Register channel partner'} onSubmit={handleSubmit} submitLabel={initial ? 'Save changes' : 'Register'}>
      <Section title="Firm">
        <Field label="Firm / agency name" htmlFor="cpFirm" required error={err('firmName')}><input id="cpFirm" value={formData.firmName} onChange={set('firmName')} className={inputCls(!!err('firmName'))} /></Field>
        <Field label="Contact person" htmlFor="cpContact" required error={err('contactPerson')}><input id="cpContact" value={formData.contactPerson} onChange={set('contactPerson')} className={inputCls(!!err('contactPerson'))} /></Field>
        <Field label="Email" htmlFor="cpEmail" required error={err('email')}><input id="cpEmail" type="email" value={formData.email} onChange={set('email')} className={inputCls(!!err('email'))} /></Field>
        <Field label="Phone" htmlFor="cpPhone" required error={err('phone')}><input id="cpPhone" type="tel" value={formData.phone} onChange={set('phone')} className={inputCls(!!err('phone'))} /></Field>
      </Section>
      <Section title="Compliance and commission">
        <Field label="Broker RERA no." htmlFor="cpRera" required error={err('reraNumber')}><input id="cpRera" value={formData.reraNumber} onChange={set('reraNumber')} className={inputCls(!!err('reraNumber'))} /></Field>
        <Field label="Commission rate (%)" htmlFor="cpRate"><input id="cpRate" type="number" step="0.1" min="0" value={formData.commissionRate} onChange={set('commissionRate')} className={inputCls()} /></Field>
      </Section>
    </Modal>
  );
};

export default NewChannelPartnerModal;

import React from 'react';
import { Lead } from '../../types';
import { Modal, Field, inputCls, textareaCls } from '../ui/Modal';

interface ExecutionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { executionDate: string; remarks: string }) => void;
  lead: Lead;
}

const ExecutionDetailsModal: React.FC<ExecutionDetailsModalProps> = ({ isOpen, onClose, onSave, lead }) => {
  const [executionDate, setExecutionDate] = React.useState('');
  const [remarks, setRemarks] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);

  React.useEffect(() => { if (isOpen) { setExecutionDate(new Date().toISOString().split('T')[0]); setRemarks(''); setSubmitted(false); } }, [isOpen]);

  const dateErr = submitted && !executionDate ? 'Pick the execution date.' : null;
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); setSubmitted(true);
    if (!executionDate) return;
    onSave({ executionDate, remarks: remarks.trim() }); onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" title="Execution completed" subtitle={lead.name} onSubmit={handleSubmit} submitLabel="Confirm execution" submitTone="success">
      <Field label="Execution date" htmlFor="execDate" required error={dateErr}><input id="execDate" type="date" value={executionDate} onChange={e => setExecutionDate(e.target.value)} className={inputCls(!!dateErr)} /></Field>
      <Field label="Remarks" htmlFor="execRemarks" hint="Optional: witnesses, handover of copies, anything to remember."><textarea id="execRemarks" value={remarks} onChange={e => setRemarks(e.target.value)} rows={3} className={textareaCls()} /></Field>
    </Modal>
  );
};

export default ExecutionDetailsModal;

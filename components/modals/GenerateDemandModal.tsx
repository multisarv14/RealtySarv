import React from 'react';
import { PaymentPlanMilestone } from '../../types';
import { Modal, Field, inputCls } from '../ui/Modal';

interface GenerateDemandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (data: { milestoneId: string; demandDate: string; dueDate: string; milestoneDate: string }) => void;
  milestones: PaymentPlanMilestone[];
  initialMilestoneId?: string;
}

const iso = (d: Date) => d.toISOString().split('T')[0];

const GenerateDemandModal: React.FC<GenerateDemandModalProps> = ({ isOpen, onClose, onGenerate, milestones, initialMilestoneId }) => {
  const [milestoneId, setMilestoneId] = React.useState('');
  const [milestoneDate, setMilestoneDate] = React.useState('');
  const [demandDate, setDemandDate] = React.useState('');
  const [dueDate, setDueDate] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    const today = new Date(); const due = new Date(); due.setDate(today.getDate() + 15);
    setDemandDate(iso(today)); setDueDate(iso(due)); setSubmitted(false);
    const id = initialMilestoneId || milestones[0]?.id || '';
    setMilestoneId(id);
    setMilestoneDate(milestones.find(m => m.id === id)?.achievedDate || iso(today));
  }, [isOpen, initialMilestoneId, milestones]);

  const pick = (id: string) => { setMilestoneId(id); const m = milestones.find(x => x.id === id); if (m?.achievedDate) setMilestoneDate(m.achievedDate); };

  const errors = {
    milestone: !milestoneId ? 'Choose the milestone.' : '',
    achieved: !milestoneDate ? 'When was this stage reached?' : '',
    demand: !demandDate ? 'Pick the letter date.' : '',
    due: !dueDate ? 'Pick the due date.' : dueDate < demandDate ? 'The due date can’t be before the letter date.' : '',
  };
  const show = (k: keyof typeof errors) => (submitted && errors[k]) || null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); setSubmitted(true);
    if (Object.values(errors).some(Boolean)) return;
    onGenerate({ milestoneId, demandDate, dueDate, milestoneDate }); onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" title="Generate demand letter" subtitle="Bank details and payment instructions are added automatically" onSubmit={handleSubmit} submitLabel="Generate">
      <Field label="Milestone" htmlFor="dmMilestone" required error={show('milestone')}>
        <select id="dmMilestone" value={milestoneId} onChange={e => pick(e.target.value)} className={inputCls(!!show('milestone'))} aria-invalid={!!show('milestone')}>
          <option value="">Select milestone</option>{milestones.map(m => <option key={m.id} value={m.id}>{m.name} ({m.percentage}%)</option>)}
        </select>
      </Field>
      <Field label="Milestone achieved on" htmlFor="dmAchieved" required error={show('achieved')} hint="The date construction reached this stage.">
        <input id="dmAchieved" type="date" value={milestoneDate} onChange={e => setMilestoneDate(e.target.value)} className={inputCls(!!show('achieved'))} aria-invalid={!!show('achieved')} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Letter date" htmlFor="dmDemand" required error={show('demand')}><input id="dmDemand" type="date" value={demandDate} onChange={e => setDemandDate(e.target.value)} className={inputCls(!!show('demand'))} aria-invalid={!!show('demand')} /></Field>
        <Field label="Due date" htmlFor="dmDue" required error={show('due')}><input id="dmDue" type="date" min={demandDate || undefined} value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputCls(!!show('due'))} aria-invalid={!!show('due')} /></Field>
      </div>
    </Modal>
  );
};

export default GenerateDemandModal;

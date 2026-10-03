import React from 'react';
import { NewSiteVisitData, SiteVisit } from '../types';
import { Modal, Field, inputCls, textareaCls } from './ui/Modal';
import { todayISO } from './leadUi';

interface SiteVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVisit: (visitData: NewSiteVisitData) => void;
  visitToEdit?: SiteVisit | null;
  /** Who the visit is for, shown under the title. */
  leadName?: string;
  /** Pre-filled property for a new visit (the lead's project). */
  defaultProperty?: string;
  /** Suggestions for the property field. */
  projectNames?: string[];
}

const SiteVisitModal: React.FC<SiteVisitModalProps> = ({ isOpen, onClose, onAddVisit, visitToEdit, leadName, defaultProperty, projectNames = [] }) => {
  const [date, setDate] = React.useState('');
  const [time, setTime] = React.useState('');
  const [propertyOfInterest, setPropertyOfInterest] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);
  const isEditing = !!visitToEdit;

  React.useEffect(() => {
    if (!isOpen) return;
    setSubmitted(false);
    setDate(visitToEdit?.date ?? '');
    setTime(visitToEdit?.time ?? '');
    setPropertyOfInterest(visitToEdit?.propertyOfInterest ?? defaultProperty ?? '');
    setNotes(visitToEdit?.notes ?? '');
  }, [isOpen, visitToEdit, defaultProperty]);

  const errors = {
    date: !date ? 'Choose the visit date.' : '',
    time: !time ? 'Choose the visit time.' : '',
    property: !propertyOfInterest.trim() ? 'Which project or unit will they see?' : '',
  };
  const show = (k: keyof typeof errors) => (submitted && errors[k]) || null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (errors.date || errors.time || errors.property) return;
    onAddVisit({ date, time, propertyOfInterest: propertyOfInterest.trim(), notes: notes.trim() || undefined });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" title={isEditing ? 'Reschedule site visit' : 'Schedule site visit'} subtitle={leadName} onSubmit={handleSubmit} submitLabel={isEditing ? 'Save visit' : 'Schedule visit'}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date" htmlFor="visitDate" required error={show('date')}>
          <input id="visitDate" type="date" min={isEditing ? undefined : todayISO()} value={date} onChange={e => setDate(e.target.value)} className={inputCls(!!show('date'))} aria-invalid={!!show('date')} />
        </Field>
        <Field label="Time" htmlFor="visitTime" required error={show('time')}>
          <input id="visitTime" type="time" value={time} onChange={e => setTime(e.target.value)} className={inputCls(!!show('time'))} aria-invalid={!!show('time')} />
        </Field>
      </div>
      <Field label="Project / unit" htmlFor="visitProperty" required error={show('property')}>
        <input id="visitProperty" list="visit-projects" value={propertyOfInterest} onChange={e => setPropertyOfInterest(e.target.value)} placeholder="e.g. The Grand Towers, Unit 1001" className={inputCls(!!show('property'))} aria-invalid={!!show('property')} />
        <datalist id="visit-projects">{projectNames.map(n => <option key={n} value={n} />)}</datalist>
      </Field>
      <Field label="Notes" htmlFor="visitNotes" hint="Optional: who is coming, what they want to see.">
        <textarea id="visitNotes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className={textareaCls()} />
      </Field>
    </Modal>
  );
};

export default SiteVisitModal;

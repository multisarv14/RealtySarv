import React from 'react';
import { Modal, Field, inputCls, textareaCls } from '../ui/Modal';

interface NewGenericSettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (itemData: { name: string; description?: string }) => void;
  title: string;
  itemNoun: string; // e.g., "Budget", "Role"
  /** When set, the dialog edits this item and calls onSave instead of onAddItem. */
  initial?: { name: string; description?: string } | null;
  onSave?: (itemData: { name: string; description?: string }) => void;
}

const NewGenericSettingModal: React.FC<NewGenericSettingModalProps> = ({ isOpen, onClose, onAddItem, title, itemNoun, initial, onSave }) => {
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);

  React.useEffect(() => { if (isOpen) { setName(initial?.name || ''); setDescription(initial?.description || ''); setSubmitted(false); } }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!name.trim()) return;
    const data = { name: name.trim(), description: description.trim() || undefined };
    if (initial && onSave) onSave(data); else onAddItem(data);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" title={initial ? `Edit ${itemNoun.toLowerCase()}` : title} onSubmit={handleSubmit} submitLabel={initial ? 'Save changes' : `Add ${itemNoun}`}>
      <Field label={`${itemNoun} name`} htmlFor="itemName" required error={submitted && !name.trim() ? `Enter a ${itemNoun.toLowerCase()} name.` : null}>
        <input id="itemName" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. 50L - 75L, IT Professional" className={inputCls(submitted && !name.trim())} />
      </Field>
      <Field label="Description" htmlFor="itemDescription" hint="Optional.">
        <textarea id="itemDescription" value={description} onChange={e => setDescription(e.target.value)} rows={3} className={textareaCls()} />
      </Field>
    </Modal>
  );
};

export default NewGenericSettingModal;

import React from 'react';
import { NewTemplateData, TemplateType } from '../../types';
import { Modal, Field, Chips, inputCls, textareaCls } from '../ui/Modal';

interface NewTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTemplate: (templateData: NewTemplateData) => void;
  initial?: NewTemplateData | null;
  onSave?: (templateData: NewTemplateData) => void;
}

const NewTemplateModal: React.FC<NewTemplateModalProps> = ({ isOpen, onClose, onAddTemplate, initial, onSave }) => {
  const [name, setName] = React.useState('');
  const [type, setType] = React.useState<TemplateType>('WhatsApp');
  const [content, setContent] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);

  React.useEffect(() => { if (isOpen) { setName(initial?.name || ''); setType(initial?.type || 'WhatsApp'); setContent(initial?.content || ''); setSubmitted(false); } }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!name.trim() || !content.trim()) return;
    const data = { name: name.trim(), type, content: content.trim() };
    if (initial && onSave) onSave(data); else onAddTemplate(data);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title={initial ? 'Edit message template' : 'Add message template'} onSubmit={handleSubmit} submitLabel={initial ? 'Save changes' : 'Add template'}>
      <Field label="Name" htmlFor="templateName" required error={submitted && !name.trim() ? 'Enter a template name.' : null}>
        <input id="templateName" value={name} onChange={e => setName(e.target.value)} className={inputCls(submitted && !name.trim())} />
      </Field>
      <Field label="Type" htmlFor="templateType"><Chips label="Template type" options={['WhatsApp', 'Email']} value={type} onChange={setType} /></Field>
      <Field label="Message" htmlFor="templateContent" required error={submitted && !content.trim() ? 'Write the message.' : null}>
        <textarea id="templateContent" value={content} onChange={e => setContent(e.target.value)} rows={6} className={textareaCls(submitted && !content.trim())} />
      </Field>
    </Modal>
  );
};

export default NewTemplateModal;

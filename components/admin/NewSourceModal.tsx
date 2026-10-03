import React from 'react';
import { NewSourceData, Source } from '../../types';
import { Modal, Field, inputCls, textareaCls } from '../ui/Modal';

interface NewSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSource: (sourceData: NewSourceData) => void;
  sources: Source[];
  initial?: Source | null;
  onSave?: (sourceData: NewSourceData) => void;
}

const NewSourceModal: React.FC<NewSourceModalProps> = ({ isOpen, onClose, onAddSource, sources, initial, onSave }) => {
  const [channelSource, setChannelSource] = React.useState('');
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) { setChannelSource(initial?.channelSource || ''); setName(initial?.name || ''); setDescription(initial?.description || ''); setSubmitted(false); }
  }, [isOpen]);

  const uniqueChannelSources = React.useMemo(() => Array.from(new Set(sources.map(s => s.channelSource))), [sources]);
  const errors = { channel: channelSource.trim() ? '' : 'Pick or type a channel.', name: name.trim() ? '' : 'Enter a source name.' };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (errors.channel || errors.name) return;
    const data = { channelSource: channelSource.trim(), name: name.trim(), description: description.trim() || undefined };
    if (initial && onSave) onSave(data); else onAddSource(data);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" title={initial ? 'Edit lead source' : 'Add lead source'} onSubmit={handleSubmit} submitLabel={initial ? 'Save changes' : 'Add source'}>
      <Field label="Channel" htmlFor="channelSource" required error={submitted ? errors.channel : null}>
        <input id="channelSource" list="channelSource-list" value={channelSource} onChange={e => setChannelSource(e.target.value)} placeholder="Select or type a new channel" className={inputCls(submitted && !!errors.channel)} />
        <datalist id="channelSource-list">{uniqueChannelSources.map(c => <option key={c} value={c} />)}</datalist>
      </Field>
      <Field label="Source name" htmlFor="sourceName" required error={submitted ? errors.name : null}>
        <input id="sourceName" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Website, Facebook, Referral" className={inputCls(submitted && !!errors.name)} />
      </Field>
      <Field label="Details" htmlFor="sourceDescription" hint="Optional.">
        <textarea id="sourceDescription" value={description} onChange={e => setDescription(e.target.value)} rows={3} className={textareaCls()} />
      </Field>
    </Modal>
  );
};

export default NewSourceModal;

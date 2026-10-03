
import React from 'react';
import { NewProjectData, ProjectStatus, ProjectType, FormFieldConfig } from '../../types';
import DynamicFieldRenderer from '../DynamicFieldRenderer';
import { useLiveQuery } from '../../liveQuery';
import { db } from '../../db';
import { Modal, Field, Section, inputCls, textareaCls } from '../ui/Modal';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProject: (projectData: NewProjectData) => void;
}

const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose, onAddProject }) => {
  const [name, setName] = React.useState('');
  const [companyName, setCompanyName] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [reraNumber, setReraNumber] = React.useState('');
  const [projectType, setProjectType] = React.useState<ProjectType>('Residential');
  const [projectStatus, setProjectStatus] = React.useState<ProjectStatus>('Pre-launch');
  const [description, setDescription] = React.useState('');
  const [totalFloors, setTotalFloors] = React.useState('');
  const [wings, setWings] = React.useState('');
  const [customData, setCustomData] = React.useState<Record<string, any>>({});
  const [submitted, setSubmitted] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    setName(''); setCompanyName(''); setLocation(''); setReraNumber(''); setProjectType('Residential');
    setProjectStatus('Pre-launch'); setDescription(''); setTotalFloors(''); setWings(''); setCustomData({}); setSubmitted(false);
  }, [isOpen]);

  const configs = useLiveQuery(() => db.formFieldConfigs.where({ module: 'project' }).toArray(), []);
  const activeConfigs = React.useMemo(() => configs?.filter(c => c.isVisible) || [], [configs]);
  const customConfigs = React.useMemo(() => activeConfigs.filter(c => !c.isSystem), [activeConfigs]);
  
  const isVisible = (field: string) => activeConfigs.some(c => c.fieldName === field);
  const isRequired = (field: string) => activeConfigs.find(c => c.fieldName === field)?.isRequired || false;

  const floors = parseInt(totalFloors, 10);
  const req = (field: string, value: string, msg: string) => (isVisible(field) && !value.trim() ? msg : '');
  const errors = {
    name: req('name', name, 'Enter the project name.'),
    companyName: req('companyName', companyName, 'Enter the company name.'),
    reraNumber: req('reraNumber', reraNumber, 'Enter the RERA number.'),
    location: req('location', location, 'Enter the location.'),
    totalFloors: isVisible('totalFloors') && !(floors > 0) ? 'Enter the number of floors.' : '',
    description: req('description', description, 'Add a short description.'),
  };
  const customErrors = (c: FormFieldConfig) => (c.isRequired && !customData[c.fieldName] ? `${c.label} is required.` : '');
  const err = (k: keyof typeof errors) => (submitted && errors[k]) || null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.values(errors).some(Boolean) || customConfigs.some(customErrors)) return;
    onAddProject({
      name: name.trim(),
      companyName: companyName.trim(),
      location: location.trim(),
      reraNumber: reraNumber.trim(),
      projectType,
      projectStatus,
      description: description.trim(),
      totalFloors: floors || 0,
      wings: wings.split(',').map(w => w.trim()).filter(Boolean),
      customData,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" title="Register new project" onSubmit={handleSubmit} submitLabel="Add project">
      <Section title="Project">
        {isVisible('name') && <Field label="Project name" htmlFor="npName" required error={err('name')}><input id="npName" value={name} onChange={e => setName(e.target.value)} className={inputCls(!!err('name'))} /></Field>}
        {isVisible('companyName') && <Field label="Company name" htmlFor="npCompany" required error={err('companyName')}><input id="npCompany" value={companyName} onChange={e => setCompanyName(e.target.value)} className={inputCls(!!err('companyName'))} /></Field>}
        {isVisible('reraNumber') && <Field label="RERA number" htmlFor="npRera" required error={err('reraNumber')}><input id="npRera" value={reraNumber} onChange={e => setReraNumber(e.target.value)} placeholder="e.g. A51800000000" className={inputCls(!!err('reraNumber'))} /></Field>}
        {isVisible('location') && <Field label="Location" htmlFor="npLocation" required error={err('location')}><input id="npLocation" value={location} onChange={e => setLocation(e.target.value)} className={inputCls(!!err('location'))} /></Field>}
        {isVisible('projectType') && (
          <Field label="Type" htmlFor="npType">
            <select id="npType" value={projectType} onChange={e => setProjectType(e.target.value as ProjectType)} className={inputCls()}>
              <option>Residential</option><option>Commercial</option><option>Mixed-Use</option>
            </select>
          </Field>
        )}
        {isVisible('projectStatus') && (
          <Field label="Status" htmlFor="npStatus">
            <select id="npStatus" value={projectStatus} onChange={e => setProjectStatus(e.target.value as ProjectStatus)} className={inputCls()}>
              <option>Pre-launch</option><option>Under Construction</option><option>Ready to Move</option>
            </select>
          </Field>
        )}
        {isVisible('totalFloors') && <Field label="Total floors" htmlFor="npFloors" required error={err('totalFloors')}><input id="npFloors" type="number" min="1" value={totalFloors} onChange={e => setTotalFloors(e.target.value)} className={inputCls(!!err('totalFloors'))} /></Field>}
        {isVisible('wings') && <Field label="Wings" htmlFor="npWings" hint="Comma separated, e.g. A, B, C"><input id="npWings" value={wings} onChange={e => setWings(e.target.value)} className={inputCls()} /></Field>}
        {isVisible('description') && <Field label="Description" htmlFor="npDesc" required error={err('description')} className="sm:col-span-2"><textarea id="npDesc" value={description} onChange={e => setDescription(e.target.value)} rows={3} className={textareaCls(!!err('description'))} /></Field>}
      </Section>
      {customConfigs.length > 0 && (
        <Section title="Additional information">
          {customConfigs.map(config => (
            <div key={config.id}>
              <DynamicFieldRenderer config={config} value={customData[config.fieldName]} onChange={(val) => setCustomData(prev => ({ ...prev, [config.fieldName]: val }))} />
              {submitted && customErrors(config) && <p role="alert" className="mt-1 text-xs text-red-500">{customErrors(config)}</p>}
            </div>
          ))}
        </Section>
      )}
    </Modal>
  );
};

export default NewProjectModal;

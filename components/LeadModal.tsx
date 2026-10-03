import React from 'react';
import { Lead, ChannelPartner, NewLeadData, LeadStatus, UnitType, Source, LocationSetting, Budget, ClientProfile, LivingPlace, Project, FormFieldConfig, User } from '../types';
import { Modal, Field, Section, Chips, inputCls, textareaCls } from './ui/Modal';
import { todayISO } from './leadUi';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLead?: (leadData: NewLeadData) => void;
  onUpdateLead?: (leadData: Lead) => void;
  leadToEdit?: Lead | null;
  unitTypes: UnitType[];
  locationSettings: LocationSetting[];
  sources: Source[];
  /** Partners that can be credited with the lead (optional). */
  channelPartners?: ChannelPartner[];
  budgets: Budget[];
  clientProfiles: ClientProfile[];
  livingPlaces: LivingPlace[];
  projects: Project[];
  formConfigs: FormFieldConfig[];
  users: User[];
  /** Signed-in user: the default owner of a new lead. */
  currentUserId?: string;
  /** An enabled distribution rule exists: the owner can be left to the rules. */
  autoAssign?: boolean;
}

type Errors = Record<string, string>;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const addDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0]; };
const QUICK: [string, number][] = [['Today', 0], ['Tomorrow', 1], ['In 3 days', 3], ['Next week', 7]];

const Select: React.FC<{ id: string; value: string; onChange: (v: string) => void; placeholder: string; options: string[]; invalid?: boolean }> = ({ id, value, onChange, placeholder, options, invalid }) => (
  <select id={id} value={value} onChange={e => onChange(e.target.value)} className={inputCls(invalid)} aria-invalid={invalid}>
    <option value="">{placeholder}</option>
    {options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
);

const LeadModal: React.FC<LeadModalProps> = ({ isOpen, onClose, onAddLead, onUpdateLead, leadToEdit, unitTypes, locationSettings, sources, budgets, clientProfiles, livingPlaces, projects, channelPartners, autoAssign, formConfigs, users, currentUserId }) => {
  const isEditing = !!leadToEdit;

  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [initialInterest, setInitialInterest] = React.useState<string[]>([]);
  const [preferredLocation, setPreferredLocation] = React.useState('');
  const [budget, setBudget] = React.useState('');
  const [clientProfile, setClientProfile] = React.useState('');
  const [livingPlace, setLivingPlace] = React.useState('');
  const [leadStatus, setLeadStatus] = React.useState<LeadStatus>('New');
  const [channelSource, setChannelSource] = React.useState('');
  const [sourceName, setSourceName] = React.useState('');
  const [channelPartnerId, setChannelPartnerId] = React.useState('');
  const [leadProject, setLeadProject] = React.useState('');
  const [ownerId, setOwnerId] = React.useState('');
  const [message, setMessage] = React.useState('');

  const [followUpActive, setFollowUpActive] = React.useState(false);
  const [followUpType, setFollowUpType] = React.useState<'Call' | 'Email' | 'Meeting'>('Call');
  const [followUpDate, setFollowUpDate] = React.useState('');
  const [followUpTime, setFollowUpTime] = React.useState('');
  const [followUpNotes, setFollowUpNotes] = React.useState('');

  const [customData, setCustomData] = React.useState<Record<string, any>>({});
  const [submitted, setSubmitted] = React.useState(false);

  const activeConfigs = React.useMemo(() => (formConfigs || []).filter(c => c.module === 'lead' && c.isVisible), [formConfigs]);
  const customConfigs = React.useMemo(() => activeConfigs.filter(c => !c.isSystem), [activeConfigs]);
  const isVisible = (f: string) => activeConfigs.some(c => c.fieldName === f);
  const isRequired = (f: string) => activeConfigs.find(c => c.fieldName === f)?.isRequired || false;

  const channelSources = React.useMemo(() => [...new Set(sources.map(s => s.channelSource))], [sources]);
  const sourceNames = React.useMemo(() => (channelSource ? sources.filter(s => s.channelSource === channelSource).map(s => s.name) : []), [sources, channelSource]);

  // Fill the form when it opens. A new lead starts blank so nothing is saved by accident.
  React.useEffect(() => {
    if (!isOpen) return;
    setSubmitted(false);
    if (leadToEdit) {
      const [first, ...rest] = leadToEdit.name.split(' ');
      setFirstName(first || ''); setLastName(rest.join(' '));
      setEmail(leadToEdit.email || '');
      setPhone(''); // the saved number is never shown; type a new one only to change it
      setInitialInterest(leadToEdit.initialInterest || []);
      setPreferredLocation(leadToEdit.preferredLocation || ''); setBudget(leadToEdit.budget || '');
      setClientProfile(leadToEdit.clientProfile || ''); setLivingPlace(leadToEdit.livingPlace || '');
      setLeadStatus(leadToEdit.leadStatus); setChannelSource(leadToEdit.channelSource || ''); setSourceName(leadToEdit.leadSource || ''); setChannelPartnerId(leadToEdit.channelPartnerId || '');
      setLeadProject(leadToEdit.leadProject === 'Not Assigned' ? '' : leadToEdit.leadProject || ''); setCustomData(leadToEdit.customData || {});
      setOwnerId(leadToEdit.ownerId); setMessage('');
    } else {
      setFirstName(''); setLastName(''); setEmail(''); setPhone(''); setInitialInterest([]);
      setPreferredLocation(''); setBudget(''); setClientProfile(''); setLivingPlace('');
      setLeadStatus('New'); setChannelSource(''); setSourceName(''); setChannelPartnerId(''); setLeadProject(projects.length === 1 ? projects[0].name : '');
      setOwnerId(autoAssign ? '' : users.find(u => u.id === currentUserId)?.id || users[0]?.id || ''); setCustomData({}); setMessage('');
      setFollowUpActive(false); setFollowUpType('Call'); setFollowUpDate(''); setFollowUpTime(''); setFollowUpNotes('');
    }
  }, [isOpen, leadToEdit, projects, users, currentUserId, autoAssign]);

  // Picking a channel resets the source if it no longer belongs to it.
  React.useEffect(() => { if (sourceName && !sourceNames.includes(sourceName)) setSourceName(''); }, [sourceNames, sourceName]);

  const errors: Errors = {};
  if (isVisible('firstName') && isRequired('firstName') && !firstName.trim()) errors.firstName = 'Enter the first name.';
  if (isVisible('lastName') && isRequired('lastName') && !lastName.trim()) errors.lastName = 'Enter the last name.';
  if (isVisible('phone')) {
    const digits = phone.replace(/\D/g, '');
    if (!phone.trim() && isRequired('phone') && !leadToEdit?.phone) errors.phone = 'Enter a phone number.';
    else if (phone.trim() && digits.length < 8) errors.phone = 'That number looks too short.';
  }
  if (isVisible('email')) {
    if (!email.trim() && isRequired('email')) errors.email = 'Enter an email address.';
    else if (email.trim() && !EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email, like name@company.com.';
  }
  if (isVisible('leadProject') && isRequired('leadProject') && !leadProject) errors.leadProject = 'Choose a project.';
  if (isVisible('initialInterest') && isRequired('initialInterest') && initialInterest.length === 0) errors.initialInterest = 'Pick at least one.';
  if (isVisible('preferredLocation') && isRequired('preferredLocation') && !preferredLocation) errors.preferredLocation = 'Choose a location.';
  if (isVisible('budget') && isRequired('budget') && !budget) errors.budget = 'Choose a budget.';
  if (isVisible('channelSource') && !channelSource) errors.channelSource = 'Where did this lead come from?';
  if (isVisible('sourceName') && !sourceName) errors.sourceName = 'Choose the source.';
  for (const c of customConfigs) if (c.isRequired && !customData[c.fieldName]) errors[`c:${c.fieldName}`] = `${c.label} is required.`;
  if (followUpActive && !followUpDate) errors.followUpDate = 'Pick a date.';
  if (followUpActive && !followUpTime) errors.followUpTime = 'Pick a time.';
  const show = (k: string) => (submitted ? errors[k] || null : null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length) {
      window.setTimeout(() => document.querySelector<HTMLElement>('[role=dialog] [aria-invalid="true"]')?.focus(), 30);
      return;
    }
    if (isEditing && onUpdateLead && leadToEdit) {
      onUpdateLead({
        ...leadToEdit, name: `${firstName} ${lastName}`.trim(), avatarInitials: `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase(),
        email: email.trim(), phone: phone.trim() || leadToEdit.phone || '', initialInterest, preferredLocation, budget, clientProfile, livingPlace,
        leadStatus, channelSource, leadSource: sourceName, leadProject: leadProject || 'Not Assigned', customData,
        channelPartnerId: channelPartnerId || undefined,
      });
    } else if (!isEditing && onAddLead) {
      onAddLead({
        ownerId, firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), phone: phone.trim(), initialInterest, preferredLocation, budget, clientProfile, livingPlace,
        leadStatus, channelSource, sourceName, leadProject, message: message.trim() || undefined, customData, channelPartnerId: channelPartnerId || undefined,
        followUp: followUpActive ? { type: followUpType, date: followUpDate, time: followUpTime, notes: followUpNotes.trim() || undefined, assignedTo: users.find(u => u.id === ownerId)?.name || '' } : undefined,
      });
    }
    onClose();
  };

  const interestOptions = (unitTypes || []).map(u => u.name);
  const hasMore = (isVisible('clientProfile') || isVisible('livingPlace') || (isVisible('message') && !isEditing));

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" title={isEditing ? 'Edit lead' : 'New lead'} subtitle={isEditing ? leadToEdit?.name : 'Add an enquiry to your pipeline'} onSubmit={handleSubmit} submitLabel={isEditing ? 'Save changes' : 'Create lead'}>
      <Section title="Contact">
        {isVisible('firstName') && <Field label="First name" htmlFor="lm-first" required={isRequired('firstName')} error={show('firstName')}><input id="lm-first" value={firstName} onChange={e => setFirstName(e.target.value)} autoComplete="off" className={inputCls(!!show('firstName'))} aria-invalid={!!show('firstName')} /></Field>}
        {isVisible('lastName') && <Field label="Last name" htmlFor="lm-last" required={isRequired('lastName')} error={show('lastName')}><input id="lm-last" value={lastName} onChange={e => setLastName(e.target.value)} autoComplete="off" className={inputCls(!!show('lastName'))} aria-invalid={!!show('lastName')} /></Field>}
        {isVisible('phone') && (
          <Field label="Mobile number" htmlFor="lm-phone" required={isRequired('phone') && !leadToEdit?.phone} error={show('phone')} hint={leadToEdit?.phone ? 'The saved number stays hidden. Type only to change it.' : undefined}>
            <input id="lm-phone" type="tel" inputMode="tel" value={phone} onChange={e => setPhone(e.target.value)} autoComplete="off" placeholder={leadToEdit?.phone ? 'Saved' : '+91 98765 43210'} className={inputCls(!!show('phone'))} aria-invalid={!!show('phone')} />
          </Field>
        )}
        {isVisible('email') && <Field label="Email" htmlFor="lm-email" required={isRequired('email')} error={show('email')}><input id="lm-email" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="off" placeholder="name@example.com" className={inputCls(!!show('email'))} aria-invalid={!!show('email')} /></Field>}
      </Section>

      <Section title="Requirement">
        {isVisible('leadProject') && <Field label="Project" htmlFor="lm-project" required={isRequired('leadProject')} error={show('leadProject')}><Select id="lm-project" value={leadProject} onChange={setLeadProject} placeholder="Select project" options={projects.map(p => p.name)} invalid={!!show('leadProject')} /></Field>}
        {isVisible('preferredLocation') && <Field label="Preferred location" htmlFor="lm-loc" required={isRequired('preferredLocation')} error={show('preferredLocation')}><Select id="lm-loc" value={preferredLocation} onChange={setPreferredLocation} placeholder="Select location" options={(locationSettings || []).map(l => l.name)} invalid={!!show('preferredLocation')} /></Field>}
        {isVisible('initialInterest') && (
          <Field label="Looking for" required={isRequired('initialInterest')} error={show('initialInterest')} className="sm:col-span-2">
            <Chips label="Looking for" options={interestOptions} value={initialInterest} onChange={setInitialInterest} multiple />
          </Field>
        )}
        {isVisible('budget') && <Field label="Budget" htmlFor="lm-budget" required={isRequired('budget')} error={show('budget')}><Select id="lm-budget" value={budget} onChange={setBudget} placeholder="Select budget" options={(budgets || []).map(b => b.name)} invalid={!!show('budget')} /></Field>}
      </Section>

      <Section title="Source & owner">
        {isVisible('channelSource') && <Field label="Channel" htmlFor="lm-channel" required error={show('channelSource')}><Select id="lm-channel" value={channelSource} onChange={setChannelSource} placeholder="Select channel" options={channelSources} invalid={!!show('channelSource')} /></Field>}
        {isVisible('sourceName') && <Field label="Source" htmlFor="lm-source" required error={show('sourceName')}><Select id="lm-source" value={sourceName} onChange={setSourceName} placeholder={channelSource ? 'Select source' : 'Choose a channel first'} options={sourceNames} invalid={!!show('sourceName')} /></Field>}
        {(channelPartners || []).some(c => c.status === 'Active' || c.id === channelPartnerId) && (
          <Field label="Channel partner" htmlFor="lm-partner" hint="Optional: credit the lead to a broker.">
            <select id="lm-partner" value={channelPartnerId} onChange={e => setChannelPartnerId(e.target.value)} className={inputCls()}>
              <option value="">None</option>
              {(channelPartners || []).filter(c => c.status === 'Active' || c.id === channelPartnerId).map(c => <option key={c.id} value={c.id}>{c.firmName}</option>)}
            </select>
          </Field>
        )}
        {!isEditing && (
          <Field label="Owner" htmlFor="lm-owner" hint="The salesperson responsible for this lead.">
            <select id="lm-owner" value={ownerId} onChange={e => setOwnerId(e.target.value)} className={inputCls()}>
              {autoAssign && <option value="">Auto-assign (distribution rules)</option>}
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </Field>
        )}
      </Section>

      {hasMore && (
        <details className="group rounded-lg border border-[var(--border-color)]">
          <summary className="cursor-pointer list-none px-3 py-2.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            More details <i className="fas fa-chevron-down text-[10px] transition-transform group-open:rotate-180" aria-hidden="true"></i>
          </summary>
          <div className="px-3 pb-3 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
            {isVisible('clientProfile') && <Field label="Client profile" htmlFor="lm-profile"><Select id="lm-profile" value={clientProfile} onChange={setClientProfile} placeholder="Select profile" options={(clientProfiles || []).map(c => c.name)} /></Field>}
            {isVisible('livingPlace') && <Field label="Currently living in" htmlFor="lm-living"><Select id="lm-living" value={livingPlace} onChange={setLivingPlace} placeholder="Select" options={(livingPlaces || []).map(l => l.name)} /></Field>}
            {isVisible('message') && !isEditing && <Field label="First note" htmlFor="lm-msg" className="sm:col-span-2"><textarea id="lm-msg" value={message} onChange={e => setMessage(e.target.value)} rows={2} placeholder="What did the customer ask for?" className={textareaCls()} /></Field>}
          </div>
        </details>
      )}

      {!isEditing && (
        <div className="rounded-lg border border-[var(--border-color)] p-3">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={followUpActive} onChange={e => setFollowUpActive(e.target.checked)} className="h-4 w-4 accent-[var(--primary-color)]" />
            <span className="text-sm font-semibold">Schedule the first follow-up</span>
          </label>
          {followUpActive && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5 animate-fadeIn">
              <Field label="Type" className="sm:col-span-2"><Chips label="Follow-up type" options={['Call', 'Meeting', 'Email']} value={followUpType} onChange={setFollowUpType} /></Field>
              <Field label="When" className="sm:col-span-2"><Chips label="Quick date" options={QUICK.map(q => q[0])} value={QUICK.find(([, n]) => addDays(n) === followUpDate)?.[0] || ''} onChange={(label: string) => setFollowUpDate(addDays(QUICK.find(q => q[0] === label)![1]))} /></Field>
              <Field label="Date" htmlFor="lm-fu-date" required error={show('followUpDate')}><input id="lm-fu-date" type="date" min={todayISO()} value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} className={inputCls(!!show('followUpDate'))} aria-invalid={!!show('followUpDate')} /></Field>
              <Field label="Time" htmlFor="lm-fu-time" required error={show('followUpTime')}><input id="lm-fu-time" type="time" value={followUpTime} onChange={e => setFollowUpTime(e.target.value)} className={inputCls(!!show('followUpTime'))} aria-invalid={!!show('followUpTime')} /></Field>
              <Field label="Notes" htmlFor="lm-fu-notes" className="sm:col-span-2"><textarea id="lm-fu-notes" value={followUpNotes} onChange={e => setFollowUpNotes(e.target.value)} rows={2} className={textareaCls()} /></Field>
            </div>
          )}
        </div>
      )}

      {customConfigs.length > 0 && (
        <Section title="Additional information">
          {customConfigs.map(c => {
            const id = `lm-c-${c.fieldName}`; const err = show(`c:${c.fieldName}`); const v = customData[c.fieldName] ?? '';
            const set = (val: any) => setCustomData(prev => ({ ...prev, [c.fieldName]: val }));
            return (
              <Field key={c.id} label={c.label} htmlFor={id} required={c.isRequired} error={err} className={c.fieldType === 'textarea' ? 'sm:col-span-2' : undefined}>
                {c.fieldType === 'textarea' ? <textarea id={id} value={v} onChange={e => set(e.target.value)} rows={3} className={textareaCls(!!err)} />
                  : c.fieldType === 'select' ? <select id={id} value={v} onChange={e => set(e.target.value)} className={inputCls(!!err)} aria-invalid={!!err}><option value="">Select</option>{c.options?.map(o => <option key={o} value={o}>{o}</option>)}</select>
                  : <input id={id} type={c.fieldType === 'number' ? 'number' : c.fieldType === 'date' ? 'date' : 'text'} value={v} onChange={e => set(e.target.value)} className={inputCls(!!err)} aria-invalid={!!err} />}
              </Field>
            );
          })}
        </Section>
      )}
    </Modal>
  );
};

export default LeadModal;

import React from 'react';
import { Lead, ChannelPartner, NewLeadData, LeadStatus, UnitType, Source, LocationSetting, Budget, ClientProfile, LivingPlace, Project, FormFieldConfig, User } from '../types';
import { Modal, Field, Section, Chips, Button, inputCls, textareaCls } from './ui/Modal';
import { todayISO, findLeadMatches } from './leadUi';

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
  /** Existing leads, to warn about the same person being added twice. */
  leads?: Lead[];
  /** May this user move a lead to another project? (the Transfer permission) */
  canTransfer?: boolean;
  /** Moves an existing lead to another project. */
  onShiftLead?: (leadId: string, project: string) => void;
  /** Opens an existing lead (used by the duplicate warning). */
  onOpenLead?: (leadId: string) => void;
  /** An enabled distribution rule exists: the owner can be left to the rules. */
  autoAssign?: boolean;
}

type Errors = Record<string, string>;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const addDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0]; };
/** Partners are a channel of their own: pick the channel, then the firm as the source. */
const PARTNER_CHANNEL = 'Channel Partner';
const STEPS = ['Contact', 'More details', 'First follow-up'] as const;
const STEP_OF: Record<string, number> = { firstName: 0, lastName: 0, phone: 0, email: 0, leadProject: 0, channelSource: 0, sourceName: 0, duplicate: 0, followUpDate: 2, followUpTime: 2 };
const QUICK: [string, number][] = [['Today', 0], ['Tomorrow', 1], ['In 3 days', 3], ['Next week', 7]];

const Select: React.FC<{ id: string; value: string; onChange: (v: string) => void; placeholder: string; options: string[]; invalid?: boolean }> = ({ id, value, onChange, placeholder, options, invalid }) => (
  <select id={id} value={value} onChange={e => onChange(e.target.value)} className={inputCls(invalid)} aria-invalid={invalid}>
    <option value="">{placeholder}</option>
    {options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
);

const LeadModal: React.FC<LeadModalProps> = ({ isOpen, onClose, onAddLead, onUpdateLead, leadToEdit, unitTypes, locationSettings, sources, budgets, clientProfiles, livingPlaces, projects, channelPartners, autoAssign, leads, onOpenLead, canTransfer, onShiftLead, formConfigs, users, currentUserId }) => {
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

  // Same person already in another project: add a new (linked) lead here, or shift the existing one.
  const [choice, setChoice] = React.useState('');
  const [step, setStep] = React.useState(0);
  const [showErrors, setShowErrors] = React.useState(false);
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

  const partners = React.useMemo(() => (channelPartners || []).filter(c => c.status === 'Active' || c.id === channelPartnerId), [channelPartners, channelPartnerId]);
  const channelSources = React.useMemo(() => {
    const base = [...new Set(sources.map(s => s.channelSource))];
    return partners.length && !base.includes(PARTNER_CHANNEL) ? [...base, PARTNER_CHANNEL] : base;
  }, [sources, partners]);
  const sourceNames = React.useMemo(
    () => (channelSource === PARTNER_CHANNEL ? partners.map(c => c.firmName) : channelSource ? sources.filter(s => s.channelSource === channelSource).map(s => s.name) : []),
    [sources, channelSource, partners]);
  const partnerIdFor = (channel: string, name: string) => (channel === PARTNER_CHANNEL ? partners.find(c => c.firmName === name)?.id : undefined);

  // Fill the form when it opens. A new lead starts blank so nothing is saved by accident.
  React.useEffect(() => {
    if (!isOpen) return;
    setSubmitted(false); setStep(0); setShowErrors(false); setChoice('');
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
      setFollowUpType('Call'); setFollowUpDate(''); setFollowUpTime(''); setFollowUpNotes('');
    }
  }, [isOpen, leadToEdit, projects, users, currentUserId, autoAssign]);

  // Picking a channel resets the source if it no longer belongs to it.
  React.useEffect(() => { if (sourceName && !sourceNames.includes(sourceName)) setSourceName(''); }, [sourceNames, sourceName]);

  // The same person (mobile or email) may already be a lead. In the same project that needs a decision; in another project it is only a heads-up.
  const matches = React.useMemo(() => findLeadMatches(leads || [], { phone, email, excludeId: leadToEdit?.id }), [leads, phone, email, leadToEdit]);
  const sameProject = leadProject ? matches.filter(l => l.leadProject === leadProject) : [];
  const elsewhere = matches.filter(l => !sameProject.includes(l));

  // A new answer is needed only when the set of matching leads or the project changes (not when we fill in the email ourselves).
  const matchKey = matches.map(l => l.id).join(',') + '|' + leadProject;
  React.useEffect(() => { setChoice(''); }, [matchKey]);

  // "Add a new lead" for a customer we already know: start from their details (editable); only blanks are filled, and never the mobile number.
  const prefillFrom = (l: Lead) => {
    const [first, ...rest] = l.name.split(' ');
    if (!firstName.trim()) setFirstName(first || '');
    if (!lastName.trim()) setLastName(rest.join(' '));
    if (!email.trim()) setEmail(l.email || '');
    if (initialInterest.length === 0) setInitialInterest(l.initialInterest || []);
    if (!budget) setBudget(l.budget || '');
    if (!preferredLocation) setPreferredLocation(l.preferredLocation || '');
    if (!clientProfile) setClientProfile(l.clientProfile || '');
    if (!livingPlace) setLivingPlace(l.livingPlace || '');
  };

  const errors: Errors = {};
  if (!isEditing && !sameProject.length && elsewhere.length && !choice) errors.duplicate = 'Choose what to do with the existing lead.';
  if (sameProject.length) errors.duplicate = 'This mobile number or email is already a lead in this project.';
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
  if (isVisible('sourceName') && !sourceName) errors.sourceName = channelSource === PARTNER_CHANNEL ? 'Choose the partner.' : 'Choose the source.';
  for (const c of customConfigs) if (c.isRequired && !customData[c.fieldName]) errors[`c:${c.fieldName}`] = `${c.label} is required.`;
  // The follow-up is optional, but a half-filled one would be lost: ask for both date and time.
  if (!isEditing && (followUpDate || followUpTime)) {
    if (!followUpDate) errors.followUpDate = 'Pick a date.';
    if (!followUpTime) errors.followUpTime = 'Pick a time.';
  }
  const stepOf = (key: string) => STEP_OF[key] ?? 1;
  const show = (k: string) => (showErrors && stepOf(k) === step ? errors[k] || null : null);
  const stepLabels = isEditing ? STEPS.slice(0, 2) : STEPS;
  const isLast = step === stepLabels.length - 1;

  const focusFirstError = () => window.setTimeout(() => document.querySelector<HTMLElement>('[role=dialog] [aria-invalid="true"]')?.focus(), 30);

  const save = () => {
    if (isEditing && onUpdateLead && leadToEdit) {
      onUpdateLead({
        ...leadToEdit, name: `${firstName} ${lastName}`.trim(), avatarInitials: `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase(),
        email: email.trim(), phone: phone.trim() || leadToEdit.phone || '', initialInterest, preferredLocation, budget, clientProfile, livingPlace,
        leadStatus, channelSource, leadSource: sourceName, leadProject: leadProject || 'Not Assigned', customData, ownerId: ownerId || leadToEdit.ownerId,
        channelPartnerId: partnerIdFor(channelSource, sourceName),
      });
    } else if (!isEditing && onAddLead) {
      onAddLead({
        ownerId, firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), phone: phone.trim(), initialInterest, preferredLocation, budget, clientProfile, livingPlace,
        leadStatus, channelSource, sourceName, leadProject, message: message.trim() || undefined, customData, channelPartnerId: partnerIdFor(channelSource, sourceName),
        ...(choice === 'add' && elsewhere.length ? { customerId: elsewhere[0].customerId || elsewhere[0].id, linkLeadIds: elsewhere.map(l => l.id) } : {}),
        followUp: followUpDate && followUpTime ? { type: followUpType, date: followUpDate, time: followUpTime, notes: followUpNotes.trim() || undefined, assignedTo: users.find(u => u.id === ownerId)?.name || '' } : undefined,
      });
    }
    onClose();
  };

  // Enter or Next: check this step, then move on; the last step saves.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 0 && choice.startsWith('shift:')) {
      if (!leadProject) { setShowErrors(true); focusFirstError(); return; }
      onShiftLead?.(choice.slice(6), leadProject); onClose(); return;
    }
    const bad = Object.keys(errors).filter(k => stepOf(k) <= step);
    if (!isLast) {
      if (bad.some(k => stepOf(k) === step)) { setShowErrors(true); focusFirstError(); return; }
      setShowErrors(false); setStep(step + 1); return;
    }
    if (Object.keys(errors).length) {
      const first = Math.min(...Object.keys(errors).map(stepOf));
      setStep(first); setShowErrors(true); focusFirstError(); return;
    }
    save();
  };

  const interestOptions = (unitTypes || []).map(u => u.name);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" title={isEditing ? 'Edit lead' : 'New lead'} subtitle={isEditing ? leadToEdit?.name : 'Add an enquiry to your pipeline'} onSubmit={handleSubmit}
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <Button type="button" tone="ghost" onClick={onClose}>Cancel</Button>
          <div className="flex gap-2">
            {step > 0 && <Button type="button" tone="ghost" onClick={() => { setShowErrors(false); setStep(step - 1); }}>Back</Button>}
            <Button type="submit" tone={isLast ? 'success' : 'primary'}>{choice.startsWith('shift:') && step === 0 ? 'Shift lead' : isLast ? (isEditing ? 'Save changes' : 'Create lead') : 'Next'}</Button>
          </div>
        </div>
      }>
      <ol className="flex items-center gap-1.5 overflow-x-auto no-scrollbar -mt-1" aria-label="Lead steps">
        {stepLabels.map((label, i) => (
          <li key={label} className="flex items-center gap-1.5 shrink-0" aria-current={i === step ? 'step' : undefined}>
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${i < step ? 'bg-[color-mix(in_srgb,var(--primary-color)_18%,transparent)] text-[var(--primary-color)]' : i === step ? 'bg-[var(--primary-color)] text-white' : 'bg-[var(--light-bg)] text-[var(--text-secondary)]'}`}>
              {i < step ? <i className="fas fa-check mr-1 text-[9px]" aria-hidden="true"></i> : <span className="mr-1">{i + 1}.</span>}{label}
            </span>
            {i < stepLabels.length - 1 && <span className="w-3 h-px bg-[var(--border-color)]"></span>}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <>
          <Section title="Project">
            {isVisible('leadProject') && <Field label="Project" htmlFor="lm-project" required={isRequired('leadProject')} error={show('leadProject')} hint="Choose this first: the same person can be a lead in more than one project, but only once in each." className="sm:col-span-2"><Select id="lm-project" value={leadProject} onChange={setLeadProject} placeholder="Select project" options={projects.map(p => p.name)} invalid={!!show('leadProject')} /></Field>}
          </Section>
          <Section title="Contact">
            {isVisible('phone') && (
              <Field label="Mobile number" htmlFor="lm-phone" required={isRequired('phone') && !leadToEdit?.phone} error={show('phone')} hint={leadToEdit?.phone ? 'The saved number stays hidden. Type only to change it.' : undefined}>
                <input id="lm-phone" type="tel" inputMode="tel" value={phone} onChange={e => setPhone(e.target.value)} autoComplete="off" placeholder={leadToEdit?.phone ? 'Saved' : '+91 98765 43210'} className={inputCls(!!show('phone'))} aria-invalid={!!show('phone')} />
              </Field>
            )}
            {isVisible('email') && <Field label="Email" htmlFor="lm-email" required={isRequired('email')} error={show('email')}><input id="lm-email" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="off" placeholder="name@example.com" className={inputCls(!!show('email'))} aria-invalid={!!show('email')} /></Field>}

            {sameProject.length > 0 && (
              <div role="alert" aria-live="polite" className="sm:col-span-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm" data-testid="duplicate-warning">
                <p className="font-semibold text-red-400 flex items-center gap-2"><i className="fas fa-copy" aria-hidden="true"></i>Already a lead in {leadProject}</p>
                <ul className="mt-2 space-y-1.5">
                  {sameProject.map(l => (
                    <li key={l.id} className="flex items-center justify-between gap-3">
                      <span className="min-w-0 text-[var(--text-primary)] truncate"><b>{l.name}</b> <span className="text-[var(--text-secondary)]">· {l.leadStatus} · owner {users.find(u => u.id === l.ownerId)?.name || 'unassigned'}</span></span>
                      {onOpenLead && <button type="button" onClick={() => { onOpenLead(l.id); onClose(); }} className="shrink-0 px-2.5 py-1 rounded-md bg-[var(--primary-color)] text-white text-xs font-semibold">Open lead</button>}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-[var(--text-secondary)]">A lead can be added only once in a project. Open it to add a follow-up, a note or a visit. If this is a different person, change the mobile number or email.</p>
              </div>
            )}
            {!isEditing && sameProject.length === 0 && elsewhere.length > 0 && (
              <fieldset className="sm:col-span-2 rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm" data-testid="duplicate-info">
                <legend className="px-1 font-semibold text-yellow-500"><i className="fas fa-info-circle mr-2" aria-hidden="true"></i>Already a lead in another project</legend>
                <ul className="mt-1 space-y-1 text-[var(--text-secondary)]">
                  {elsewhere.map(l => (
                    <li key={l.id} className="flex items-center justify-between gap-3">
                      <span className="min-w-0 truncate"><b className="text-[var(--text-primary)]">{l.name}</b> · {l.leadProject} · {l.leadStatus} · owner {users.find(u => u.id === l.ownerId)?.name || 'unassigned'}</span>
                      {onOpenLead && <button type="button" onClick={() => { onOpenLead(l.id); onClose(); }} className="shrink-0 px-2.5 py-1 rounded-md border border-[var(--border-color)] text-xs font-semibold text-[var(--text-primary)]">Open lead</button>}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[var(--text-primary)]">What should happen?</p>
                <div className="mt-1.5 space-y-1.5" role="radiogroup" aria-label="Existing customer">
                  <label className="flex items-start gap-2 cursor-pointer"><input type="radio" name="dup-choice" checked={choice === 'add'} onChange={() => { setChoice('add'); prefillFrom(elsewhere[0]); }} className="mt-1 accent-[var(--primary-color)]" /><span>Add a new lead for {leadProject || 'this project'}<span className="block text-xs text-[var(--text-secondary)]">Same customer, so both leads are linked. The other project's lead stays as it is.</span></span></label>
                  {elsewhere.map(l => {
                    const blocked = !canTransfer ? "You don't have permission to transfer leads. Ask an Admin." : l.bookingDetails ? 'It has a booking, so it cannot be moved.' : '';
                    return (
                      <label key={l.id} className={`flex items-start gap-2 ${blocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                        <input type="radio" name="dup-choice" checked={choice === 'shift:' + l.id} disabled={!!blocked} onChange={() => setChoice('shift:' + l.id)} className="mt-1 accent-[var(--primary-color)]" />
                        <span>Shift {l.name} from {l.leadProject} to {leadProject || 'this project'}<span className="block text-xs text-[var(--text-secondary)]">{blocked || 'Moves the existing lead with its chats and follow-ups. No new lead is created.'}</span></span>
                      </label>
                    );
                  })}
                </div>
                {choice === 'add' && <p className="mt-2 text-xs text-[var(--text-secondary)]"><i className="fas fa-copy mr-1" aria-hidden="true"></i>Name, email and requirement are copied from {elsewhere[0].name}. Change anything that is different.</p>}
                {showErrors && errors.duplicate && step === 0 && <p role="alert" className="mt-2 text-xs text-red-500"><i className="fas fa-exclamation-circle mr-1" aria-hidden="true"></i>{errors.duplicate}</p>}
              </fieldset>
            )}

            {isVisible('firstName') && <Field label="First name" htmlFor="lm-first" required={isRequired('firstName')} error={show('firstName')}><input id="lm-first" value={firstName} onChange={e => setFirstName(e.target.value)} autoComplete="off" className={inputCls(!!show('firstName'))} aria-invalid={!!show('firstName')} /></Field>}
            {isVisible('lastName') && <Field label="Last name" htmlFor="lm-last" required={isRequired('lastName')} error={show('lastName')}><input id="lm-last" value={lastName} onChange={e => setLastName(e.target.value)} autoComplete="off" className={inputCls(!!show('lastName'))} aria-invalid={!!show('lastName')} /></Field>}
          </Section>
          <Section title="Source">
            {isVisible('channelSource') && <Field label="Channel" htmlFor="lm-channel" required error={show('channelSource')}><Select id="lm-channel" value={channelSource} onChange={setChannelSource} placeholder="Select channel" options={channelSources} invalid={!!show('channelSource')} /></Field>}
            {isVisible('sourceName') && <Field label={channelSource === PARTNER_CHANNEL ? 'Partner' : 'Source'} htmlFor="lm-source" required error={show('sourceName')}><Select id="lm-source" value={sourceName} onChange={setSourceName} placeholder={channelSource ? (channelSource === PARTNER_CHANNEL ? 'Select partner' : 'Select source') : 'Choose a channel first'} options={sourceNames} invalid={!!show('sourceName')} /></Field>}
          </Section>
        </>
      )}

      {step === 1 && (
        <>
          <Section title="Requirement">
            {isVisible('preferredLocation') && <Field label="Preferred location" htmlFor="lm-loc" required={isRequired('preferredLocation')} error={show('preferredLocation')}><Select id="lm-loc" value={preferredLocation} onChange={setPreferredLocation} placeholder="Select location" options={(locationSettings || []).map(l => l.name)} invalid={!!show('preferredLocation')} /></Field>}
            {isVisible('initialInterest') && (
              <Field label="Looking for" required={isRequired('initialInterest')} error={show('initialInterest')} className="sm:col-span-2">
                <Chips label="Looking for" options={interestOptions} value={initialInterest} onChange={setInitialInterest} multiple />
              </Field>
            )}
            {isVisible('budget') && <Field label="Budget" htmlFor="lm-budget" required={isRequired('budget')} error={show('budget')}><Select id="lm-budget" value={budget} onChange={setBudget} placeholder="Select budget" options={(budgets || []).map(b => b.name)} invalid={!!show('budget')} /></Field>}
            <Field label="Owner" htmlFor="lm-owner" hint={isEditing && !canTransfer ? 'Only people with the Transfer permission can change the owner.' : 'The salesperson responsible for this lead.'}>
              <select id="lm-owner" value={ownerId} disabled={isEditing && !canTransfer} onChange={e => setOwnerId(e.target.value)} className={inputCls()}>
                {autoAssign && !isEditing && <option value="">Auto-assign (distribution rules)</option>}
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </Field>
          </Section>

          <Section title="Profile">
            {isVisible('clientProfile') && <Field label="Client profile" htmlFor="lm-profile"><Select id="lm-profile" value={clientProfile} onChange={setClientProfile} placeholder="Select profile" options={(clientProfiles || []).map(c => c.name)} /></Field>}
            {isVisible('livingPlace') && <Field label="Currently living in" htmlFor="lm-living"><Select id="lm-living" value={livingPlace} onChange={setLivingPlace} placeholder="Select" options={(livingPlaces || []).map(l => l.name)} /></Field>}
            {isVisible('message') && !isEditing && <Field label="First remark" htmlFor="lm-msg" className="sm:col-span-2"><textarea id="lm-msg" value={message} onChange={e => setMessage(e.target.value)} rows={2} placeholder="What did the customer ask for?" className={textareaCls()} /></Field>}
          </Section>

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
        </>
      )}

      {step === 2 && !isEditing && (
        <Section title="Schedule the first follow-up">
          <Field label="Type" className="sm:col-span-2"><Chips label="Follow-up type" options={['Call', 'Meeting', 'Email']} value={followUpType} onChange={setFollowUpType} /></Field>
          <Field label="When" className="sm:col-span-2" hint="Optional. Leave the date and time empty to skip, but a first follow-up keeps a new lead from going cold."><Chips label="Quick date" options={QUICK.map(q => q[0])} value={QUICK.find(([, n]) => addDays(n) === followUpDate)?.[0] || ''} onChange={(label: string) => setFollowUpDate(addDays(QUICK.find(q => q[0] === label)![1]))} /></Field>
          <Field label="Date" htmlFor="lm-fu-date" error={show('followUpDate')}><input id="lm-fu-date" type="date" min={todayISO()} value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} className={inputCls(!!show('followUpDate'))} aria-invalid={!!show('followUpDate')} /></Field>
          <Field label="Time" htmlFor="lm-fu-time" error={show('followUpTime')}><input id="lm-fu-time" type="time" value={followUpTime} onChange={e => setFollowUpTime(e.target.value)} className={inputCls(!!show('followUpTime'))} aria-invalid={!!show('followUpTime')} /></Field>
          <Field label="Notes" htmlFor="lm-fu-notes" className="sm:col-span-2"><textarea id="lm-fu-notes" value={followUpNotes} onChange={e => setFollowUpNotes(e.target.value)} rows={2} className={textareaCls()} /></Field>
        </Section>
      )}
    </Modal>
  );
};

export default LeadModal;

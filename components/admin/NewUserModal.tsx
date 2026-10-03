
import React from 'react';
import { NewUserData, User, UserRole, FormFieldConfig } from '../../types';
import DynamicFieldRenderer from '../DynamicFieldRenderer';
import { useLiveQuery } from '../../liveQuery';
import { db } from '../../db';
import { Modal, Field, Section, inputCls } from '../ui/Modal';

interface NewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddUser: (userData: NewUserData) => void | Promise<unknown>;
  users: User[];
}

const NewUserModal: React.FC<NewUserModalProps> = ({ isOpen, onClose, onAddUser, users }) => {
  const [name, setName] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [role, setRole] = React.useState<UserRole>('User');
  const [reportsTo, setReportsTo] = React.useState<string>('');
  const [customData, setCustomData] = React.useState<Record<string, any>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const configs = useLiveQuery(() => db.formFieldConfigs.where({ module: 'user' }).toArray(), []);
  const activeConfigs = React.useMemo(() => configs?.filter(c => c.isVisible) || [], [configs]);
  const customConfigs = React.useMemo(() => activeConfigs.filter(c => !c.isSystem), [activeConfigs]);
  
  const isVisible = (field: string) => activeConfigs.some(c => c.fieldName === field);
  const isRequired = (field: string) => activeConfigs.find(c => c.fieldName === field)?.isRequired || false;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (isVisible('name') && isRequired('name') && !name.trim()) newErrors.name = 'Enter the full name.';
    if (isVisible('username') && isRequired('username') && !username.trim()) newErrors.username = 'Enter a username.';
    if (isVisible('email') && isRequired('email') && !email.trim()) newErrors.email = 'Enter an email.';
    if (isVisible('phone') && isRequired('phone') && !phone.trim()) newErrors.phone = 'Enter a phone number.';
    if (isVisible('email')) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email.trim() && !emailRegex.test(email)) newErrors.email = 'Invalid email address.';
    }
    if (password.length < 6) newErrors.password = 'Min 6 characters.';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';
    
    // Custom Fields Validation
    for (const c of customConfigs) {
        if (c.isRequired && !customData[c.fieldName]) {
            newErrors[c.fieldName] = `${c.label} is required.`;
        }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [submitError, setSubmitError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    setName(''); setUsername(''); setEmail(''); setPhone(''); setPassword(''); setConfirmPassword('');
    setRole('User'); setReportsTo(''); setCustomData({}); setErrors({}); setSubmitError(null);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (validate()) {
      setSubmitting(true);
      try {
        // The server can refuse (e.g. the plan's active-user limit); keep the form open and say why.
        await onAddUser({ name: name.trim(), username: username.trim(), password, email: email.trim(), phone: phone.trim(), role, reportsTo: reportsTo || null, customData, assignedProjectIds: [] });
        onClose();
      } catch (err: any) {
        setSubmitError(err?.message || 'Could not add the user. Please try again.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const req = (f: string) => isRequired(f);
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title="Add new user" onSubmit={handleSubmit} submitLabel="Add user" submitting={submitting} error={submitError}>
      <Section title="Profile">
        {isVisible('name') && <Field label="Full name" htmlFor="nuName" required={req('name')} error={errors.name}><input id="nuName" value={name} onChange={e => setName(e.target.value)} className={inputCls(!!errors.name)} /></Field>}
        {isVisible('username') && <Field label="Username" htmlFor="nuUser" required={req('username')} error={errors.username}><input id="nuUser" value={username} onChange={e => setUsername(e.target.value)} autoComplete="off" className={inputCls(!!errors.username)} /></Field>}
        {isVisible('email') && <Field label="Email" htmlFor="nuEmail" required={req('email')} error={errors.email}><input id="nuEmail" type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls(!!errors.email)} /></Field>}
        {isVisible('phone') && <Field label="Phone" htmlFor="nuPhone" required={req('phone')} error={errors.phone}><input id="nuPhone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inputCls(!!errors.phone)} /></Field>}
      </Section>
      <Section title="Sign-in">
        <Field label="Password" htmlFor="nuPass" required error={errors.password}><input id="nuPass" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" className={inputCls(!!errors.password)} /></Field>
        <Field label="Confirm password" htmlFor="nuPass2" required error={errors.confirmPassword}><input id="nuPass2" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" className={inputCls(!!errors.confirmPassword)} /></Field>
        {isVisible('role') && (
          <Field label="Role" htmlFor="nuRole">
            <select id="nuRole" value={role} onChange={e => setRole(e.target.value as UserRole)} className={inputCls()}>
              <option value="User">User</option><option value="Sales">Sales</option><option value="Admin">Admin</option>
            </select>
          </Field>
        )}
        {isVisible('reportsTo') && (
          <Field label="Reports to" htmlFor="nuReports">
            <select id="nuReports" value={reportsTo} onChange={e => setReportsTo(e.target.value)} className={inputCls()}>
              <option value="">None</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </Field>
        )}
      </Section>
      {customConfigs.length > 0 && (
        <Section title="Profile details">
          {customConfigs.map(config => (
            <DynamicFieldRenderer key={config.id} config={config} value={customData[config.fieldName]} onChange={(val) => setCustomData(prev => ({ ...prev, [config.fieldName]: val }))} error={errors[config.fieldName]} />
          ))}
        </Section>
      )}
    </Modal>
  );
};

export default NewUserModal;

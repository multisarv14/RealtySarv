import React from 'react';
import { User, UserRole } from '../../types';
import { Modal, Field, Section, inputCls } from '../ui/Modal';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSaveUser: (updatedUser: User) => void;
  users: User[];
  /** The signed-in admin: cannot demote themselves. */
  currentUserId?: string;
}

/** Everyone below `id` in the reporting tree (they cannot be chosen as that person's manager). */
const descendantIds = (id: string, users: User[]): Set<string> => {
  const out = new Set<string>();
  const walk = (parent: string) => users.forEach(u => { if (u.reportsTo === parent && !out.has(u.id)) { out.add(u.id); walk(u.id); } });
  walk(id);
  return out;
};

const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, user, onSaveUser, users, currentUserId }) => {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [role, setRole] = React.useState<UserRole>('User');
  const [reportsTo, setReportsTo] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmNewPassword, setConfirmNewPassword] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen || !user) return;
    setName(user.name); setEmail(user.email); setPhone(user.phone || ''); setRole(user.role);
    setReportsTo(user.reportsTo || ''); setNewPassword(''); setConfirmNewPassword(''); setSubmitted(false);
  }, [isOpen, user]);

  if (!user) return null;

  const isSelf = user.id === currentUserId;
  const lastAdmin = user.role === 'Admin' && user.isActive && users.filter(u => u.role === 'Admin' && u.isActive).length <= 1;
  const roleLocked = isSelf || lastAdmin;
  const blocked = descendantIds(user.id, users);
  const managers = users.filter(u => u.id !== user.id && !blocked.has(u.id));

  const errors = {
    name: name.trim() ? '' : 'Enter the full name.',
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? '' : 'Enter a valid email address.',
    newPassword: newPassword && newPassword.length < 6 ? 'At least 6 characters.' : '',
    confirmNewPassword: newPassword && newPassword !== confirmNewPassword ? 'Passwords do not match.' : '',
  };
  const err = (k: keyof typeof errors) => (submitted && errors[k]) || null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.values(errors).some(Boolean)) return;
    const updated: User = { ...user, name: name.trim(), email: email.trim(), phone: phone.trim(), role, reportsTo: reportsTo || null };
    if (newPassword) updated.password = newPassword;
    onSaveUser(updated);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title="Edit user" subtitle={`@${user.username}`} onSubmit={handleSubmit} submitLabel="Save changes">
      <Section title="Profile">
        <Field label="Full name" htmlFor="editUserName" required error={err('name')}><input id="editUserName" value={name} onChange={e => setName(e.target.value)} className={inputCls(!!err('name'))} /></Field>
        <Field label="Email" htmlFor="editUserEmail" required error={err('email')}><input id="editUserEmail" type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls(!!err('email'))} /></Field>
        <Field label="Phone" htmlFor="editUserPhone"><input id="editUserPhone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inputCls()} /></Field>
        <Field label="Username" htmlFor="editUserUsername" hint="Cannot be changed."><input id="editUserUsername" value={user.username} readOnly disabled className={inputCls()} /></Field>
      </Section>
      <Section title="Access">
        <Field label="Role" htmlFor="editUserRole" hint={isSelf ? 'You cannot change your own role.' : lastAdmin ? 'The company needs at least one active Admin.' : undefined}>
          <select id="editUserRole" value={role} disabled={roleLocked} onChange={e => setRole(e.target.value as UserRole)} className={inputCls()}>
            <option value="User">User</option><option value="Sales">Sales</option><option value="Admin">Admin</option>
          </select>
        </Field>
        <Field label="Reports to" htmlFor="editReportsTo">
          <select id="editReportsTo" value={reportsTo} onChange={e => setReportsTo(e.target.value)} className={inputCls()}>
            <option value="">None</option>
            {managers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </Field>
      </Section>
      <Section title="Change password (optional)">
        <Field label="New password" htmlFor="editNewPassword" error={err('newPassword')}><input id="editNewPassword" type="password" autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inputCls(!!err('newPassword'))} /></Field>
        <Field label="Confirm new password" htmlFor="editConfirmNewPassword" error={err('confirmNewPassword')}><input id="editConfirmNewPassword" type="password" autoComplete="new-password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} className={inputCls(!!err('confirmNewPassword'))} /></Field>
      </Section>
    </Modal>
  );
};

export default EditUserModal;

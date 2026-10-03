
import React from 'react';
import { NewUserData, User, UserRole, FormFieldConfig } from '../../types';
import DynamicFieldRenderer from '../DynamicFieldRenderer';
import { useLiveQuery } from '../../liveQuery';
import { db } from '../../db';

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
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const configs = useLiveQuery(() => db.formFieldConfigs.where({ module: 'user' }).toArray(), []);
  const activeConfigs = React.useMemo(() => configs?.filter(c => c.isVisible) || [], [configs]);
  const customConfigs = React.useMemo(() => activeConfigs.filter(c => !c.isSystem), [activeConfigs]);
  
  const isVisible = (field: string) => activeConfigs.some(c => c.fieldName === field);
  const isRequired = (field: string) => activeConfigs.find(c => c.fieldName === field)?.isRequired || false;

  const validate = () => {
    const newErrors: Record<string, string> = {};
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (validate()) {
      try {
        // The server can refuse (e.g. the plan's active-user limit); keep the form open and say why.
        await onAddUser({ name: name.trim(), username: username.trim(), password, email: email.trim(), phone: phone.trim(), role, reportsTo: reportsTo || null, customData, assignedProjectIds: [] });
        onClose();
      } catch (err: any) {
        setSubmitError(err?.message || 'Could not add the user. Please try again.');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 animate-fadeIn" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-[var(--medium-bg)] p-6 sm:p-8 rounded-lg shadow-xl w-11/12 max-w-lg relative max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl sm:text-2xl font-bold mb-6 text-[var(--text-primary)] text-center">Add New User</h3>
        {submitError && <div role="alert" className="mb-4 text-sm text-red-300 bg-red-900/30 border border-red-500/40 rounded-md p-3">{submitError}</div>}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isVisible('name') && (
                <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Full Name{isRequired('name') ? '*' : ''}</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required={isRequired('name')} className="w-full p-3 rounded-md border border-[var(--light-bg)] bg-[var(--dark-bg)] text-[var(--text-primary)]" />
                </div>
            )}
            {isVisible('username') && (
                <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Username{isRequired('username') ? '*' : ''}</label>
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} required={isRequired('username')} className="w-full p-3 rounded-md border border-[var(--light-bg)] bg-[var(--dark-bg)] text-[var(--text-primary)]" />
                </div>
            )}
          </div>
          {isVisible('email') && (
            <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Email{isRequired('email') ? '*' : ''}</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required={isRequired('email')} className={`w-full p-3 rounded-md border ${errors.email ? 'border-red-500' : 'border-[var(--light-bg)]'} bg-[var(--dark-bg)] text-[var(--text-primary)]`} />
            </div>
          )}
          {isVisible('phone') && (
            <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Phone{isRequired('phone') ? '*' : ''}</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required={isRequired('phone')} className="w-full p-3 rounded-md border border-[var(--light-bg)] bg-[var(--dark-bg)] text-[var(--text-primary)]" />
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Password*</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className={`w-full p-3 rounded-md border ${errors.password ? 'border-red-500' : 'border-[var(--light-bg)]'} bg-[var(--dark-bg)] text-[var(--text-primary)]`} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Confirm*</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className={`w-full p-3 rounded-md border ${errors.confirmPassword ? 'border-red-500' : 'border-[var(--light-bg)]'} bg-[var(--dark-bg)] text-[var(--text-primary)]`} />
              </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isVisible('role') && (
                <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Role*</label>
                    <select value={role} onChange={e => setRole(e.target.value as UserRole)} className="w-full p-3 rounded-md border border-[var(--light-bg)] bg-[var(--dark-bg)] text-[var(--text-primary)]">
                        <option value="User">User</option>
                        <option value="Sales">Sales</option>
                        <option value="Admin">Admin</option>
                    </select>
                </div>
            )}
            {isVisible('reportsTo') && (
                <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Reports To</label>
                    <select value={reportsTo} onChange={e => setReportsTo(e.target.value)} className="w-full p-3 rounded-md border border-[var(--light-bg)] bg-[var(--dark-bg)] text-[var(--text-primary)]">
                        <option value="">-- None --</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                </div>
            )}
          </div>

          {/* Render Custom Fields */}
          {customConfigs.length > 0 && (
              <div className="pt-4 border-t border-[var(--light-bg)]">
                  <h4 className="text-xs font-bold text-[var(--primary-color)] uppercase tracking-wider mb-4">Profile Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {customConfigs.map(config => (
                          <DynamicFieldRenderer 
                            key={config.id} 
                            config={config} 
                            value={customData[config.fieldName]} 
                            onChange={(val) => setCustomData(prev => ({...prev, [config.fieldName]: val}))} 
                            error={errors[config.fieldName]}
                          />
                      ))}
                  </div>
              </div>
          )}

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[var(--light-bg)]">
            <button type="button" onClick={onClose} className="px-5 py-2 rounded-md bg-gray-700 text-[var(--text-primary)] font-medium">Cancel</button>
            <button type="submit" className="px-5 py-2 rounded-md bg-[var(--primary-color)] text-white font-medium hover:bg-[#128c7e]">Add User</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewUserModal;

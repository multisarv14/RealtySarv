
import React from 'react';
import { FormFieldConfig, FormModule, FieldType } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '../ui/Toast';
import { confirmDialog } from '../ui/Confirm';
import { SHOW_DELETE } from '../../features';

interface AdminFormFieldCustomizationProps {
  configs: FormFieldConfig[];
  onUpdateConfigs: (updatedConfigs: FormFieldConfig[]) => void;
  initialModule?: FormModule;
}

const NewFieldModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onAdd: (field: Omit<FormFieldConfig, 'id'>) => void;
    module: FormModule;
}> = ({ isOpen, onClose, onAdd, module }) => {
    const [label, setLabel] = React.useState('');
    const [type, setType] = React.useState<FieldType>('text');
    const [required, setRequired] = React.useState(false);
    const [options, setOptions] = React.useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const fieldName = label.toLowerCase().replace(/[^a-z0-9]/g, '_');
        onAdd({
            module,
            fieldName,
            label,
            fieldType: type,
            isVisible: true,
            isRequired: required,
            isSystem: false,
            options: type === 'select' ? options.split(',').map(o => o.trim()).filter(Boolean) : undefined
        });
        setLabel('');
        setType('text');
        setRequired(false);
        setOptions('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-[var(--medium-bg)] p-6 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6">Add Custom Field</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Field Label</label>
                        <input type="text" value={label} onChange={e => setLabel(e.target.value)} required placeholder="e.g., Passport Number" className="w-full p-2 rounded bg-[var(--dark-bg)] border border-[var(--light-bg)] text-[var(--text-primary)] focus:border-[var(--primary-color)] outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Field Type</label>
                        <select value={type} onChange={e => setType(e.target.value as FieldType)} className="w-full p-2 rounded bg-[var(--dark-bg)] border border-[var(--light-bg)] text-[var(--text-primary)] focus:border-[var(--primary-color)] outline-none">
                            <option value="text">Short Text</option>
                            <option value="textarea">Long Text</option>
                            <option value="number">Number</option>
                            <option value="date">Date</option>
                            <option value="select">Dropdown Select</option>
                        </select>
                    </div>
                    {type === 'select' && (
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Options (Comma separated)</label>
                            <input type="text" value={options} onChange={e => setOptions(e.target.value)} placeholder="Option 1, Option 2, Option 3" className="w-full p-2 rounded bg-[var(--dark-bg)] border border-[var(--light-bg)] text-[var(--text-primary)] focus:border-[var(--primary-color)] outline-none" required />
                        </div>
                    )}
                    <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-[var(--dark-bg)]">
                        <input type="checkbox" checked={required} onChange={e => setRequired(e.target.checked)} className="h-4 w-4 text-[var(--primary-color)]" />
                        <span className="text-sm text-[var(--text-primary)]">Mark as Mandatory</span>
                    </label>
                    <div className="flex justify-end gap-3 pt-4 border-t border-[var(--light-bg)]">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-[var(--text-secondary)] font-medium">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-[var(--primary-color)] text-white font-bold rounded-md hover:bg-[#128c7e]">Add Field</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AdminFormFieldCustomization: React.FC<AdminFormFieldCustomizationProps> = ({ configs, onUpdateConfigs, initialModule = 'lead' }) => {
  const [activeModule, setActiveModule] = React.useState<FormModule>(initialModule);
  const [localConfigs, setLocalConfigs] = React.useState<FormFieldConfig[]>(configs || []);
  const [showAddModal, setShowAddModal] = React.useState(false);

  React.useEffect(() => {
    setLocalConfigs(configs || []);
  }, [configs]);

  const modules: { key: FormModule; label: string; icon: string }[] = [
    { key: 'lead', label: 'Leads', icon: 'fas fa-users' },
    { key: 'project', label: 'Projects', icon: 'fas fa-building' },
    { key: 'booking', label: 'Bookings', icon: 'fas fa-file-signature' },
    { key: 'user', label: 'Users', icon: 'fas fa-user-circle' },
    { key: 'company', label: 'Company', icon: 'fas fa-industry' },
  ];

  const currentConfigs = (localConfigs || []).filter(c => c.module === activeModule);

  const handleToggle = (id: string, field: 'isVisible' | 'isRequired') => {
    setLocalConfigs(prev => (prev || []).map(c => {
      if (c.id === id) {
        if (field === 'isVisible' && c.isVisible) return { ...c, isVisible: false, isRequired: false };
        if (field === 'isVisible' && c.isSystem) return c;
        return { ...c, [field]: !c[field] };
      }
      return c;
    }));
  };

  const handleDeleteCustom = async (id: string) => {
      if (await confirmDialog({ title: 'Delete custom field?', message: 'Existing data for this field will be inaccessible.', confirmLabel: 'Delete', danger: true })) {
          setLocalConfigs(prev => (prev || []).filter(c => c.id !== id));
      }
  };

  const handleAddField = (newField: Omit<FormFieldConfig, 'id'>) => {
      const fieldWithId = { ...newField, id: uuidv4() };
      setLocalConfigs(prev => [...(prev || []), fieldWithId]);
  };

  const handleSave = () => {
    onUpdateConfigs(localConfigs);
    toast.success('Form structure saved.');
  };

  return (
    <div className="p-4 bg-[var(--medium-bg)] rounded-lg shadow-md h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-[var(--text-primary)]">Form Customization</h3>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Configure system fields or add your own custom data fields.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowAddModal(true)} className="px-4 py-2 rounded-md bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors text-sm">
             <i className="fas fa-plus mr-2"></i> Add Custom Field
          </button>
          <button onClick={handleSave} className="px-5 py-2 rounded-md bg-[var(--primary-color)] text-white font-bold hover:bg-[#128c7e] transition-colors shadow-lg">
             Save Changes
          </button>
        </div>
      </div>

      <div className="flex border-b border-[var(--light-bg)] mb-6 overflow-x-auto no-scrollbar">
        {modules.map(mod => (
          <button
            key={mod.key}
            onClick={() => setActiveModule(mod.key)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeModule === mod.key
                ? 'border-[var(--primary-color)] text-[var(--primary-color)] bg-[var(--light-bg)]/30'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <i className={mod.icon}></i>
            {mod.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        <div className="bg-[var(--dark-bg)] rounded-xl border border-[var(--light-bg)] overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--light-bg)] text-[var(--text-primary)] sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-4 font-bold uppercase tracking-wider text-xs">Field Detail</th>
                <th className="p-4 font-bold uppercase tracking-wider text-xs text-center">Visible</th>
                <th className="p-4 font-bold uppercase tracking-wider text-xs text-center">Required</th>
                <th className="p-4 font-bold uppercase tracking-wider text-xs">Type / Status</th>
                <th className="p-4 font-bold uppercase tracking-wider text-xs"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--light-bg)]">
              {currentConfigs.map(config => (
                <tr key={config.id} className="hover:bg-[var(--medium-bg)] transition-colors group">
                  <td className="p-4">
                    <p className="font-bold text-[var(--text-primary)]">{config.label}</p>
                    <p className="text-[10px] font-mono text-[var(--text-secondary)] uppercase">DB_KEY: {config.fieldName}</p>
                  </td>
                  <td className="p-4 text-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={config.isVisible} onChange={() => handleToggle(config.id, 'isVisible')} disabled={config.isSystem} />
                      <div className={`w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary-color)] ${config.isSystem ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}></div>
                    </label>
                  </td>
                  <td className="p-4 text-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={config.isRequired} onChange={() => handleToggle(config.id, 'isRequired')} disabled={!config.isVisible} />
                      <div className={`w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500 ${!config.isVisible ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}></div>
                    </label>
                  </td>
                  <td className="p-4">
                     <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase block mb-1">{config.fieldType}</span>
                    {config.isSystem ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">SYSTEM LOCK</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">CUSTOM FIELD</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                      {SHOW_DELETE && !config.isSystem && (
                          <button onClick={() => handleDeleteCustom(config.id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-500/10 rounded-full" title="Delete Field">
                              <i className="fas fa-trash-alt"></i>
                          </button>
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <NewFieldModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onAdd={handleAddField} module={activeModule} />
    </div>
  );
};

export default AdminFormFieldCustomization;

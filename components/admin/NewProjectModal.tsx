
import React from 'react';
import { NewProjectData, ProjectStatus, ProjectType, FormFieldConfig } from '../../types';
import DynamicFieldRenderer from '../DynamicFieldRenderer';
import { useLiveQuery } from '../../liveQuery';
import { db } from '../../db';

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

  const configs = useLiveQuery(() => db.formFieldConfigs.where({ module: 'project' }).toArray(), []);
  const activeConfigs = React.useMemo(() => configs?.filter(c => c.isVisible) || [], [configs]);
  const customConfigs = React.useMemo(() => activeConfigs.filter(c => !c.isSystem), [activeConfigs]);
  
  const isVisible = (field: string) => activeConfigs.some(c => c.fieldName === field);
  const isRequired = (field: string) => activeConfigs.find(c => c.fieldName === field)?.isRequired || false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const floors = parseInt(totalFloors, 10);
    const wingsArray = wings.split(',').map(w => w.trim()).filter(Boolean);

    // Validate custom fields
    for (const c of customConfigs) {
        if (c.isRequired && !customData[c.fieldName]) {
            alert(`${c.label} is required.`);
            return;
        }
    }

    if (name.trim() && companyName.trim() && location.trim() && reraNumber.trim() && description.trim() && !isNaN(floors) && floors > 0) {
      onAddProject({ 
        name, 
        companyName,
        location, 
        reraNumber,
        projectType,
        projectStatus,
        description,
        totalFloors: floors, 
        wings: wingsArray,
        customData
      });
      onClose();
    } else {
      alert('Please fill all required system fields.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 animate-fadeIn" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-[var(--medium-bg)] p-6 sm:p-8 rounded-lg shadow-xl w-11/12 max-w-2xl relative max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl sm:text-2xl font-bold mb-6 text-[var(--text-primary)] text-center">Register New Project</h3>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isVisible('name') && (
                <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Project Name*</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Enter project name" className="w-full p-3 rounded-md border border-[var(--light-bg)] bg-[var(--dark-bg)] text-[var(--text-primary)]" />
                </div>
            )}
            {isVisible('companyName') && (
                <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Company Name*</label>
                <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} required placeholder="Enter company name" className="w-full p-3 rounded-md border border-[var(--light-bg)] bg-[var(--dark-bg)] text-[var(--text-primary)]" />
                </div>
            )}
          </div>
          {isVisible('reraNumber') && (
            <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">RERA Number*</label>
                <input type="text" value={reraNumber} onChange={e => setReraNumber(e.target.value)} required placeholder="e.g., A51800000000" className="w-full p-3 rounded-md border border-[var(--light-bg)] bg-[var(--dark-bg)] text-[var(--text-primary)]" />
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isVisible('projectType') && (
                <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Project Type*</label>
                    <select value={projectType} onChange={e => setProjectType(e.target.value as ProjectType)} className="w-full p-3 rounded-md border border-[var(--light-bg)] bg-[var(--dark-bg)] text-[var(--text-primary)]">
                        <option value="Residential">Residential</option>
                        <option value="Commercial">Commercial</option>
                        <option value="Mixed-Use">Mixed-Use</option>
                    </select>
                </div>
            )}
            {isVisible('projectStatus') && (
                <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Project Status*</label>
                    <select value={projectStatus} onChange={e => setProjectStatus(e.target.value as ProjectStatus)} className="w-full p-3 rounded-md border border-[var(--light-bg)] bg-[var(--dark-bg)] text-[var(--text-primary)]">
                        <option value="Pre-launch">Pre-launch</option>
                        <option value="Under Construction">Under Construction</option>
                        <option value="Ready to Move">Ready to Move</option>
                    </select>
                </div>
            )}
            {isVisible('location') && (
                <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Location*</label>
                    <input type="text" value={location} onChange={e => setLocation(e.target.value)} required className="w-full p-3 rounded-md border border-[var(--light-bg)] bg-[var(--dark-bg)] text-[var(--text-primary)]" />
                </div>
            )}
            {isVisible('totalFloors') && (
                <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Total Floors*</label>
                    <input type="number" value={totalFloors} onChange={e => setTotalFloors(e.target.value)} required min="1" className="w-full p-3 rounded-md border border-[var(--light-bg)] bg-[var(--dark-bg)] text-[var(--text-primary)]" />
                </div>
            )}
          </div>
          {isVisible('wings') && (
            <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Wings (comma separated)</label>
                <input type="text" value={wings} onChange={e => setWings(e.target.value)} placeholder="e.g. A, B, C" className="w-full p-3 rounded-md border border-[var(--light-bg)] bg-[var(--dark-bg)] text-[var(--text-primary)]" />
            </div>
          )}
          {isVisible('description') && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Description*</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} required rows={3} className="w-full p-3 rounded-md border border-[var(--light-bg)] bg-[var(--dark-bg)] text-[var(--text-primary)]" />
            </div>
          )}

          {/* Dynamic Custom Fields */}
          {customConfigs.length > 0 && (
              <div className="pt-4 border-t border-[var(--light-bg)]">
                  <h4 className="text-xs font-bold text-[var(--primary-color)] uppercase tracking-wider mb-4">Additional Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {customConfigs.map(config => (
                          <DynamicFieldRenderer 
                            key={config.id} 
                            config={config} 
                            value={customData[config.fieldName]} 
                            onChange={(val) => setCustomData(prev => ({...prev, [config.fieldName]: val}))} 
                          />
                      ))}
                  </div>
              </div>
          )}

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[var(--light-bg)]">
            <button type="button" onClick={onClose} className="px-5 py-2 rounded-md bg-gray-700 text-[var(--text-primary)] font-medium">Cancel</button>
            <button type="submit" className="px-5 py-2 rounded-md bg-[var(--primary-color)] text-white font-medium hover:bg-[#128c7e]">Add Project</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewProjectModal;

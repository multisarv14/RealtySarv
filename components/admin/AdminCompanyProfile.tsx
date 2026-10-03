
import React from 'react';
import { CompanyProfile, FormFieldConfig } from '../../types';
import DynamicFieldRenderer from '../DynamicFieldRenderer';
import { toast } from '../ui/Toast';

interface AdminCompanyProfileProps {
  profile: CompanyProfile;
  onUpdateProfile: (updatedProfile: CompanyProfile) => void;
  formConfigs: FormFieldConfig[];
}

const AdminCompanyProfile: React.FC<AdminCompanyProfileProps> = ({ profile, onUpdateProfile, formConfigs }) => {
  const [formData, setFormData] = React.useState(profile);
  const [customData, setCustomData] = React.useState<Record<string, any>>(profile.customData || {});

  React.useEffect(() => {
    setFormData(profile);
    setCustomData(profile.customData || {});
  }, [profile]);

  const activeConfigs = React.useMemo(() => (formConfigs || []).filter(c => c.module === 'company' && c.isVisible), [formConfigs]);
  const customConfigs = React.useMemo(() => activeConfigs.filter(c => !c.isSystem), [activeConfigs]);
  
  const isVisible = (fieldName: string) => activeConfigs.some(c => c.fieldName === fieldName);
  const isRequired = (fieldName: string) => activeConfigs.find(c => c.fieldName === fieldName)?.isRequired || false;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCustomChange = (field: string, value: any) => {
    setCustomData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({ ...formData, customData });
    toast.success('Company profile saved.');
  };

  return (
    <div className="p-4 bg-[var(--medium-bg)] rounded-lg shadow-md h-full flex flex-col">
      <h3 className="text-xl font-bold mb-6 text-[var(--text-primary)]">Company Profile</h3>

      <div className="flex-1 overflow-y-auto pr-2">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
          <fieldset className="border border-[var(--light-bg)] p-6 rounded-lg">
            <legend className="px-2 text-lg font-semibold text-[var(--text-primary)]">Basic Information</legend>
            <div className="space-y-4 mt-4">
                {isVisible('name') && (
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Company Name{isRequired('name') ? '*' : ''}</label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required={isRequired('name')} className="w-full p-3 rounded-md border border-[var(--light-bg)] bg-[var(--dark-bg)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-color)]" />
                    </div>
                )}
                {isVisible('address') && (
                    <div>
                        <label htmlFor="address" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Company Address{isRequired('address') ? '*' : ''}</label>
                        <textarea id="address" name="address" value={formData.address} onChange={handleChange} required={isRequired('address')} rows={3} className="w-full p-3 rounded-md border border-[var(--light-bg)] bg-[var(--dark-bg)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-color)] resize-y" />
                    </div>
                )}
                <div className="grid sm:grid-cols-2 gap-4">
                    {isVisible('phone') && (
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Phone Number{isRequired('phone') ? '*' : ''}</label>
                            <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} required={isRequired('phone')} className="w-full p-3 rounded-md border border-[var(--light-bg)] bg-[var(--dark-bg)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-color)]" />
                        </div>
                    )}
                    {isVisible('website') && (
                        <div>
                            <label htmlFor="website" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Website{isRequired('website') ? '*' : ''}</label>
                            <input type="url" id="website" name="website" value={formData.website} onChange={handleChange} required={isRequired('website')} className="w-full p-3 rounded-md border border-[var(--light-bg)] bg-[var(--dark-bg)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-color)]" />
                        </div>
                    )}
                </div>
            </div>
          </fieldset>
          
          {customConfigs.length > 0 && (
              <fieldset className="border border-[var(--light-bg)] p-6 rounded-lg">
                <legend className="px-2 text-lg font-semibold text-[var(--text-primary)]">Additional Information</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    {customConfigs.map(config => (
                        <DynamicFieldRenderer 
                            key={config.id} 
                            config={config} 
                            value={customData[config.fieldName]} 
                            onChange={(val) => handleCustomChange(config.fieldName, val)} 
                        />
                    ))}
                </div>
              </fieldset>
          )}

          <fieldset className="border border-[var(--light-bg)] p-6 rounded-lg">
            <legend className="px-2 text-lg font-semibold text-[var(--text-primary)]">Branding</legend>
             <div className="mt-4">
                 <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Company Logo</label>
                 <div className="mt-1 flex items-center justify-center p-4 border-2 border-dashed border-[var(--light-bg)] rounded-md cursor-pointer hover:border-[var(--primary-color)] transition-colors">
                    <div className="text-center">
                        <i className="fas fa-cloud-upload-alt text-3xl mb-2 text-[var(--primary-color)]"></i>
                        <p className="text-sm">Click to upload new logo (PNG, JPG)</p>
                         <input type="file" className="hidden" />
                    </div>
                 </div>
            </div>
          </fieldset>

          <div className="flex justify-end pt-6 mt-6 border-t border-[var(--light-bg)]">
            <button type="submit" className="px-6 py-2 rounded-md bg-[var(--primary-color)] text-white font-medium hover:bg-[#128c7e] transition-colors">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminCompanyProfile;

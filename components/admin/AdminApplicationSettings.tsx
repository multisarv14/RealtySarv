
import React from 'react';
import { ApplicationSettings } from '../../types';
import { toast } from '../ui/Toast';

interface AdminApplicationSettingsProps {
  settings: ApplicationSettings;
  onUpdateSettings: (settings: ApplicationSettings) => void;
}

const AdminApplicationSettings: React.FC<AdminApplicationSettingsProps> = ({ settings, onUpdateSettings }) => {
  const [formData, setFormData] = React.useState(settings);

  React.useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formData);
    toast.success('Application settings saved.');
  };

  return (
    <div className="p-4 bg-[var(--medium-bg)] rounded-lg shadow-md h-full flex flex-col">
      <h3 className="text-xl font-bold mb-6 text-[var(--text-primary)]">Application Settings</h3>

      <div className="flex-1 overflow-y-auto pr-2">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
          <fieldset className="border border-[var(--light-bg)] p-6 rounded-lg">
            <legend className="px-2 text-lg font-semibold text-[var(--text-primary)]">Localization</legend>
            <div className="space-y-4 mt-4">
                <div>
                    <label htmlFor="dateFormat" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Date Format</label>
                    <select id="dateFormat" name="dateFormat" value={formData.dateFormat} onChange={handleChange} className="w-full p-3 rounded-md border border-[var(--light-bg)] bg-[var(--dark-bg)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-color)]">
                        <option value="DD/MM/YYYY">DD/MM/YYYY (e.g., 25/12/2023)</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY (e.g., 12/25/2023)</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD (e.g., 2023-12-25)</option>
                        <option value="DD-MMM-YYYY">DD-MMM-YYYY (e.g., 25-Dec-2023)</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="timeZone" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Time Zone</label>
                    <select id="timeZone" name="timeZone" value={formData.timeZone} onChange={handleChange} className="w-full p-3 rounded-md border border-[var(--light-bg)] bg-[var(--dark-bg)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-color)]">
                        <option value="UTC">UTC</option>
                        <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                        <option value="America/New_York">America/New_York (EST)</option>
                        <option value="Europe/London">Europe/London (GMT)</option>
                         <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                    </select>
                </div>
                 <div>
                    <label htmlFor="currencySymbol" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Currency Symbol</label>
                    <input type="text" id="currencySymbol" name="currencySymbol" value={formData.currencySymbol} onChange={handleChange} className="w-full p-3 rounded-md border border-[var(--light-bg)] bg-[var(--dark-bg)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-color)]" placeholder="e.g., ₹, $, €" />
                </div>
                <div>
                    <label htmlFor="appUrl" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">App URL</label>
                    <input type="url" id="appUrl" name="appUrl" value={formData.appUrl || ''} onChange={handleChange} className="w-full p-3 rounded-md border border-[var(--light-bg)] bg-[var(--dark-bg)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-color)]" placeholder="e.g., https://crm.yourcompany.com" />
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

export default AdminApplicationSettings;


import React from 'react';
import { toast } from '../ui/Toast';

interface ProviderItem {
    id: string;
    label: string;
    icon: string;
    color: string;
    status: 'Connected' | 'Not Connected' | 'Coming Soon';
    description: string;
}

const STORAGE_PROVIDERS: ProviderItem[] = [
    { id: 'gdrive', label: 'Google Drive', icon: 'fab fa-google-drive', color: 'text-green-500', status: 'Coming Soon', description: 'Store files in Google Workspace.' },
    { id: 'onedrive', label: 'OneDrive', icon: 'fab fa-microsoft', color: 'text-blue-600', status: 'Coming Soon', description: 'Microsoft 365 cloud storage.' },
    { id: 'aws-s3', label: 'AWS S3', icon: 'fab fa-aws', color: 'text-orange-500', status: 'Coming Soon', description: 'Scalable object storage.' },
];

const USE_CASES = [
    { id: 'kyc', label: 'Store KYC Documents', icon: 'fas fa-id-card', description: 'Auto-upload PAN, Aadhaar to secure folders.' },
    { id: 'agreements', label: 'Store Agreements / PDFs', icon: 'fas fa-file-contract', description: 'Archive signed booking forms and sale deeds.' },
    { id: 'receipts', label: 'Sync Payment Receipts', icon: 'fas fa-receipt', description: 'Backup generated payment receipts.' },
    { id: 'auto-folder', label: 'Auto-Folder Creation', icon: 'fas fa-folder-plus', description: 'Create folders per Project/Tower/Unit.' },
    { id: 'public-links', label: 'Public Link Generation', icon: 'fas fa-link', description: 'Generate shareable links for customers.' },
];

const ProviderCard: React.FC<{ item: ProviderItem }> = ({ item }) => (
    <div className="bg-[var(--dark-bg)] p-4 rounded-lg border border-[var(--light-bg)] flex flex-col justify-between hover:border-[var(--primary-color)] transition-colors group">
        <div>
            <div className="flex justify-between items-start mb-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-[var(--medium-bg)] ${item.color} text-2xl shadow-sm border border-[var(--light-bg)]`}>
                    <i className={item.icon}></i>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    item.status === 'Connected' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                    item.status === 'Coming Soon' ? 'bg-gray-500/10 text-gray-500 border-gray-500/20' :
                    'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                }`}>
                    {item.status}
                </span>
            </div>
            <h4 className="font-bold text-[var(--text-primary)] text-base mb-1">{item.label}</h4>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed h-8 overflow-hidden">{item.description}</p>
        </div>
        <button 
            className={`mt-4 w-full py-2 rounded-md text-xs font-bold transition-colors ${
                item.status === 'Coming Soon' 
                ? 'bg-[var(--light-bg)] text-[var(--text-secondary)] cursor-not-allowed opacity-60' 
                : 'bg-[var(--medium-bg)] text-[var(--text-primary)] hover:bg-[var(--primary-color)] hover:text-white border border-[var(--light-bg)] group-hover:border-[var(--primary-color)]'
            }`}
            disabled={item.status === 'Coming Soon'}
            onClick={() => toast.info(`${item.label} is coming soon.`)}
        >
            {item.status === 'Connected' ? 'Configure' : 'Connect'}
        </button>
    </div>
);

const AdminStorageIntegrations: React.FC = () => {
    return (
        <div className="p-4 bg-[var(--medium-bg)] rounded-lg shadow-md h-full overflow-hidden flex flex-col">
            <div className="flex-shrink-0 mb-6">
                <h3 className="text-xl font-bold text-[var(--text-primary)]">Document & File Storage</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">Connect your cloud storage to automatically sync and backup important documents.</p>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                
                {/* Storage Features */}
                <div className="mb-8 p-6 bg-[var(--dark-bg)] rounded-lg border border-[var(--light-bg)]">
                    <h4 className="text-sm font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2 border-b border-[var(--light-bg)] pb-2">
                        <i className="fas fa-server text-[var(--primary-color)]"></i> Storage Automation Settings
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {USE_CASES.map(feature => (
                            <label key={feature.id} className="flex items-start gap-3 p-3 rounded bg-[var(--medium-bg)] border border-[var(--light-bg)] cursor-pointer hover:border-[var(--primary-color)] transition-colors group">
                                <div className="mt-0.5">
                                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-gray-600 text-[var(--primary-color)] focus:ring-[var(--primary-color)] bg-[var(--dark-bg)]" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <i className={`${feature.icon} text-xs text-[var(--text-secondary)] group-hover:text-[var(--primary-color)]`}></i>
                                        <span className="text-sm font-medium text-[var(--text-primary)]">{feature.label}</span>
                                    </div>
                                    <p className="text-[10px] text-[var(--text-secondary)]">{feature.description}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Providers List */}
                <div>
                    <h4 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2 border-b border-[var(--light-bg)] pb-2">
                        <i className="fas fa-hdd text-[var(--primary-color)]"></i> Supported Cloud Providers
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {STORAGE_PROVIDERS.map(item => <ProviderCard key={item.id} item={item} />)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminStorageIntegrations;

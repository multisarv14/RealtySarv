
import React from 'react';
import { toast } from '../ui/Toast';

interface IntegrationItem {
    id: string;
    label: string;
    icon: string;
    color: string;
    description: string;
    status: 'Connected' | 'Not Connected' | 'Coming Soon';
    navTarget?: string;
}

const LEAD_SOURCES: IntegrationItem[] = [
    { id: 'fb-ads', label: 'Facebook & Instagram Lead Ads', icon: 'fab fa-facebook-f', color: 'text-blue-600', description: 'Leads from FB and IG forms.', status: 'Coming Soon' },
    { id: 'google-ads', label: 'Google Ads Forms', icon: 'fab fa-google', color: 'text-red-500', description: 'Capture leads from search ads.', status: 'Coming Soon' },
    { id: 'website', label: 'Website & Landing Pages', icon: 'fas fa-globe', color: 'text-green-500', description: 'Enquiry forms via API or webhook.', status: 'Coming Soon', navTarget: 'custom' },
    { id: 'whatsapp-chat', label: 'WhatsApp Click-to-Chat', icon: 'fab fa-whatsapp', color: 'text-green-500', description: 'Direct chat entry.', status: 'Coming Soon', navTarget: 'whatsapp' },
];

interface AdminLeadIntegrationsProps {
    onNavigate: (subId: string) => void;
}

const IntegrationCard: React.FC<{ item: IntegrationItem; onNavigate: (target: string) => void }> = ({ item, onNavigate }) => (
    <div className="bg-[var(--dark-bg)] p-4 rounded-lg border border-[var(--light-bg)] flex flex-col justify-between hover:border-[var(--primary-color)] transition-colors group">
        <div>
            <div className="flex justify-between items-start mb-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-[var(--medium-bg)] ${item.color} text-xl shadow-sm border border-[var(--light-bg)]`}>
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
            <h4 className="font-bold text-[var(--text-primary)] text-sm mb-1">{item.label}</h4>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed h-8 overflow-hidden">{item.description}</p>
        </div>
        <button 
            className={`mt-4 w-full py-2 rounded-md text-xs font-bold transition-colors ${
                item.status === 'Coming Soon' 
                ? 'bg-[var(--light-bg)] text-[var(--text-secondary)] cursor-not-allowed opacity-60' 
                : 'bg-[var(--medium-bg)] text-[var(--text-primary)] hover:bg-[var(--primary-color)] hover:text-white border border-[var(--light-bg)] group-hover:border-[var(--primary-color)]'
            }`}
            disabled={item.status === 'Coming Soon'}
            onClick={() => item.navTarget ? onNavigate(item.navTarget) : toast.info(`${item.label} is coming soon.`)}
        >
            {item.status === 'Connected' ? 'Manage' : 'Connect'}
        </button>
    </div>
);

const AdminLeadIntegrations: React.FC<AdminLeadIntegrationsProps> = ({ onNavigate }) => {
    return (
        <div className="p-4 bg-[var(--medium-bg)] rounded-lg shadow-md h-full overflow-hidden flex flex-col">
            <div className="flex-shrink-0 mb-6">
                <h3 className="text-xl font-bold text-[var(--text-primary)]">Lead capture</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">Bring enquiries from ads and your website straight into LeadSarv. Assigning them to the team is set under Operations, Distribution rules.</p>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="mb-8">
                    <h4 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2 border-b border-[var(--light-bg)] pb-2">
                        <i className="fas fa-inbox text-[var(--primary-color)]"></i> Lead Source Integrations
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {LEAD_SOURCES.map(item => <IntegrationCard key={item.id} item={item} onNavigate={onNavigate} />)}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AdminLeadIntegrations;

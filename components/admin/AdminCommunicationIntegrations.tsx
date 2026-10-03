
import React from 'react';
import { toast } from '../ui/Toast';

interface ProviderItem {
    id: string;
    label: string;
    icon: string;
    color: string;
    category: 'Telephony' | 'WhatsApp' | 'SMS';
    status: 'Connected' | 'Not Connected' | 'Coming Soon';
    description: string;
}

const TELEPHONY_PROVIDERS: ProviderItem[] = [
    { id: 'exotel', label: 'Exotel', icon: 'fas fa-phone-volume', color: 'text-indigo-600', category: 'Telephony', status: 'Coming Soon', description: 'Cloud telephony & IVR solutions.' },
    { id: 'knowlarity', label: 'Knowlarity', icon: 'fas fa-headset', color: 'text-blue-500', category: 'Telephony', status: 'Coming Soon', description: 'Virtual numbers and IVR.' },
    { id: 'ozonetel', label: 'Ozonetel', icon: 'fas fa-cloud', color: 'text-cyan-500', category: 'Telephony', status: 'Coming Soon', description: 'Cloud communication platform.' },
    { id: 'myoperator', label: 'MyOperator', icon: 'fas fa-mobile-alt', color: 'text-green-500', category: 'Telephony', status: 'Coming Soon', description: 'Call management system.' },
];

const WHATSAPP_PROVIDERS: ProviderItem[] = [
    { id: 'meta-cloud', label: 'Meta Cloud API', icon: 'fab fa-meta', color: 'text-blue-600', category: 'WhatsApp', status: 'Coming Soon', description: 'Direct API from Meta.' },
    { id: 'gupshup', label: 'Gupshup', icon: 'fas fa-comments', color: 'text-orange-500', category: 'WhatsApp', status: 'Coming Soon', description: 'Conversational messaging.' },
    { id: 'interakt', label: 'Interakt', icon: 'fas fa-check-double', color: 'text-green-600', category: 'WhatsApp', status: 'Coming Soon', description: 'Official WhatsApp Business solution.' },
];

const SMS_GATEWAYS: ProviderItem[] = [
    { id: 'textlocal', label: 'Textlocal', icon: 'fas fa-comment-alt', color: 'text-gray-600', category: 'SMS', status: 'Coming Soon', description: 'Bulk SMS platform.' },
    { id: 'msg91', label: 'MSG91', icon: 'fas fa-sms', color: 'text-blue-400', category: 'SMS', status: 'Coming Soon', description: 'Enterprise SMS solution.' },
];

const ProviderCard: React.FC<{ item: ProviderItem }> = ({ item }) => (
    <div className="bg-[var(--dark-bg)] p-4 rounded-lg border border-[var(--light-bg)] flex flex-col justify-between hover:border-[var(--primary-color)] transition-colors group">
        <div>
            <div className="flex justify-between items-start mb-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-[var(--medium-bg)] ${item.color} text-lg shadow-sm border border-[var(--light-bg)]`}>
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
            <p className="text-xs text-[var(--text-secondary)] h-8 overflow-hidden leading-relaxed">{item.description}</p>
        </div>
        <button 
            className={`mt-3 w-full py-2 rounded-md text-xs font-bold transition-colors ${
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

const FeatureToggle: React.FC<{ label: string; description: string }> = ({ label, description }) => (
    <div className="flex items-center justify-between p-3 rounded bg-[var(--dark-bg)] border border-[var(--light-bg)] hover:border-[var(--primary-color)] transition-colors">
        <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">{label}</p>
            <p className="text-xs text-[var(--text-secondary)]">{description}</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" />
            <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--primary-color)]"></div>
        </label>
    </div>
);

const AdminCommunicationIntegrations: React.FC = () => {
    return (
        <div className="p-4 bg-[var(--medium-bg)] rounded-lg shadow-md h-full overflow-hidden flex flex-col">
            <div className="flex-shrink-0 mb-6">
                <h3 className="text-xl font-bold text-[var(--text-primary)]">Communication & Telephony</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">Manage your call centers, messaging gateways, and automation settings.</p>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-8">
                
                {/* Global Settings */}
                <div className="p-4 bg-[var(--medium-bg)]/50 border border-[var(--light-bg)] rounded-lg">
                    <h4 className="text-sm font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                        <i className="fas fa-sliders-h text-[var(--primary-color)]"></i> Communication Features
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <FeatureToggle label="Click-to-Call" description="Enable one-click calling from CRM." />
                        <FeatureToggle label="Call Recordings" description="Auto-save call logs to lead timeline." />
                        <FeatureToggle label="Incoming Call Pop-up" description="Show lead details on incoming calls." />
                        <FeatureToggle label="Missed Call Auto-Lead" description="Create leads from missed calls." />
                        <FeatureToggle label="IVR Routing" description="Route calls based on project/team." />
                        <FeatureToggle label="Agent Logs" description="Track agent call performance metrics." />
                    </div>
                </div>

                {/* Telephony */}
                <div>
                    <h4 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2 border-b border-[var(--light-bg)] pb-2">
                        <i className="fas fa-phone-volume text-indigo-500"></i> Telephony & IVR
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {TELEPHONY_PROVIDERS.map(item => <ProviderCard key={item.id} item={item} />)}
                    </div>
                </div>

                {/* WhatsApp */}
                <div>
                    <h4 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2 border-b border-[var(--light-bg)] pb-2">
                        <i className="fab fa-whatsapp text-green-500"></i> WhatsApp Integrations
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {WHATSAPP_PROVIDERS.map(item => <ProviderCard key={item.id} item={item} />)}
                    </div>
                </div>

                {/* SMS */}
                <div>
                    <h4 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2 border-b border-[var(--light-bg)] pb-2">
                        <i className="fas fa-sms text-blue-400"></i> SMS Gateways
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {SMS_GATEWAYS.map(item => <ProviderCard key={item.id} item={item} />)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminCommunicationIntegrations;

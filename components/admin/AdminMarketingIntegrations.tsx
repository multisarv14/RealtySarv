
import React from 'react';
import { toast } from '../ui/Toast';

interface ProviderItem {
    id: string;
    label: string;
    icon: string;
    color: string;
    category: 'Marketing' | 'Analytics';
    status: 'Connected' | 'Not Connected' | 'Coming Soon';
    description: string;
}

const MARKETING_TOOLS: ProviderItem[] = [
    { id: 'mailchimp', label: 'Mailchimp', icon: 'fab fa-mailchimp', color: 'text-yellow-500', category: 'Marketing', status: 'Coming Soon', description: 'Email marketing & automation.' },
    { id: 'sendgrid', label: 'SendGrid', icon: 'fas fa-paper-plane', color: 'text-blue-500', category: 'Marketing', status: 'Coming Soon', description: 'Transactional & marketing emails.' },
];

const ANALYTICS_TOOLS: ProviderItem[] = [
    { id: 'ga4', label: 'Google Analytics 4', icon: 'fab fa-google', color: 'text-orange-400', category: 'Analytics', status: 'Coming Soon', description: 'Web analytics service.' },
    { id: 'gtm', label: 'Google Tag Manager', icon: 'fas fa-tags', color: 'text-blue-400', category: 'Analytics', status: 'Coming Soon', description: 'Tag management system.' },
    { id: 'fb-pixel', label: 'Facebook Pixel', icon: 'fab fa-facebook-f', color: 'text-blue-600', category: 'Analytics', status: 'Coming Soon', description: 'Conversion tracking.' },
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

const AdminMarketingIntegrations: React.FC = () => {
    return (
        <div className="p-4 bg-[var(--medium-bg)] rounded-lg shadow-md h-full overflow-hidden flex flex-col">
            <div className="flex-shrink-0 mb-6">
                <h3 className="text-xl font-bold text-[var(--text-primary)]">Marketing & Automation</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">Connect your marketing stack for advanced analytics, remarketing, and campaign automation.</p>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-8">
                
                {/* Ad Automation */}
                <div className="p-4 bg-[var(--medium-bg)]/50 border border-[var(--light-bg)] rounded-lg">
                    <h4 className="text-sm font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                        <i className="fas fa-magic text-[var(--primary-color)]"></i> Ad Automation
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FeatureToggle label="Auto Audience Sync" description="Sync CRM segments to ad platforms for remarketing." />
                        <FeatureToggle label="Campaign Lead Tracking" description="Auto-tag leads with UTM source and campaign data." />
                        <FeatureToggle label="Offline Conversion Upload" description="Push 'Converted' status back to Google/FB Ads." />
                        <FeatureToggle label="Lookalike Seed Lists" description="Auto-generate seed lists from high-value customers." />
                    </div>
                </div>

                {/* Marketing Tools */}
                <div>
                    <h4 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2 border-b border-[var(--light-bg)] pb-2">
                        <i className="fas fa-bullhorn text-yellow-500"></i> Marketing Tools
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {MARKETING_TOOLS.map(item => <ProviderCard key={item.id} item={item} />)}
                    </div>
                </div>

                {/* Analytics Tools */}
                <div>
                    <h4 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2 border-b border-[var(--light-bg)] pb-2">
                        <i className="fas fa-chart-pie text-blue-400"></i> Analytics Tools
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {ANALYTICS_TOOLS.map(item => <ProviderCard key={item.id} item={item} />)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminMarketingIntegrations;

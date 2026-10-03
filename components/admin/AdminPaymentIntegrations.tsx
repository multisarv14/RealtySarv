
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

const PAYMENT_PROVIDERS: ProviderItem[] = [
    { id: 'razorpay', label: 'Razorpay', icon: 'fas fa-bolt', color: 'text-blue-500', status: 'Coming Soon', description: 'Accept payments via UPI, Cards, Netbanking.' },
    { id: 'payu', label: 'PayU', icon: 'fas fa-wallet', color: 'text-green-500', status: 'Coming Soon', description: 'Leading payment gateway for India.' },
    { id: 'ccavenue', label: 'CCAvenue', icon: 'fas fa-money-check-alt', color: 'text-orange-500', status: 'Coming Soon', description: 'Multi-currency payment processing.' },
    { id: 'cashfree', label: 'Cashfree', icon: 'fas fa-money-bill-wave', color: 'text-pink-500', status: 'Coming Soon', description: 'Banking and payment solutions.' },
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

const AdminPaymentIntegrations: React.FC = () => {
    return (
        <div className="p-4 bg-[var(--medium-bg)] rounded-lg shadow-md h-full overflow-hidden flex flex-col">
            <div className="flex-shrink-0 mb-6">
                <h3 className="text-xl font-bold text-[var(--text-primary)]">Payment Gateway Integrations</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">Accept online payments for tokens and bookings directly through the CRM.</p>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-8">
                
                {/* Global Settings */}
                <div className="p-6 bg-[var(--medium-bg)]/50 border border-[var(--light-bg)] rounded-lg">
                    <h4 className="text-sm font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                        <i className="fas fa-sliders-h text-[var(--primary-color)]"></i> Payment Automation Features
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <FeatureToggle label="Auto Reconciliation" description="Match incoming payments with booking records automatically." />
                        <FeatureToggle label="Payment Confirmation Alerts" description="Send SMS/Email/WhatsApp on successful payment." />
                        <FeatureToggle label="Booking Workflow Automation" description="Auto-confirm booking status upon full token receipt." />
                        <FeatureToggle label="Partial Payment Support" description="Allow customers to pay token amount in parts." />
                        <FeatureToggle label="Failed Payment Follow-up" description="Auto-create task for sales team on payment failure." />
                        <FeatureToggle label="Generate Receipt Automatically" description="Create and email PDF receipt upon success." />
                    </div>
                </div>

                {/* Providers List */}
                <div>
                    <h4 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2 border-b border-[var(--light-bg)] pb-2">
                        <i className="fas fa-credit-card text-[var(--primary-color)]"></i> Supported Gateways
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {PAYMENT_PROVIDERS.map(item => <ProviderCard key={item.id} item={item} />)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPaymentIntegrations;


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

const ACCOUNTING_PROVIDERS: ProviderItem[] = [
    { id: 'tally', label: 'Tally ERP / Prime', icon: 'fas fa-chart-bar', color: 'text-green-600', status: 'Coming Soon', description: 'Market leading accounting software.' },
    { id: 'zoho-books', label: 'Zoho Books', icon: 'fas fa-book', color: 'text-blue-500', status: 'Coming Soon', description: 'Online accounting software.' },
    { id: 'quickbooks', label: 'QuickBooks', icon: 'fas fa-file-invoice-dollar', color: 'text-green-500', status: 'Coming Soon', description: 'Small business accounting.' },
];

const SYNC_FEATURES = [
    { id: 'booking-entries', label: 'Booking Entries', icon: 'fas fa-file-contract', description: 'Sync new bookings as sales orders.' },
    { id: 'tax-invoices', label: 'Tax Invoices', icon: 'fas fa-file-invoice', description: 'Generate GST invoices in ERP.' },
    { id: 'receipts', label: 'Receipts', icon: 'fas fa-receipt', description: 'Sync payment receipts to ledgers.' },
    { id: 'refunds', label: 'Refunds', icon: 'fas fa-undo-alt', description: 'Process cancellations and refunds.' },
    { id: 'ledger-creation', label: 'Ledger Creation', icon: 'fas fa-book-open', description: 'Auto-create customer ledgers.' },
    { id: 'demand-letters', label: 'Demand Letters', icon: 'fas fa-envelope-open-text', description: 'Track demand generation.' },
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

const AdminAccountingIntegrations: React.FC = () => {
    return (
        <div className="p-4 bg-[var(--medium-bg)] rounded-lg shadow-md h-full overflow-hidden flex flex-col">
            <div className="flex-shrink-0 mb-6">
                <h3 className="text-xl font-bold text-[var(--text-primary)]">Accounting & ERP Integrations</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">Seamlessly sync financial data between LeadSarv and your accounting software.</p>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                
                {/* Data Sync Configuration */}
                <div className="mb-8 p-6 bg-[var(--dark-bg)] rounded-lg border border-[var(--light-bg)]">
                    <h4 className="text-sm font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2 border-b border-[var(--light-bg)] pb-2">
                        <i className="fas fa-sync-alt text-[var(--primary-color)]"></i> Data Synchronization Settings
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {SYNC_FEATURES.map(feature => (
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
                        <i className="fas fa-plug text-[var(--primary-color)]"></i> Available Providers
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {ACCOUNTING_PROVIDERS.map(item => <ProviderCard key={item.id} item={item} />)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAccountingIntegrations;

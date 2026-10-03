
import React from 'react';
import { toast } from '../ui/Toast';
import { SHOW_DELETE } from '../../features';

interface IntegrationMethod {
    id: string;
    label: string;
    icon: string;
    color: string;
    description: string;
    status: 'Active' | 'Inactive';
}

const CUSTOM_METHODS: IntegrationMethod[] = [
    { id: 'rest-api', label: 'REST API', icon: 'fas fa-globe', color: 'text-blue-500', description: 'Full access programmatic API.', status: 'Active' },
    { id: 'webhooks', label: 'Webhooks', icon: 'fas fa-anchor', color: 'text-purple-500', description: 'Real-time event notifications.', status: 'Inactive' },
];

const MethodCard: React.FC<{ item: IntegrationMethod }> = ({ item }) => (
    <div className="bg-[var(--dark-bg)] p-4 rounded-lg border border-[var(--light-bg)] flex flex-col justify-between hover:border-[var(--primary-color)] transition-colors group">
        <div>
            <div className="flex justify-between items-start mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-[var(--medium-bg)] ${item.color} text-xl shadow-sm border border-[var(--light-bg)]`}>
                    <i className={item.icon}></i>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${item.status === 'Active' ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                    <span className="text-[10px] text-[var(--text-secondary)] uppercase font-bold tracking-wider">{item.status}</span>
                </div>
            </div>
            <h4 className="font-bold text-[var(--text-primary)] text-sm mb-1">{item.label}</h4>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed h-8 overflow-hidden">{item.description}</p>
        </div>
        <div className="mt-4 pt-3 border-t border-[var(--light-bg)] flex gap-2">
            <button 
                className="flex-1 py-1.5 rounded text-xs font-bold bg-[var(--medium-bg)] text-[var(--text-secondary)] hover:bg-[var(--light-bg)] hover:text-[var(--text-primary)] border border-[var(--light-bg)] transition-colors"
                onClick={() => toast.info(`${item.label} docs are coming soon.`)}
            >
                Docs
            </button>
            <button 
                className="flex-1 py-1.5 rounded text-xs font-bold bg-[var(--primary-color)]/10 text-[var(--primary-color)] hover:bg-[var(--primary-color)] hover:text-white border border-[var(--primary-color)]/20 transition-colors"
                onClick={() => toast.info(`${item.label} is coming soon.`)}
            >
                Configure
            </button>
        </div>
    </div>
);

const ApiKeyItem: React.FC<{ name: string; prefix: string; created: string }> = ({ name, prefix, created }) => (
    <div className="flex items-center justify-between p-3 bg-[var(--medium-bg)] rounded border border-[var(--light-bg)]">
        <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">{name}</p>
            <p className="text-xs text-[var(--text-secondary)] font-mono mt-0.5">Key: {prefix}****************</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
            <span>Created: {created}</span>
            {SHOW_DELETE && <button className="text-red-400 hover:text-red-300"><i className="fas fa-trash-alt"></i></button>}
        </div>
    </div>
);

const AdminCustomIntegrations: React.FC = () => {
    return (
        <div className="p-4 bg-[var(--medium-bg)] rounded-lg shadow-md h-full overflow-hidden flex flex-col">
            <div className="flex-shrink-0 mb-6">
                <h3 className="text-xl font-bold text-[var(--text-primary)]">Custom Integrations</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">Developer tools for custom API connections, webhooks, and legacy sync methods.</p>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
                
                {/* Available Methods */}
                <div>
                    <h4 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2 border-b border-[var(--light-bg)] pb-2">
                        <i className="fas fa-tools text-[var(--primary-color)]"></i> Integration Methods
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                        {CUSTOM_METHODS.map(item => <MethodCard key={item.id} item={item} />)}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* API Credentials */}
                    <div className="bg-[var(--dark-bg)] p-6 rounded-lg border border-[var(--light-bg)]">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                                <i className="fas fa-key text-yellow-500"></i> API Credentials
                            </h4>
                            <button className="text-xs bg-[var(--primary-color)] text-white px-3 py-1.5 rounded hover:bg-[#128c7e]">
                                + New Key
                            </button>
                        </div>
                        <div className="space-y-2">
                            <ApiKeyItem name="Website Backend" prefix="ls_live_wb_" created="Oct 12, 2023" />
                            <ApiKeyItem name="Mobile App" prefix="ls_live_mb_" created="Jan 05, 2024" />
                            <ApiKeyItem name="Zapier Connector" prefix="ls_live_zp_" created="Mar 22, 2024" />
                        </div>
                    </div>

                    {/* Webhook Logs Preview */}
                    <div className="bg-[var(--dark-bg)] p-6 rounded-lg border border-[var(--light-bg)]">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                                <i className="fas fa-history text-blue-400"></i> Recent Webhook Events
                            </h4>
                            <button className="text-xs text-[var(--primary-color)] hover:underline">View All Logs</button>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center p-2 rounded bg-[var(--medium-bg)] border border-[var(--light-bg)] text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="text-green-400 font-bold">200 OK</span>
                                    <span className="text-[var(--text-primary)]">lead.created</span>
                                </div>
                                <span className="text-[var(--text-secondary)]">2 mins ago</span>
                            </div>
                            <div className="flex justify-between items-center p-2 rounded bg-[var(--medium-bg)] border border-[var(--light-bg)] text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="text-green-400 font-bold">200 OK</span>
                                    <span className="text-[var(--text-primary)]">booking.updated</span>
                                </div>
                                <span className="text-[var(--text-secondary)]">15 mins ago</span>
                            </div>
                            <div className="flex justify-between items-center p-2 rounded bg-[var(--medium-bg)] border border-[var(--light-bg)] text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="text-red-400 font-bold">500 ERR</span>
                                    <span className="text-[var(--text-primary)]">lead.assigned</span>
                                </div>
                                <span className="text-[var(--text-secondary)]">1 hr ago</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminCustomIntegrations;

import React from 'react';
import { toast } from '../ui/Toast';

const StatCard: React.FC<{ icon: string; label: string; value: string; }> = ({ icon, label, value }) => (
    <div className="bg-[var(--dark-bg)] p-4 rounded-lg flex items-center gap-4 border border-[var(--light-bg)]">
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--light-bg)] text-[var(--primary-color)] text-lg">
            <i className={icon}></i>
        </div>
        <div>
            <p className="text-sm text-[var(--text-secondary)]">{label}</p>
            <p className="text-lg font-bold text-[var(--text-primary)]">{value}</p>
        </div>
    </div>
);

const AdminBilling: React.FC = () => {
  return (
    <div className="p-4 bg-[var(--medium-bg)] rounded-lg shadow-md h-full flex flex-col">
      <h3 className="text-xl font-bold mb-6 text-[var(--text-primary)]">Billing & Subscription</h3>

      <div className="flex-1 overflow-y-auto pr-2">
        <div className="max-w-4xl mx-auto">
            {/* Current Plan Section */}
            <div className="bg-[var(--dark-bg)] p-6 rounded-lg border border-[var(--light-bg)] mb-8">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                        <p className="text-sm text-[var(--text-secondary)]">Current Plan</p>
                        <h4 className="text-2xl font-bold text-[var(--primary-color)]">Professional</h4>
                        <p className="text-sm text-[var(--text-secondary)] mt-1">
                            Your plan renews on <span className="font-semibold text-[var(--text-primary)]">August 15, 2024</span>.
                        </p>
                    </div>
                    <div className="flex gap-3">
                         <button onClick={() => toast.info("Billing portal is coming soon. Write to info@multisarv.com for plan changes.")} className="px-4 py-2 rounded-md bg-gray-700 text-[var(--text-primary)] font-medium hover:bg-gray-600 transition-colors">
                            Manage Subscription
                        </button>
                        <button onClick={() => toast.info("Write to info@multisarv.com to change your plan.")} className="px-4 py-2 rounded-md bg-[var(--primary-color)] text-white font-medium hover:bg-[#128c7e] transition-colors">
                            Change Plan
                        </button>
                    </div>
                </div>
            </div>

            {/* Usage Section */}
            <div>
                 <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Current Usage</h4>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StatCard icon="fas fa-users" label="Active Users" value="8 / 15" />
                    <StatCard icon="fas fa-stream" label="Leads this month" value="1,204" />
                    <StatCard icon="fas fa-building" label="Managed Projects" value="Unlimited" />
                    <StatCard icon="fab fa-whatsapp" label="WhatsApp Messages" value="3,450 / 10,000" />
                    <StatCard icon="fas fa-envelope" label="Emails Sent" value="8,123 / 25,000" />
                    <StatCard icon="fas fa-database" label="Storage Used" value="12.5 GB / 50 GB" />
                 </div>
            </div>

             {/* Billing History Section */}
             <div className="mt-10">
                <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Billing History</h4>
                <div className="bg-[var(--dark-bg)] rounded-lg border border-[var(--light-bg)] overflow-hidden">
                    <table className="min-w-full">
                        <thead>
                             <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Description</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Amount</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider"></th>
                              </tr>
                        </thead>
                         <tbody className="divide-y divide-[var(--light-bg)]">
                            <tr className="hover:bg-[var(--medium-bg)]">
                                <td className="px-4 py-3 text-sm text-[var(--text-primary)]">July 15, 2024</td>
                                <td className="px-4 py-3 text-sm text-[var(--text-primary)]">Professional Plan - Monthly</td>
                                <td className="px-4 py-3 text-sm text-[var(--text-primary)]">$99.00</td>
                                <td className="px-4 py-3 text-sm text-right"><button className="font-medium text-[var(--primary-color)] hover:underline">Download Invoice</button></td>
                            </tr>
                            <tr className="hover:bg-[var(--medium-bg)]">
                                <td className="px-4 py-3 text-sm text-[var(--text-primary)]">June 15, 2024</td>
                                <td className="px-4 py-3 text-sm text-[var(--text-primary)]">Professional Plan - Monthly</td>
                                <td className="px-4 py-3 text-sm text-[var(--text-primary)]">$99.00</td>
                                <td className="px-4 py-3 text-sm text-right"><button className="font-medium text-[var(--primary-color)] hover:underline">Download Invoice</button></td>
                            </tr>
                         </tbody>
                    </table>
                </div>
             </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBilling;
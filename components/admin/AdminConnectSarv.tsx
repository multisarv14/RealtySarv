
import React from 'react';
import { toast } from '../ui/Toast';

interface AdminConnectSarvProps {
  activeItem: string;
}

// Interface for mock email account data
interface ConnectedEmailAccount {
  id: string;
  provider: 'gmail' | 'outlook';
  email: string;
  status: 'Connected' | 'Syncing' | 'Error';
}

// No email provider is wired up yet, so there are no connected accounts.
const MOCK_ACCOUNTS: ConnectedEmailAccount[] = [];


const AdminConnectSarv: React.FC<AdminConnectSarvProps> = ({ activeItem }) => {

  // State to manage mock accounts
  const [accounts, setAccounts] = React.useState(MOCK_ACCOUNTS);

  // Helper to get provider icon and color
  const getProviderDetails = (provider: 'gmail' | 'outlook') => {
    switch (provider) {
      case 'gmail':
        return { icon: 'fab fa-google', color: 'text-red-500' };
      case 'outlook':
        return { icon: 'fab fa-microsoft', color: 'text-blue-500' };
      default:
        return { icon: 'fas fa-envelope', color: 'text-gray-400' };
    }
  };

  // Helper to get status color
  const getStatusColor = (status: 'Connected' | 'Syncing' | 'Error') => {
      switch(status) {
          case 'Connected': return 'bg-green-500';
          case 'Syncing': return 'bg-blue-500 animate-pulse';
          case 'Error': return 'bg-red-500';
      }
  }


  const renderContent = () => {
    switch (activeItem) {
      case 'cloud-telephony':
        return (
          <div>
            <h4 className="text-lg font-bold text-[var(--text-primary)] mb-2">Cloud Telephony Integration</h4>
            <p className="text-sm text-[var(--text-secondary)] mb-6">Connect with your favorite cloud telephony provider to manage calls directly within LeadSarv.</p>
            <div className="flex justify-end mb-6">
                 <button 
                    onClick={() => toast.info('Cloud telephony is coming soon.')}
                    className="px-4 py-2 rounded-md bg-[var(--primary-color)] text-white font-medium hover:bg-[#128c7e] transition-colors flex items-center gap-2"
                 >
                    <i className="fas fa-phone-alt"></i> Connect Provider
                </button>
            </div>
            <div className="text-center p-8 border-2 border-dashed border-[var(--light-bg)] rounded-lg text-[var(--text-secondary)]">
                <i className="fas fa-headset text-4xl mb-3 opacity-50"></i>
                <p>No provider connected. Click above to set up.</p>
            </div>
          </div>
        );
      case 'whatsapp':
        return (
          <div>
            <h4 className="text-lg font-bold text-[var(--text-primary)] mb-2">WhatsApp Integration</h4>
            <p className="text-sm text-[var(--text-secondary)] mb-6">Integrate with WhatsApp Business API to send and receive messages from leads.</p>
            <div className="flex justify-end mb-6">
                 <button 
                    onClick={() => toast.info('WhatsApp Business is coming soon.')}
                    className="px-4 py-2 rounded-md bg-[#25D366] text-white font-medium hover:bg-[#20bd5a] transition-colors flex items-center gap-2"
                 >
                    <i className="fab fa-whatsapp"></i> Connect Business Account
                </button>
            </div>
            <div className="text-center p-8 border-2 border-dashed border-[var(--light-bg)] rounded-lg text-[var(--text-secondary)]">
                <i className="fab fa-whatsapp text-4xl mb-3 opacity-50"></i>
                <p>No WhatsApp Business account connected.</p>
            </div>
          </div>
        );
      case 'email':
        return (
          <div>
            <h4 className="text-lg font-bold text-[var(--text-primary)] mb-2">Email Integration</h4>
            <p className="text-sm text-[var(--text-secondary)] mb-6">Connect your email accounts (e.g., Gmail, Outlook) to sync conversations with leads and manage communication directly from LeadSarv.</p>
            
            <div className="flex justify-end mb-6">
                 <button 
                    onClick={() => toast.info('Email sync is coming soon.')}
                    className="px-4 py-2 rounded-md bg-[var(--primary-color)] text-white font-medium hover:bg-[#128c7e] transition-colors flex items-center gap-2"
                 >
                    <i className="fas fa-plus"></i> Connect New Account
                </button>
            </div>

            <div className="space-y-4">
                <h5 className="text-md font-semibold text-[var(--text-primary)] border-b border-[var(--light-bg)] pb-2">Connected Accounts</h5>
                {accounts.length === 0 ? (
                     <p className="text-center text-[var(--text-secondary)] italic py-4">No email accounts connected yet.</p>
                ) : (
                    accounts.map(account => {
                        const { icon, color } = getProviderDetails(account.provider);
                        return (
                            <div key={account.id} className="bg-[var(--dark-bg)] p-4 rounded-lg border border-[var(--light-bg)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <i className={`${icon} ${color} text-3xl`}></i>
                                    <div>
                                        <p className="font-semibold text-[var(--text-primary)]">{account.email}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className={`w-2 h-2 rounded-full ${getStatusColor(account.status)}`}></div>
                                            <p className="text-xs text-[var(--text-secondary)]">{account.status}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 self-end sm:self-center">
                                    <button 
                                        onClick={() => toast.info('Email sync is coming soon.')}
                                        className="text-sm px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                                    >
                                        <i className="fas fa-sync-alt mr-1"></i> Refresh
                                    </button>
                                    <button 
                                        onClick={() => toast.info('Email sync is coming soon.')}
                                        className="text-sm px-3 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white transition-colors"
                                    >
                                        <i className="fas fa-unlink mr-1"></i> Disconnect
                                    </button>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4 bg-[var(--medium-bg)] rounded-lg shadow-md h-full">
      <div className="p-6 bg-[var(--dark-bg)] rounded-lg border border-[var(--light-bg)]">
        {renderContent()}
        {activeItem !== 'email' && activeItem !== 'whatsapp' && activeItem !== 'cloud-telephony' && (
            <div className="mt-8 pt-6 border-t border-[var(--light-bg)] text-center text-[var(--text-secondary)]">
                <p>Feature coming soon. This is a placeholder for the integration settings.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default AdminConnectSarv;

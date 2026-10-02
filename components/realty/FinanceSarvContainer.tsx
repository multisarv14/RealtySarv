
import React from 'react';
import { User, Project, LedgerAccount, Voucher, GstEntry, SystemType } from '../../types';
import { db } from '../../db';
import { useLiveQuery } from '../../liveQuery';
import { v4 as uuidv4 } from 'uuid';

interface FinanceSarvContainerProps {
  currentUser: User;
  users: User[];
  projects: Project[];
  onSwitchSystem: (system: SystemType) => void;
}

type FinanceTab = 'dashboard' | 'general-ledger' | 'payable' | 'receivable' | 'reconciliation' | 'gst' | 'tds' | 'reports';

const FinanceSarvContainer: React.FC<FinanceSarvContainerProps> = ({ currentUser, users, projects, onSwitchSystem }) => {
  const [activeTab, setActiveTab] = React.useState<FinanceTab>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = React.useState(projects[0]?.id || '');
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  const accounts = useLiveQuery(() => db.ledgerAccounts.toArray(), []);
  const vouchers = useLiveQuery(() => db.vouchers.where({ projectId: selectedProjectId }).toArray(), [selectedProjectId]);
  const gstEntries = useLiveQuery(() => db.gstEntries.toArray(), []);

  if (!accounts || !vouchers) {
      return <div className="p-8 text-center text-indigo-400 font-bold animate-pulse">Opening Finance Vault...</div>;
  }

  const renderContent = () => {
    switch(activeTab) {
        case 'dashboard': return <FinanceDashboard accounts={accounts} vouchers={vouchers} />;
        case 'general-ledger': return <GeneralLedger accounts={accounts} vouchers={vouchers} />;
        case 'gst': return <GstCompliance entries={gstEntries || []} />;
        case 'reports': return <FinancialReports accounts={accounts} />;
        default: return (
            <div className="p-20 text-center text-gray-500 flex flex-col items-center">
                <i className="fas fa-microchip text-4xl mb-4 opacity-20"></i>
                <p className="font-bold uppercase tracking-widest text-xs">Module: {activeTab.replace('-', ' ')}</p>
                <p className="text-sm mt-2">Legal & Statutory compliance data is being synchronized from site logs.</p>
            </div>
        );
    }
  };

  return (
    <div className="flex h-full w-full bg-[#f1f3f4] overflow-hidden">
      {/* Top Header */}
      <div className="fixed top-0 left-0 right-0 h-[48px] bg-[#4f46e5] flex items-center justify-between px-4 z-[60] shadow-md">
          <div className="flex items-center gap-6">
              <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="text-white hover:bg-white/10 p-2 rounded-full transition-colors"><i className="fas fa-bars"></i></button>
              <div className="flex items-center gap-2">
                  <span className="text-white text-lg font-medium tracking-tight whitespace-nowrap">FinanceSarv</span>
                  <div className="h-4 w-px bg-white/20 mx-2"></div>
                  <select 
                    value={selectedProjectId} 
                    onChange={e => setSelectedProjectId(e.target.value)} 
                    className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-1 rounded transition-colors focus:outline-none cursor-pointer appearance-none border-none"
                  >
                      {projects.map(p => <option key={p.id} value={p.id} className="text-black">{p.name}</option>)}
                  </select>
              </div>
          </div>
          <div className="flex items-center gap-4">
              <button onClick={() => onSwitchSystem('ProjectSarv')} className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold uppercase px-3 py-1.5 rounded transition-all">Project ERP</button>
              <div className="w-8 h-8 rounded-full bg-indigo-800 flex items-center justify-center text-white text-xs font-bold border border-white/20">{currentUser.name.charAt(0)}</div>
          </div>
      </div>

      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-0' : 'w-64'} mt-[48px] border-r border-[#dadce0] bg-white flex flex-col transition-all duration-300 z-50 overflow-hidden`}>
          <div className="p-4 border-b border-[#dadce0] font-bold text-[10px] text-gray-500 uppercase tracking-wider">Accounting System</div>
          <nav className="flex-1 py-2 overflow-y-auto custom-scrollbar">
              <MenuBtn active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon="fas fa-chart-pie" label="Finance Overview" />
              <MenuBtn active={activeTab === 'general-ledger'} onClick={() => setActiveTab('general-ledger')} icon="fas fa-book" label="General Ledger" />
              <MenuBtn active={activeTab === 'receivable'} onClick={() => setActiveTab('receivable')} icon="fas fa-hand-holding-dollar" label="Accounts Receivable" />
              <MenuBtn active={activeTab === 'payable'} onClick={() => setActiveTab('payable')} icon="fas fa-file-invoice" label="Accounts Payable" />
              <MenuBtn active={activeTab === 'reconciliation'} onClick={() => setActiveTab('reconciliation')} icon="fas fa-building-columns" label="Bank Reconciliation" />
              
              <div className="mt-4 px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Statutory Filing</div>
              <MenuBtn active={activeTab === 'gst'} onClick={() => setActiveTab('gst')} icon="fas fa-receipt" label="GST Compliance" />
              <MenuBtn active={activeTab === 'tds'} onClick={() => setActiveTab('tds')} icon="fas fa-shield-halved" label="TDS Filing" />
              
              <div className="mt-4 px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Final Accounts</div>
              <MenuBtn active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} icon="fas fa-balance-scale" label="Financial Reports" />
          </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 mt-[48px] overflow-hidden flex flex-col relative bg-[#f8f9fa]">
          <div className="h-[48px] border-b border-[#dadce0] bg-white flex items-center justify-between px-6 z-10">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Fiscal Year: 2024-25</span>
              <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-600">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                TALLY CLOUD SYNC: OPERATIONAL
              </div>
          </div>
          <div className="flex-1 overflow-y-auto z-10 custom-scrollbar">{renderContent()}</div>
      </div>
    </div>
  );
};

const MenuBtn: React.FC<{ active: boolean; icon: string; label: string; onClick: () => void }> = ({ active, icon, label, onClick }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-2.5 text-sm transition-all ${active ? 'text-[#4f46e5] bg-[#f5f3ff] font-semibold border-r-4 border-[#4f46e5]' : 'text-[#3c4043] hover:bg-gray-100'}`}>
        <i className={`${icon} w-5 text-center text-base ${active ? 'text-[#4f46e5]' : 'text-gray-400'}`}></i>
        <span>{label}</span>
    </button>
);

const FinanceDashboard: React.FC<{ accounts: LedgerAccount[]; vouchers: Voucher[] }> = ({ accounts, vouchers }) => {
    const cashBank = accounts.filter(a => a.name.includes('Bank') || a.name.includes('Cash')).reduce((s,a) => s + a.currentBalance, 0);
    const receivables = accounts.find(a => a.code === 'AR001')?.currentBalance || 0;
    const payables = accounts.find(a => a.code === 'AP001')?.currentBalance || 0;

    return (
        <div className="p-8 space-y-8 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FinanceStatCard label="Liquid Capital" value={`₹${(cashBank/100000).toFixed(2)}L`} sub="Bank & Cash Balances" icon="fas fa-vault" color="bg-indigo-600" />
                <FinanceStatCard label="Total Receivables" value={`₹${(receivables/100000).toFixed(2)}L`} sub="Customer Advances/Dues" icon="fas fa-arrow-trend-up" color="bg-green-600" />
                <FinanceStatCard label="Total Payables" value={`₹${(payables/100000).toFixed(2)}L`} sub="Vendor Liabilities" icon="fas fa-arrow-trend-down" color="bg-red-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl border border-[#dadce0] shadow-sm">
                    <h4 className="font-bold text-gray-800 text-sm uppercase tracking-widest mb-6 border-b pb-2">Recent Vouchers</h4>
                    <div className="space-y-3">
                        {vouchers.slice(0, 5).map(v => (
                            <div key={v.id} className="flex items-center justify-between p-3 bg-[#f8f9fa] rounded border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-white flex items-center justify-center text-[10px] font-bold border border-gray-200">{v.type.charAt(0)}</div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-900">{v.voucherNumber}</p>
                                        <p className="text-[10px] text-gray-500">{v.date}</p>
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-indigo-600">₹{v.entries.reduce((s,e) => s + e.debit, 0).toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-[#dadce0] shadow-sm">
                    <h4 className="font-bold text-gray-800 text-sm uppercase tracking-widest mb-6 border-b pb-2">Statutory Health</h4>
                    <div className="space-y-6">
                        <HealthItem label="GST Returns" status="Filed" date="Mar 2024" color="text-green-600" />
                        <HealthItem label="TDS Deposits" status="Due in 2 days" date="Apr 2024" color="text-orange-600" />
                        <HealthItem label="RERA Escrow" status="Audit Pass" date="FY 23-24" color="text-blue-600" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const FinanceStatCard: React.FC<{ label: string; value: string; sub: string; icon: string; color: string }> = ({ label, value, sub, icon, color }) => (
    <div className="bg-white p-6 rounded-xl border border-[#dadce0] shadow-sm group hover:shadow-md transition-all">
        <div className="flex justify-between items-start mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl shadow-lg ${color}`}><i className={icon}></i></div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active</span>
        </div>
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-tighter mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-400 mt-2">{sub}</p>
    </div>
);

const HealthItem: React.FC<{ label: string; status: string; date: string; color: string }> = ({ label, status, date, color }) => (
    <div className="flex items-center justify-between">
        <div>
            <p className="text-xs font-bold text-gray-900">{label}</p>
            <p className="text-[10px] text-gray-500 uppercase">{date}</p>
        </div>
        <span className={`text-[10px] font-bold uppercase ${color}`}>{status}</span>
    </div>
);

const GeneralLedger: React.FC<{ accounts: LedgerAccount[]; vouchers: Voucher[] }> = ({ accounts, vouchers }) => (
    <div className="p-8">
        <div className="bg-white rounded-xl border border-[#dadce0] overflow-hidden shadow-sm">
            <div className="p-4 bg-[#f8f9fa] border-b flex justify-between items-center">
                <h4 className="font-bold text-gray-800 text-xs uppercase tracking-widest">Chart of Accounts</h4>
                <button className="text-xs font-bold text-indigo-600 hover:underline">+ NEW ACCOUNT</button>
            </div>
            <table className="w-full text-left text-sm">
                <thead className="bg-[#f8f9fa] text-gray-600 font-bold uppercase text-[10px] tracking-wider border-b">
                    <tr><th className="p-4">Account Name</th><th className="p-4">Group</th><th className="p-4 text-right">Debit</th><th className="p-4 text-right">Credit</th><th className="p-4 text-right">Balance (INR)</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {accounts.map(acc => (
                        <tr key={acc.id} className="hover:bg-indigo-50/30 transition-colors">
                            <td className="p-4"><div className="font-bold text-gray-800">{acc.name}</div><div className="text-[10px] font-mono text-gray-400">{acc.code}</div></td>
                            <td className="p-4"><span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-500">{acc.group}</span></td>
                            <td className="p-4 text-right text-gray-400 font-mono">0.00</td>
                            <td className="p-4 text-right text-gray-400 font-mono">0.00</td>
                            <td className="p-4 text-right font-bold text-gray-900 font-mono">₹{acc.currentBalance.toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const GstCompliance: React.FC<{ entries: GstEntry[] }> = ({ entries }) => (
    <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-[#dadce0] shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Accumulated Input Tax Credit</p>
                <p className="text-2xl font-bold text-green-600">₹4,25,890.00</p>
                <div className="mt-4 h-1 w-full bg-gray-100 rounded-full overflow-hidden"><div className="bg-green-500 h-full w-2/3"></div></div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-[#dadce0] shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Output Tax Payable</p>
                <p className="text-2xl font-bold text-red-600">₹1,12,450.00</p>
                <div className="mt-4 h-1 w-full bg-gray-100 rounded-full overflow-hidden"><div className="bg-red-500 h-full w-1/4"></div></div>
            </div>
        </div>
        <div className="bg-white rounded-xl border border-[#dadce0] overflow-hidden">
             <div className="p-4 bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider">GSTR-1 Sales Report (Provisional)</div>
             <table className="w-full text-left text-xs">
                 <thead className="bg-gray-50 text-gray-500 font-black uppercase">
                    <tr><th className="p-4">Customer/GSTIN</th><th className="p-4 text-right">Taxable Value</th><th className="p-4 text-right">CGST</th><th className="p-4 text-right">SGST</th><th className="p-4 text-right">Total GST</th></tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                     {[1,2,3].map(i => (
                         <tr key={i} className="hover:bg-gray-50">
                             <td className="p-4 font-bold">27ABCDE1234F{i}Z5</td>
                             <td className="p-4 text-right font-mono">₹5,00,000</td>
                             <td className="p-4 text-right font-mono text-gray-400">₹25,000</td>
                             <td className="p-4 text-right font-mono text-gray-400">₹25,000</td>
                             <td className="p-4 text-right font-mono font-bold">₹50,000</td>
                         </tr>
                     ))}
                 </tbody>
             </table>
        </div>
    </div>
);

const FinancialReports: React.FC<{ accounts: LedgerAccount[] }> = ({ accounts }) => (
    <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl border border-[#dadce0] shadow-sm">
            <h4 className="text-center font-bold text-gray-900 uppercase tracking-wider mb-8 border-b pb-4">Balance Sheet (Draft)</h4>
            <div className="space-y-6">
                <div>
                    <h5 className="text-[10px] font-bold text-indigo-600 uppercase border-b border-indigo-100 mb-2">Sources of Funds</h5>
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs"><span>Equity Capital</span><span className="font-mono">₹50,00,000</span></div>
                        <div className="flex justify-between text-xs"><span>Liabilities (AP)</span><span className="font-mono">₹12,40,000</span></div>
                    </div>
                </div>
                <div>
                    <h5 className="text-[10px] font-bold text-indigo-600 uppercase border-b border-indigo-100 mb-2">Application of Funds</h5>
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs"><span>Project Assets</span><span className="font-mono">₹45,00,000</span></div>
                        <div className="flex justify-between text-xs"><span>Cash & Bank</span><span className="font-mono">₹17,40,000</span></div>
                    </div>
                </div>
            </div>
        </div>
        <div className="bg-white p-8 rounded-2xl border border-[#dadce0] shadow-sm">
            <h4 className="text-center font-bold text-gray-900 uppercase tracking-wider mb-8 border-b pb-4">Profit & Loss (P&L)</h4>
            <div className="space-y-4">
                 <div className="flex justify-between text-xs"><span>Operating Income</span><span className="font-mono text-green-600">₹85,00,000</span></div>
                 <div className="flex justify-between text-xs text-red-500"><span>Direct Material Costs</span><span className="font-mono">-(₹34,00,000)</span></div>
                 <div className="flex justify-between text-xs text-red-500"><span>Labour & Service Costs</span><span className="font-mono">-(₹12,00,000)</span></div>
                 <div className="flex justify-between text-xs text-red-500"><span>Marketing Overheads</span><span className="font-mono">-(₹5,00,000)</span></div>
                 <div className="pt-4 border-t border-gray-900 flex justify-between text-sm font-bold uppercase">
                     <span>Net Operating Profit</span>
                     <span className="text-indigo-600">₹34,00,000</span>
                 </div>
            </div>
        </div>
    </div>
);

export default FinanceSarvContainer;

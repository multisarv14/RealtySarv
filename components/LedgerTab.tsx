
import React from 'react';
import { toast } from './ui/Toast';
import { Lead, Project, PaymentPlan, BookingDetails, PaymentRecord, DemandRecord } from '../types';
import AddPaymentModal from './modals/AddPaymentModal';
import GenerateDemandModal from './modals/GenerateDemandModal';
import UnitDocumentViewerModal from './modals/UnitDocumentViewerModal';

interface LedgerTabProps {
  lead: Lead;
  project: Project | null;
  paymentPlans: PaymentPlan[];
  onUpdateBooking: (leadId: string, bookingDetails: BookingDetails) => void;
}

type LedgerSubTab = 'Payment History' | 'Plan & Demands' | 'Settlement' | 'Notices & Letters';

const NoticeRow: React.FC<{ name: string; icon: string; description: string; onGenerate: () => void }> = ({ name, icon, description, onGenerate }) => (
    <div className="bg-[var(--dark-bg)] p-4 rounded-xl border border-[var(--light-bg)] flex items-center gap-4 group hover:border-[var(--primary-color)] transition-all shadow-sm mb-3">
        <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-lg bg-[var(--medium-bg)] text-[var(--primary-color)] text-xl border border-[var(--light-bg)] group-hover:bg-[var(--primary-color)] group-hover:text-white transition-colors">
            <i className={icon}></i>
        </div>
        <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-[var(--text-primary)] text-sm uppercase tracking-tight">{name}</h4>
            <p className="text-[11px] text-[var(--text-secondary)] mt-1">{description}</p>
        </div>
        <div className="flex-shrink-0">
            <button
                onClick={onGenerate}
                className="px-4 py-2 rounded text-[10px] bg-[var(--medium-bg)] text-[var(--primary-color)] font-semibold uppercase hover:bg-[var(--primary-color)] hover:text-white border border-[var(--primary-color)]/20 transition-all shadow-sm"
            >
                Generate Letter
            </button>
        </div>
    </div>
);

const LedgerTab: React.FC<LedgerTabProps> = ({ lead, project, paymentPlans, onUpdateBooking }) => {
  const [activeSubTab, setActiveSubTab] = React.useState<LedgerSubTab>('Payment History');
  const [showPaymentModal, setShowPaymentModal] = React.useState(false);
  const [showDemandModal, setShowDemandModal] = React.useState(false);
  const [viewingDoc, setViewingDoc] = React.useState<{ type: any, data: any } | null>(null);
  
  // State for settlement allocation
  const [tempSettlement, setTempSettlement] = React.useState<Record<string, number>>({});

  React.useEffect(() => {
      if (lead.bookingDetails?.settlementMapping) {
          setTempSettlement(lead.bookingDetails.settlementMapping);
      } else {
          setTempSettlement({});
      }
  }, [lead.bookingDetails]);

  if (!lead.bookingDetails) return null;

  const { priceBreakup, tokenDetails, payments = [], demands = [] } = lead.bookingDetails;
  const plan = paymentPlans.find(p => p.id === lead.bookingDetails?.paymentPlanId);

  const totalPaid = (tokenDetails.amount || 0) + payments.reduce((sum, p) => sum + p.amount, 0);
  const totalDue = priceBreakup.grandTotal;

  const currentAllocatedTotal: number = (Object.values(tempSettlement) as number[]).reduce((sum: number, val: number) => sum + (val || 0), 0);
  const unallocatedAmount = totalPaid - currentAllocatedTotal;

  const handleAddPayment = (payment: PaymentRecord) => {
      const updatedBookingDetails: BookingDetails = {
          ...lead.bookingDetails!,
          payments: [...(lead.bookingDetails!.payments || []), payment]
      };
      onUpdateBooking(lead.id, updatedBookingDetails);
  };

  const handleGenerateDemand = (data: { milestoneId: string; demandDate: string; dueDate: string; milestoneDate: string }) => {
      const newDemand: DemandRecord = {
          milestoneId: data.milestoneId,
          generatedDate: data.demandDate,
          dueDate: data.dueDate,
          milestoneDate: data.milestoneDate
      };
      const updatedBookingDetails: BookingDetails = {
          ...lead.bookingDetails!,
          demands: [...(lead.bookingDetails!.demands || []), newDemand]
      };
      onUpdateBooking(lead.id, updatedBookingDetails);
  };

  const handleSaveSettlement = () => {
      const updatedBookingDetails: BookingDetails = {
          ...lead.bookingDetails!,
          settlementMapping: tempSettlement
      };
      onUpdateBooking(lead.id, updatedBookingDetails);
      toast.success("Settlement updated.");
  };

  const handleSettlementChange = (key: string, value: string) => {
      const numVal = parseFloat(value) || 0;
      setTempSettlement(prev => ({ ...prev, [key]: numVal }));
  };

  const costHeads = [
      { key: 'basicSalePrice', label: 'Basic Sale Price' },
      { key: 'floorPLC', label: 'Floor PLC' },
      { key: 'otherCharges', label: 'Other Charges' },
      { key: 'gst', label: 'GST' },
      { key: 'stampDuty', label: 'Stamp Duty' },
      { key: 'registrationCharges', label: 'Registration' },
      { key: 'societyFormationCharges', label: 'Society Formation' },
      { key: 'legalCharges', label: 'Legal Charges' },
      { key: 'maintenanceCharges', label: 'Maintenance' },
      { key: 'corpusFund', label: 'Corpus Fund' },
  ];
  
  if (priceBreakup.customCharges) {
      Object.keys(priceBreakup.customCharges).forEach(key => {
          costHeads.push({ key: key, label: key });
      });
  }

  const financialNotices = [
      { name: 'Interest Letter', icon: 'fas fa-percent', description: 'Notice for interest accrued on delayed payments for construction milestones.' },
      { name: 'GST Installment Letter', icon: 'fas fa-receipt', description: 'Communication regarding current GST liability and tax component breakdown.' },
      { name: 'Payment Reminder', icon: 'fas fa-bell', description: 'Soft reminder for upcoming or slightly overdue installments as per CLP.' },
      { name: 'Cancellation Notice', icon: 'fas fa-exclamation-triangle', description: 'Statutory warning notice for persistent payment defaults and potential booking termination.' },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[var(--medium-bg)] animate-fadeIn">
        {/* Sub-tabs Navigation */}
        <div className="border-b border-[var(--light-bg)] flex-shrink-0 bg-[var(--dark-bg)]/50">
            <nav className="flex px-4">
                {(['Payment History', 'Plan & Demands', 'Settlement', 'Notices & Letters'] as LedgerSubTab[]).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveSubTab(tab)}
                        className={`px-6 py-3 text-[10px] font-semibold uppercase tracking-widest transition-all border-b-2 ${
                            activeSubTab === tab 
                            ? 'border-[var(--primary-color)] text-[var(--primary-color)]' 
                            : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </nav>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {activeSubTab === 'Payment History' && (
                <div className="max-w-4xl mx-auto animate-fadeIn">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Transaction Ledger</h4>
                        <button onClick={() => setShowPaymentModal(true)} className="px-4 py-1.5 bg-[var(--primary-color)] text-white text-[10px] font-semibold uppercase rounded shadow hover:brightness-110 transition-all">
                            + Add Receipt
                        </button>
                    </div>

                    <div className="space-y-4">
                         {/* Token Entry (Always First) */}
                         <div className="bg-[var(--dark-bg)] p-4 rounded-xl border-l-4 border-l-blue-500 border border-[var(--light-bg)] flex justify-between items-center">
                            <div>
                                <p className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-tight">Booking Token Amount</p>
                                <p className="text-[10px] text-[var(--text-secondary)] font-mono mt-1">{tokenDetails.mode} • TXN: {tokenDetails.transactionId}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-base font-bold text-green-500">₹{tokenDetails.amount.toLocaleString('en-IN')}</p>
                                <p className="text-[9px] font-bold text-gray-500 uppercase mt-1">{tokenDetails.transactionDate}</p>
                            </div>
                        </div>

                        {payments.length === 0 && <p className="text-center py-12 text-sm text-gray-500 italic">No additional receipts recorded yet.</p>}
                        
                        {payments.map(payment => (
                            <div key={payment.id} className="bg-[var(--dark-bg)] p-4 rounded-xl border border-[var(--light-bg)] flex justify-between items-center group hover:border-[var(--primary-color)] transition-colors">
                                <div>
                                    <p className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-tight">{payment.milestoneName || 'Part Payment Entry'}</p>
                                    <p className="text-[10px] text-[var(--text-secondary)] font-mono mt-1">{payment.mode} • {payment.bankName || 'N/A'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-base font-bold text-green-500">₹{payment.amount.toLocaleString('en-IN')}</p>
                                    <div className="flex items-center gap-3 justify-end mt-1">
                                        <p className="text-[9px] font-bold text-gray-500 uppercase">{payment.date}</p>
                                        <button onClick={() => setViewingDoc({ type: 'Payment Receipt', data: payment })} className="text-[9px] font-semibold uppercase text-blue-500 hover:underline">Receipt</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeSubTab === 'Plan & Demands' && (
                <div className="max-w-4xl mx-auto animate-fadeIn">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Demands & Milestones</h4>
                        <button onClick={() => setShowDemandModal(true)} className="px-4 py-1.5 bg-blue-600 text-white text-[10px] font-semibold uppercase rounded shadow hover:brightness-110 transition-all">
                            Raise Demand
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {plan?.milestones.map((milestone) => {
                            const demand = demands.find(d => d.milestoneId === milestone.id);
                            const isPaid = payments.some(p => p.milestoneName === milestone.name) || (milestone.name === 'On Booking' && tokenDetails.amount > 0);
                            const milestoneAmount = priceBreakup.totalConsideration * (milestone.percentage / 100);

                            return (
                                <div key={milestone.id} className={`p-5 rounded-xl border transition-all ${demand ? 'bg-[var(--dark-bg)] border-blue-500/30' : 'bg-transparent border-[var(--light-bg)]'}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold text-sm text-[var(--text-primary)] uppercase">{milestone.name}</p>
                                            <p className="text-xs font-bold text-blue-500 mt-1">{milestone.percentage}% of Value (₹{milestoneAmount.toLocaleString('en-IN')})</p>
                                        </div>
                                        {isPaid ? (
                                            <span className="bg-green-500/10 text-green-500 text-[9px] font-semibold px-2 py-1 rounded-full border border-green-500/20 uppercase"><i className="fas fa-check-circle mr-1"></i> Settled</span>
                                        ) : demand ? (
                                            <span className="bg-orange-500/10 text-orange-500 text-[9px] font-semibold px-2 py-1 rounded-full border border-orange-500/20 uppercase"><i className="fas fa-clock mr-1"></i> Overdue</span>
                                        ) : (
                                            <span className="bg-gray-500/10 text-gray-500 text-[9px] font-semibold px-2 py-1 rounded-full border border-gray-500/20 uppercase">Upcoming</span>
                                        )}
                                    </div>
                                    
                                    {demand && (
                                        <div className="mt-4 pt-4 border-t border-[var(--light-bg)] flex justify-between items-center text-[10px]">
                                            <div className="flex gap-6">
                                                <p className="text-gray-500">Raised: <span className="text-[var(--text-primary)] font-bold">{demand.generatedDate}</span></p>
                                                <p className="text-gray-500">Due: <span className="text-[var(--text-primary)] font-bold">{demand.dueDate}</span></p>
                                            </div>
                                            <button onClick={() => setViewingDoc({ type: 'Demand Letter', data: { milestone, demandDate: demand.generatedDate, dueDate: demand.dueDate, milestoneDate: demand.milestoneDate } })} className="text-blue-500 font-semibold uppercase hover:underline">Download Letter</button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {activeSubTab === 'Settlement' && (
                <div className="max-w-4xl mx-auto animate-fadeIn">
                    <div className="bg-[var(--dark-bg)] p-6 rounded-xl border border-[var(--light-bg)] mb-6 flex justify-between items-center">
                        <div>
                            <h4 className="text-xs font-bold uppercase text-[var(--text-secondary)] tracking-wider mb-1">Fund Allocation Status</h4>
                            <p className="text-[10px] text-gray-500">Allocate total received funds (₹{totalPaid.toLocaleString()}) against cost heads.</p>
                        </div>
                        <div className="text-right">
                             <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Remaining Balance</p>
                             <p className={`text-2xl font-bold ${unallocatedAmount < 0 ? 'text-red-500' : 'text-green-500'}`}>₹{unallocatedAmount.toLocaleString('en-IN')}</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-[var(--light-bg)] bg-[var(--dark-bg)]">
                        <table className="w-full text-[11px] text-left">
                            <thead className="text-[var(--text-secondary)] bg-[var(--medium-bg)] font-semibold uppercase tracking-widest">
                                <tr>
                                    <th className="p-4 border-b border-[var(--light-bg)]">Agreement Component</th>
                                    <th className="p-4 border-b border-[var(--light-bg)] text-right">Target (INR)</th>
                                    <th className="p-4 border-b border-[var(--light-bg)] text-right">Settled (INR)</th>
                                    <th className="p-4 border-b border-[var(--light-bg)] text-right">Variance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--light-bg)]">
                                {costHeads.map(head => {
                                    const due = (priceBreakup as any)[head.key] || (priceBreakup.customCharges && priceBreakup.customCharges[head.key]) || 0;
                                    if (due === 0) return null;
                                    const settled = tempSettlement[head.key] || 0;
                                    const balance = due - settled;
                                    return (
                                        <tr key={head.key} className="hover:bg-[var(--medium-bg)]/30 transition-colors">
                                            <td className="p-4 font-bold text-[var(--text-primary)]">{head.label}</td>
                                            <td className="p-4 text-right text-gray-500 font-mono">₹{due.toLocaleString('en-IN')}</td>
                                            <td className="p-4 text-right">
                                                <input type="number" value={settled} onChange={(e) => handleSettlementChange(head.key, e.target.value)} className="bg-[var(--medium-bg)] border border-[var(--light-bg)] rounded px-3 py-1 text-right text-[var(--text-primary)] w-36 focus:outline-none focus:border-[var(--primary-color)] font-mono" />
                                            </td>
                                            <td className={`p-4 text-right font-bold font-mono ${balance > 0 ? 'text-red-400' : 'text-green-400'}`}>₹{balance.toLocaleString('en-IN')}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button onClick={handleSaveSettlement} className="px-8 py-2 bg-[var(--primary-color)] text-white text-[11px] font-semibold uppercase rounded shadow hover:brightness-110 transition-all">
                            Synchronize Ledger
                        </button>
                    </div>
                </div>
            )}

            {activeSubTab === 'Notices & Letters' && (
                <div className="max-w-4xl mx-auto animate-fadeIn">
                    <div className="mb-6 flex justify-between items-center">
                        <div>
                            <h4 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Financial Notices & Statutory Letters</h4>
                            <p className="text-[11px] text-[var(--text-secondary)] mt-1">Generate automated compliance and financial communication for the customer.</p>
                        </div>
                    </div>

                    <div className="flex flex-col">
                        {financialNotices.map((notice) => (
                            <NoticeRow 
                                key={notice.name}
                                name={notice.name}
                                icon={notice.icon}
                                description={notice.description}
                                onGenerate={() => setViewingDoc({ type: notice.name, data: { lead, project } })}
                            />
                        ))}
                    </div>

                    <div className="mt-8 p-6 bg-blue-500/5 rounded-xl border border-blue-500/20">
                        <h5 className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <i className="fas fa-info-circle"></i> Operational Guidelines
                        </h5>
                        <ul className="text-[11px] text-[var(--text-secondary)] space-y-2 list-disc pl-4">
                            <li>Letters generated here use real-time data from the <strong>Transaction Ledger</strong>.</li>
                            <li>Ensure all payment receipts are recorded before generating an <strong>Interest Letter</strong>.</li>
                            <li>Notices generated are archived in the unit history automatically for future audit trails.</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>

        <AddPaymentModal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} onSave={handleAddPayment} milestones={plan?.milestones || []} />
        <GenerateDemandModal isOpen={showDemandModal} onClose={() => setShowDemandModal(false)} onGenerate={handleGenerateDemand} milestones={plan?.milestones || []} />
        {viewingDoc && <UnitDocumentViewerModal isOpen={!!viewingDoc} onClose={() => setViewingDoc(null)} templateType={viewingDoc.type} lead={lead} project={project} extraData={viewingDoc.data} />}
    </div>
  );
};

export default LedgerTab;


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

const NoticeRow: React.FC<{ name: string; icon: string; description: string; badge?: string; onGenerate: () => void }> = ({ name, icon, description, badge, onGenerate }) => (
    <li className="flex items-center gap-4 px-4 py-3.5 hover:bg-[var(--dark-bg)] transition-colors">
        <span className="w-10 h-10 shrink-0 flex items-center justify-center rounded-lg bg-[var(--medium-bg)] text-[var(--primary-color)] border border-[var(--light-bg)]" aria-hidden="true"><i className={icon}></i></span>
        <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-[var(--text-primary)] text-sm flex items-center gap-2">{name}{badge && <span className="text-[10px] font-semibold px-1.5 py-px rounded-full bg-red-500/15 text-red-500">{badge}</span>}</h4>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">{description}</p>
        </div>
        <button onClick={onGenerate} aria-label={`Generate ${name}`} className="shrink-0 px-3.5 py-1.5 rounded-lg text-xs bg-[var(--medium-bg)] text-[var(--primary-color)] font-semibold hover:bg-[var(--primary-color)] hover:text-white border border-[var(--primary-color)]/40 transition-colors">Generate</button>
    </li>
);

const LedgerTab: React.FC<LedgerTabProps> = ({ lead, project, paymentPlans, onUpdateBooking }) => {
  const [activeSubTab, setActiveSubTab] = React.useState<LedgerSubTab>('Payment History');
  const [showPaymentModal, setShowPaymentModal] = React.useState(false);
  const [showDemandModal, setShowDemandModal] = React.useState(false);
  const [demandFor, setDemandFor] = React.useState<string | undefined>(undefined);
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
        {/* Sub-tabs */}
        <div role="tablist" className="flex items-center gap-1.5 px-4 py-2.5 md:py-0 md:h-[52px] border-b border-[var(--light-bg)] flex-shrink-0 bg-[var(--dark-bg)] overflow-x-auto no-scrollbar">
            {(['Payment History', 'Plan & Demands', 'Settlement', 'Notices & Letters'] as LedgerSubTab[]).map(tab => (
                <button key={tab} role="tab" aria-selected={activeSubTab === tab} onClick={() => setActiveSubTab(tab)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${activeSubTab === tab ? 'bg-[var(--primary-color)] text-white shadow-sm' : 'bg-[var(--medium-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--light-bg)]'}`}>
                    {tab === 'Payment History' ? 'Payments' : tab === 'Plan & Demands' ? 'Plan and demands' : tab === 'Notices & Letters' ? 'Letters' : tab}
                </button>
            ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {activeSubTab === 'Payment History' && (() => {
                // One chronological ledger (token first), with the balance left after each receipt.
                const rows = [
                    { id: 'token', date: tokenDetails.transactionDate, title: 'Booking token', ref: [tokenDetails.mode, tokenDetails.bankName, tokenDetails.transactionId && `TXN ${tokenDetails.transactionId}`].filter(Boolean).join(' · '), amount: tokenDetails.amount || 0, receipt: null as PaymentRecord | null },
                    ...payments.map(pm => ({ id: pm.id, date: pm.date, title: pm.milestoneName || 'Part payment', ref: [pm.mode, pm.bankName, pm.transactionId && `TXN ${pm.transactionId}`].filter(Boolean).join(' · '), amount: pm.amount, receipt: pm })),
                ].sort((x, y) => String(x.date).localeCompare(String(y.date)));
                let running = totalDue;
                const withBalance = rows.map(r => { running -= r.amount; return { ...r, balance: running }; });
                const pct = totalDue > 0 ? Math.min(100, Math.round((totalPaid / totalDue) * 100)) : 0;
                const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
                return (
                <div className="max-w-5xl mx-auto animate-fadeIn space-y-5" data-testid="ledger-payments">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-[var(--dark-bg)] rounded-xl border border-[var(--light-bg)] p-4"><p className="text-[11px] text-[var(--text-secondary)]">Agreement value</p><p className="text-xl font-bold text-[var(--text-primary)]">{inr(totalDue)}</p></div>
                        <div className="bg-[var(--dark-bg)] rounded-xl border border-[var(--light-bg)] p-4"><p className="text-[11px] text-[var(--text-secondary)]">Paid so far</p><p className="text-xl font-bold text-green-500">{inr(totalPaid)}</p>
                            <div className="mt-2 h-1.5 rounded-full bg-[var(--light-bg)] overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Paid"><div className="h-full bg-green-500" style={{ width: `${pct}%` }}></div></div>
                            <p className="mt-1 text-[11px] text-[var(--text-secondary)]">{pct}% of the agreement value</p></div>
                        <div className="bg-[var(--dark-bg)] rounded-xl border border-[var(--light-bg)] p-4"><p className="text-[11px] text-[var(--text-secondary)]">Balance</p><p className={`text-xl font-bold ${totalDue - totalPaid > 0 ? 'text-red-500' : 'text-green-500'}`}>{inr(Math.max(totalDue - totalPaid, 0))}</p></div>
                    </div>

                    <div className="flex justify-between items-center">
                        <h4 className="text-sm font-semibold text-[var(--text-primary)]">Receipts <span className="font-normal text-[var(--text-secondary)]">· {rows.length}</span></h4>
                        <button onClick={() => setShowPaymentModal(true)} className="px-3.5 py-1.5 bg-[var(--primary-color)] text-white text-xs font-semibold rounded-lg shadow hover:brightness-110 transition-all">+ Add receipt</button>
                    </div>

                    <div className="border border-[var(--light-bg)] rounded-xl overflow-hidden">
                        <div className="hidden md:grid grid-cols-[96px_minmax(0,1.6fr)_minmax(0,1.4fr)_120px_120px_90px] gap-3 px-4 py-2 bg-[var(--dark-bg)] text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                            <span>Date</span><span>For</span><span>Mode and reference</span><span className="text-right">Amount</span><span className="text-right">Balance</span><span></span>
                        </div>
                        <ul className="divide-y divide-[var(--light-bg)]">
                            {withBalance.map(r => (
                                <li key={r.id} className="grid grid-cols-2 md:grid-cols-[96px_minmax(0,1.6fr)_minmax(0,1.4fr)_120px_120px_90px] gap-x-3 gap-y-1 items-center px-4 py-3 hover:bg-[var(--dark-bg)] transition-colors">
                                    <span className="text-xs text-[var(--text-secondary)]">{r.date}</span>
                                    <span className="text-sm font-semibold text-[var(--text-primary)] truncate md:col-auto col-span-2 md:order-none -order-1">{r.title}</span>
                                    <span className="text-xs text-[var(--text-secondary)] truncate col-span-2 md:col-auto">{r.ref || 'No reference'}</span>
                                    <span className="text-sm font-bold text-green-500 md:text-right">{inr(r.amount)}</span>
                                    <span className="text-xs text-[var(--text-secondary)] md:text-right"><span className="md:hidden">Balance </span>{inr(Math.max(r.balance, 0))}</span>
                                    <span className="md:text-right col-span-2 md:col-auto">{r.receipt ? <button onClick={() => setViewingDoc({ type: 'Payment Receipt', data: r.receipt })} className="text-xs font-semibold text-blue-500 hover:underline">Receipt</button> : <span className="text-[11px] text-[var(--text-secondary)] whitespace-nowrap">With booking</span>}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                );
            })()}

            {activeSubTab === 'Plan & Demands' && (() => {
                const today = new Date().toISOString().split('T')[0];
                const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
                const stages = (plan?.milestones || []).map(milestone => {
                    const demand = demands.find(d => d.milestoneId === milestone.id);
                    const settled = payments.some(p => p.milestoneName === milestone.name) || (milestone.name === 'On Booking' && tokenDetails.amount > 0);
                    const state = settled ? 'Settled' : demand ? (demand.dueDate < today ? 'Overdue' : 'Demand raised') : 'Upcoming';
                    return { milestone, demand, state, amount: priceBreakup.totalConsideration * (milestone.percentage / 100) };
                });
                const done = stages.filter(x => x.state === 'Settled').length;
                const BADGE: Record<string, string> = { Settled: 'bg-green-500/10 text-green-500 border-green-500/30', Overdue: 'bg-red-500/10 text-red-500 border-red-500/30', 'Demand raised': 'bg-blue-500/10 text-blue-500 border-blue-500/30', Upcoming: 'bg-gray-500/10 text-[var(--text-secondary)] border-gray-500/30' };
                const open = (id?: string) => { setDemandFor(id); setShowDemandModal(true); };
                return (
                <div className="max-w-5xl mx-auto animate-fadeIn space-y-4" data-testid="ledger-plan">
                    <div className="flex flex-wrap justify-between items-center gap-3">
                        <div>
                            <h4 className="text-sm font-semibold text-[var(--text-primary)]">{plan?.name || 'Payment plan'}</h4>
                            <p className="text-xs text-[var(--text-secondary)]">{done} of {stages.length} stages settled</p>
                        </div>
                        <button onClick={() => open(undefined)} className="px-3.5 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg shadow hover:brightness-110 transition-all">Raise demand</button>
                    </div>
                    <div className="border border-[var(--light-bg)] rounded-xl overflow-hidden">
                        <div className="hidden md:grid grid-cols-[minmax(0,1.6fr)_70px_120px_120px_minmax(0,1.5fr)_110px] gap-3 px-4 py-2 bg-[var(--dark-bg)] text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                            <span>Stage</span><span>Share</span><span className="text-right">Amount</span><span>Status</span><span>Demand</span><span></span>
                        </div>
                        <ul className="divide-y divide-[var(--light-bg)]">
                            {stages.map(({ milestone, demand, state, amount }) => (
                                <li key={milestone.id} className="grid grid-cols-2 md:grid-cols-[minmax(0,1.6fr)_70px_120px_120px_minmax(0,1.5fr)_110px] gap-x-3 gap-y-1 items-center px-4 py-3 hover:bg-[var(--dark-bg)] transition-colors">
                                    <span className="text-sm font-semibold text-[var(--text-primary)] col-span-2 md:col-auto">{milestone.name}</span>
                                    <span className="text-xs text-[var(--text-secondary)]">{milestone.percentage}%</span>
                                    <span className="text-sm font-bold text-[var(--text-primary)] md:text-right">{inr(amount)}</span>
                                    <span><span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full border ${BADGE[state]}`}>{state}</span></span>
                                    <span className="text-xs text-[var(--text-secondary)] col-span-2 md:col-auto">{demand ? `Raised ${demand.generatedDate}, due ${demand.dueDate}` : state === 'Settled' ? 'Paid' : 'Not raised yet'}</span>
                                    <span className="md:text-right col-span-2 md:col-auto">
                                        {demand ? <button onClick={() => setViewingDoc({ type: 'Demand Letter', data: { milestone, demandDate: demand.generatedDate, dueDate: demand.dueDate, milestoneDate: demand.milestoneDate } })} className="text-xs font-semibold text-blue-500 hover:underline">View letter</button>
                                            : state === 'Upcoming' ? <button onClick={() => open(milestone.id)} className="text-xs font-semibold text-[var(--primary-color)] hover:underline">Raise demand</button> : null}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                );
            })()}

            {activeSubTab === 'Settlement' && (() => {
                const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
                const heads = costHeads.map(h => ({ ...h, due: (priceBreakup as any)[h.key] || (priceBreakup.customCharges && priceBreakup.customCharges[h.key]) || 0 })).filter(h => h.due !== 0);
                const allocatedPct = totalPaid > 0 ? Math.min(100, Math.round((currentAllocatedTotal / totalPaid) * 100)) : 0;
                // Fill the heads in the order shown (price first), each up to its amount, until the money received runs out.
                const autoAllocate = () => { let left = totalPaid; const next: Record<string, number> = {}; for (const h of heads) { const put = Math.max(Math.min(h.due, left), 0); next[h.key] = put; left -= put; } setTempSettlement(next); };
                return (
                <div className="max-w-5xl mx-auto animate-fadeIn space-y-4" data-testid="ledger-settlement">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-[var(--dark-bg)] rounded-xl border border-[var(--light-bg)] p-4"><p className="text-[11px] text-[var(--text-secondary)]">Money received</p><p className="text-xl font-bold text-[var(--text-primary)]">{inr(totalPaid)}</p></div>
                        <div className="bg-[var(--dark-bg)] rounded-xl border border-[var(--light-bg)] p-4"><p className="text-[11px] text-[var(--text-secondary)]">Allocated to components</p><p className="text-xl font-bold text-green-500">{inr(currentAllocatedTotal)}</p>
                            <div className="mt-2 h-1.5 rounded-full bg-[var(--light-bg)] overflow-hidden"><div className="h-full bg-green-500" style={{ width: `${allocatedPct}%` }}></div></div></div>
                        <div className="bg-[var(--dark-bg)] rounded-xl border border-[var(--light-bg)] p-4"><p className="text-[11px] text-[var(--text-secondary)]">Left to allocate</p><p className={`text-xl font-bold ${unallocatedAmount < 0 ? 'text-red-500' : unallocatedAmount === 0 ? 'text-green-500' : 'text-amber-500'}`}>{inr(unallocatedAmount)}</p>
                            {unallocatedAmount < 0 && <p role="alert" className="mt-1 text-[11px] text-red-500">You have allocated more than was received.</p>}</div>
                    </div>
                    <div className="flex flex-wrap justify-between items-center gap-3">
                        <p className="text-xs text-[var(--text-secondary)]">Say which part of the agreement each rupee received has paid for.</p>
                        <button onClick={autoAllocate} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--light-bg)]">Allocate automatically</button>
                    </div>
                    <div className="border border-[var(--light-bg)] rounded-xl overflow-hidden">
                        <div className="hidden md:grid grid-cols-[minmax(0,1.6fr)_140px_160px_140px] gap-3 px-4 py-2 bg-[var(--dark-bg)] text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                            <span>Component</span><span className="text-right">Agreement amount</span><span className="text-right">Allocated</span><span className="text-right">Still to allocate</span>
                        </div>
                        <ul className="divide-y divide-[var(--light-bg)]">
                            {heads.map(h => {
                                const settled = tempSettlement[h.key] || 0; const left = h.due - settled;
                                return (
                                    <li key={h.key} className="grid grid-cols-2 md:grid-cols-[minmax(0,1.6fr)_140px_160px_140px] gap-x-3 gap-y-1 items-center px-4 py-2.5 hover:bg-[var(--dark-bg)] transition-colors">
                                        <span className="text-sm font-semibold text-[var(--text-primary)] col-span-2 md:col-auto">{h.label}</span>
                                        <span className="text-xs text-[var(--text-secondary)] md:text-right"><span className="md:hidden">Amount </span>{inr(h.due)}</span>
                                        <span className="md:text-right"><input type="number" min="0" value={settled} onChange={(e) => handleSettlementChange(h.key, e.target.value)} aria-label={`Allocated to ${h.label}`} className="w-32 h-9 px-3 rounded-lg border border-[var(--border-color)] bg-[var(--dark-bg)] text-sm text-right text-[var(--text-primary)] outline-none focus:border-[var(--primary-color)]" /></span>
                                        <span className={`text-xs font-semibold md:text-right col-span-2 md:col-auto ${left > 0 ? 'text-red-400' : left === 0 ? 'text-green-500' : 'text-amber-500'}`}>{left === 0 ? <><i className="fas fa-check mr-1" aria-hidden="true"></i>Done</> : left < 0 ? `${inr(-left)} extra` : inr(left)}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                    <div className="flex justify-end">
                        <button onClick={handleSaveSettlement} disabled={unallocatedAmount < 0} className="px-5 py-2 bg-[var(--primary-color)] text-white text-sm font-semibold rounded-lg shadow hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed">Save allocation</button>
                    </div>
                </div>
                );
            })()}

            {activeSubTab === 'Notices & Letters' && (() => {
                const today = new Date().toISOString().split('T')[0];
                const overdue = demands.filter(d => d.dueDate < today && !payments.some(p => plan?.milestones.find(m => m.id === d.milestoneId)?.name === p.milestoneName)).length;
                return (
                <div className="max-w-5xl mx-auto animate-fadeIn space-y-4" data-testid="ledger-letters">
                    <div>
                        <h4 className="text-sm font-semibold text-[var(--text-primary)]">Letters and notices</h4>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">They use the receipts in this ledger, so record payments first.</p>
                    </div>
                    <ul className="border border-[var(--light-bg)] rounded-xl overflow-hidden divide-y divide-[var(--light-bg)]">
                        {financialNotices.map((notice) => (
                            <NoticeRow key={notice.name} name={notice.name} icon={notice.icon} description={notice.description}
                                badge={overdue > 0 && (notice.name === 'Payment Reminder' || notice.name === 'Interest Letter') ? `${overdue} overdue` : undefined}
                                onGenerate={() => setViewingDoc({ type: notice.name, data: { lead, project } })} />
                        ))}
                    </ul>
                </div>
                );
            })()}
        </div>

        <AddPaymentModal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} onSave={handleAddPayment} milestones={plan?.milestones || []} />
        <GenerateDemandModal isOpen={showDemandModal} onClose={() => setShowDemandModal(false)} onGenerate={handleGenerateDemand} milestones={plan?.milestones || []} initialMilestoneId={demandFor} />
        {viewingDoc && <UnitDocumentViewerModal isOpen={!!viewingDoc} onClose={() => setViewingDoc(null)} templateType={viewingDoc.type} lead={lead} project={project} extraData={viewingDoc.data} />}
    </div>
  );
};

export default LedgerTab;

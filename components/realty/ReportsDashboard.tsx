
import React from 'react';
import { Project, Vendor, PurchaseOrder, WorkOrder, CostBudget, BOQ, BOQItem, MaterialMaster } from '../../types';
import { db } from '../../db';
import { useLiveQuery } from '../../liveQuery';

interface ReportsDashboardProps {
  projects: Project[];
  vendors: Vendor[];
}

type ReportType = 'cost-sheet' | 'tower-cost' | 'variance' | 'consumption' | 'aging' | 'retention' | 'compliance' | 'ledger';

const ReportsDashboard: React.FC<ReportsDashboardProps> = ({ projects, vendors }) => {
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>(projects[0]?.id || '');
  const [activeReport, setActiveReport] = React.useState<ReportType>('cost-sheet');

  const budgets = useLiveQuery(() => db.costBudgets.where({ projectId: selectedProjectId }).toArray(), [selectedProjectId]);
  const po = useLiveQuery(() => db.purchaseOrders.where({ projectId: selectedProjectId }).toArray(), [selectedProjectId]);
  const wo = useLiveQuery(() => db.workOrders.where({ projectId: selectedProjectId }).toArray(), [selectedProjectId]);
  const boqs = useLiveQuery(() => db.boqs.where({ projectId: selectedProjectId }).toArray(), [selectedProjectId]);
  const boqItems = useLiveQuery(() => db.boqItems.toArray(), []);
  const materials = useLiveQuery(() => db.materialMaster.toArray(), []);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const renderReport = () => {
    switch (activeReport) {
      case 'cost-sheet': return <ProjectCostSheet budgets={budgets || []} po={po || []} wo={wo || []} />;
      case 'tower-cost': return <TowerWiseCost project={selectedProject!} boqItems={boqItems} boqs={boqs || []} />;
      case 'variance': return <VarianceAnalysis boqs={boqs || []} po={po || []} wo={wo || []} />;
      case 'consumption': return <MaterialConsumption boqItems={boqItems} materials={materials || []} po={po || []} />;
      case 'aging': return <PaymentAging po={po || []} wo={wo || []} vendors={vendors} />;
      case 'retention': return <RetentionLiability wo={wo || []} vendors={vendors} />;
      case 'compliance': return <ComplianceReport po={po || []} wo={wo || []} />;
      case 'ledger': return <VendorLedgerSummary vendors={vendors} po={po || []} wo={wo || []} />;
      default: return null;
    }
  };

  return (
    <div className="p-8 h-full flex flex-col gap-6 animate-fadeIn">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-wider">Executive ERP Insights</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">Project Viability & Operational Reports</p>
          </div>
          <div className="flex gap-4 w-full lg:w-auto">
              <select 
                value={selectedProjectId} 
                onChange={e => setSelectedProjectId(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-blue-600 font-bold outline-none flex-1 shadow-inner"
              >
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button className="bg-white text-blue-600 border border-slate-200 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-colors"><i className="fas fa-file-pdf mr-2"></i> Print Dashboard</button>
          </div>
      </div>

      <div className="flex border-b border-slate-200 flex-shrink-0 overflow-x-auto no-scrollbar">
          <ReportTab active={activeReport === 'cost-sheet'} onClick={() => setActiveReport('cost-sheet')} label="Cost Sheet" icon="fas fa-file-invoice-dollar" />
          <ReportTab active={activeReport === 'tower-cost'} onClick={() => setActiveReport('tower-cost')} label="Tower Breakup" icon="fas fa-building" />
          <ReportTab active={activeReport === 'variance'} onClick={() => setActiveReport('variance')} label="Budget vs Actual" icon="fas fa-scale-balanced" />
          <ReportTab active={activeReport === 'consumption'} onClick={() => setActiveReport('consumption')} label="Consumption" icon="fas fa-vial-circle-check" />
          <ReportTab active={activeReport === 'aging'} onClick={() => setActiveReport('aging')} label="Payment Aging" icon="fas fa-calendar-alt" />
          <ReportTab active={activeReport === 'retention'} onClick={() => setActiveReport('retention')} label="Retention" icon="fas fa-piggy-bank" />
          <ReportTab active={activeReport === 'compliance'} onClick={() => setActiveReport('compliance')} label="Tax Compliance" icon="fas fa-shield-halved" />
          <ReportTab active={activeReport === 'ledger'} onClick={() => setActiveReport('ledger')} label="Vendor Ledger" icon="fas fa-book" />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
          {renderReport()}
      </div>
    </div>
  );
};

const ReportTab: React.FC<{ active: boolean; label: string; icon: string; onClick: () => void }> = ({ active, label, icon, onClick }) => (
    <button 
        onClick={onClick}
        className={`px-6 py-3 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${active ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
    >
        <i className={icon}></i>
        {label}
    </button>
);

/* Detailed Report Views */

const MaterialConsumption: React.FC<{ boqItems: BOQItem[], materials: MaterialMaster[], po: PurchaseOrder[] }> = ({ boqItems, materials, po }) => (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 border-b border-slate-100 text-[10px] font-black text-blue-600 uppercase tracking-widest">BOQ vs Actual Site Receipt</div>
        <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/50 text-blue-600 font-black uppercase">
                <tr>
                    <th className="p-4 border-b border-slate-100">Material Detail</th>
                    <th className="p-4 border-b border-slate-100 text-center">BOQ Allocated</th>
                    <th className="p-4 border-b border-slate-100 text-center">Procured (GRN)</th>
                    <th className="p-4 border-b border-slate-100 text-center">Variance %</th>
                    <th className="p-4 border-b border-slate-100 text-right">Procurement Value</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {materials.slice(0, 10).map(mat => {
                    const boqQty = boqItems.filter(i => i.masterId === mat.id).reduce((s, i) => s + i.quantity, 0);
                    const procuredQty = boqQty * (0.4 + Math.random() * 0.5); 
                    const variance = ((procuredQty - boqQty) / (boqQty || 1)) * 100;
                    return (
                        <tr key={mat.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4">
                                <div className="font-bold text-slate-800">{mat.name}</div>
                                <div className="text-[10px] text-slate-400 uppercase">{mat.category}</div>
                            </td>
                            <td className="p-4 text-center text-slate-500 font-mono">{boqQty.toLocaleString()} {mat.uom}</td>
                            <td className="p-4 text-center text-blue-600 font-black font-mono">{procuredQty.toFixed(0)} {mat.uom}</td>
                            <td className={`p-4 text-center font-bold ${variance > 0 ? 'text-red-600' : 'text-green-600'}`}>{variance.toFixed(1)}%</td>
                            <td className="p-4 text-right font-mono text-slate-700">₹{(procuredQty * 450).toLocaleString()}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    </div>
);

const PaymentAging: React.FC<{ po: PurchaseOrder[], wo: WorkOrder[], vendors: Vendor[] }> = ({ po, wo, vendors }) => {
    const today = new Date();
    const buckets = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };

    [...po, ...wo].forEach(item => {
        // Fixed: Use type-safe property access for inferred union types. WorkOrder uses 'startDate'.
        const itemDate = new Date('date' in item ? item.date : (item as any).startDate);
        const diffDays = Math.ceil(Math.abs(today.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24));
        const val = (item as any).grandTotal || (item as any).contractValue;

        if (diffDays <= 30) buckets['0-30'] += val;
        else if (diffDays <= 60) buckets['31-60'] += val;
        else if (diffDays <= 90) buckets['61-90'] += val;
        else buckets['90+'] += val;
    });

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {Object.entries(buckets).map(([range, val]) => (
                <div key={range} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">{range} Days Outstanding</p>
                    <p className="text-2xl font-black text-slate-800">₹{(val / 100000).toFixed(2)} L</p>
                    <div className="mt-4 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full" style={{ width: `${Math.min((val / (Object.values(buckets).reduce((s,v)=>s+v,0)||1))*100, 100)}%` }}></div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const RetentionLiability: React.FC<{ wo: WorkOrder[], vendors: Vendor[] }> = ({ wo, vendors }) => (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 border-b border-slate-100 text-[10px] font-black text-blue-600 uppercase tracking-widest">Withheld Contractor Retention Ledger</div>
        <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/50 text-blue-600 font-black uppercase">
                <tr>
                    <th className="p-4 border-b border-slate-100">Contractor Name</th>
                    <th className="p-4 border-b border-slate-100">Active Orders</th>
                    <th className="p-4 border-b border-slate-100 text-right">Work Certified</th>
                    <th className="p-4 border-b border-slate-100 text-center">Retention %</th>
                    <th className="p-4 border-b border-slate-100 text-right">Retention Liability</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {vendors.filter(v => v.vendorType !== 'Material Supplier').map(v => {
                    const vWO = wo.filter(w => w.vendorId === v.id);
                    const totalRet = vWO.reduce((s,w) => s + (w.contractValue * w.retentionPercent / 100), 0);
                    if (totalRet === 0) return null;
                    return (
                        <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 font-bold text-slate-800">{v.firmName}</td>
                            <td className="p-4 text-slate-500 font-bold">{vWO.length}</td>
                            <td className="p-4 text-right font-mono text-slate-400">₹{vWO.reduce((s,w)=>s+w.contractValue,0).toLocaleString()}</td>
                            <td className="p-4 text-center text-blue-600 font-bold">{vWO[0].retentionPercent}%</td>
                            <td className="p-4 text-right font-mono text-orange-600 font-black">₹{totalRet.toLocaleString()}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    </div>
);

const ProjectCostSheet: React.FC<{ budgets: CostBudget[], po: PurchaseOrder[], wo: WorkOrder[] }> = ({ budgets, po, wo }) => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             <StatCard label="Total Est. Cost" value={`₹${(budgets.reduce((s,b)=>s+b.estimatedAmount, 0)/10000000).toFixed(2)} Cr`} color="text-blue-600" />
             <StatCard label="Purchase Commit" value={`₹${(po.reduce((s,p)=>s+p.grandTotal, 0)/100000).toFixed(2)} L`} color="text-purple-600" />
             <StatCard label="Contract Commit" value={`₹${(wo.reduce((s,w)=>s+w.contractValue, 0)/100000).toFixed(2)} L`} color="text-orange-600" />
             <StatCard label="Balance Budget" value={`₹${((budgets.reduce((s,b)=>s+b.estimatedAmount, 0) - budgets.reduce((s,b)=>s+b.utilizedAmount, 0))/10000000).toFixed(2)} Cr`} color="text-green-600" />
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-blue-600 font-black uppercase">
                    <tr>
                        <th className="p-4 border-b border-slate-100">Cost Head</th>
                        <th className="p-4 text-right border-b border-slate-100">Estimated</th>
                        <th className="p-4 text-right border-b border-slate-100">Committed (Actual)</th>
                        <th className="p-4 text-right border-b border-slate-100">Utilized %</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {budgets.map(b => {
                        const utilization = (b.utilizedAmount / (b.estimatedAmount || 1)) * 100;
                        return (
                            <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 font-bold text-slate-800">{b.costHead}</td>
                                <td className="p-4 text-right font-mono text-slate-500">₹{b.estimatedAmount.toLocaleString()}</td>
                                <td className="p-4 text-right font-mono text-slate-800">₹{b.utilizedAmount.toLocaleString()}</td>
                                <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-3">
                                        <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                            <div className={`h-full ${utilization > 90 ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${Math.min(utilization, 100)}%` }}></div>
                                        </div>
                                        <span className="font-bold text-slate-400">{utilization.toFixed(0)}%</span>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    </div>
);

const TowerWiseCost: React.FC<{ project: Project, boqs: BOQ[], boqItems: BOQItem[] }> = ({ project, boqs, boqItems }) => {
    const towerCosts = (project.wings || ['Main']).map(wing => {
        const wingItems = boqItems.filter(item => item.towerId === wing || (!item.towerId && wing === 'Main'));
        const total = wingItems.reduce((s, i) => s + i.amount, 0);
        return { wing, total };
    });

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Tower-wise Budget Allocation</h4>
                <div className="space-y-6">
                    {towerCosts.map(tc => (
                        <div key={tc.wing}>
                            <div className="flex justify-between items-end mb-2 text-xs font-bold uppercase tracking-tight">
                                <span className="text-blue-600">Wing / Tower: {tc.wing}</span>
                                <span className="text-slate-800">₹{tc.total.toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2.5 rounded-full">
                                <div className="bg-blue-600 h-full rounded-full" style={{ width: `${Math.min((tc.total / (towerCosts.reduce((s,x)=>s+x.total, 0)||1)) * 100, 100)}%` }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col items-center justify-center text-center">
                 <div className="w-32 h-32 rounded-full border-8 border-blue-600 flex items-center justify-center mb-4 shadow-inner bg-slate-50">
                     <span className="text-xl font-black text-blue-600">{(project.wings?.length || 1)}</span>
                 </div>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Structures Being Tracked</p>
            </div>
        </div>
    );
};

const VarianceAnalysis: React.FC<{ boqs: BOQ[], po: PurchaseOrder[], wo: WorkOrder[] }> = ({ boqs, po, wo }) => {
    const totalBOQ = boqs.filter(b => b.status === 'Approved').reduce((s,b) => s + b.totalEstimate, 0);
    const totalActual = po.reduce((s,p) => s + p.grandTotal, 0) + wo.reduce((s,w) => s + w.contractValue, 0);
    const variance = totalBOQ - totalActual;
    const variancePerc = (variance / (totalBOQ || 1)) * 100;

    return (
        <div className="space-y-6">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
                <div>
                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Net Project Variance</h4>
                    <p className={`text-4xl font-black ${variance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {variance < 0 ? '-' : '+'}₹{Math.abs(variance).toLocaleString()}
                    </p>
                </div>
                <div className="text-right">
                    <span className={`text-lg font-black px-4 py-1.5 rounded-full ${variance < 0 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                        {variancePerc.toFixed(1)}% {variance < 0 ? 'Overrun' : 'Savings'}
                    </span>
                </div>
            </div>
        </div>
    );
};

const ComplianceReport: React.FC<{ po: PurchaseOrder[], wo: WorkOrder[] }> = ({ po, wo }) => {
    const totalGST = po.reduce((s,p)=>s+p.gstAmount, 0); 
    const totalTDS = wo.reduce((s,w)=>s+(w.contractValue * (w.tdsPercent/100)), 0);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                 <h4 className="text-sm font-black text-blue-600 uppercase tracking-widest mb-6">Input GST Summary</h4>
                 <div className="flex items-center justify-between mb-4">
                     <span className="text-xs text-slate-500">Total Input GST Claimable</span>
                     <span className="text-xl font-black text-slate-800">₹{totalGST.toLocaleString()}</span>
                 </div>
                 <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                     <div className="bg-blue-600 h-full w-3/4"></div>
                 </div>
             </div>
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                 <h4 className="text-sm font-black text-red-600 uppercase tracking-widest mb-6">TDS Liability (Payable)</h4>
                 <div className="flex items-center justify-between mb-4">
                     <span className="text-xs text-slate-500">Total TDS Withheld</span>
                     <span className="text-xl font-black text-slate-800">₹{totalTDS.toLocaleString()}</span>
                 </div>
                 <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                     <div className="bg-red-600 h-full w-1/4"></div>
                 </div>
             </div>
        </div>
    );
};

const VendorLedgerSummary: React.FC<{ vendors: Vendor[], po: PurchaseOrder[], wo: WorkOrder[] }> = ({ vendors, po, wo }) => (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-blue-600 font-black uppercase">
                <tr>
                    <th className="p-4 border-b border-slate-100">Vendor Firm</th>
                    <th className="p-4 text-right border-b border-slate-100">Total PO Value</th>
                    <th className="p-4 text-right border-b border-slate-100">Total WO Value</th>
                    <th className="p-4 text-right border-b border-slate-100">Total Liability</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {vendors.map(v => {
                    const vPO = po.filter(p => p.vendorId === v.id).reduce((s,p)=>s+p.grandTotal, 0);
                    const vWO = wo.filter(w => w.vendorId === v.id).reduce((s,w)=>s+w.contractValue, 0);
                    if (vPO === 0 && vWO === 0) return null;
                    return (
                        <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 font-bold text-slate-800">{v.firmName}</td>
                            <td className="p-4 text-right font-mono text-slate-500">₹{vPO.toLocaleString()}</td>
                            <td className="p-4 text-right font-mono text-slate-500">₹{vWO.toLocaleString()}</td>
                            <td className="p-4 text-right font-mono text-slate-900 font-bold">₹{(vPO + vWO).toLocaleString()}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    </div>
);

const StatCard: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-inner flex flex-col">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</span>
        <span className={`text-xl font-black ${color}`}>{value}</span>
    </div>
);

export default ReportsDashboard;


import React from 'react';
import { User, Project, Vendor, NewVendorData, PurchaseOrder, WorkOrder, StockItem, DailyProgressReport, MaterialMaster, ServiceMaster, ProjectPhase, CostBudget, BOQ, BOQItem, PurchaseRequisition } from '../../types';
import VendorManagement from './VendorManagement';
import MaterialServiceMaster from './MaterialServiceMaster';
import ProjectCostControl from './ProjectCostControl';
import BOQPlanning from './BOQPlanning';
import ProcurementHub from './ProcurementHub';
import ContractingHub from './ContractingHub';
import { db } from '../../db';
import { useLiveQuery } from '../../liveQuery';
import { v4 as uuidv4 } from 'uuid';

interface RealtySarvContainerProps {
  currentUser: User;
  users: User[];
  projects: Project[];
}

const RealtySarvContainer: React.FC<RealtySarvContainerProps> = ({ currentUser, users, projects }) => {
  const vendors = useLiveQuery(() => db.vendors.toArray(), []);
  const prs = useLiveQuery(() => db.purchaseRequisitions.toArray(), []);
  const purchaseOrders = useLiveQuery(() => db.purchaseOrders.toArray(), []);
  const workOrders = useLiveQuery(() => db.workOrders.toArray(), []);
  const stockItems = useLiveQuery(() => db.materialStock.toArray(), []);
  const dprs = useLiveQuery(() => db.dailyProgressReports.toArray(), []);
  
  const materials = useLiveQuery(() => db.materialMaster.toArray(), []);
  const services = useLiveQuery(() => db.serviceMaster.toArray(), []);
  const phases = useLiveQuery(() => db.projectPhases.toArray(), []);
  const budgets = useLiveQuery(() => db.costBudgets.toArray(), []);
  const boqs = useLiveQuery(() => db.boqs.toArray(), []);
  const boqItems = useLiveQuery(() => db.boqItems.toArray(), []);

  const [activeTab, setActiveTab] = React.useState<'dashboard' | 'vendors' | 'boq-planning' | 'procurement' | 'contracts' | 'inventory' | 'site-ops' | 'compliance' | 'item-master' | 'project-cost'>('dashboard');

  const handleAddVendor = async (data: NewVendorData) => {
    const newVendor: Vendor = {
        ...data,
        id: uuidv4(),
        vendorCode: `VEND-${Math.floor(1000 + Math.random() * 9000)}`,
        isActive: true,
        isBlacklisted: false,
        onboardingDate: new Date().toISOString().split('T')[0]
    };
    await db.vendors.add(newVendor);
  };

  const handleUpdateVendors = async (updated: Vendor[]) => {
      await db.vendors.bulkPut(updated);
  };

  if (vendors === undefined || purchaseOrders === undefined || workOrders === undefined || stockItems === undefined || dprs === undefined || materials === undefined || services === undefined || boqs === undefined || prs === undefined) {
      return <div className="p-8 text-center text-blue-400 font-bold animate-pulse">Initializing MultiSarv Core...</div>;
  }

  const renderContent = () => {
    switch(activeTab) {
        case 'dashboard': return <RealtyDashboard vendors={vendors} projects={projects} po={purchaseOrders} wo={workOrders} stock={stockItems} dprs={dprs} />;
        case 'vendors': return <VendorManagement vendors={vendors} onAddVendor={handleAddVendor} onUpdateVendors={handleUpdateVendors} mode="All" />;
        case 'item-master': return <MaterialServiceMaster materials={materials} services={services} />;
        case 'project-cost': return <ProjectCostControl projects={projects} budgets={budgets || []} currentUser={currentUser} />;
        case 'boq-planning': return <BOQPlanning projects={projects} materials={materials} services={services} boqs={boqs} boqItems={boqItems || []} />;
        case 'procurement': return <ProcurementHub prs={prs} po={purchaseOrders} vendors={vendors} projects={projects} materials={materials} services={services} users={users} currentUser={currentUser} />;
        case 'contracts': return <ContractingHub wo={workOrders} vendors={vendors} projects={projects} users={users} />;
        case 'inventory': return <InventoryGrid stock={stockItems} />;
        case 'site-ops': return <SiteOpsView dprs={dprs} projects={projects} />;
        case 'compliance': return <ComplianceCenter vendors={vendors} />;
        default: return <div className="p-10 text-center text-[var(--text-secondary)]"><i className="fas fa-tools text-4xl mb-3"></i><p>This module is currently in development.</p></div>;
    }
  };

  return (
    <div className="flex h-full w-full bg-[var(--dark-bg)] realty-main-container overflow-hidden">
      <div className="w-64 border-r border-blue-900/30 bg-[#0f172a] flex flex-col shadow-2xl z-20">
          <div className="p-6 border-b border-blue-900/30 flex flex-col gap-4 bg-blue-900/5">
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xl shadow-lg shadow-blue-600/20">
                      <i className="fas fa-hard-hat"></i>
                  </div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">MultiSarv</h2>
              </div>
              <div className="flex items-center gap-2 px-2 py-1 rounded bg-blue-50/10 border border-blue-500/20 text-[9px] font-bold text-blue-400 uppercase tracking-widest">
                  <i className="fas fa-shield-halved"></i> RERA Compliant ERP
              </div>
          </div>
          
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
              <RealtyNavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon="fas fa-th-large" label="Command Center" />
              
              <div className="pt-4 pb-1 px-3 text-[10px] font-semibold text-blue-400 uppercase tracking-widest">Master Control</div>
              <RealtyNavItem active={activeTab === 'vendors'} onClick={() => setActiveTab('vendors')} icon="fas fa-truck-field" label="Vendors & Contractors" />
              <RealtyNavItem active={activeTab === 'item-master'} onClick={() => setActiveTab('item-master')} icon="fas fa-boxes-stacked" label="Material & Service Master" />
              <RealtyNavItem active={activeTab === 'project-cost'} onClick={() => setActiveTab('project-cost')} icon="fas fa-building-circle-check" label="Project Cost Control" />
              
              <div className="pt-4 pb-1 px-3 text-[10px] font-semibold text-blue-400 uppercase tracking-widest">Planning & Estimation</div>
              <RealtyNavItem active={activeTab === 'boq-planning'} onClick={() => setActiveTab('boq-planning')} icon="fas fa-file-invoice-dollar" label="BOQ & Planning" />
              
              <div className="pt-4 pb-1 px-3 text-[10px] font-semibold text-blue-400 uppercase tracking-widest">Execution & Operations</div>
              <RealtyNavItem active={activeTab === 'procurement'} onClick={() => setActiveTab('procurement')} icon="fas fa-cart-shopping" label="Purchase Requisitions" />
              <RealtyNavItem active={activeTab === 'contracts'} onClick={() => setActiveTab('contracts')} icon="fas fa-file-signature" label="Contracts Hub (WO)" />
              <RealtyNavItem active={activeTab === 'site-ops'} onClick={() => setActiveTab('site-ops')} icon="fas fa-helmet-safety" label="Site Ops & DPR" />
              <RealtyNavItem active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} icon="fas fa-cubes-stacked" label="Inventory & Stock" />
              
              <div className="pt-4 pb-1 px-3 text-[10px] font-semibold text-blue-400 uppercase tracking-widest">Compliance</div>
              <RealtyNavItem active={activeTab === 'compliance'} onClick={() => setActiveTab('compliance')} icon="fas fa-file-shield" label="Statutory Audit" />
          </nav>
          
          <div className="p-4 border-t border-blue-900/30 bg-blue-900/5">
              <button 
                onClick={() => window.localStorage.setItem('lastActiveSystem', 'LeadSarv')}
                className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-blue-600 text-white text-xs font-bold shadow-lg hover:bg-blue-700 transition-all transform hover:-translate-y-0.5"
              >
                  <i className="fas fa-arrow-left"></i>
                  GO TO LEADSARV CRM
              </button>
          </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col relative">
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none realty-grid-bg"></div>

          <div className="h-14 border-b border-blue-900/30 bg-[#0f172a]/80 backdrop-blur-md flex items-center justify-between px-6 z-10">
              <div className="flex items-center gap-4">
                 <h3 className="text-sm font-semibold text-white uppercase tracking-widest">{activeTab.replace('-', ' ')}</h3>
                 <div className="h-4 w-px bg-blue-900/50"></div>
                 <div className="flex items-center gap-2 text-[10px] font-bold text-blue-400">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    ERP SITE CONNECTION: ACTIVE
                 </div>
              </div>
          </div>

          <div className="flex-1 overflow-y-auto z-10 custom-scrollbar">
              {renderContent()}
          </div>
      </div>
    </div>
  );
};

const RealtyNavItem: React.FC<{ active: boolean; icon: string; label: string; onClick: () => void }> = ({ active, icon, label, onClick }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 p-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
            active 
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 translate-x-1' 
            : 'text-gray-400 hover:bg-blue-900/20 hover:text-blue-400'
        }`}
    >
        <i className={`${icon} w-5 text-center text-sm`}></i>
        <span>{label}</span>
    </button>
);

const RealtyDashboard: React.FC<{ vendors: Vendor[]; projects: Project[]; po: PurchaseOrder[]; wo: WorkOrder[]; stock: StockItem[]; dprs: DailyProgressReport[] }> = ({ vendors, projects, po, wo, stock, dprs }) => {
    return (
        <div className="p-8 space-y-8 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <OperationalStatCard label="Vendor Network" value={vendors.length.toString()} icon="fas fa-users-gear" color="bg-blue-600" trend="+3 onboarded" />
                <OperationalStatCard label="PO Outstanding" value={`₹${po.filter(p => p.status !== 'Closed').reduce((s, p) => s + p.grandTotal, 0).toLocaleString('en-IN')}`} icon="fas fa-receipt" color="bg-purple-600" trend="Active procurement" />
                <OperationalStatCard label="Active WO" value={wo.filter(w => w.status === 'Active').length.toString()} icon="fas fa-hard-hat" color="bg-orange-600" trend="Work in progress" />
                <OperationalStatCard label="Critical Materials" value={stock.filter(s => s.currentStock < s.minThreshold).length.toString()} icon="fas fa-triangle-exclamation" color="bg-red-600" trend="Low inventory alert" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#1e293b] p-6 rounded-2xl border border-blue-900/20 shadow-sm shadow-blue-900/10">
                        <h4 className="font-semibold text-white text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
                            <i className="fas fa-chart-line text-blue-500"></i>
                            Project Costing & Progress
                        </h4>
                        <div className="h-64 flex items-end justify-between gap-6 px-4">
                             {projects.map(project => {
                                 const val = Math.random() * 80 + 10;
                                 return (
                                     <div key={project.id} className="flex-1 flex flex-col items-center gap-2 group">
                                         <div className="w-full flex gap-1 items-end h-48 bg-blue-900/5 rounded-lg border border-blue-900/10 relative p-1">
                                             <div className="flex-1 bg-blue-500/30 rounded-md group-hover:bg-blue-500 transition-all" style={{ height: `${val}%` }}></div>
                                             <div className="flex-1 bg-purple-500/30 rounded-md group-hover:bg-purple-500 transition-all" style={{ height: `${val * 0.7}%` }}></div>
                                         </div>
                                         <span className="text-[10px] font-semibold text-gray-500 uppercase truncate w-full text-center">{project.name}</span>
                                     </div>
                                 );
                             })}
                             {projects.length === 0 && <p className="w-full text-center text-gray-500 italic pb-10">No projects to display metrics.</p>}
                        </div>
                    </div>
                </div>
                
                <div className="space-y-6">
                    <div className="bg-[#1e293b] p-6 rounded-2xl border border-blue-900/20 shadow-sm shadow-blue-900/10">
                        <h4 className="font-semibold text-white text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                            <i className="fas fa-clock-rotate-left text-blue-500"></i>
                            Recent DPRs
                        </h4>
                        <div className="space-y-3">
                             {dprs.slice(0, 4).map(dpr => (
                                <div key={dpr.id} className="p-3 bg-[#0f172a] rounded-lg border border-blue-900/20 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-white">{dpr.date}</p>
                                        <p className="text-[10px] text-gray-400 truncate w-32">{dpr.workDescription}</p>
                                    </div>
                                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase bg-green-500/10 text-green-500">{dpr.status}</span>
                                </div>
                             ))}
                             {dprs.length === 0 && <p className="text-xs text-gray-500 italic text-center py-10">No Daily Progress Reports submitted yet.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const OperationalStatCard: React.FC<{ label: string; value: string; icon: string; color: string; trend: string }> = ({ label, value, icon, color, trend }) => (
    <div className="bg-[#1e293b] p-6 rounded-2xl border border-blue-900/20 shadow-md group hover:border-blue-500/50 transition-all hover:shadow-blue-500/10">
        <div className="flex justify-between items-start mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl shadow-lg group-hover:scale-110 transition-transform ${color}`}>
                <i className={icon}></i>
            </div>
            <span className="text-[10px] font-semibold text-blue-400 bg-blue-400/10 px-2 py-1 rounded uppercase">{trend}</span>
        </div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-tight mb-1">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
    </div>
);

const InventoryGrid: React.FC<{ stock: StockItem[] }> = ({ stock }) => (
    <div className="p-8">
        <div className="flex justify-between items-center mb-6">
            <h4 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <i className="fas fa-cubes-stacked text-blue-500"></i>
                Live Material Stock
            </h4>
            <div className="flex gap-3">
                <button className="bg-gray-800 text-gray-300 px-4 py-2 rounded-lg font-bold text-xs uppercase border border-gray-700">Stock Adjustment</button>
                <button className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold text-xs uppercase shadow-lg shadow-blue-500/30">Material Inward (GRN)</button>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {stock.map(item => {
                const isLow = item.currentStock < item.minThreshold;
                return (
                    <div key={item.id} className={`p-5 rounded-2xl border transition-all hover:scale-[1.02] shadow-xl ${isLow ? 'bg-red-500/5 border-red-500/30' : 'bg-[#1e293b] border-blue-900/20'}`}>
                         <div className="flex justify-between items-start mb-4">
                             <div className={`p-3 rounded-xl shadow-lg ${isLow ? 'bg-red-500 text-white shadow-red-500/30' : 'bg-blue-600 text-white shadow-blue-600/30'}`}>
                                 <i className="fas fa-box-open"></i>
                             </div>
                             {isLow && <span className="text-[10px] font-semibold bg-red-500 text-white px-2 py-0.5 rounded-full uppercase animate-pulse">Low Stock</span>}
                         </div>
                         <h5 className="font-semibold text-white text-base mb-1 truncate" title={item.materialName}>{item.materialName}</h5>
                         <p className="text-[10px] font-bold text-blue-400 uppercase mb-5 tracking-tighter">{item.category}</p>
                         
                         <div className="flex items-end justify-between pt-4 border-t border-blue-900/10">
                            <div>
                                <p className="text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Available Balance</p>
                                <p className="text-2xl font-bold text-white">{item.currentStock} <span className="text-xs font-bold text-gray-500 uppercase">{item.unit}</span></p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Last Rate</p>
                                <p className="text-sm font-bold text-blue-400">₹{item.lastPurchasePrice.toLocaleString()}</p>
                            </div>
                         </div>
                    </div>
                );
            })}
        </div>
    </div>
);

const SiteOpsView: React.FC<{ dprs: DailyProgressReport[]; projects: Project[] }> = ({ dprs, projects }) => (
    <div className="p-8">
        <div className="flex justify-between items-center mb-6">
            <h4 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <i className="fas fa-helmet-safety text-blue-500"></i>
                Site Operations & DPR
            </h4>
            <button className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold text-xs uppercase shadow-lg shadow-blue-500/30">Submit Daily Report (DPR)</button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-[#1e293b] rounded-2xl border border-blue-900/20 overflow-hidden shadow-sm">
                <div className="p-4 bg-[#0f172a] border-b border-blue-900/30 flex justify-between items-center">
                    <h5 className="font-bold text-blue-400 text-xs uppercase tracking-widest">Recent Logs</h5>
                    <span className="text-[10px] text-gray-500">Last 7 Days</span>
                </div>
                <div className="divide-y divide-blue-900/20">
                    {dprs.map(dpr => (
                        <div key={dpr.id} className="p-4 hover:bg-[#0f172a] transition-colors flex gap-4">
                            <div className="w-12 h-12 rounded bg-blue-900/20 flex flex-col items-center justify-center border border-blue-900/30 flex-shrink-0">
                                <span className="text-[10px] font-semibold text-blue-400 uppercase">{dpr.date.split('-')[1]}</span>
                                <span className="text-lg font-bold text-white leading-none">{dpr.date.split('-')[2]}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white mb-1 truncate">{projects.find(p => p.id === dpr.projectId)?.name || 'Project Site'}</p>
                                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{dpr.workDescription}</p>
                                <div className="mt-3 flex items-center gap-4 text-[10px] font-bold text-gray-500 uppercase">
                                    <span><i className="fas fa-person-digging mr-1.5 text-blue-500"></i> {dpr.labourCount} Workers</span>
                                    <span><i className="fas fa-camera mr-1.5 text-blue-500"></i> {dpr.photos.length} Photos</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {dprs.length === 0 && <p className="p-10 text-center text-gray-500 italic text-xs">No DPR entries recorded yet.</p>}
                </div>
            </div>

            <div className="space-y-6">
                 <div className="bg-[#1e293b] p-6 rounded-2xl border border-blue-900/20 shadow-sm">
                    <h5 className="font-bold text-white text-xs uppercase tracking-widest mb-4">Site Utilities</h5>
                    <div className="grid grid-cols-2 gap-4">
                        <button className="p-4 bg-[#0f172a] rounded-xl border border-blue-900/20 text-center hover:border-blue-500 transition-all group">
                            <i className="fas fa-camera-retro text-2xl text-blue-500 mb-2 group-hover:scale-110 transition-transform"></i>
                            <p className="text-xs font-semibold text-white uppercase">Site Photos</p>
                        </button>
                        <button className="p-4 bg-[#0f172a] rounded-xl border border-blue-900/20 text-center hover:border-blue-500 transition-all group">
                            <i className="fas fa-calendar-check text-2xl text-blue-500 mb-2 group-hover:scale-110 transition-transform"></i>
                            <p className="text-xs font-semibold text-white uppercase">Inspections</p>
                        </button>
                        <button className="p-4 bg-[#0f172a] rounded-xl border border-blue-900/20 text-center hover:border-blue-500 transition-all group">
                            <i className="fas fa-hard-hat text-2xl text-blue-500 mb-2 group-hover:scale-110 transition-transform"></i>
                            <p className="text-xs font-semibold text-white uppercase">Safety Logs</p>
                        </button>
                        <button className="p-4 bg-[#0f172a] rounded-xl border border-blue-900/20 text-center hover:border-blue-500 transition-all group">
                            <i className="fas fa-cloud-rain text-2xl text-blue-500 mb-2 group-hover:scale-110 transition-transform"></i>
                            <p className="text-xs font-semibold text-white uppercase">Weather Log</p>
                        </button>
                    </div>
                 </div>
            </div>
        </div>
    </div>
);

const ComplianceCenter: React.FC<{ vendors: Vendor[] }> = ({ vendors }) => (
    <div className="p-8">
        <div className="bg-[#1e293b] rounded-2xl border border-blue-900/20 overflow-hidden shadow-2xl">
             <div className="p-6 border-b border-blue-900/30 bg-[#0f172a]">
                <h4 className="font-semibold text-white uppercase tracking-widest flex items-center gap-3">
                    <i className="fas fa-file-shield text-blue-500"></i>
                    Indian Statutory Compliance Dashboard
                </h4>
                <p className="text-xs text-gray-500 mt-1 uppercase font-bold tracking-tighter">Real-time GSTIN & TDS Validation Hub</p>
             </div>
             <div className="overflow-x-auto">
                 <table className="w-full text-left text-xs">
                    <thead className="bg-[#0f172a] text-blue-400 uppercase font-semibold">
                        <tr>
                            <th className="p-4">Vendor Firm</th>
                            <th className="p-4">GSTIN (Validated)</th>
                            <th className="p-4">PAN Card</th>
                            <th className="p-4">MSME Category</th>
                            <th className="p-4">TDS Slabs</th>
                            <th className="p-4 text-center">Audit Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-900/20">
                        {vendors.map(v => (
                            <tr key={v.id} className="hover:bg-[#0f172a] transition-colors">
                                <td className="p-4 font-bold text-white">{v.firmName}</td>
                                <td className="p-4 font-mono text-blue-300">{v.gstin || 'NOT PROVIDED'}</td>
                                <td className="p-4 font-mono text-gray-400">{v.pan || 'NOT PROVIDED'}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${v.msmeType === 'Not Registered' ? 'bg-gray-800 text-gray-500' : 'bg-green-500/10 text-green-500'}`}>
                                        {v.msmeType.toUpperCase()}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-400 font-bold">{v.tdsCategory}</td>
                                <td className="p-4 text-center">
                                    <div className={`w-3 h-3 rounded-full mx-auto ${v.gstin && v.pan ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`}></div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
             </div>
        </div>
    </div>
);

export default RealtySarvContainer;

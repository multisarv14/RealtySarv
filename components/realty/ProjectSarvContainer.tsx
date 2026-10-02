
import React from 'react';
import { User, Project, Vendor, NewVendorData, PurchaseOrder, WorkOrder, StockItem, DailyProgressReport, MaterialMaster, ServiceMaster, ProjectPhase, CostBudget, BOQ, BOQItem, PurchaseRequisition, SystemType } from '../../types';
import VendorManagement from './VendorManagement';
import MaterialServiceMaster from './MaterialServiceMaster';
import ProjectCostControl from './ProjectCostControl';
import BOQPlanning from './BOQPlanning';
import ProjectPlanning from './ProjectPlanning';
import ProcurementHub from './ProcurementHub';
import ContractingHub from './ContractingHub';
import ApprovalCenter from './ApprovalCenter';
import AuditTrailView from './AuditTrailView';
import ReportsDashboard from './ReportsDashboard';
import CostHeadMaster from './CostHeadMaster';
import { db } from '../../db';
import { useLiveQuery } from '../../liveQuery';
import { v4 as uuidv4 } from 'uuid';

interface ProjectSarvContainerProps {
  currentUser: User;
  users: User[];
  projects: Project[];
  onSwitchSystem: (system: SystemType) => void;
}

type TabType = 'dashboard' | 'approvals' | 'vendor-master' | 'contractor-master' | 'cost-head-master' | 'boq-master' | 'project-planning' | 'procurement' | 'contracts' | 'inventory' | 'site-ops' | 'audit' | 'item-master' | 'service-master' | 'project-cost' | 'reports' | 'grn' | 'material-issue' | 'measurement-book' | 'vendor-invoice' | 'payments' | 'gst-tds';

interface MenuSection {
    id: string;
    label: string;
    icon: string;
    items?: { id: TabType; label: string; icon: string }[];
    standalone?: TabType;
}

const ProjectSarvContainer: React.FC<ProjectSarvContainerProps> = ({ currentUser, users, projects, onSwitchSystem }) => {
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

  const [activeTab, setActiveTab] = React.useState<TabType>('dashboard');
  const [expandedSections, setExpandedSections] = React.useState<string[]>(['masters', 'planning']);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [selectedProjectId, setSelectedProjectId] = React.useState(projects[0]?.id || '');

  const toggleSection = (sectionId: string) => {
      setExpandedSections(prev => prev.includes(sectionId) ? prev.filter(id => id !== sectionId) : [...prev, sectionId]);
  };

  const getTabTitle = (tab: TabType) => {
    switch(tab) {
        case 'dashboard': return 'Command Center';
        case 'grn': return 'Goods Receipt Note';
        case 'material-issue': return 'Material Issue Note';
        case 'measurement-book': return 'Measurement Book';
        case 'vendor-invoice': return 'Vendor Invoices';
        case 'gst-tds': return 'GST & TDS Compliance';
        default: return (tab as string).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }
  };

  const menuConfig: MenuSection[] = [
      { id: 'dash', label: 'Command Center', icon: 'fas fa-th-large', standalone: 'dashboard' },
      { id: 'approvals', label: 'Approval Center', icon: 'fas fa-stamp', standalone: 'approvals' },
      { id: 'reports', label: 'Analytics Hub', icon: 'fas fa-chart-line', standalone: 'reports' },
      { id: 'masters', label: 'Master Data', icon: 'fas fa-database', items: [
          { id: 'vendor-master', label: 'Vendor Master', icon: 'fas fa-truck-field' },
          { id: 'contractor-master', label: 'Contractor Master', icon: 'fas fa-user-gear' },
          { id: 'item-master', label: 'Item Master', icon: 'fas fa-boxes-stacked' },
          { id: 'service-master', label: 'Service Master', icon: 'fas fa-handholding-hand' },
          { id: 'cost-head-master', label: 'Project Cost Heads', icon: 'fas fa-tags' },
      ]},
      { id: 'planning', label: 'Planning & Budget', icon: 'fas fa-calendar-check', items: [
          { id: 'project-planning', label: 'Project Planning', icon: 'fas fa-calendar-alt' },
          { id: 'boq-master', label: 'BOQ Master', icon: 'fas fa-file-invoice-dollar' },
          { id: 'project-cost', label: 'Cost Control', icon: 'fas fa-building-circle-check' },
      ]},
      { id: 'procurement_sec', label: 'Procurement', icon: 'fas fa-cart-shopping', items: [
          { id: 'procurement', label: 'Purchase (PR/PO)', icon: 'fas fa-cart-arrow-down' },
          { id: 'contracts', label: 'Contracts (WO)', icon: 'fas fa-file-signature' },
      ]},
      { id: 'site_ops_sec', label: 'Site Operations', icon: 'fas fa-helmet-safety', items: [
          { id: 'grn', label: 'GRN (Store Inward)', icon: 'fas fa-truck-ramp-box' },
          { id: 'material-issue', label: 'Material Issue', icon: 'fas fa-dolly' },
          { id: 'measurement-book', label: 'Measurement Book', icon: 'fas fa-ruler-combined' },
          { id: 'site-ops', label: 'Daily Site Logs', icon: 'fas fa-person-digging' },
          { id: 'inventory', label: 'Site Store Ledger', icon: 'fas fa-cubes-stacked' },
      ]},
  ];

  const handleAddVendor = async (data: NewVendorData) => {
    const newVendor: Vendor = { ...data, id: uuidv4(), vendorCode: `VEND-${Math.floor(1000 + Math.random() * 9000)}`, isActive: true, isBlacklisted: false, onboardingDate: new Date().toISOString().split('T')[0] };
    await db.vendors.add(newVendor);
  };

  const handleUpdateVendors = async (updated: Vendor[]) => { await db.vendors.bulkPut(updated); };

  if (vendors === undefined || purchaseOrders === undefined || workOrders === undefined || stockItems === undefined || dprs === undefined || materials === undefined || services === undefined || boqs === undefined || prs === undefined) {
      return <div className="p-8 text-center text-[var(--primary-color)] font-bold animate-pulse">Initializing Console...</div>;
  }

  const renderContent = () => {
    switch(activeTab) {
        case 'dashboard': return <RealtyDashboard vendors={vendors} projects={projects} po={purchaseOrders} wo={workOrders} stock={stockItems} dprs={dprs} />;
        case 'approvals': return <ApprovalCenter currentUser={currentUser} />;
        case 'vendor-master': return <VendorManagement vendors={vendors} onAddVendor={handleAddVendor} onUpdateVendors={handleUpdateVendors} mode="Vendors" />;
        case 'contractor-master': return <VendorManagement vendors={vendors} onAddVendor={handleAddVendor} onUpdateVendors={handleUpdateVendors} mode="Contractors" />;
        case 'item-master': return <MaterialServiceMaster materials={materials} services={services} forceMode="materials" />;
        case 'service-master': return <MaterialServiceMaster materials={materials} services={services} forceMode="services" />;
        case 'cost-head-master': return <CostHeadMaster />;
        case 'project-cost': return <ProjectCostControl projects={projects} budgets={budgets || []} currentUser={currentUser} />;
        case 'project-planning': return <ProjectPlanning projects={projects} phases={phases || []} />;
        case 'boq-master': return <BOQPlanning projects={projects} materials={materials} services={services} boqs={boqs} boqItems={boqItems || []} />;
        case 'procurement': return <ProcurementHub prs={prs} po={purchaseOrders} vendors={vendors} projects={projects} materials={materials} services={services} users={users} currentUser={currentUser} />;
        case 'contracts': return <ContractingHub wo={workOrders} vendors={vendors} projects={projects} users={users} />;
        case 'inventory': return <InventoryGrid stock={stockItems} />;
        case 'site-ops': return <SiteOpsView dprs={dprs} projects={projects} />;
        case 'audit': return <AuditTrailView />;
        case 'reports': return <ReportsDashboard projects={projects} vendors={vendors} />;
        default: return <div className="p-10 text-center text-[var(--text-secondary)]"><i className="fas fa-tools text-4xl mb-3"></i><p>This module is currently in development.</p></div>;
    }
  };

  return (
    <div className="flex h-full w-full bg-[#f1f3f4] realty-main-container overflow-hidden">
      <div className="fixed top-0 left-0 right-0 h-[48px] bg-[#1a73e8] flex items-center justify-between px-4 z-[60] shadow-md">
          <div className="flex items-center gap-6">
              <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="text-white hover:bg-white/10 p-2 rounded-full transition-colors"><i className="fas fa-bars"></i></button>
              <div className="flex items-center gap-2">
                  <span className="text-white text-lg font-medium tracking-tight whitespace-nowrap">RealtySarv</span>
                  <div className="h-4 w-px bg-white/20 mx-2"></div>
                  <div className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1 rounded transition-colors cursor-pointer group">
                      <i className="fas fa-folder text-white/70"></i>
                      <select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer appearance-none">
                          {projects.map(p => <option key={p.id} value={p.id} className="text-black">{p.name}</option>)}
                      </select>
                      <i className="fas fa-chevron-down text-[10px] text-white/70"></i>
                  </div>
              </div>
          </div>
          <div className="flex items-center gap-4">
              <button onClick={() => onSwitchSystem('LeadSarv')} className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold uppercase px-3 py-1.5 rounded transition-all">Go to CRM</button>
              <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white/20">{currentUser.name.charAt(0)}</div>
          </div>
      </div>

      <div className={`${sidebarCollapsed ? 'w-0' : 'w-64'} mt-[48px] border-r border-[#dadce0] bg-white flex flex-col transition-all duration-300 z-50 overflow-hidden`}>
          <div className="p-4 border-b border-[#dadce0] flex items-center justify-between"><h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Resources</h3></div>
          <nav className="flex-1 py-2 overflow-y-auto custom-scrollbar">
              {menuConfig.map((section) => (
                  <div key={section.id} className="mb-0.5">
                      {section.standalone ? (
                          <button onClick={() => setActiveTab(section.standalone!)} className={`w-full flex items-center gap-4 px-6 py-2.5 text-sm transition-all ${activeTab === section.standalone ? 'text-[#1a73e8] bg-[#e8f0fe] font-semibold border-r-4 border-[#1a73e8]' : 'text-[#3c4043] hover:bg-gray-100'}`}>
                            <i className={`${section.icon} w-5 text-center text-base ${activeTab === section.standalone ? 'text-[#1a73e8]' : 'text-gray-400'}`}></i>
                            <span>{section.label}</span>
                          </button>
                      ) : (
                          <>
                            <button onClick={() => toggleSection(section.id)} className={`w-full flex items-center justify-between px-6 py-2.5 text-sm transition-all ${expandedSections.includes(section.id) ? 'text-[#3c4043] font-bold' : 'text-[#3c4043] hover:bg-gray-100'}`}>
                                <div className="flex items-center gap-4"><i className={`${section.icon} w-5 text-center text-base text-gray-400`}></i><span>{section.label}</span></div>
                                <i className={`fas fa-chevron-right text-[10px] transition-transform duration-300 ${expandedSections.includes(section.id) ? 'rotate-90' : ''}`}></i>
                            </button>
                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedSections.includes(section.id) ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="space-y-0.5">
                                    {section.items?.map((item) => (
                                        <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-4 pl-12 pr-6 py-2.5 text-[13px] transition-all ${activeTab === item.id ? 'text-[#1a73e8] bg-[#e8f0fe] font-semibold border-r-4 border-[#1a73e8]' : 'text-[#3c4043] hover:bg-gray-100'}`}>
                                            <i className={`${item.icon} w-4 text-center ${activeTab === item.id ? 'text-[#1a73e8]' : 'text-gray-400'}`}></i>
                                            <span>{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                          </>
                      )}
                  </div>
              ))}
          </nav>
      </div>

      <div className="flex-1 mt-[48px] overflow-hidden flex flex-col relative bg-[#f8f9fa]">
          <div className="h-[48px] border-b border-[#dadce0] bg-white flex items-center justify-between px-6 z-10">
              <div className="flex items-center gap-2 text-sm">
                 <span className="text-[#1a73e8] hover:underline cursor-pointer">RealtySarv-ERP</span>
                 <i className="fas fa-chevron-right text-[10px] text-gray-400"></i>
                 <span className="text-gray-900 font-medium">{getTabTitle(activeTab)}</span>
              </div>
          </div>
          <div className="flex-1 overflow-y-auto z-10 custom-scrollbar">{renderContent()}</div>
      </div>
    </div>
  );
};

const RealtyNavItem: React.FC<{ active: boolean; icon: string; label: string; onClick: () => void }> = ({ active, icon, label, onClick }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 p-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 translate-x-1' : 'text-gray-400 hover:bg-blue-900/20 hover:text-blue-400'}`}>
        <i className={`${icon} w-5 text-center text-sm`}></i>
        <span>{label}</span>
    </button>
);

const RealtyDashboard: React.FC<{ vendors: Vendor[]; projects: Project[]; po: PurchaseOrder[]; wo: WorkOrder[]; stock: StockItem[]; dprs: DailyProgressReport[] }> = ({ vendors, projects, po, wo, stock, dprs }) => {
    return (
        <div className="p-6 space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <OperationalStatCard label="Vendor Network" value={vendors.length.toString()} icon="fas fa-users-gear" accentColor="bg-blue-600" description="Total registered partners" />
                <OperationalStatCard label="PO Pipeline" value={`₹${(po.filter(p => p.status !== 'Closed').reduce((s, p) => s + p.grandTotal, 0) / 100000).toFixed(1)}L`} icon="fas fa-receipt" accentColor="bg-blue-600" description="Unbilled Purchase Orders" />
                <OperationalStatCard label="Active Work" value={wo.filter(w => w.status === 'Active').length.toString()} icon="fas fa-hard-hat" accentColor="bg-blue-600" description="Contracts in execution" />
                <OperationalStatCard label="Critical Items" value={stock.filter(s => s.currentStock < s.minThreshold).length.toString()} icon="fas fa-triangle-exclamation" accentColor="bg-red-500" description="Below stock threshold" />
            </div>
        </div>
    );
};

const OperationalStatCard: React.FC<{ label: string; value: string; icon: string; accentColor: string; description: string }> = ({ label, value, icon, accentColor, description }) => (
    <div className="bg-white p-5 rounded border border-[#dadce0] shadow-sm hover:shadow-md transition-all group flex flex-col h-full">
        <div className="flex items-center gap-3 mb-4"><div className={`w-8 h-8 rounded flex items-center justify-center text-white text-sm shadow-sm ${accentColor}`}><i className={icon}></i></div><span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{label}</span></div>
        <p className="text-3xl font-light text-gray-900 mb-1">{value}</p>
        <p className="text-xs text-gray-500 mt-auto">{description}</p>
    </div>
);

const InventoryGrid: React.FC<{ stock: StockItem[] }> = ({ stock }) => (
    <div className="p-6">
        <div className="bg-white rounded border border-[#dadce0] shadow-sm overflow-hidden">
             <div className="p-4 border-b border-[#dadce0] flex justify-between items-center bg-[#f8f9fa]"><h4 className="font-medium text-gray-900">Active Stock Management</h4></div>
             <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                    <thead className="bg-[#f8f9fa] text-gray-700 font-semibold border-b border-[#dadce0]"><tr><th className="p-3">Material Nomenclature</th><th className="p-3 text-right">On Hand</th><th className="p-3 text-center">Health</th></tr></thead>
                    <tbody className="divide-y divide-[#dadce0]">
                        {stock.map(item => (
                            <tr key={item.id} className="hover:bg-[#f8f9fa]">
                                <td className="p-3 text-[#1a73e8] font-medium">{item.materialName}</td>
                                <td className="p-3 text-right font-medium text-gray-900">{item.currentStock} {item.unit}</td>
                                <td className="p-3 text-center">{item.currentStock < item.minThreshold ? <span className="text-red-500 text-xs font-bold uppercase">Low</span> : <span className="text-green-600 text-xs font-bold uppercase">Stable</span>}</td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
             </div>
        </div>
    </div>
);

const SiteOpsView: React.FC<{ dprs: DailyProgressReport[]; projects: Project[] }> = ({ dprs, projects }) => (
    <div className="p-6 space-y-6">
        <div className="bg-white rounded border border-[#dadce0] overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
                <thead className="bg-[#f8f9fa] text-gray-600 font-semibold border-b border-[#dadce0]"><tr><th className="p-4">Date</th><th className="p-4">Execution Summary</th><th className="p-4 text-center">Log Status</th></tr></thead>
                <tbody className="divide-y divide-[#dadce0]">
                    {dprs.map(dpr => (
                        <tr key={dpr.id} className="hover:bg-[#f8f9fa]">
                            <td className="p-4 font-mono text-gray-900">{dpr.date}</td>
                            <td className="p-4 text-gray-500 max-w-md truncate">{dpr.workDescription}</td>
                            <td className="p-4 text-center"><span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-[#e8f0fe] text-[#1a73e8]">{dpr.status}</span></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

export default ProjectSarvContainer;

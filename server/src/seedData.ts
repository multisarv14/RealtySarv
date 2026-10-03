import bcrypt from 'bcryptjs';
import { TenantModels } from './models';
import { toDoc } from './models';
import * as C from '../../constants';

// Same starter data the browser used to put in IndexedDB on first load.
const data: Record<string, any[]> = {
  users: C.INITIAL_USERS, leads: C.INITIAL_LEADS, projects: C.INITIAL_PROJECTS, sources: C.INITIAL_SOURCES,
  templates: C.INITIAL_TEMPLATES, paymentPlans: C.INITIAL_PAYMENT_PLANS, budgets: C.INITIAL_BUDGETS,
  clientProfiles: C.INITIAL_CLIENT_PROFILES, unitTypes: C.INITIAL_UNIT_TYPES, locationSettings: C.INITIAL_LOCATION_SETTINGS,
  livingPlaces: C.INITIAL_LIVING_PLACES, leadStatusTypes: C.INITIAL_LEAD_STATUS_TYPES,
  siteVisitStatusTypes: C.INITIAL_SITE_VISIT_STATUS_TYPES, taskPriorityTypes: C.INITIAL_TASK_PRIORITY_TYPES,
  bookingStatusTypes: C.INITIAL_BOOKING_STATUS_TYPES, agreementStatusTypes: C.INITIAL_AGREEMENT_STATUS_TYPES,
  possessionStatusTypes: C.INITIAL_POSSESSION_STATUS_TYPES, inventoryStatusTypes: C.INITIAL_INVENTORY_STATUS_TYPES,
  projectTypeTypes: C.INITIAL_PROJECT_TYPE_TYPES, projectStatusTypes: C.INITIAL_PROJECT_STATUS_TYPES,
  userRoleSettings: C.INITIAL_USER_ROLE_SETTINGS, userDesignations: C.INITIAL_USER_DESIGNATIONS,
  channelPartners: C.INITIAL_CHANNEL_PARTNERS, distributionRules: C.INITIAL_DISTRIBUTION_RULES, formFieldConfigs: C.INITIAL_FORM_FIELD_CONFIGS,
  companyProfile: [C.INITIAL_COMPANY_PROFILE],
  financialSettings: [{ id: 1, ...C.INITIAL_FINANCIAL_SETTINGS }],
  applicationSettings: [{ id: 1, ...C.INITIAL_APPLICATION_SETTINGS }],
  ledgerAccounts: [
    { id: 'l1', name: 'HDFC Bank - 0012', code: 'BANK001', group: 'Assets', openingBalance: 5000000, currentBalance: 5000000, isSystem: true },
    { id: 'l2', name: 'GST Input Credit', code: 'GST001', group: 'Assets', openingBalance: 0, currentBalance: 0, isSystem: true },
    { id: 'l3', name: 'GST Output Payable', code: 'GST002', group: 'Liabilities', openingBalance: 0, currentBalance: 0, isSystem: true },
    { id: 'l4', name: 'Accounts Payable', code: 'AP001', group: 'Liabilities', openingBalance: 0, currentBalance: 0, isSystem: true },
    { id: 'l5', name: 'Advance from Customers', code: 'AR001', group: 'Liabilities', openingBalance: 0, currentBalance: 0, isSystem: true },
    { id: 'l6', name: 'Project Revenue', code: 'REV001', group: 'Income', openingBalance: 0, currentBalance: 0, isSystem: true },
    { id: 'l7', name: 'Material Procurement', code: 'EXP001', group: 'Expenses', openingBalance: 0, currentBalance: 0, isSystem: true },
  ],
  materialMaster: [
    { id: 'm1', itemCode: 'MAT-0001', name: 'Cement (OPC 53)', category: 'Cement', uom: 'Bag', hsnCode: '2523', gstPercent: 28, standardWastage: 2, qualityGrade: 'IS 12269', isActive: true },
    { id: 'm2', itemCode: 'MAT-0002', name: 'Steel (TMT 12mm)', category: 'Steel', uom: 'MT', hsnCode: '7214', gstPercent: 18, standardWastage: 5, qualityGrade: 'Fe 500D', isActive: true },
  ],
  serviceMaster: [{ id: 's1', serviceCode: 'SRV-0001', name: 'Excavation - Hard Rock', category: 'Excavation', uom: 'Cum', sacCode: '9954', gstPercent: 18, isActive: true }],
  materialStock: [
    { id: 'ms1', materialName: 'Cement (OPC)', unit: 'Bags', category: 'Raw Materials', currentStock: 450, minThreshold: 100, lastPurchasePrice: 380 },
    { id: 'ms2', materialName: 'Steel Reinforcement 12mm', unit: 'MT', category: 'Raw Materials', currentStock: 12, minThreshold: 5, lastPurchasePrice: 62000 },
  ],
  approvalRules: [
    { id: 'rule-1', module: 'PR', minAmount: 0, maxAmount: 50000, workflowSteps: ['Project Mgr'] },
    { id: 'rule-2', module: 'PR', minAmount: 50001, maxAmount: 500000, workflowSteps: ['Project Mgr', 'Accounts'] },
    { id: 'rule-3', module: 'PR', minAmount: 500001, maxAmount: 100000000, workflowSteps: ['Project Mgr', 'Accounts', 'Director'] },
  ],
  costHeadMaster: [
    { id: 'ch1', name: 'Land & Legal Cost', category: 'Direct', description: 'Land acquisition, registry and lawyer fees.', isActive: true },
    { id: 'ch2', name: 'Approval & Liaison', category: 'Direct', description: 'Government approvals, RERA, and architect fees.', isActive: true },
    { id: 'ch3', name: 'Civil: Foundation', category: 'Construction', description: 'Excavation, piling and sub-structure.', isActive: true },
    { id: 'ch4', name: 'Civil: RCC Structure', category: 'Construction', description: 'Slab casting, columns and structural steel.', isActive: true },
    { id: 'ch9', name: 'Marketing & Sales', category: 'Indirect', description: 'Advertisements, events and sales commissions.', isActive: true },
  ],
};


// Tables that hold a tenant's own business data. A brand-new tenant starts with these empty
// (but keeps the configuration/master-data tables above), exactly like the old install wizard.
export const OPERATIONAL = [
  'users', 'leads', 'projects', 'channelPartners', 'distributionRules', 'vendors', 'purchaseRequisitions', 'purchaseOrders', 'workOrders',
  'materialStock', 'dailyProgressReports', 'projectPhases', 'costBudgets', 'boqs', 'boqItems', 'vouchers', 'gstEntries',
];

/** Fill a tenant database with starter data. demo=true also loads the sample leads/projects/users. */
export async function seedTenant(models: TenantModels, opts: { demo: boolean }): Promise<void> {
  for (const [name, rows] of Object.entries(data)) {
    if (!opts.demo && OPERATIONAL.includes(name)) continue;
    const docs = [];
    for (const r of rows) {
      const { password, ...rest } = r as any;
      const d = toDoc(name, rest);
      if (name === 'users') {
        d.email = d.email?.toLowerCase();
        if (password) d.passwordHash = await bcrypt.hash(String(password), 10);
      }
      docs.push(d);
    }
    if (docs.length) await models[name].insertMany(docs);
  }
}

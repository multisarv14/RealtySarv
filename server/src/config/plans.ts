// What each plan includes. The wizard, the landing page (plans.ts at the repo root) and the API must agree.
export interface PlanSpec {
  modules: { crm: boolean; erp: boolean }; // erp covers ProjectSarv and FinanceSarv
  maxUsers: number | null; // active users; null = unlimited
}

export const PLAN_SPECS: Record<string, PlanSpec> = {
  'Growth Hub': { modules: { crm: true, erp: false }, maxUsers: 10 },
  'Ultimate Stack': { modules: { crm: true, erp: true }, maxUsers: null },
};

// Collections that belong to ProjectSarv ERP and FinanceSarv. Plans without the erp module can't read or write them.
export const ERP_COLLECTIONS = new Set([
  'vendors', 'purchaseRequisitions', 'purchaseOrders', 'workOrders', 'materialStock', 'dailyProgressReports',
  'materialMaster', 'serviceMaster', 'projectPhases', 'costBudgets', 'boqs', 'boqItems', 'approvalRules',
  'auditTrails', 'costHeadMaster', 'ledgerAccounts', 'vouchers', 'gstEntries',
]);

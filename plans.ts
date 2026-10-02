// Plans shown on the landing page and in the install wizard. One source so the two never disagree.
// The server derives the included modules from the plan name (server/src/routes/tenants.ts).
export type PlanId = 'Growth Hub' | 'Ultimate Stack';

export interface Plan {
  id: PlanId;
  price: string;
  tagline: string;
  modules: { crm: boolean; erp: boolean };
  moduleNames: string[];
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: 'Growth Hub',
    price: '₹3,999',
    tagline: 'For sales teams that live in the CRM',
    modules: { crm: true, erp: false },
    moduleNames: ['LeadSarv CRM'],
    features: ['LeadSarv CRM: leads, site visits, bookings', 'RERA-ready booking documents', 'WhatsApp & SMS integrations', 'Financial dashboard', 'Up to 10 active users'],
  },
  {
    id: 'Ultimate Stack',
    price: '₹6,999',
    tagline: 'CRM + site operations + accounts',
    modules: { crm: true, erp: true },
    moduleNames: ['LeadSarv CRM', 'ProjectSarv ERP', 'FinanceSarv'],
    features: ['Everything in Growth Hub', 'ProjectSarv ERP: BOQ, procurement, contractors', 'FinanceSarv: ledger, GST & TDS reports', 'Tally integration', 'Unlimited users', 'Priority support'],
  },
];

export const getPlan = (id: string | undefined): Plan => PLANS.find((p) => p.id === id) ?? PLANS[0];

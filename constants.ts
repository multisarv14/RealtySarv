
import { buildDemoLeads } from './demoLeads';
import { Lead, Message, IntegrationOptionType, LeadStatus, SiteVisit, Task, User, Source, AdminPanelSection, Project, Budget, ClientProfile, UnitType, LocationSetting, LivingPlace, Template, LeadStatusType, SiteVisitStatusType, TaskPriorityType, BookingStatusType, AgreementStatusType, PossessionStatusType, InventoryStatusType, ProjectTypeType, ProjectStatusType, UserRoleSetting, UserDesignation, CompanyProfile, PaymentPlan, FinancialSettings, ApplicationSettings, ChannelPartner, FormFieldConfig, AgreementStatus, PossessionStatus } from './types';
import { v4 as uuidv4 } from 'uuid';

export const USER_AVATAR_INITIALS: string = 'RP';
export const USER_NAME: string = 'RealtySarv';
export const USER_ROLE: string = 'Admin User';
export const DEFAULT_ASSIGNED_TO: string = USER_NAME;

export interface AdminPanelSectionConfig {
  id: AdminPanelSection | 'dashboard';
  label: string;
  icon: string;
  subItems?: { id: string; label: string; icon: string }[];
}

export const INTEGRATION_OPTIONS: IntegrationOptionType[] = [
  { icon: 'fas fa-user-plus', label: 'New Lead', action: 'new-lead' },
  { icon: 'fas fa-calendar-check', label: 'Site Visit', action: 'site-visit' },
  { icon: 'fas fa-file-contract', label: 'Booking', action: 'booking' },
  { icon: 'fas fa-shield-alt', label: 'Admin', action: 'admin' },
];

export const ADMIN_PANEL_SECTIONS: AdminPanelSectionConfig[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
  { id: 'leads', label: 'Lead Management', icon: 'fas fa-users' },
  { id: 'lead-flow', label: 'Lead Flow', icon: 'fas fa-stream' },
  { id: 'task-management', label: 'Task Management', icon: 'fas fa-tasks' },
  { id: 'users', label: 'User Management', icon: 'fas fa-user-circle' },
  { id: 'projects', label: 'Project Management', icon: 'fas fa-building' },
  { id: 'channel-partners', label: 'Channel Partners', icon: 'fas fa-handshake' },
  {
    id: 'integrations',
    label: 'Integrations',
    icon: 'fas fa-puzzle-piece',
    subItems: [
        { id: 'lead-acquisition', label: 'Lead Acquisition', icon: 'fas fa-magnet' },
        { id: 'portals', label: 'Property Portals', icon: 'fas fa-home' },
        { id: 'communication', label: 'Comm. & Telephony', icon: 'fas fa-headset' },
        { id: 'payment-gateways', label: 'Payment Gateways', icon: 'fas fa-credit-card' },
        { id: 'accounting', label: 'Accounting & ERP', icon: 'fas fa-calculator' },
        { id: 'project-management', label: 'Project Management', icon: 'fas fa-tasks' },
        { id: 'storage', label: 'Document Storage', icon: 'fas fa-hdd' },
        { id: 'marketing', label: 'Marketing & Auto.', icon: 'fas fa-bullhorn' },
        { id: 'custom', label: 'Custom Integrations', icon: 'fas fa-code' },
        { id: 'email', label: 'Email', icon: 'fas fa-envelope' },
        { id: 'templates', label: 'Templates', icon: 'fas fa-file-alt' },
        { id: 'meta', label: 'Meta (Facebook)', icon: 'fab fa-facebook' },
        { id: 'google', label: 'Google Ads', icon: 'fab fa-google' },
        { id: 'linkedin', label: 'LinkedIn', icon: 'fab fa-linkedin' },
    ]
  },
  { id: 'reporting', label: 'Reporting', icon: 'fas fa-chart-bar' },
  { id: 'settings', label: 'Settings', icon: 'fas fa-cog' },
];

export const AVAILABLE_MENUS: string[] = ADMIN_PANEL_SECTIONS.flatMap(section => {
  const mainLabel = section.label;
  const subLabels = section.subItems ? section.subItems.map(sub => sub.label) : [];
  return [mainLabel, ...subLabels];
});

export const defaultCustomerDocs = {
  'PAN Card': { status: 'Pending' as const },
  'Aadhaar Card': { status: 'Pending' as const },
  'Address Proof': { status: 'Pending' as const },
  'Passport Size Photo': { status: 'Pending' as const },
  'Bank Statement': { status: 'Pending' as const },
  'ITR / Salary Slip': { status: 'Pending' as const },
};

export const INITIAL_USERS: User[] = [
  { id: 'user-1', name: 'John Doe', username: 'ss', password: 'sss', email: 'john.doe@example.com', phone: '+1-555-0111', role: 'Admin', isActive: true, assignedProjectIds: ['proj-1', 'proj-2', 'proj-3'], reportsTo: null },
  { id: 'user-2', name: 'Aarav Deshmukh', username: 'aarav', password: 'sss', email: 'aarav@multisarv.com', phone: '+91 98230 11001', role: 'Sales', isActive: true, assignedProjectIds: ['proj-1', 'proj-2'], reportsTo: 'user-1' },
  { id: 'user-3', name: 'Priya Nair', username: 'priya', password: 'sss', email: 'priya@multisarv.com', phone: '+91 98230 11002', role: 'Sales', isActive: true, assignedProjectIds: ['proj-1', 'proj-3'], reportsTo: 'user-1' },
  { id: 'user-4', name: 'Rohan Kulkarni', username: 'rohan', password: 'sss', email: 'rohan@multisarv.com', phone: '+91 98230 11003', role: 'Sales', isActive: true, assignedProjectIds: ['proj-2', 'proj-3'], reportsTo: 'user-1' },
  { id: 'user-5', name: 'Sneha Patil', username: 'sneha', password: 'sss', email: 'sneha@multisarv.com', phone: '+91 98230 11004', role: 'Sales', isActive: true, assignedProjectIds: ['proj-1', 'proj-2', 'proj-3'], reportsTo: 'user-1' },
];

export const INITIAL_SOURCES: Source[] = [
  { id: 'source-1', channelSource: 'Digital Marketing', name: 'Website', description: 'Leads from official company website' },
  { id: 'source-2', channelSource: 'Digital Marketing', name: 'Google Ads', description: 'Leads from Google' },
  { id: 'source-3', channelSource: 'Digital Marketing', name: 'Facebook', description: 'Leads from FB' },
  { id: 'source-4', channelSource: 'Offline', name: 'Referral', description: 'Direct referrals' },
  { id: 'source-5', channelSource: 'Offline', name: 'Walk-in', description: 'Site visits' },
  { id: 'source-6', channelSource: 'Property Portals', name: 'MagicBricks', description: 'Leads from MagicBricks' },
  { id: 'source-7', channelSource: 'Property Portals', name: '99acres', description: 'Leads from 99acres' },
];

export const INITIAL_PAYMENT_PLANS: PaymentPlan[] = [
  {
    id: 'pp-1',
    name: 'Standard CLP',
    milestones: [
      { id: uuidv4(), name: 'On Booking', percentage: 10 },
      { id: uuidv4(), name: 'Completion of Slab 1', percentage: 20 },
      { id: uuidv4(), name: 'Completion of Slab 5', percentage: 20 },
      { id: uuidv4(), name: 'Plastering', percentage: 25 },
      { id: uuidv4(), name: 'Possession', percentage: 25 },
    ],
  },
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'The Grand Towers',
    companyName: 'MultiSarv Pvt.Ltd',
    location: 'Downtown Metropolis',
    reraNumber: 'A51800001234',
    projectType: 'Residential',
    projectStatus: 'Under Construction',
    description: 'Luxurious high-rise apartments.',
    totalFloors: 20,
    wings: ['A', 'B'],
    inventory: [],
    parkingInventory: [],
    paymentPlanIds: ['pp-1'],
  },
  {
    id: 'proj-2',
    name: 'Serene Gardens',
    companyName: 'MultiSarv Pvt.Ltd',
    location: 'Green Valley',
    reraNumber: 'P51800005678',
    projectType: 'Residential',
    projectStatus: 'Ready to Move',
    description: 'Garden living at its best.',
    totalFloors: 10,
    wings: ['Main'],
    inventory: [],
    parkingInventory: [],
    paymentPlanIds: ['pp-1'],
  },
  {
    id: 'proj-3',
    name: 'Orchid Residency',
    companyName: 'MultiSarv Pvt.Ltd',
    location: 'Suburbs',
    reraNumber: 'P52100009012',
    projectType: 'Residential',
    projectStatus: 'Under Construction',
    description: 'Affordable 1 and 2 BHK homes close to the IT corridor.',
    totalFloors: 14,
    wings: ['A', 'B', 'C'],
    inventory: [],
    parkingInventory: [],
    paymentPlanIds: ['pp-1'],
  }
];

export const INITIAL_BUDGETS: Budget[] = [{ id: 'b1', name: '50L - 75L' }, { id: 'b2', name: '75L - 1Cr' }, { id: 'b3', name: '1.5Cr+' }];
export const INITIAL_CLIENT_PROFILES: ClientProfile[] = [{ id: 'rs1', name: 'IT Professional' }, { id: 'rs2', name: 'Doctor' }, { id: 'rs3', name: 'Business Owner' }];
export const INITIAL_UNIT_TYPES: UnitType[] = [{ id: 'ut1', name: '1BHK' }, { id: 'ut2', name: '2BHK' }, { id: 'ut3', name: '3BHK' }, { id: 'ut4', name: 'Villa' }];
export const INITIAL_LOCATION_SETTINGS: LocationSetting[] = [{ id: 'ls1', name: 'Downtown' }, { id: 'ls2', name: 'Suburbs' }, { id: 'ls3', name: 'Waterfront' }];
export const INITIAL_LIVING_PLACES: LivingPlace[] = [{ id: 'lp1', name: 'Rented Apartment' }, { id: 'lp2', name: 'Owned Apartment' }, { id: 'lp3', name: 'Family Home' }];
export const INITIAL_TEMPLATES: Template[] = [{ id: 'tpl-1', name: 'Welcome', type: 'WhatsApp', content: 'Hi {{lead_name}}!' }];
export const INITIAL_LEAD_STATUS_TYPES: LeadStatusType[] = [{ id: 'lst-1', name: 'New' }, { id: 'lst-2', name: 'Contacted' }, { id: 'lst-3', name: 'Qualified' }];
export const INITIAL_SITE_VISIT_STATUS_TYPES: SiteVisitStatusType[] = [{ id: 'svst-1', name: 'Visit Scheduled' }, { id: 'svst-2', name: 'Completed' }];
export const INITIAL_TASK_PRIORITY_TYPES: TaskPriorityType[] = [{ id: 'tpt-1', name: 'Low' }, { id: 'tpt-2', name: 'Medium' }, { id: 'tpt-3', name: 'High' }];
export const INITIAL_BOOKING_STATUS_TYPES: BookingStatusType[] = [{ id: 'bst-1', name: 'Pending' }, { id: 'bst-2', name: 'Booked' }];
export const INITIAL_AGREEMENT_STATUS_TYPES: AgreementStatusType[] = [{ id: 'ast-1', name: 'Drafted' }, { id: 'ast-2', name: 'Signature' }, { id: 'ast-3', name: 'Registered' }, { id: 'ast-4', name: 'ATS' }];
export const INITIAL_POSSESSION_STATUS_TYPES: PossessionStatusType[] = [{ id: 'pst-1', name: 'Pending' }, { id: 'pst-2', name: 'Scheduled' }, { id: 'pst-3', name: 'Handed Over' }];
export const INITIAL_INVENTORY_STATUS_TYPES: InventoryStatusType[] = [{ id: 'ist-1', name: 'Available' }, { id: 'ist-2', name: 'Booked' }];
export const INITIAL_PROJECT_TYPE_TYPES: ProjectTypeType[] = [{ id: 'pt-1', name: 'Residential' }, { id: 'pt-2', name: 'Commercial' }];
export const INITIAL_PROJECT_STATUS_TYPES: ProjectStatusType[] = [{ id: 'ps-1', name: 'Pre-launch' }, { id: 'ps-2', name: 'Under Construction' }];
export const INITIAL_USER_ROLE_SETTINGS: UserRoleSetting[] = [{ id: 'urs-1', name: 'Sales Manager', menuAccess: [] }];
export const INITIAL_USER_DESIGNATIONS: UserDesignation[] = [{ id: 'ud-1', name: 'Senior Sales Executive' }];
export const INITIAL_COMPANY_PROFILE: CompanyProfile = { name: "MultiSarv Pvt.Ltd", address: "123 Business Avenue", phone: "+1-800-555-LEAD", website: "www.multisarv.com", setupCompleted: false };
export const INITIAL_FINANCIAL_SETTINGS: FinancialSettings = { gstPercentage: 5, stampDutyRules: [], registrationRules: [], societyFormationCharges: { basis: 'fixedAmount', value: 25000, applyGst: false }, legalCharges: { basis: 'fixedAmount', value: 25000, applyGst: false }, maintenanceCharges: { basis: 'saleableArea', value: 2, months: 24, applyGst: false }, corpusFund: { basis: 'saleableArea', value: 50, applyGst: false }, customCharges: [] };
export const INITIAL_APPLICATION_SETTINGS: ApplicationSettings = { dateFormat: 'DD/MM/YYYY', timeZone: 'UTC', currencySymbol: '₹' };
export const INITIAL_CHANNEL_PARTNERS: ChannelPartner[] = [{ id: 'cp-1', firmName: 'Elite Realty Brokers', contactPerson: 'Rahul Sharma', email: 'rahul@eliterealty.com', phone: '+91 98765 43210', reraNumber: 'A51800012345', status: 'Active', commissionRate: 2.5, totalLeads: 45, totalConversions: 3, onboardingDate: '2023-10-12' }];

export const INITIAL_FORM_FIELD_CONFIGS: FormFieldConfig[] = [
  { id: 'l1', module: 'lead', fieldName: 'firstName', label: 'First Name', fieldType: 'text', isVisible: true, isRequired: true, isSystem: true },
  { id: 'l2', module: 'lead', fieldName: 'lastName', label: 'Last Name', fieldType: 'text', isVisible: true, isRequired: false, isSystem: true },
  { id: 'l3', module: 'lead', fieldName: 'email', label: 'Email', fieldType: 'text', isVisible: true, isRequired: true, isSystem: true },
  { id: 'l4', module: 'lead', fieldName: 'phone', label: 'Phone', fieldType: 'text', isVisible: true, isRequired: true, isSystem: true },
  { id: 'l5', module: 'lead', fieldName: 'leadProject', label: 'Project', fieldType: 'select', isVisible: true, isRequired: true, isSystem: true },
  { id: 'l6', module: 'lead', fieldName: 'initialInterest', label: 'Initial Interest', fieldType: 'select', isVisible: true, isRequired: true, isSystem: true },
  { id: 'l7', module: 'lead', fieldName: 'preferredLocation', label: 'Preferred Location', fieldType: 'select', isVisible: true, isRequired: true, isSystem: true },
  { id: 'l8', module: 'lead', fieldName: 'budget', label: 'Budget', fieldType: 'select', isVisible: true, isRequired: true, isSystem: true },
  { id: 'l9', module: 'lead', fieldName: 'clientProfile', label: 'Client Profile', fieldType: 'select', isVisible: true, isRequired: false, isSystem: true },
  { id: 'l10', module: 'lead', fieldName: 'livingPlace', label: 'Living Place', fieldType: 'select', isVisible: true, isRequired: false, isSystem: true },
  { id: 'l11', module: 'lead', fieldName: 'channelSource', label: 'Channel Source', fieldType: 'select', isVisible: true, isRequired: true, isSystem: true },
  { id: 'l12', module: 'lead', fieldName: 'sourceName', label: 'Source Name', fieldType: 'select', isVisible: true, isRequired: true, isSystem: true },
  { id: 'l13', module: 'lead', fieldName: 'message', label: 'Message/Notes', fieldType: 'textarea', isVisible: true, isRequired: false, isSystem: true },
  { id: 'p1', module: 'project', fieldName: 'name', label: 'Project Name', fieldType: 'text', isVisible: true, isRequired: true, isSystem: true },
  { id: 'p2', module: 'project', fieldName: 'companyName', label: 'Company Name', fieldType: 'text', isVisible: true, isRequired: true, isSystem: true },
  { id: 'p3', module: 'project', fieldName: 'reraNumber', label: 'RERA Number', fieldType: 'text', isVisible: true, isRequired: true, isSystem: true },
  { id: 'p4', module: 'project', fieldName: 'location', label: 'Location', fieldType: 'text', isVisible: true, isRequired: true, isSystem: true },
  { id: 'p5', module: 'project', fieldName: 'projectType', label: 'Project Type', fieldType: 'select', isVisible: true, isRequired: true, isSystem: true },
  { id: 'p6', module: 'project', fieldName: 'projectStatus', label: 'Project Status', fieldType: 'select', isVisible: true, isRequired: true, isSystem: true },
  { id: 'p7', module: 'project', fieldName: 'totalFloors', label: 'Total Floors', fieldType: 'number', isVisible: true, isRequired: true, isSystem: true },
  { id: 'p8', module: 'project', fieldName: 'wings', label: 'Wings', fieldType: 'text', isVisible: true, isRequired: false, isSystem: true },
  { id: 'p9', module: 'project', fieldName: 'description', label: 'Description', fieldType: 'textarea', isVisible: true, isRequired: true, isSystem: true },
  { id: 'u1', module: 'user', fieldName: 'name', label: 'Full Name', fieldType: 'text', isVisible: true, isRequired: true, isSystem: true },
  { id: 'u2', module: 'user', fieldName: 'username', label: 'Username', fieldType: 'text', isVisible: true, isRequired: true, isSystem: true },
  { id: 'u3', module: 'user', fieldName: 'email', label: 'Email', fieldType: 'text', isVisible: true, isRequired: true, isSystem: true },
  { id: 'u4', module: 'user', fieldName: 'phone', label: 'Phone', fieldType: 'text', isVisible: true, isRequired: true, isSystem: true },
  { id: 'u5', module: 'user', fieldName: 'role', label: 'Role', fieldType: 'select', isVisible: true, isRequired: true, isSystem: true },
  { id: 'u6', module: 'user', fieldName: 'reportsTo', label: 'Reports To', fieldType: 'select', isVisible: true, isRequired: false, isSystem: true },
  { id: 'b1', module: 'booking', fieldName: 'unitId', label: 'Unit ID', fieldType: 'text', isVisible: true, isRequired: true, isSystem: true },
  { id: 'b2', module: 'booking', fieldName: 'paymentPlanId', label: 'Payment Plan', fieldType: 'select', isVisible: true, isRequired: true, isSystem: true },
  { id: 'b3', module: 'booking', fieldName: 'tokenAmount', label: 'Token Amount', fieldType: 'number', isVisible: true, isRequired: true, isSystem: true },
  { id: 'b4', module: 'booking', fieldName: 'tokenMode', label: 'Token Mode', fieldType: 'select', isVisible: true, isRequired: true, isSystem: true },
  { id: 'c1', module: 'company', fieldName: 'name', label: 'Company Name', fieldType: 'text', isVisible: true, isRequired: true, isSystem: true },
  { id: 'c2', module: 'company', fieldName: 'address', label: 'Office Address', fieldType: 'textarea', isVisible: true, isRequired: true, isSystem: true },
  { id: 'c3', module: 'company', fieldName: 'phone', label: 'Support Phone', fieldType: 'text', isVisible: true, isRequired: true, isSystem: true },
  { id: 'c4', module: 'company', fieldName: 'website', label: 'Website URL', fieldType: 'text', isVisible: true, isRequired: true, isSystem: true },
];

// Demo leads are built last because they use the users and payment plan milestones defined above.
export const INITIAL_LEADS: Lead[] = buildDemoLeads({
  projects: INITIAL_PROJECTS,
  users: INITIAL_USERS,
  milestones: (INITIAL_PAYMENT_PLANS[0]?.milestones || []).map((m) => ({ id: m.id, name: m.name })),
});


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

const generateBookingDetails = (name: string, phone: string, email: string) => ({
    primaryApplicant: {
        id: uuidv4(),
        fullName: name,
        relationValue: 'Self',
        dob: '1985-05-15',
        pan: 'ABCDE1234F',
        aadhaar: '1234 5678 9012',
        presentAddress: '123 Test Street, Sample City',
        permanentAddress: '123 Test Street, Sample City',
        isSameAddress: true,
        mobile: phone,
        email: email,
        occupation: 'Service',
        nationality: 'Indian',
        customerDocuments: { ...defaultCustomerDocs },
    },
    coApplicants: [],
    unitId: 'unit-1',
    parkingId: 'p-1',
    priceBreakup: {
        basicSalePrice: 5000000,
        floorPLC: 0,
        otherCharges: 250000,
        societyFormationCharges: 25000,
        legalCharges: 25000,
        maintenanceCharges: 50000,
        corpusFund: 50000,
        totalConsideration: 5250000,
        gst: 262500,
        stampDuty: 315000,
        registrationCharges: 30000,
        grandTotal: 5857500,
    },
    paymentPlanId: 'pp-1',
    tokenDetails: {
        amount: 100000,
        mode: 'NEFT' as const,
        transactionId: 'TXN' + Math.random().toString(16).slice(2, 10).toUpperCase(),
        bankName: 'Axis Bank',
        transactionDate: new Date().toISOString().split('T')[0],
    },
    declarationAccepted: true,
});

export const INITIAL_LEADS: Lead[] = [
    // --- 10 ACTIVE LEADS (GENERAL) ---
    ...Array.from({ length: 10 }).map((_, i) => ({
        id: `active-lead-${i}`,
        name: `Active Prospect ${i + 1}`,
        avatarInitials: `AP${i + 1}`,
        lastMessage: 'Interested in a new project',
        time: '10:00',
        chatStatus: 'online' as const,
        leadStatus: 'Qualified' as const,
        read: true,
        messages: [{ id: uuidv4(), content: 'Hi, I need details.', time: '09:00', sender: 'received' as const }],
        email: `prospect${i}@example.com`,
        phone: `+91 900000001${i}`,
        initialInterest: ["2BHK"],
        siteVisits: [],
        tasks: [],
        channelSource: 'Digital Marketing',
        leadSource: 'Google Ads',
        preferredLocation: 'Downtown',
        budget: '75L - 1Cr',
        clientProfile: 'IT Professional',
        livingPlace: 'Rented Apartment',
        propertyImages: [],
        ownerId: 'user-1',
        leadProject: 'The Grand Towers',
        leadDate: '2024-07-20',
        bookingStatus: 'Pending' as const,
        agreementStatus: 'Drafted' as const,
        possessionStatus: 'Pending' as const,
    })),

    // --- 10 VISIT LEADS ---
    ...Array.from({ length: 10 }).map((_, i) => ({
        id: `visit-lead-${i}`,
        name: `Visit Client ${i + 1}`,
        avatarInitials: `VC${i + 1}`,
        lastMessage: 'Site visit scheduled',
        time: '11:30',
        chatStatus: 'offline' as const,
        leadStatus: 'Contacted' as const,
        read: true,
        messages: [],
        email: `visit${i}@example.com`,
        phone: `+91 911111111${i}`,
        initialInterest: ["3BHK"],
        siteVisits: [{
            id: uuidv4(),
            leadId: `visit-lead-${i}`,
            date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            time: '14:00',
            propertyOfInterest: 'The Grand Towers',
            status: i % 2 === 0 ? 'Visit Scheduled' as const : 'Completed' as const
        }],
        tasks: [],
        channelSource: 'Offline',
        leadSource: 'Referral',
        preferredLocation: 'Suburbs',
        budget: '1Cr+',
        clientProfile: 'Business Owner',
        livingPlace: 'Owned Apartment',
        propertyImages: [],
        ownerId: 'user-2',
        leadProject: 'The Grand Towers',
        leadDate: '2024-07-15',
        bookingStatus: 'Pending' as const,
        agreementStatus: 'Drafted' as const,
        possessionStatus: 'Pending' as const,
    })),

    // --- 10 TOKEN BOOKING LEADS ---
    ...Array.from({ length: 10 }).map((_, i) => ({
        id: `token-lead-${i}`,
        name: `Token Holder ${i + 1}`,
        avatarInitials: `TH${i + 1}`,
        lastMessage: 'Token amount paid',
        time: '14:45',
        chatStatus: 'online' as const,
        leadStatus: 'Converted' as const,
        read: true,
        messages: [],
        email: `token${i}@example.com`,
        phone: `+91 922222222${i}`,
        initialInterest: ["2BHK"],
        siteVisits: [{ id: uuidv4(), leadId: `token-lead-${i}`, date: '2024-07-01', time: '10:00', propertyOfInterest: 'Serene Gardens', status: 'Completed' as const }],
        tasks: [],
        channelSource: 'Digital Marketing',
        leadSource: 'Facebook',
        preferredLocation: 'Waterfront',
        budget: '50L - 75L',
        clientProfile: 'Doctor',
        livingPlace: 'Family Home',
        propertyImages: [],
        ownerId: 'user-1',
        leadProject: 'Serene Gardens',
        leadDate: '2024-07-10',
        bookingStatus: 'Pending' as const,
        agreementStatus: 'Drafted' as const,
        possessionStatus: 'Pending' as const,
        tokenAmount: 51000 + (i * 1000),
    })),

    // --- 10 CONFIRMED BOOKING / AGREEMENT LEADS ---
    ...Array.from({ length: 10 }).map((_, i) => ({
        id: `booked-lead-${i}`,
        name: `Booked Owner ${i + 1}`,
        avatarInitials: `BO${i + 1}`,
        lastMessage: 'Agreement in process',
        time: 'Yesterday',
        chatStatus: 'offline' as const,
        leadStatus: 'Converted' as const,
        read: true,
        messages: [],
        email: `owner${i}@example.com`,
        phone: `+91 933333333${i}`,
        initialInterest: ["3BHK"],
        siteVisits: [],
        tasks: [],
        channelSource: 'Offline',
        leadSource: 'Walk-in',
        preferredLocation: 'Downtown',
        budget: '1.5Cr+',
        propertyImages: [],
        ownerId: 'user-2',
        leadProject: 'The Grand Towers',
        leadDate: '2024-06-01',
        bookingStatus: 'Booked' as const,
        agreementStatus: (i < 2 ? 'Drafted' : i < 5 ? 'Signature' : i < 8 ? 'ATS' : 'Registered') as AgreementStatus,
        possessionStatus: 'Pending' as const,
        bookingDetails: generateBookingDetails(`Booked Owner ${i + 1}`, `+91 933333333${i}`, `owner${i}@example.com`),
    })),

    // --- 10 POSSESSION LEADS ---
    ...Array.from({ length: 10 }).map((_, i) => ({
        id: `possession-lead-${i}`,
        name: `Resident ${i + 1}`,
        avatarInitials: `RE${i + 1}`,
        lastMessage: 'Possession scheduled',
        time: '2 days ago',
        chatStatus: 'offline' as const,
        leadStatus: 'Converted' as const,
        read: true,
        messages: [],
        email: `resident${i}@example.com`,
        phone: `+91 944444444${i}`,
        initialInterest: ["Villa"],
        siteVisits: [],
        tasks: [],
        channelSource: 'Digital Marketing',
        leadSource: 'Website',
        preferredLocation: 'Suburbs',
        budget: '2Cr+',
        propertyImages: [],
        ownerId: 'user-1',
        leadProject: 'The Grand Towers',
        leadDate: '2023-12-15',
        bookingStatus: 'Booked' as const,
        agreementStatus: 'Registered' as const,
        possessionStatus: (i < 3 ? 'Pending' : i < 7 ? 'Scheduled' : 'Handed Over') as PossessionStatus,
        bookingDetails: generateBookingDetails(`Resident ${i + 1}`, `+91 944444444${i}`, `resident${i}@example.com`),
    })),
];

export const INITIAL_USERS: User[] = [
  { id: 'user-1', name: 'John Doe', username: 'ss', password: 'sss', email: 'john.doe@example.com', phone: '+1-555-0111', role: 'Admin', isActive: true, assignedProjectIds: ['proj-1', 'proj-2'], reportsTo: null },
];

export const INITIAL_SOURCES: Source[] = [
  { id: 'source-1', channelSource: 'Digital Marketing', name: 'Website', description: 'Leads from official company website' },
  { id: 'source-2', channelSource: 'Digital Marketing', name: 'Google Ads', description: 'Leads from Google' },
  { id: 'source-3', channelSource: 'Digital Marketing', name: 'Facebook', description: 'Leads from FB' },
  { id: 'source-4', channelSource: 'Offline', name: 'Referral', description: 'Direct referrals' },
  { id: 'source-5', channelSource: 'Offline', name: 'Walk-in', description: 'Site visits' },
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

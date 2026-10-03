
import { USER_NAME } from "./constants";

export type SystemType = 'LeadSarv' | 'ProjectSarv' | 'FinanceSarv';

export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Unqualified' | 'Converted';
export type SiteVisitStatus = 'Visit Scheduled' | 'Completed' | 'Canceled';
export type TaskStatus = 'Pending' | 'Completed' | 'Overdue';
export type TaskPriority = 'Low' | 'Medium' | 'High';
export type UserRole = 'Admin' | 'Sales' | 'User';
export type BookingStatus = 'Pending' | 'Booked';
export type AgreementStatus = 'Drafted' | 'Signature' | 'ATS' | 'Registered';
export type PossessionStatus = 'Pending' | 'Scheduled' | 'Handed Over';

export type LifecycleStage = 'leadStatus' | 'bookingStatus' | 'agreementStatus' | 'possessionStatus';
export type LeadLifecycleStatus = LeadStatus | BookingStatus | AgreementStatus | PossessionStatus;

export type FormModule = 'lead' | 'project' | 'booking' | 'user' | 'company' | 'vendor' | 'procurement' | 'contract' | 'site_ops' | 'inventory_master' | 'boq' | 'finance_ledger';
export type FieldType = 'text' | 'number' | 'date' | 'select' | 'textarea';

export interface Message { id: string; content: string; time: string; sender: 'sent' | 'received'; }
export interface SiteVisit { id: string; leadId: string; date: string; time: string; propertyOfInterest: string; notes?: string; status: SiteVisitStatus; }
export interface Task { id: string; leadId: string; title: string; description?: string; dueDate: string; priority: TaskPriority; status: TaskStatus; assignedTo: string; }
export interface PropertyImage { id: string; url: string; }
export interface CustomerDocument { status: 'Pending' | 'Uploaded' | 'Verified' | 'Rejected'; fileName?: string; fileUrl?: string; }

// --- FinanceSarv Types ---
export type VoucherType = 'Journal' | 'Payment' | 'Receipt' | 'Contra' | 'Sales' | 'Purchase';
export type AccountGroup = 'Assets' | 'Liabilities' | 'Income' | 'Expenses' | 'Equity';

export interface LedgerAccount {
    id: string;
    name: string;
    code: string;
    group: AccountGroup;
    openingBalance: number;
    currentBalance: number;
    isSystem: boolean;
}

export interface VoucherEntry {
    accountId: string;
    accountName: string;
    debit: number;
    credit: number;
}

export interface Voucher {
    id: string;
    voucherNumber: string;
    date: string;
    type: VoucherType;
    entries: VoucherEntry[];
    narration: string;
    projectId?: string;
    referenceId?: string; // Links to PO, WO, or Booking Receipt
    status: 'Draft' | 'Posted' | 'Cancelled';
}

export interface GstEntry {
    id: string;
    date: string;
    voucherId: string;
    type: 'Input' | 'Output';
    gstin: string;
    taxableValue: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalGst: number;
}

// --- Setting Types ---
export interface Budget { id: string; name: string; description?: string; }
export interface ClientProfile { id: string; name: string; description?: string; }
export interface UnitType { id: string; name: string; description?: string; }
export interface LocationSetting { id: string; name: string; description?: string; }
export interface LivingPlace { id: string; name: string; description?: string; }
export interface Template { id: string; name: string; type: TemplateType; content: string; }
export type TemplateType = 'WhatsApp' | 'Email';

export interface LeadStatusType { id: string; name: string; description?: string; }
export interface SiteVisitStatusType { id: string; name: string; description?: string; }
export interface TaskPriorityType { id: string; name: string; description?: string; }
export interface BookingStatusType { id: string; name: string; description?: string; }
export interface AgreementStatusType { id: string; name: string; description?: string; }
export interface PossessionStatusType { id: string; name: string; description?: string; }
export interface InventoryStatusType { id: string; name: string; description?: string; }
export interface ProjectTypeType { id: string; name: string; description?: string; }
export interface ProjectStatusType { id: string; name: string; description?: string; }

export interface UserRoleSetting { id: string; name: string; description?: string; menuAccess: string[]; }
export interface UserDesignation { id: string; name: string; description?: string; }
export interface CompanyProfile { name: string; address: string; phone: string; website: string; logoUrl?: string; setupCompleted?: boolean; customData?: Record<string, any>; }

export interface ChannelPartner { id: string; firmName: string; contactPerson: string; email: string; phone: string; reraNumber: string; status: 'Active' | 'Inactive' | 'Pending'; commissionRate: number; totalLeads: number; totalConversions: number; onboardingDate: string; }

export interface ApplicationSettings { id?: number; dateFormat: string; timeZone: string; currencySymbol: string; appUrl?: string; }

export interface Source { id: string; channelSource: string; name: string; description?: string; }

export type InventoryUnitStatus = 'Available' | 'Booked' | 'On Hold' | 'Sold' | 'Not for Sale';
export type ProjectType = 'Residential' | 'Commercial' | 'Mixed-Use';
export type ProjectStatus = 'Pre-launch' | 'Under Construction' | 'Ready to Move';

export interface InventoryUnit { id: string; unitNumber: string; wing?: string; floor: number; type: string; area: number; carpetArea?: number; price: number; status: InventoryUnitStatus; calculationBasis?: CalculationBasis; bedrooms?: number; bathrooms?: number; }
export interface ParkingSlot { id: string; slotNumber: string; level: string; status: InventoryUnitStatus; assignedUnitId?: string; }

export interface Project { id: string; name: string; companyName: string; location: string; reraNumber: string; projectType: ProjectType; projectStatus: ProjectStatus; description: string; totalFloors: number; wings?: string[]; inventory: InventoryUnit[]; parkingInventory: ParkingSlot[]; paymentPlanIds?: string[]; floorPlanUrl?: string; customData?: Record<string, any>; }

export interface User { id: string; name: string; username: string; password?: string; email: string; phone?: string; role: UserRole; isActive: boolean; assignedProjectIds: string[]; reportsTo?: string | null; customData?: Record<string, any>; }

export interface PaymentPlanMilestone { id: string; name: string; percentage: number; achievedDate?: string; }
export interface PaymentPlan { id: string; name: string; milestones: PaymentPlanMilestone[]; }

export type CalculationBasis = 'rate' | 'consideration' | 'grandTotal';

export interface Applicant { id: string; fullName: string; relationValue: string; dob: string; pan: string; aadhaar: string; presentAddress: string; permanentAddress: string; isSameAddress: boolean; mobile: string; email: string; occupation: string; nationality: string; relationshipWithPrimary?: string; customerDocuments: Record<string, CustomerDocument>; }
export interface PriceBreakup { basicSalePrice: number; floorPLC: number; otherCharges: number; societyFormationCharges: number; legalCharges: number; maintenanceCharges: number; corpusFund: number; customCharges?: Record<string, number>; totalConsideration: number; gst: number; stampDuty: number; registrationCharges: number; grandTotal: number; }
export interface TokenDetails { amount: number; mode: 'Cheque' | 'NEFT' | 'RTGS' | 'UPI' | 'Other'; transactionId: string; bankName: string; transactionDate: string; }
export interface PaymentRecord { id: string; date: string; amount: number; mode: string; transactionId: string; bankName?: string; notes?: string; milestoneName?: string; }
export interface DemandRecord { milestoneId: string; generatedDate: string; dueDate: string; milestoneDate?: string; }
export interface Nominee { fullName: string; relationship: string; address: string; contact: string; }
export interface BookingDetails { primaryApplicant: Applicant; coApplicants: Applicant[]; unitId: string; parkingId: string; priceBreakup: PriceBreakup; paymentPlanId: string; tokenDetails: TokenDetails; payments?: PaymentRecord[]; demands?: DemandRecord[]; settlementMapping?: Record<string, number>; nominee?: Nominee; declarationAccepted: boolean; customData?: Record<string, any>; unitDocuments?: Record<string, CustomerDocument>; }

export interface Lead { id: string; name: string; avatarInitials: string; lastMessage: string; time: string; chatStatus: 'online' | 'offline'; leadStatus: LeadStatus; read: boolean; messages: Message[]; email: string; phone: string; initialInterest: string[]; siteVisits: SiteVisit[]; tasks: Task[]; channelSource: string; leadSource: string; preferredLocation: string; budget?: string; clientProfile?: string; livingPlace?: string; propertyImages: PropertyImage[]; ownerId: string; leadProject: string; leadDate: string; bookingStatus: BookingStatus; agreementStatus: AgreementStatus; possessionStatus: PossessionStatus; tokenAmount?: number; bookingDetails?: BookingDetails; customData?: Record<string, any>; }

export type ActiveLeadTab = 'Follow-up' | 'Active' | 'Inactive';
export type AdminPanelSection = 'leads' | 'users' | 'projects' | 'channel-partners' | 'integrations' | 'lead-flow' | 'task-management' | 'reporting' | 'settings';

export interface IntegrationOptionType {
  icon: string;
  label: string;
  action: string;
}

// --- New Data Interfaces (for Modals) ---
export interface NewLeadData { ownerId?: string; firstName: string; lastName: string; email: string; phone: string; initialInterest: string[]; preferredLocation: string; budget: string; clientProfile: string; livingPlace: string; leadStatus: LeadStatus; channelSource: string; sourceName: string; leadProject: string; message?: string; customData?: Record<string, any>; followUp?: NewFollowUpData; }
export interface NewSiteVisitData { date: string; time: string; propertyOfInterest: string; notes?: string; }
export interface NewTaskData { title: string; description?: string; dueDate: string; priority: TaskPriority; assignedTo: string; }
export interface NewFollowUpData { type: 'Call' | 'Email' | 'Meeting'; date: string; time: string; notes?: string; assignedTo: string; }
export interface NewUserData extends Omit<User, 'id' | 'isActive'> { confirmPassword?: string; }
export interface NewSourceData { channelSource: string; name: string; description?: string; }
export interface NewProjectData extends Omit<Project, 'id' | 'inventory' | 'parkingInventory' | 'paymentPlanIds' | 'floorPlanUrl'> {}
export interface NewTemplateData { name: string; type: TemplateType; content: string; }
export interface NewChannelPartnerData { firmName: string; contactPerson: string; email: string; phone: string; reraNumber: string; commissionRate: number; }
export interface NewBudgetData { name: string; description?: string; }
export interface NewClientProfileData { name: string; description?: string; }
export interface NewUnitTypeData { name: string; description?: string; }
export interface NewLocationSettingData { name: string; description?: string; }
export interface NewLivingPlaceData { name: string; description?: string; }
export interface NewLeadStatusTypeData { name: string; description?: string; }
export interface NewSiteVisitStatusTypeData { name: string; description?: string; }
export interface NewTaskPriorityTypeData { name: string; description?: string; }
export interface NewBookingStatusTypeData { name: string; description?: string; }
export interface NewAgreementStatusTypeData { name: string; description?: string; }
export interface NewPossessionStatusTypeData { name: string; description?: string; }
export interface NewInventoryStatusTypeData { name: string; description?: string; }
export interface NewProjectTypeTypeData { name: string; description?: string; }
export interface NewProjectStatusTypeData { name: string; description?: string; }
export interface NewUserRoleSettingData { name: string; description?: string; }
export interface NewUserDesignationData { name: string; description?: string; }

export type ConditionOperator = 'greater_than_or_equal_to' | 'greater_than' | 'less_than_or_equal_to' | 'less_than' | 'between';
export type FinancialRuleType = 'percentage' | 'fixed';
export interface ConditionalFinancialRule { id: string; operator: ConditionOperator; value: number; value2?: number; ruleType: FinancialRuleType; percentage?: number; fixedAmount?: number; }
export type OtherChargeBasis = 'fixedAmount' | 'basicSalePrice' | 'totalConsideration' | 'saleableArea';
export interface OtherChargeSetting { basis: OtherChargeBasis; value: number; months?: number; applyGst: boolean; gstPercentage?: number; }
export interface CustomChargeSetting extends OtherChargeSetting { id: string; name: string; partOfTotalConsideration?: boolean; }
export interface FinancialSettings { gstPercentage: number; stampDutyRules: ConditionalFinancialRule[]; registrationRules: ConditionalFinancialRule[]; societyFormationCharges: OtherChargeSetting; legalCharges: OtherChargeSetting; maintenanceCharges: OtherChargeSetting; corpusFund: OtherChargeSetting; customCharges: CustomChargeSetting[]; }

export interface FacebookLeadRaw { id: string; created_time: string; ad_id?: string; form_id: string; field_data: { name: string; values: string[]; }[]; }
export interface FacebookField { key: string; label: string; example: string; }
export interface FacebookForm { id: string; name: string; status: 'ACTIVE' | 'ARCHIVED'; leadCount: number; mappedProjectId: string | ''; mappedUserId: string | ''; isSyncing: boolean; fields: FacebookField[]; fieldMapping: Record<string, string>; leads?: FacebookLeadRaw[]; }
export interface FacebookPage { id: string; name: string; category: string; imageUrl?: string; forms: FacebookForm[]; }

export interface FormFieldConfig { id: string; module: FormModule; fieldName: string; label: string; fieldType: FieldType; isVisible: boolean; isRequired: boolean; isSystem: boolean; options?: string[]; }

// --- Execution Hub Specific Types ---
export type VendorType = 'Material Supplier' | 'Labour Contractor' | 'EPC / Civil Contractor' | 'Sub-Contractor' | 'Consultant (Architect, Liaison, Legal)';
export type MSMEType = 'Not Registered' | 'Micro' | 'Small' | 'Medium';
export type TDSCategory = '194C (Contractors)' | '194J (Professional)' | '194H (Commission)' | '194I (Rent)' | 'No TDS';

export type PRStatus = 'Draft' | 'Pending Site' | 'Pending Project Mgr' | 'Pending Accounts' | 'Pending Management' | 'Approved' | 'PO Created' | 'Rejected';
export type POStatus = 'Draft' | 'Approval Pending' | 'Approved' | 'Issued' | 'Partially Received' | 'Closed' | 'Rejected';
export type WOStatus = 'Draft' | 'Active' | 'On Hold' | 'Completed';
export type DPRStatus = 'Draft' | 'Submitted' | 'Approved';

// --- Item & Service Master ---
export type MaterialCategory = 'Cement' | 'Steel' | 'Sand' | 'Aggregate' | 'RMC' | 'Electrical' | 'Plumbing' | 'Finishing' | 'General';
export type ServiceCategory = 'Excavation' | 'Shuttering' | 'Brickwork' | 'Plumbing Labour' | 'Electrical Labour' | 'Liaison' | 'Legal' | 'Consultancy';
export type UOM = 'Bag' | 'MT' | 'Brass' | 'SqFt' | 'Cum' | 'Running Ft' | 'Nos' | 'Kg' | 'Bundle' | 'Ltr';

export interface MaterialMaster { id: string; itemCode: string; name: string; category: MaterialCategory; uom: UOM; hsnCode: string; gstPercent: number; standardWastage: number; qualityGrade?: string; lastRate?: number; isActive: boolean; }
export interface ServiceMaster { id: string; serviceCode: string; name: string; category: ServiceCategory; uom: UOM; sacCode: string; gstPercent: number; isActive: boolean; }

// --- BOQ & Project Planning ---
export type BOQStatus = 'Draft' | 'Approved' | 'Revised' | 'Archived';
export interface BOQItem { id: string; boqId: string; masterId: string; itemType: 'Material' | 'Service'; quantity: number; estimatedRate: number; amount: number; towerId?: string; stageName?: string; }
export interface BOQ { id: string; projectId: string; name: string; version: number; revisionLabel: string; status: BOQStatus; approvedBy?: string; approvedAt?: string; createdAt: string; totalEstimate: number; }

// --- Execution: PR, PO, WO ---
export interface PurchaseRequisitionItem { id: string; masterId: string; itemType: 'Material' | 'Service'; quantity: number; requiredByDate: string; boqLinkedQty?: number; }
export interface PurchaseRequisition { id: string; prNumber: string; projectId: string; requesterId: string; date: string; status: PRStatus; isEmergency: boolean; emergencyReason?: string; items: PurchaseRequisitionItem[]; remarks?: string; totalAmount?: number; approvalHistory?: ApprovalLog[]; }
export interface PurchaseOrderItem { id: string; masterId: string; itemType: 'Material' | 'Service'; description: string; hsnCode: string; quantity: number; uom: string; rate: number; gstPercent: number; gstAmount: number; amount: number; }
export interface PurchaseOrder { id: string; poNumber: string; prId?: string; vendorId: string; projectId: string; date: string; status: POStatus; items: PurchaseOrderItem[]; baseAmount: number; gstAmount: number; freightAmount: number; grandTotal: number; deliverySchedule?: string; penaltyClause?: string; terms?: string; version: number; approvalHistory?: ApprovalLog[]; }
export interface WorkOrderMilestone { id: string; name: string; percentage: number; amount: number; isAchieved: boolean; achievedDate?: string; }
export interface WorkOrder { id: string; woNumber: string; vendorId: string; projectId: string; subject: string; status: WOStatus; billingType: 'Lump-sum' | 'Item-rate' | 'BOQ-based'; startDate: string; endDate?: string; contractValue: number; retentionPercent: number; tdsPercent: number; penaltyClause?: string; escalationClause?: string; scopeOfWork: string; milestones: WorkOrderMilestone[]; }

export interface StockItem { id: string; materialName: string; unit: string; category: string; currentStock: number; minThreshold: number; lastPurchasePrice: number; }
export interface DailyProgressReport { id: string; date: string; projectId: string; labourCount: number; workDescription: string; challenges?: string; status: DPRStatus; photos: string[]; }

export interface Vendor { id: string; vendorCode: string; firmName: string; vendorType: VendorType; contactPerson: string; email: string; phone: string; gstin: string; pan: string; msmeType: MSMEType; msmeNumber?: string; tdsCategory: TDSCategory; creditDays: number; bankName: string; accountNumber: string; ifscCode: string; branchName?: string; address?: string; city?: string; state?: string; isActive: boolean; isBlacklisted: boolean; blacklistReason?: string; vendorRating: number; onboardingDate: string; labourLicenseNo?: string; pfEsicRegistration?: string; customData?: Record<string, any>; }

export interface ProjectPhase { id: string; projectId: string; name: string; startDate: string; estimatedEndDate: string; status: 'Planning' | 'Active' | 'On Hold' | 'Completed'; isBudgetLocked?: boolean; }
export interface CostBudget { id: string; projectId: string; phaseId?: string; costHead: string; estimatedAmount: number; utilizedAmount: number; lastUpdated: string; isFrozen?: boolean; }

// --- Master Data Interfaces ---
export type CostHeadCategory = 'Direct' | 'Construction' | 'Indirect';
export interface CostHeadMasterItem { id: string; name: string; category: CostHeadCategory; description?: string; isActive: boolean; }

// --- Approval & Audit ---
export type ApprovalAction = 'Pending' | 'Approved' | 'Rejected' | 'Re-route';
export interface ApprovalLog { id: string; userId: string; userName: string; action: ApprovalAction; timestamp: string; comments?: string; step: string; }
export interface ApprovalRule { id: string; module: 'PR' | 'PO' | 'WO'; minAmount: number; maxAmount: number; workflowSteps: string[]; }

export interface AuditTrail { id: string; userId: string; userName: string; action: string; module: string; entityId: string; timestamp: string; details: string; oldValue?: any; newValue?: any; }

export interface NewVendorData extends Omit<Vendor, 'id' | 'onboardingDate' | 'isActive' | 'isBlacklisted' | 'vendorCode'> {}
export interface NewPRData extends Omit<PurchaseRequisition, 'id' | 'prNumber' | 'status' | 'date'> {}
export interface NewPOData extends Omit<PurchaseOrder, 'id' | 'poNumber' | 'status' | 'date' | 'version'> {}
export interface NewWOData extends Omit<WorkOrder, 'id' | 'woNumber' | 'status'> {}

export type CostHeadType = 'Land Cost' | 'Approval & Liaison' | 'Excavation' | 'RCC' | 'Masonry' | 'Finishing' | 'MEP' | 'Amenities' | 'Infra & External Dev' | 'Marketing' | 'Admin & Overheads';
export interface NewMaterialData { name: string; category: MaterialCategory; uom: UOM; hsnCode: string; gstPercent: number; standardWastage: number; qualityGrade?: string; }
export interface NewServiceData { name: string; category: ServiceCategory; uom: UOM; sacCode: string; gstPercent: number; }
export interface NewBOQData { name: string; }
export interface NewCostHeadData { name: string; category: CostHeadCategory; description?: string; }

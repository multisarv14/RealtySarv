import { 
  Lead, User, Project, Source, Template, PaymentPlan, Budget, ClientProfile, UnitType, 
  LocationSetting, LivingPlace, LeadStatusType, SiteVisitStatusType, TaskPriorityType, 
  BookingStatusType, AgreementStatusType, PossessionStatusType, InventoryStatusType, 
  ProjectTypeType, ProjectStatusType, UserRoleSetting, UserDesignation, CompanyProfile, 
  FinancialSettings, ApplicationSettings, ChannelPartner, DistributionRule, FormFieldConfig, Vendor, 
  PurchaseOrder, WorkOrder, StockItem, DailyProgressReport, MaterialMaster, ServiceMaster,
  ProjectPhase, CostBudget, BOQ, BOQItem, PurchaseRequisition, ApprovalRule, AuditTrail,
  CostHeadMasterItem, LedgerAccount, Voucher, GstEntry
} from './types';
import { http } from './httpClient';
import { track, notifyChange } from './liveQuery';

// Drop-in replacement for the old Dexie/IndexedDB layer: same table API (toArray, put, bulkPut,
// where(...).toArray(), update, ...) but backed by the Express + MongoDB server.

// Tables that used Dexie auto-increment ids; the server stores them as a singleton with id 1.
const SINGLETONS = new Set(['financialSettings', 'applicationSettings']);

class Collection<T extends Record<string, any>> {
    constructor(private table: Table<T>, private filter: Record<string, string> = {}, private sort = '') {}

    reverse(): Collection<T> {
        const desc = this.sort.startsWith('-');
        return new Collection(this.table, this.filter, desc ? this.sort.slice(1) : `-${this.sort}`);
    }

    async toArray(): Promise<T[]> {
        track(this.table.name);
        const qs = new URLSearchParams({ ...this.filter, ...(this.sort ? { sort: this.sort } : {}) }).toString();
        return http<T[]>('GET', `/${this.table.name}${qs ? '?' + qs : ''}`);
    }

    async count(): Promise<number> { return (await this.toArray()).length; }

    async modify(fn: (item: T) => void): Promise<number> {
        const items = await this.toArray();
        items.forEach(fn);
        await this.table.bulkPut(items);
        return items.length;
    }
}

class Table<T extends Record<string, any>> {
    constructor(public name: string, private keyField = 'id') {}

    private keyOf(item: T): string { return String((item as any)[this.keyField]); }

    private withKey(item: T): T {
        if ((item as any)[this.keyField] === undefined && SINGLETONS.has(this.name)) return { ...item, [this.keyField]: 1 };
        return item;
    }

    toArray(): Promise<T[]> { return new Collection(this).toArray(); }
    count(): Promise<number> { return new Collection(this).count(); }
    where(criteria: Record<string, string>): Collection<T> { return new Collection(this, criteria); }
    orderBy(field: string): Collection<T> { return new Collection(this, {}, field); }

    async get(key: string | number): Promise<T | undefined> {
        track(this.name);
        try { return await http<T>('GET', `/${this.name}/${encodeURIComponent(String(key))}`); }
        catch (e: any) { if (e?.status === 404) return undefined; throw e; }
    }

    async add(item: T): Promise<string> {
        const body = this.withKey(item);
        await http('POST', `/${this.name}`, body);
        notifyChange(this.name);
        return this.keyOf(body);
    }

    async put(item: T): Promise<string> {
        const body = this.withKey(item);
        await http('PUT', `/${this.name}/${encodeURIComponent(this.keyOf(body))}`, body);
        notifyChange(this.name);
        return this.keyOf(body);
    }

    async bulkPut(items: T[]): Promise<void> {
        if (items.length) await http('PUT', `/${this.name}/bulk`, items.map((i) => this.withKey(i)));
        notifyChange(this.name);
    }

    bulkAdd(items: T[]): Promise<void> { return this.bulkPut(items); }

    async update(key: string | number, changes: Partial<T>): Promise<number> {
        await http('PUT', `/${this.name}/${encodeURIComponent(String(key))}`, changes);
        notifyChange(this.name);
        return 1;
    }

    async delete(key: string | number): Promise<void> {
        await http('DELETE', `/${this.name}/${encodeURIComponent(String(key))}`);
        notifyChange(this.name);
    }

    async clear(): Promise<void> {
        await http('DELETE', `/${this.name}`);
        notifyChange(this.name);
    }
}

export class RealtySarvDB {
    leads = new Table<Lead>('leads');
    users = new Table<User>('users');
    projects = new Table<Project>('projects');
    sources = new Table<Source>('sources');
    templates = new Table<Template>('templates');
    paymentPlans = new Table<PaymentPlan>('paymentPlans');
    budgets = new Table<Budget>('budgets');
    clientProfiles = new Table<ClientProfile>('clientProfiles');
    unitTypes = new Table<UnitType>('unitTypes');
    locationSettings = new Table<LocationSetting>('locationSettings');
    livingPlaces = new Table<LivingPlace>('livingPlaces');
    leadStatusTypes = new Table<LeadStatusType>('leadStatusTypes');
    siteVisitStatusTypes = new Table<SiteVisitStatusType>('siteVisitStatusTypes');
    taskPriorityTypes = new Table<TaskPriorityType>('taskPriorityTypes');
    bookingStatusTypes = new Table<BookingStatusType>('bookingStatusTypes');
    agreementStatusTypes = new Table<AgreementStatusType>('agreementStatusTypes');
    possessionStatusTypes = new Table<PossessionStatusType>('possessionStatusTypes');
    inventoryStatusTypes = new Table<InventoryStatusType>('inventoryStatusTypes');
    projectTypeTypes = new Table<ProjectTypeType>('projectTypeTypes');
    projectStatusTypes = new Table<ProjectStatusType>('projectStatusTypes');
    userRoleSettings = new Table<UserRoleSetting>('userRoleSettings');
    userDesignations = new Table<UserDesignation>('userDesignations');
    channelPartners = new Table<ChannelPartner>('channelPartners');
    distributionRules = new Table<DistributionRule>('distributionRules');
    companyProfile = new Table<CompanyProfile>('companyProfile', 'name');
    financialSettings = new Table<FinancialSettings>('financialSettings');
    applicationSettings = new Table<ApplicationSettings>('applicationSettings');
    formFieldConfigs = new Table<FormFieldConfig>('formFieldConfigs');
    vendors = new Table<Vendor>('vendors');
    purchaseRequisitions = new Table<PurchaseRequisition>('purchaseRequisitions');
    purchaseOrders = new Table<PurchaseOrder>('purchaseOrders');
    workOrders = new Table<WorkOrder>('workOrders');
    materialStock = new Table<StockItem>('materialStock');
    dailyProgressReports = new Table<DailyProgressReport>('dailyProgressReports');
    materialMaster = new Table<MaterialMaster>('materialMaster');
    serviceMaster = new Table<ServiceMaster>('serviceMaster');
    projectPhases = new Table<ProjectPhase>('projectPhases');
    costBudgets = new Table<CostBudget>('costBudgets');
    boqs = new Table<BOQ>('boqs');
    boqItems = new Table<BOQItem>('boqItems');
    approvalRules = new Table<ApprovalRule>('approvalRules');
    auditTrails = new Table<AuditTrail>('auditTrails');
    costHeadMaster = new Table<CostHeadMasterItem>('costHeadMaster');
    ledgerAccounts = new Table<LedgerAccount>('ledgerAccounts');
    vouchers = new Table<Voucher>('vouchers');
    gstEntries = new Table<GstEntry>('gstEntries');

    /** Kept for call-site compatibility: verifies the API is reachable. */
    async open(): Promise<void> { await http('GET', '/health', undefined, { auth: false }); }
}

export const db = new RealtySarvDB();

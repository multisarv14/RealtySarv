
import React from 'react';
import { AdminPanelSection, Lead, User, NewUserData, NewSourceData, Project, NewProjectData, Source, Budget, NewBudgetData, ClientProfile, NewClientProfileData, UnitType, NewUnitTypeData, LocationSetting, NewLocationSettingData, LivingPlace, NewLivingPlaceData, Template, NewTemplateData, LeadStatusType, SiteVisitStatusType, TaskPriorityType, BookingStatusType, AgreementStatusType, PossessionStatusType, InventoryStatusType, ProjectTypeType, ProjectStatusType, NewLeadStatusTypeData, NewSiteVisitStatusTypeData, NewTaskPriorityTypeData, NewBookingStatusTypeData, NewAgreementStatusTypeData, NewPossessionStatusTypeData, NewInventoryStatusTypeData, NewProjectTypeTypeData, NewProjectStatusTypeData, UserRoleSetting, NewUserRoleSettingData, UserDesignation, NewUserDesignationData, CompanyProfile, PaymentPlan, FinancialSettings, ApplicationSettings, ChannelPartner, NewChannelPartnerData, FormFieldConfig, DistributionRule } from '../../types';
import AdminSidebar from './AdminSidebar';
import { Toaster } from '../ui/Toast';
import { ConfirmHost } from '../ui/Confirm';
import AdminUserManagement from './AdminUserManagement';
import AdminSourceManagement from './AdminSourceManagement';
import AdminProjectManagement from './AdminProjectManagement';
import AdminGenericSettingManagement from './AdminGenericSettingManagement';
import AdminConnectSarv from './AdminConnectSarv';
import AdminTemplateManagement from './AdminTemplateManagement';
import AdminCompanyProfile from './AdminCompanyProfile';
import AdminBilling from './AdminBilling';
import AdminReporting from './AdminReporting';
import AdminPaymentPlanManagement from './AdminPaymentPlanManagement';
import AdminFinancialSettings from './AdminFinancialSettings';
import AdminAppearanceSettings from './AdminAppearanceSettings';
import AdminRoleAccess from './AdminRoleAccess';
import AdminLeadTransfer from './AdminLeadTransfer';
import AdminLeadMerge from './AdminLeadMerge';
import AdminDistributionRules from './AdminDistributionRules';
import OrganizationChart from './OrganizationChart';
import AdminApplicationSettings from './AdminApplicationSettings';
import AdminDashboard from './AdminDashboard';
import AdminLeadIntegrations from './AdminLeadIntegrations';
import AdminPropertyPortals from './AdminPropertyPortals';
import AdminCommunicationIntegrations from './AdminCommunicationIntegrations';
import AdminAccountingIntegrations from './AdminAccountingIntegrations';
import AdminPaymentIntegrations from './AdminPaymentIntegrations';
import AdminMarketingIntegrations from './AdminMarketingIntegrations';
import AdminStorageIntegrations from './AdminStorageIntegrations';
import AdminCustomIntegrations from './AdminCustomIntegrations';
import AdminChannelPartnerManagement from './AdminChannelPartnerManagement';
import AdminFormFieldCustomization from './AdminFormFieldCustomization';

interface AdminPanelProps {
  currentUserId?: string;
  onSaveRoleAccess: (role: UserRoleSetting) => Promise<unknown> | void;
  erpLocked?: boolean;
  distributionRules: DistributionRule[];
  onSaveDistributionRule: (rule: DistributionRule) => Promise<unknown> | void;
  onMergeLeads: (primary: Lead, removeIds: string[]) => Promise<unknown> | void;
  leads: Lead[];
  onUpdateLeads: (updatedLeads: Lead[]) => void;
  users: User[];
  onUpdateUsers: (updatedUsers: User[]) => void;
  onAddUser: (userData: NewUserData) => void;
  onUpdateUser: (updatedUser: User) => void;
  sources: Source[];
  onUpdateSources: (updatedSources: Source[]) => void;
  onAddSource: (sourceData: NewSourceData) => void;
  projects: Project[];
  onUpdateProjects: (updatedProjects: Project[]) => void;
  onAddProject: (projectData: NewProjectData) => void;
  onDeleteProject: (projectId: string) => void;
  templates: Template[];
  onUpdateTemplates: (updatedTemplates: Template[]) => void;
  onAddTemplate: (templateData: NewTemplateData) => void;
  paymentPlans: PaymentPlan[];
  onUpdatePaymentPlans: (updatedPlans: PaymentPlan[]) => void;
  onDeletePaymentPlan: (planId: string) => void;
  budgets: Budget[];
  onUpdateBudgets: (updated: Budget[]) => void;
  onAddBudget: (data: NewBudgetData) => void;
  clientProfiles: ClientProfile[];
  onUpdateClientProfiles: (updated: ClientProfile[]) => void;
  onAddClientProfile: (data: NewClientProfileData) => void;
  unitTypes: UnitType[];
  onUpdateUnitTypes: (updated: UnitType[]) => void;
  onAddUnitType: (data: NewUnitTypeData) => void;
  locationSettings: LocationSetting[];
  onUpdateLocationSettings: (updated: LocationSetting[]) => void;
  onAddLocationSetting: (data: NewLocationSettingData) => void;
  livingPlaces: LivingPlace[];
  onUpdateLivingPlaces: (updated: LivingPlace[]) => void;
  onAddLivingPlace: (data: NewLivingPlaceData) => void;
  leadStatusTypes: LeadStatusType[];
  onUpdateLeadStatusTypes: (updated: LeadStatusType[]) => void;
  onAddLeadStatusType: (data: NewLeadStatusTypeData) => void;
  siteVisitStatusTypes: SiteVisitStatusType[];
  onUpdateSiteVisitStatusTypes: (updated: SiteVisitStatusType[]) => void;
  onAddSiteVisitStatusType: (data: NewSiteVisitStatusTypeData) => void;
  taskPriorityTypes: TaskPriorityType[];
  onUpdateTaskPriorityTypes: (updated: TaskPriorityType[]) => void;
  onAddTaskPriorityType: (data: NewTaskPriorityTypeData) => void;
  bookingStatusTypes: BookingStatusType[];
  onUpdateBookingStatusTypes: (updated: BookingStatusType[]) => void;
  onAddBookingStatusType: (data: NewBookingStatusTypeData) => void;
  agreementStatusTypes: AgreementStatusType[];
  onUpdateAgreementStatusTypes: (updated: AgreementStatusType[]) => void;
  onAddAgreementStatusType: (data: NewAgreementStatusTypeData) => void;
  possessionStatusTypes: PossessionStatusType[];
  onUpdatePossessionStatusTypes: (updated: PossessionStatusType[]) => void;
  onAddPossessionStatusType: (data: NewPossessionStatusTypeData) => void;
  inventoryStatusTypes: InventoryStatusType[];
  onUpdateInventoryStatusTypes: (updated: InventoryStatusType[]) => void;
  onAddInventoryStatusType: (data: NewInventoryStatusTypeData) => void;
  projectTypeTypes: ProjectTypeType[];
  onUpdateProjectTypeTypes: (updated: ProjectTypeType[]) => void;
  onAddProjectTypeType: (data: NewProjectTypeTypeData) => void;
  projectStatusTypes: ProjectStatusType[];
  onUpdateProjectStatusTypes: (updated: ProjectStatusType[]) => void;
  onAddProjectStatusType: (data: NewProjectStatusTypeData) => void;
  userRoleSettings: UserRoleSetting[];
  userDesignations: UserDesignation[];
  onUpdateUserDesignations: (updated: UserDesignation[]) => void;
  onAddUserDesignation: (data: NewUserDesignationData) => void;
  companyProfile: CompanyProfile;
  onUpdateCompanyProfile: (updated: CompanyProfile) => void;
  financialSettings: FinancialSettings;
  onUpdateFinancialSettings: (updated: FinancialSettings) => void;
  applicationSettings: ApplicationSettings;
  onUpdateApplicationSettings: (updated: ApplicationSettings) => void;
  formFieldConfigs: FormFieldConfig[];
  onUpdateFormFieldConfigs: (updated: FormFieldConfig[]) => void;
  channelPartners: ChannelPartner[];
  onAddChannelPartner: (data: NewChannelPartnerData) => void;
  onUpdateChannelPartners: (updated: ChannelPartner[]) => void;
  themeColor: string;
  onThemeColorChange: (color: string) => void;
  themeMode: 'light' | 'dark';
  onThemeModeChange: (mode: 'light' | 'dark') => void;
  onNavigateToMain: () => void;
  onLogout: () => void;
}

type SettingsTab = 'lead' | 'booking' | 'company' | 'forms';

const SECTION_TITLES: Record<string, string> = {
  dashboard: 'Dashboard', users: 'Users', projects: 'Projects', 'channel-partners': 'Partners',
  integrations: 'Integrations', reporting: 'Reports', operations: 'Operations', settings: 'Settings',
};

const AdminPanel: React.FC<AdminPanelProps> = (props) => {
  const [activeSection, setActiveSection] = React.useState<AdminPanelSection | 'dashboard'>('dashboard');
  const [activeSubSection, setActiveSubSection] = React.useState<string | null>(null);
  const [activeSetting, setActiveSetting] = React.useState<string | null>(null);
  const [activeSettingsTab, setActiveSettingsTab] = React.useState<SettingsTab>('lead');
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  const handleSelectSection = (section: AdminPanelSection | 'dashboard', subSection?: string) => {
    setActiveSection(section);
    setActiveSubSection(subSection || (section === 'users' || section === 'projects' ? 'list' : section === 'operations' ? 'transfer' : null));
    if (section !== 'settings') setActiveSetting(null);
    setIsSidebarOpen(false);
  };

  const SettingCard: React.FC<{
    settingKey: string;
    icon: string;
    title: string;
    description: string;
    onClick: (key: string) => void;
  }> = ({ settingKey, icon, title, description, onClick }) => (
    <div
      onClick={() => onClick(settingKey)}
      className="bg-[var(--medium-bg)] p-5 rounded-xl shadow-sm border border-[var(--light-bg)] flex flex-col transition-all cursor-pointer hover:border-[var(--primary-color)] hover:shadow-md group"
    >
      <div className="text-2xl text-[var(--primary-color)] mb-3 group-hover:scale-110 transition-transform">
        <i className={icon}></i>
      </div>
      <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1">{title}</h4>
      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{description}</p>
    </div>
  );

  const SettingsTabButton: React.FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
  }> = ({ label, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
        isActive
          ? 'border-[var(--primary-color)] text-[var(--primary-color)] bg-[var(--primary-color)]/5'
          : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
      }`}
    >
      {label}
    </button>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <AdminDashboard leads={props.leads} projects={props.projects} users={props.users} onAddUser={() => setActiveSection('users')} onAddProject={() => setActiveSection('projects')} onViewReports={() => setActiveSection('reporting')} />;
      case 'users':
        if (activeSubSection === 'access') return <AdminRoleAccess settings={props.userRoleSettings} users={props.users} onSave={props.onSaveRoleAccess} erpLocked={props.erpLocked} />;
        if (activeSubSection === 'designations') return <AdminGenericSettingManagement title="Designations" itemNoun="Designation" items={props.userDesignations} onUpdateItems={props.onUpdateUserDesignations} onAddItem={props.onAddUserDesignation} />;
        if (activeSubSection === 'chart') return <div className="p-4 bg-[var(--medium-bg)] rounded-lg shadow-md h-full overflow-auto org-chart-container"><h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">Org chart</h3><OrganizationChart users={props.users || []} /></div>;
        return <AdminUserManagement currentUserId={props.currentUserId} users={props.users} onUpdateUsers={props.onUpdateUsers} onAddUser={props.onAddUser} onUpdateUser={props.onUpdateUser} projects={props.projects} />;
      case 'projects':
        switch (activeSubSection) {
          case 'types': return <AdminGenericSettingManagement title="Project types" itemNoun="Project Type" items={props.projectTypeTypes} onUpdateItems={props.onUpdateProjectTypeTypes} onAddItem={props.onAddProjectTypeType} />;
          case 'statuses': return <AdminGenericSettingManagement title="Construction stages" itemNoun="Project Status" items={props.projectStatusTypes} onUpdateItems={props.onUpdateProjectStatusTypes} onAddItem={props.onAddProjectStatusType} />;
          case 'unit-types': return <AdminGenericSettingManagement title="Unit types" itemNoun="Unit Type" items={props.unitTypes} onUpdateItems={props.onUpdateUnitTypes} onAddItem={props.onAddUnitType} />;
          case 'inventory': return <AdminGenericSettingManagement title="Inventory states" itemNoun="Inventory Status" items={props.inventoryStatusTypes} onUpdateItems={props.onUpdateInventoryStatusTypes} onAddItem={props.onAddInventoryStatusType} />;
          case 'payment-plans': return <AdminPaymentPlanManagement plans={props.paymentPlans} onUpdatePlans={props.onUpdatePaymentPlans} onDeletePlan={props.onDeletePaymentPlan} />;
          default: return <AdminProjectManagement projects={props.projects} onUpdateProjects={props.onUpdateProjects} onAddProject={props.onAddProject} onDeleteProject={props.onDeleteProject} paymentPlans={props.paymentPlans} />;
        }
      case 'channel-partners':
        return <AdminChannelPartnerManagement leads={props.leads} partners={props.channelPartners} onAddPartner={props.onAddChannelPartner} onUpdatePartners={props.onUpdateChannelPartners} />;
      case 'operations':
        if (activeSubSection === 'merge') return <AdminLeadMerge leads={props.leads} users={props.users} onMergeLeads={props.onMergeLeads} />;
        if (activeSubSection === 'distribution') return <AdminDistributionRules rules={props.distributionRules} users={props.users} projects={props.projects} sources={props.sources} leads={props.leads} onSaveRule={props.onSaveDistributionRule} />;
        return <AdminLeadTransfer leads={props.leads} users={props.users} projects={(props.projects || []).map(p => p.name)} currentUserId={props.currentUserId} onUpdateLeads={props.onUpdateLeads} />;
      case 'reporting':
        return <AdminReporting leads={props.leads} projects={props.projects} />;
      case 'integrations':
        if (!activeSubSection) return <div className="p-20 text-center opacity-40"><i className="fas fa-puzzle-piece text-5xl mb-4"></i><p>Select a specific integration to configure.</p></div>;
        switch(activeSubSection) {
            case 'lead-acquisition': return <AdminLeadIntegrations onNavigate={(target) => setActiveSubSection(target)} />;
            case 'portals': return <AdminPropertyPortals />;
            case 'communication': return <AdminCommunicationIntegrations leads={props.leads} />;
            case 'payment-gateways': return <AdminPaymentIntegrations />;
            case 'accounting': return <AdminAccountingIntegrations />;
            case 'marketing': return <AdminMarketingIntegrations />;
            case 'storage': return <AdminStorageIntegrations />;
            case 'custom': return <AdminCustomIntegrations />;
            case 'templates': return <AdminTemplateManagement templates={props.templates} onUpdateTemplates={props.onUpdateTemplates} onAddTemplate={props.onAddTemplate} />;
            case 'email': return <AdminConnectSarv activeItem="email" />;
            default: return <div className="p-10 text-center text-gray-500">Integration setting for "{activeSubSection}" is coming soon.</div>;
        }
      case 'settings':
         if (activeSetting) {
            switch (activeSetting) {
                case 'sources': return <AdminSourceManagement sources={props.sources} onUpdateSources={props.onUpdateSources} onAddSource={props.onAddSource} />;
                case 'budgets': return <AdminGenericSettingManagement title="Budget Management" itemNoun="Budget" items={props.budgets} onUpdateItems={props.onUpdateBudgets} onAddItem={props.onAddBudget} />;
                case 'client-profiles': return <AdminGenericSettingManagement title="Client Profile Management" itemNoun="Profile" items={props.clientProfiles} onUpdateItems={props.onUpdateClientProfiles} onAddItem={props.onAddClientProfile} />;
                case 'locations': return <AdminGenericSettingManagement title="Preferred Location Management" itemNoun="Location" items={props.locationSettings} onUpdateItems={props.onUpdateLocationSettings} onAddItem={props.onAddLocationSetting} />;
                case 'living-places': return <AdminGenericSettingManagement title="Current Living Place Management" itemNoun="Living Place" items={props.livingPlaces} onUpdateItems={props.onUpdateLivingPlaces} onAddItem={props.onAddLivingPlace} />;
                case 'lead-statuses': return <AdminGenericSettingManagement title="Lead Status Management" itemNoun="Lead Status" items={props.leadStatusTypes} onUpdateItems={props.onUpdateLeadStatusTypes} onAddItem={props.onAddLeadStatusType} />;
                case 'site-visit-statuses': return <AdminGenericSettingManagement title="Site Visit Status Management" itemNoun="Site Visit Status" items={props.siteVisitStatusTypes} onUpdateItems={props.onUpdateSiteVisitStatusTypes} onAddItem={props.onAddSiteVisitStatusType} />;
                case 'task-priorities': return <AdminGenericSettingManagement title="Task Priority Management" itemNoun="Task Priority" items={props.taskPriorityTypes} onUpdateItems={props.onUpdateTaskPriorityTypes} onAddItem={props.onAddTaskPriorityType} />;
                case 'booking-statuses': return <AdminGenericSettingManagement title="Booking Status Management" itemNoun="Booking Status" items={props.bookingStatusTypes} onUpdateItems={props.onUpdateBookingStatusTypes} onAddItem={props.onAddBookingStatusType} />;
                case 'agreement-statuses': return <AdminGenericSettingManagement title="Agreement Status Management" itemNoun="Agreement Status" items={props.agreementStatusTypes} onUpdateItems={props.onUpdateAgreementStatusTypes} onAddItem={props.onAddAgreementStatusType} />;
                case 'possession-statuses': return <AdminGenericSettingManagement title="Possession Status Management" itemNoun="Possession Status" items={props.possessionStatusTypes} onUpdateItems={props.onUpdatePossessionStatusTypes} onAddItem={props.onAddPossessionStatusType} />;
                case 'company-profile': return <AdminCompanyProfile profile={props.companyProfile} onUpdateProfile={props.onUpdateCompanyProfile} formConfigs={props.formFieldConfigs} />;
                case 'billing': return <AdminBilling />;
                case 'financial-settings': return <AdminFinancialSettings settings={props.financialSettings} onUpdateSettings={props.onUpdateFinancialSettings} />;
                case 'application-settings': return <AdminApplicationSettings settings={props.applicationSettings} onUpdateSettings={props.onUpdateApplicationSettings} />;
                case 'appearance': return <AdminAppearanceSettings profile={props.companyProfile} onUpdateProfile={props.onUpdateCompanyProfile} themeColor={props.themeColor} onThemeColorChange={props.onThemeColorChange} themeMode={props.themeMode} onThemeModeChange={props.onThemeModeChange} />;
                case 'custom-fields': return <AdminFormFieldCustomization configs={props.formFieldConfigs} onUpdateConfigs={props.onUpdateFormFieldConfigs} />;
                default: setActiveSetting(null); return null;
            }
        }
        return (
          <div className="flex flex-col h-full animate-fadeIn">
            <div className="border-b border-[var(--light-bg)] mb-8 -mx-4 px-4 flex-shrink-0">
                <nav className="flex space-x-2 overflow-x-auto no-scrollbar">
                    <SettingsTabButton label="Leads" isActive={activeSettingsTab === 'lead'} onClick={() => setActiveSettingsTab('lead')} />
                    <SettingsTabButton label="Finances" isActive={activeSettingsTab === 'booking'} onClick={() => setActiveSettingsTab('booking')} />
                    <SettingsTabButton label="Form Engine" isActive={activeSettingsTab === 'forms'} onClick={() => setActiveSettingsTab('forms')} />
                    <SettingsTabButton label="Company" isActive={activeSettingsTab === 'company'} onClick={() => setActiveSettingsTab('company')} />
                </nav>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {activeSettingsTab === 'lead' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <SettingCard settingKey="sources" icon="fas fa-bullhorn" title="Lead Sources" description="Manage marketing channels." onClick={setActiveSetting} />
                        <SettingCard settingKey="lead-statuses" icon="fas fa-flag" title="Pipeline Stages" description="Custom lead lifecycle stages." onClick={setActiveSetting} />
                        <SettingCard settingKey="site-visit-statuses" icon="fas fa-calendar-check" title="Visit Outcomes" description="Site visit registration states." onClick={setActiveSetting} />
                        <SettingCard settingKey="task-priorities" icon="fas fa-exclamation-circle" title="Task Priorities" description="SLA urgency levels." onClick={setActiveSetting} />
                        <SettingCard settingKey="budgets" icon="fas fa-wallet" title="Budget Range" description="Lead qualification brackets." onClick={setActiveSetting} />
                        <SettingCard settingKey="client-profiles" icon="fas fa-user-tie" title="Client Profiles" description="Professional segmentation." onClick={setActiveSetting} />
                        <SettingCard settingKey="locations" icon="fas fa-map-marked-alt" title="Locations" description="Geographic preferences." onClick={setActiveSetting} />
                        <SettingCard settingKey="living-places" icon="fas fa-home" title="Living Status" description="Current residence types." onClick={setActiveSetting} />
                    </div>
                )}
                {activeSettingsTab === 'booking' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                         <SettingCard settingKey="booking-statuses" icon="fas fa-file-signature" title="Booking Status" description="Post-sales workflow states." onClick={setActiveSetting} />
                         <SettingCard settingKey="agreement-statuses" icon="fas fa-file-contract" title="Legal States" description="Sale deed processing states." onClick={setActiveSetting} />
                         <SettingCard settingKey="possession-statuses" icon="fas fa-key" title="Handover Logic" description="Final possession states." onClick={setActiveSetting} />
                         <SettingCard settingKey="financial-settings" icon="fas fa-calculator" title="Financial Engine" description="Tax and rule-based charges." onClick={setActiveSetting} />
                    </div>
                )}
                {activeSettingsTab === 'forms' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <SettingCard settingKey="custom-fields" icon="fas fa-vial" title="Dynamic Form Fields" description="Add or remove fields globally." onClick={setActiveSetting} />
                    </div>
                )}
                {activeSettingsTab === 'company' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <SettingCard settingKey="company-profile" icon="fas fa-building" title="Organization Identity" description="Firm details and statutory data." onClick={setActiveSetting} />
                        <SettingCard settingKey="billing" icon="fas fa-credit-card" title="Enterprise Subscription" description="Invoices and plan control." onClick={setActiveSetting} />
                        <SettingCard settingKey="appearance" icon="fas fa-paint-brush" title="Branding & UI" description="White-label configuration." onClick={setActiveSetting} />
                        <SettingCard settingKey="application-settings" icon="fas fa-cog" title="System Config" description="Timezone and locale settings." onClick={setActiveSetting} />
                    </div>
                )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full relative flex overflow-hidden bg-[var(--dark-bg)]">
      <div className={`fixed md:relative top-0 left-0 h-full z-50 transform md:transform-none transition-all duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'}`}>
          <AdminSidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} activeSection={activeSection} onSelectSection={handleSelectSection} activeSubSection={activeSubSection} onClose={() => setIsSidebarOpen(false)} />
      </div>
      <div className="flex-1 flex flex-col w-full md:w-auto overflow-hidden">
        <div className="bg-[var(--medium-bg)] p-3 border-b border-[var(--light-bg)] flex justify-between items-center h-12">
            <div className="flex items-center gap-3">
                <button onClick={() => setIsSidebarOpen(true)} className="text-[var(--text-secondary)] p-2 rounded-full md:hidden"><i className="fas fa-bars"></i></button>
                <div className="flex items-center gap-2">
                    {activeSection === 'settings' && activeSetting && (
                      <button onClick={() => setActiveSetting(null)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2"><i className="fas fa-arrow-left"></i></button>
                    )}
                    <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                        Admin Console / {SECTION_TITLES[activeSection] || activeSection}{activeSetting ? ` / ${activeSetting.replace(/-/g, ' ')}` : ''}
                    </h3>
                </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={props.onNavigateToMain} className="px-3 py-1 rounded bg-[var(--primary-color)] text-white text-[10px] font-bold uppercase shadow-sm transition-all hover:brightness-110">Main App</button>
              <button onClick={props.onLogout} className="px-3 py-1 rounded bg-red-600 text-white text-[10px] font-bold uppercase transition-all hover:brightness-110">Logout</button>
            </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-[var(--dark-bg)] custom-scrollbar">
          {renderContent()}
        </div>
      </div>
      <Toaster />
      <ConfirmHost />
    </div>
  );
};

export default AdminPanel;

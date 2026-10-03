
import React from 'react';
import LoginPage from './components/LoginPage';
import LandingPage from './components/LandingPage';
import MainAppContainer from './components/MainAppContainer';
import ProjectSarvContainer from './components/realty/ProjectSarvContainer';
import FinanceSarvContainer from './components/realty/FinanceSarvContainer';
import SystemSwitcher from './components/SystemSwitcher';
import { Lead, User, Project, NewUserData, SystemType, PaymentPlan, Budget, ClientProfile, UnitType, LocationSetting, LivingPlace, FormFieldConfig, FinancialSettings, ApplicationSettings, ChannelPartner, NewChannelPartnerData, TaskStatus, LifecycleStage, LeadLifecycleStatus } from './types';
import { db } from './db';
import { useLiveQuery } from './liveQuery';
import { INITIAL_USERS } from './constants';
import { v4 as uuidv4 } from 'uuid';
import InstallationWizard from './components/InstallationWizard';
import SetupWizard from './components/SetupWizard';
import AdminPanel from './components/admin/AdminPanel';
import { tenantApi, getToken, setToken, onUnauthorized, authApi } from './httpClient';
import { currentTenant, tenantUrl, mainSiteUrl } from './tenant';
import WorkspaceFinder from './components/WorkspaceFinder';
import { PlanId } from './plans';
import { notifyAll } from './liveQuery';

const getInitialTheme = (): string => {
  try {
    const savedTheme = localStorage.getItem('realtySarvThemeColor');
    return savedTheme || '#1a73e8';
  } catch (error) {
    return '#1a73e8';
  }
};

const getInitialThemeMode = (): 'light' | 'dark' => {
  try {
    const savedMode = localStorage.getItem('realtySarvThemeMode');
    return savedMode === 'light' ? 'light' : 'dark';
  } catch (error) {
    return 'dark';
  }
};

const App: React.FC = () => {
  const [activeSystem, setActiveSystem] = React.useState<SystemType>(() => {
    return (localStorage.getItem('lastActiveSystem') as SystemType) || 'LeadSarv';
  });
  const [showInstallationWizard, setShowInstallationWizard] = React.useState<boolean>(false);
  const [workspaceInfo, setWorkspaceInfo] = React.useState<{ plan?: string | null; modules?: { crm?: boolean; erp?: boolean } } | null>(null);
  const [wizardPlan, setWizardPlan] = React.useState<PlanId | undefined>(undefined);

  // viewState controls exactly what the user sees: the marketing landing page, the sign-in screen, or the app itself
  // On a company address (acme.realtysarv.com) clients land on their own sign-in page; the main site shows the landing page.
  const tenant = React.useMemo(currentTenant, []);
  const [viewState, setViewState] = React.useState<'landing' | 'login' | 'authenticated'>(() => (tenant || window.location.hash === '#find' ? 'login' : 'landing'));

  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [themeColor, setThemeColorState] = React.useState<string>(getInitialTheme);
  const [themeMode, setThemeModeState] = React.useState<'light' | 'dark'>(getInitialThemeMode);
  const [currentAppView, setCurrentAppView] = React.useState<'main' | 'admin'>('main');
  const [dbError, setDbError] = React.useState<string | null>(null);
  const [restoringSession, setRestoringSession] = React.useState<boolean>(() => !!getToken() || window.location.hash.startsWith('#handoff='));

  const leads = useLiveQuery(() => db.leads.toArray(), []);
  const users = useLiveQuery(() => db.users.toArray(), []);
  const projects = useLiveQuery(() => db.projects.toArray(), []);
  const sources = useLiveQuery(() => db.sources.toArray(), []);
  const templates = useLiveQuery(() => db.templates.toArray(), []);
  const paymentPlans = useLiveQuery(() => db.paymentPlans.toArray(), []);
  const budgets = useLiveQuery(() => db.budgets.toArray(), []);
  const clientProfiles = useLiveQuery(() => db.clientProfiles.toArray(), []);
  const unitTypes = useLiveQuery(() => db.unitTypes.toArray(), []);
  const locationSettings = useLiveQuery(() => db.locationSettings.toArray(), []);
  const livingPlaces = useLiveQuery(() => db.livingPlaces.toArray(), []);
  const leadStatusTypes = useLiveQuery(() => db.leadStatusTypes.toArray(), []);
  const siteVisitStatusTypes = useLiveQuery(() => db.siteVisitStatusTypes.toArray(), []);
  const taskPriorityTypes = useLiveQuery(() => db.taskPriorityTypes.toArray(), []);
  const bookingStatusTypes = useLiveQuery(() => db.bookingStatusTypes.toArray(), []);
  const agreementStatusTypes = useLiveQuery(() => db.agreementStatusTypes.toArray(), []);
  const possessionStatusTypes = useLiveQuery(() => db.possessionStatusTypes.toArray(), []);
  const inventoryStatusTypes = useLiveQuery(() => db.inventoryStatusTypes.toArray(), []);
  const projectTypeTypes = useLiveQuery(() => db.projectTypeTypes.toArray(), []);
  const projectStatusTypes = useLiveQuery(() => db.projectStatusTypes.toArray(), []);
  const userRoleSettings = useLiveQuery(() => db.userRoleSettings.toArray(), []);
  const userDesignations = useLiveQuery(() => db.userDesignations.toArray(), []);
  const channelPartners = useLiveQuery(() => db.channelPartners.toArray(), []);
  const formFieldConfigs = useLiveQuery(() => db.formFieldConfigs.toArray(), []);
  const companyProfile = useLiveQuery(async () => (await db.companyProfile.toArray())[0]);
  const financialSettings = useLiveQuery(async () => (await db.financialSettings.toArray())[0]);
  const applicationSettings = useLiveQuery(async () => (await db.applicationSettings.toArray())[0]);

  React.useEffect(() => {
    (db as any).open().catch((err: any) => {
      console.error("Failed to open database:", err);
      setDbError("Cannot reach the RealtySarv server. Please make sure the API and MongoDB are running, then retry.");
    });
  }, []);

  // Resume an existing session, and drop back to the landing page if the token stops working.
  React.useEffect(() => {
    // Arriving from the install wizard: the fragment holds a short-lived pass that signs the new owner straight in.
    const hash = window.location.hash;
    if (hash.startsWith('#handoff=')) {
      const pass = hash.slice('#handoff='.length);
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      authApi.exchange(pass)
        .then(({ token, user }) => { setToken(token); setCurrentUser(user); setViewState('authenticated'); notifyAll(); })
        .catch(() => { /* expired: they simply sign in on the login page */ })
        .finally(() => setRestoringSession(false));
    } else if (getToken()) {
      authApi.me()
        .then(({ user }: any) => { setCurrentUser(user); setViewState('authenticated'); notifyAll(); })
        .catch(() => setToken(''))
        .finally(() => setRestoringSession(false));
    }
    return onUnauthorized(() => { setViewState(tenant ? 'login' : 'landing'); setCurrentUser(null); setCurrentAppView('main'); });
  }, []);

  React.useEffect(() => {
    const body = document.body;
    if (activeSystem === 'ProjectSarv' && viewState === 'authenticated') {
      body.classList.add('realty-theme');
      document.documentElement.style.setProperty('--primary-color', '#3b82f6');
    } else if (activeSystem === 'FinanceSarv' && viewState === 'authenticated') {
      body.classList.remove('realty-theme');
      document.documentElement.style.setProperty('--primary-color', '#6366f1');
    } else {
      body.classList.remove('realty-theme');
      document.documentElement.style.setProperty('--primary-color', themeColor);
    }
    localStorage.setItem('lastActiveSystem', activeSystem);
  }, [activeSystem, themeColor, viewState]);

  React.useEffect(() => {
    const body = document.body;
    if (themeMode === 'light') body.classList.add('light');
    else body.classList.remove('light');
    localStorage.setItem('realtySarvThemeMode', themeMode);
    localStorage.setItem('realtySarvThemeColor', themeColor);
  }, [themeMode, themeColor]);

  const handleInstallComplete = async (
    adminData: NewUserData,
    companyName: string,
    plan: string,
    modules: { crm: boolean; erp: boolean },
    subdomain: string
  ): Promise<string> => {
    const normalizedEmail = (adminData.email || '').trim().toLowerCase();
    if (!normalizedEmail || !(adminData.password || '')) throw new Error('Please provide a valid email and password for the workspace administrator.');

    try {
      const { subdomain: created, handoff } = await tenantApi.create({ admin: { ...adminData, email: normalizedEmail }, companyName, subdomain, plan });
      return tenantUrl(created, handoff);
    } catch (error: any) {
      throw new Error(error?.status ? error.message : 'Can’t reach the server. Check your connection and try again.');
    }
  };

  // Which modules the company's plan includes (Growth Hub = CRM only).
  React.useEffect(() => {
    if (viewState !== 'authenticated') { setWorkspaceInfo(null); return; }
    authApi.workspace().then(setWorkspaceInfo).catch(() => setWorkspaceInfo(null));
  }, [viewState]);
  const lockedSystems: SystemType[] = workspaceInfo?.modules?.erp === false ? ['ProjectSarv', 'FinanceSarv'] : [];
  React.useEffect(() => {
    if (lockedSystems.includes(activeSystem)) setActiveSystem('LeadSarv');
  }, [workspaceInfo, activeSystem]);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setViewState('authenticated');
  };

  // The CRM hands us the whole list after every action. Save only the leads that changed, so an
  // open (possibly stale) page can't write old copies of everyone else's leads back to the database.
  const handleLeadsUpdate = async (updatedLeads: Lead[]) => {
    const before = new Map((leads || []).map((l) => [l.id, JSON.stringify(l)]));
    const changed = updatedLeads.filter((l) => before.get(l.id) !== JSON.stringify(l));
    if (changed.length) await db.leads.bulkPut(changed);
  };

  const handleUsersUpdate = async (updatedUsers: User[]) => {
    await db.users.bulkPut(updatedUsers);
  };

  const handleProjectsUpdate = async (updatedProjects: Project[]) => {
    await db.projects.bulkPut(updatedProjects);
  };

  const handleLogout = () => {
    setToken('');
    setViewState(tenant ? 'login' : 'landing');
    setCurrentUser(null);
    setCurrentAppView('main');
  };

  if (dbError) {
    return (
      <div className="flex h-screen w-screen flex-col justify-center items-center bg-[var(--dark-bg)] text-white p-6 text-center">
        <i className="fas fa-exclamation-triangle text-5xl text-red-500 mb-4"></i>
        <h2 className="text-2xl font-bold mb-2">Database Connection Error</h2>
        <p className="text-[var(--text-secondary)] max-w-md">{dbError}</p>
        <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2 bg-blue-600 rounded-md font-bold">Retry Connection</button>
      </div>
    );
  }

  if (restoringSession) return <div className="flex h-screen w-screen justify-center items-center bg-[var(--dark-bg)] text-white">Loading...</div>;

  if (showInstallationWizard) return <InstallationWizard onComplete={handleInstallComplete} onGoToLogin={() => setShowInstallationWizard(false)} initialPlan={wizardPlan} />;

  if (viewState !== 'authenticated') {
    return (
      <div className="app-container relative flex flex-col h-screen w-screen bg-[var(--dark-bg)] overflow-hidden">
        <div className="flex-1 overflow-hidden relative">
          {viewState === 'login' ? (
            tenant ? (
              <LoginPage
                onLoginSuccess={handleLoginSuccess}
                onGoToInstall={() => { window.location.href = mainSiteUrl(); }}
              />
            ) : (
              <WorkspaceFinder
                onGoToInstall={() => setShowInstallationWizard(true)}
                onBackToLanding={() => { window.history.replaceState(null, '', window.location.pathname); setViewState('landing'); }}
              />
            )
          ) : (
            <LandingPage onSignInClick={() => setViewState('login')} onStartFreeClick={(plan) => { setWizardPlan(plan); setShowInstallationWizard(true); }} />
          )}
        </div>
      </div>
    );
  }

  if (
    leads === undefined || users === undefined || projects === undefined || sources === undefined || templates === undefined || paymentPlans === undefined ||
    budgets === undefined || clientProfiles === undefined || unitTypes === undefined || locationSettings === undefined || livingPlaces === undefined ||
    leadStatusTypes === undefined || siteVisitStatusTypes === undefined || taskPriorityTypes === undefined || bookingStatusTypes === undefined ||
    agreementStatusTypes === undefined || possessionStatusTypes === undefined || inventoryStatusTypes === undefined || projectTypeTypes === undefined ||
    projectStatusTypes === undefined || userRoleSettings === undefined || userDesignations === undefined || companyProfile === undefined || financialSettings === undefined || applicationSettings === undefined || channelPartners === undefined || formFieldConfigs === undefined
  ) {
    return <div className="flex h-screen w-screen justify-center items-center bg-[var(--dark-bg)] text-white">Loading your workspace...</div>;
  }

  const showSetupWizard = viewState === 'authenticated' && currentUser?.role === 'Admin' && companyProfile && !companyProfile.setupCompleted;

  const renderActiveSystem = () => {
    if (activeSystem === 'ProjectSarv') {
      return <ProjectSarvContainer currentUser={currentUser!} users={users} projects={projects} onSwitchSystem={setActiveSystem} />;
    }

    if (activeSystem === 'FinanceSarv') {
      return <FinanceSarvContainer currentUser={currentUser!} users={users} projects={projects} onSwitchSystem={setActiveSystem} />;
    }

    if (currentAppView === 'main') {
      return (
        <MainAppContainer
          currentUser={currentUser}
          leads={leads}
          users={users}
          projects={projects}
          paymentPlans={paymentPlans}
          financialSettings={financialSettings}
          unitTypes={unitTypes}
          locationSettings={locationSettings}
          sources={sources}
          budgets={budgets}
          clientProfiles={clientProfiles}
          livingPlaces={livingPlaces}
          formConfigs={formFieldConfigs}
          onLeadsUpdate={handleLeadsUpdate}
          onProjectsUpdate={handleProjectsUpdate}
          onNavigateToAdmin={() => setCurrentAppView('admin')}
          onLogout={handleLogout}
          onUpdateTaskStatus={async (leadId, taskId, status) => await db.leads.where({ id: leadId }).modify(l => { const t = l.tasks.find(x => x.id === taskId); if (t) t.status = status; })}
          onUpdateLeadLifecycle={async (leadId, stage, status) => await db.leads.update(leadId, { [stage]: status } as any)}
          onUpdateLeadOwner={async (leadId, ownerId) => await db.leads.update(leadId, { ownerId })}
        />
      );
    }

    return (
      <AdminPanel
        leads={leads} onUpdateLeads={handleLeadsUpdate}
        users={users} onUpdateUsers={handleUsersUpdate} onAddUser={async (u) => await db.users.add({ id: uuidv4(), ...u, isActive: true, assignedProjectIds: [] })} onUpdateUser={async (u) => { try { await db.users.put(u); } catch (e: any) { window.alert(e?.message || 'Could not save the user.'); } }}
        sources={sources} onUpdateSources={async (s) => await db.sources.bulkPut(s)} onAddSource={async (s) => await db.sources.add({ id: uuidv4(), ...s })}
        projects={projects} onUpdateProjects={handleProjectsUpdate} onAddProject={async (p) => await db.projects.add({ id: uuidv4(), ...p, inventory: [], parkingInventory: [] })} onDeleteProject={async (id) => await db.projects.delete(id)}
        templates={templates} onUpdateTemplates={async (t) => await db.templates.bulkPut(t)} onAddTemplate={async (t) => await db.templates.add({ id: uuidv4(), ...t })}
        paymentPlans={paymentPlans} onUpdatePaymentPlans={async (p) => await db.paymentPlans.bulkPut(p)} onDeletePaymentPlan={async (id) => await db.paymentPlans.delete(id)}
        channelPartners={channelPartners} onAddChannelPartner={async (c) => await db.channelPartners.add({ id: uuidv4(), ...c, status: 'Pending', totalLeads: 0, totalConversions: 0, onboardingDate: new Date().toISOString().split('T')[0] })} onUpdateChannelPartners={async (c) => await db.channelPartners.bulkPut(c)}
        budgets={budgets} onUpdateBudgets={async (b) => await db.budgets.bulkPut(b)} onAddBudget={async (b) => await db.budgets.add({ id: uuidv4(), ...b })}
        clientProfiles={clientProfiles} onUpdateClientProfiles={async (c) => await db.clientProfiles.bulkPut(c)} onAddClientProfile={async (c) => await db.clientProfiles.add({ id: uuidv4(), ...c })}
        unitTypes={unitTypes} onUpdateUnitTypes={async (u) => await db.unitTypes.bulkPut(u)} onAddUnitType={async (u) => await db.unitTypes.add({ id: uuidv4(), ...u })}
        locationSettings={locationSettings} onUpdateLocationSettings={async (l) => await db.locationSettings.bulkPut(l)} onAddLocationSetting={async (l) => await db.locationSettings.add({ id: uuidv4(), ...l })}
        livingPlaces={livingPlaces} onUpdateLivingPlaces={async (l) => await db.livingPlaces.bulkPut(l)} onAddLivingPlace={async (l) => await db.livingPlaces.add({ id: uuidv4(), ...l })}
        leadStatusTypes={leadStatusTypes} onUpdateLeadStatusTypes={async (l) => await db.leadStatusTypes.bulkPut(l)} onAddLeadStatusType={async (l) => await db.leadStatusTypes.add({ id: uuidv4(), ...l })}
        siteVisitStatusTypes={siteVisitStatusTypes} onUpdateSiteVisitStatusTypes={async (s) => await db.siteVisitStatusTypes.bulkPut(s)} onAddSiteVisitStatusType={async (s) => await db.siteVisitStatusTypes.add({ id: uuidv4(), ...s })}
        taskPriorityTypes={taskPriorityTypes} onUpdateTaskPriorityTypes={async (t) => await db.taskPriorityTypes.bulkPut(t)} onAddTaskPriorityType={async (t) => await db.taskPriorityTypes.add({ id: uuidv4(), ...t })}
        bookingStatusTypes={bookingStatusTypes} onUpdateBookingStatusTypes={async (b) => await db.bookingStatusTypes.bulkPut(b)} onAddBookingStatusType={async (b) => await db.bookingStatusTypes.add({ id: uuidv4(), ...b })}
        agreementStatusTypes={agreementStatusTypes} onUpdateAgreementStatusTypes={async (a) => await db.agreementStatusTypes.bulkPut(a)} onAddAgreementStatusType={async (a) => await db.agreementStatusTypes.add({ id: uuidv4(), ...a })}
        possessionStatusTypes={possessionStatusTypes} onUpdatePossessionStatusTypes={async (p) => await db.possessionStatusTypes.bulkPut(p)} onAddPossessionStatusType={async (p) => await db.possessionStatusTypes.add({ id: uuidv4(), ...p })}
        inventoryStatusTypes={inventoryStatusTypes} onUpdateInventoryStatusTypes={async (i) => await db.inventoryStatusTypes.bulkPut(i)} onAddInventoryStatusType={async (i) => await db.inventoryStatusTypes.add({ id: uuidv4(), ...i })}
        projectTypeTypes={projectTypeTypes} onUpdateProjectTypeTypes={async (p) => await db.projectTypeTypes.bulkPut(p)} onAddProjectTypeType={async (p) => await db.projectTypeTypes.add({ id: uuidv4(), ...p })}
        projectStatusTypes={projectStatusTypes} onUpdateProjectStatusTypes={async (p) => await db.projectStatusTypes.bulkPut(p)} onAddProjectStatusType={async (p) => await db.projectStatusTypes.add({ id: uuidv4(), ...p })}
        userRoleSettings={userRoleSettings} onUpdateUserRoleSettings={async (u) => await db.userRoleSettings.bulkPut(u)} onAddUserRoleSetting={async (u) => await db.userRoleSettings.add({ id: uuidv4(), ...u, menuAccess: [] })} onUpdateUserRoleMenuAccess={async (id, m) => await db.userRoleSettings.update(id, { menuAccess: m })}
        userDesignations={userDesignations} onUpdateUserDesignations={async (u) => await db.userDesignations.bulkPut(u)} onAddUserDesignation={async (u) => await db.userDesignations.add({ id: uuidv4(), ...u })}
        companyProfile={companyProfile} onUpdateCompanyProfile={async (p) => { if (p) await db.companyProfile.put(p); }}
        financialSettings={financialSettings} onUpdateFinancialSettings={async (s) => { if (s) await db.financialSettings.put(s); }}
        applicationSettings={applicationSettings} onUpdateApplicationSettings={async (s) => { if (s) await db.applicationSettings.put(s); }}
        formFieldConfigs={formFieldConfigs} onUpdateFormFieldConfigs={async (f) => { await db.formFieldConfigs.clear(); await db.formFieldConfigs.bulkAdd(f); }}
        onNavigateToMain={() => setCurrentAppView('main')}
        onLogout={handleLogout}
        themeColor={themeColor} onThemeColorChange={(c) => setThemeColorState(c)}
        themeMode={themeMode} onThemeModeChange={(m) => setThemeModeState(m)}
      />
    );
  };

  return (
    <div className="app-container relative flex flex-col h-screen w-screen bg-[var(--dark-bg)] overflow-hidden">
      {viewState === 'authenticated' && !showSetupWizard && (
        <SystemSwitcher
          activeSystem={activeSystem}
          onSwitch={setActiveSystem}
          onGoToAdmin={() => setCurrentAppView('admin')}
          currentAppView={currentAppView}
          lockedSystems={lockedSystems}
        />
      )}

      <div className="flex-1 overflow-hidden relative">
        {(
          showSetupWizard ? (
            <SetupWizard
              user={currentUser!}
              onComplete={async () => { if (companyProfile) await db.companyProfile.update(companyProfile.name, { setupCompleted: true }); setCurrentAppView('admin'); }}
              companyProfile={companyProfile!}
              onUpdateCompanyProfile={async (p) => await db.companyProfile.put(p)}
              onAddProject={async (p) => await db.projects.add({ id: uuidv4(), ...p, inventory: [], parkingInventory: [] })}
              onAddUser={async (u) => await db.users.add({ id: uuidv4(), ...u, isActive: true, assignedProjectIds: [] })}
              onUpdateFinancialSettings={async (s) => await db.financialSettings.put(s)}
              onAddSource={async (s) => await db.sources.add({ id: uuidv4(), ...s })}
              projects={projects}
              users={users}
              financialSettings={financialSettings!}
              sources={sources}
            />
          ) : renderActiveSystem()
        )}
      </div>
    </div>
  );
};

export default App;

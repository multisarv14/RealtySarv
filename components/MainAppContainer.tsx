
import React from 'react';
import { Lead, Message, NewLeadData, NewSiteVisitData, SiteVisit, NewTaskData, Task, User, NewFollowUpData, TaskStatus, LifecycleStage, LeadLifecycleStatus, SiteVisitStatus, Project, BookingDetails, PaymentPlan, FinancialSettings, UnitType, Source, LocationSetting, Budget, ClientProfile, LivingPlace, CustomerDocument, FormFieldConfig } from '../types';
import Sidebar from './Sidebar';
import MainContent from './MainContent';
import LeadModal from './LeadModal';
import SiteVisitModal from './SiteVisitModal';
import FollowUpModal from './FollowUpModal';
import BookingModal from './BookingModal';
import TokenEntryModal from './TokenEntryModal';
import AtsLineupModal from './modals/AtsLineupModal';
import RegistrationDetailsModal from './modals/RegistrationDetailsModal';
import ExecutionDetailsModal from './modals/ExecutionDetailsModal';
import { v4 as uuidv4 } from 'uuid';
import { Toaster } from './ui/Toast';

type ActiveMenu = 'Leads' | 'Visits' | 'Booking' | 'Agreement' | 'Possession';
type ContentTab = 'chat' | 'history' | 'details' | 'siteVisit' | 'booking' | 'ledger' | 'documents';

interface MainAppContainerProps {
  leads: Lead[];
  users: User[];
  projects: Project[];
  paymentPlans: PaymentPlan[];
  financialSettings: FinancialSettings;
  unitTypes: UnitType[];
  locationSettings: LocationSetting[];
  sources: Source[];
  budgets: Budget[];
  clientProfiles: ClientProfile[];
  livingPlaces: LivingPlace[];
  formConfigs: FormFieldConfig[];
  onLeadsUpdate: (updatedLeads: Lead[]) => void;
  onProjectsUpdate: (updatedProjects: Project[]) => void;
  onNavigateToAdmin: () => void;
  onLogout: () => void;
  onUpdateTaskStatus: (leadId: string, taskId: string, newStatus: TaskStatus) => void;
  onUpdateLeadLifecycle: (leadId: string, stage: LifecycleStage, newStatus: LeadLifecycleStatus) => void;
  onUpdateLeadOwner: (leadId: string, ownerId: string) => void;
  currentUser?: User | null;
}

const MainAppContainer: React.FC<MainAppContainerProps> = ({
  leads,
  users,
  projects,
  paymentPlans,
  financialSettings,
  unitTypes,
  locationSettings,
  sources,
  budgets,
  clientProfiles,
  livingPlaces,
  formConfigs,
  onLeadsUpdate,
  onProjectsUpdate,
  onNavigateToAdmin,
  onLogout,
  onUpdateTaskStatus,
  onUpdateLeadLifecycle,
  onUpdateLeadOwner,
  currentUser,
}) => {
  const [selectedLeadId, setSelectedLeadId] = React.useState<string | null>(
    leads.length > 0 ? leads[0].id : null
  );
  const [isMainContentVisible, setIsMainContentVisible] = React.useState<boolean>(false);
  const [showLeadModal, setShowLeadModal] = React.useState<boolean>(false);
  const [leadToEdit, setLeadToEdit] = React.useState<Lead | null>(null);
  const [showSiteVisitModal, setShowSiteVisitModal] = React.useState<boolean>(false);
  const [showFollowUpModal, setShowFollowUpModal] = React.useState<boolean>(false);
  const [followUpContext, setFollowUpContext] = React.useState<ActiveMenu>('Leads');
  const [editingVisit, setEditingVisit] = React.useState<SiteVisit | null>(null);
  const [showBookingModal, setShowBookingModal] = React.useState(false);
  const [bookingLeadId, setBookingLeadId] = React.useState<string | null>(null);
  const [isEditingBooking, setIsEditingBooking] = React.useState(false);
  const [showTokenEntryModal, setShowTokenEntryModal] = React.useState(false);
  const [tokenEntryLeadId, setTokenEntryLeadId] = React.useState<string | null>(null);
  const [activeContentTab, setActiveContentTab] = React.useState<ContentTab>('chat');
  const [activeDocTab, setActiveDocTab] = React.useState<string>('Customer KYC');

  // ATS Workflow Modals
  const [showAtsLineupModal, setShowAtsLineupModal] = React.useState(false);
  const [showRegDetailsModal, setShowRegDetailsModal] = React.useState(false);
  const [showExecutionModal, setShowExecutionModal] = React.useState(false);
  const [atsActiveLeadId, setAtsActiveLeadId] = React.useState<string | null>(null);

  const selectedLead = React.useMemo(() => {
    return leads.find((lead) => lead.id === selectedLeadId) || null;
  }, [leads, selectedLeadId]);

  const bookingLead = React.useMemo(() => {
    return leads.find(lead => lead.id === bookingLeadId) || null;
  }, [leads, bookingLeadId]);
  
  const tokenEntryLead = React.useMemo(() => {
    return leads.find(lead => lead.id === tokenEntryLeadId) || null;
  }, [leads, tokenEntryLeadId]);

  const atsActiveLead = React.useMemo(() => {
    return leads.find(lead => lead.id === atsActiveLeadId) || null;
  }, [leads, atsActiveLeadId]);

  const bookingProject = React.useMemo(() => {
      if (!bookingLead) return null;
      return projects.find(p => p.name === bookingLead.leadProject) || null;
  }, [projects, bookingLead]);

  const handleSelectLead = React.useCallback((leadId: string) => {
    setSelectedLeadId(leadId);
    const updatedLeads = leads.map(lead =>
      lead.id === leadId ? { ...lead, read: true } : lead
    );
    onLeadsUpdate(updatedLeads);
    setIsMainContentVisible(true);
    setActiveContentTab('chat');
  }, [leads, onLeadsUpdate]);

  const handleSendMessage = React.useCallback((leadId: string, message: Message) => {
    const updatedLeads = leads.map((lead) =>
      lead.id === leadId
          ? {
              ...lead,
              messages: [...lead.messages, message],
              lastMessage: message.content,
              time: message.time,
            }
          : lead
    );
    onLeadsUpdate(updatedLeads);
  }, [leads, onLeadsUpdate]);

  const handleBackButtonClick = React.useCallback(() => {
    setIsMainContentVisible(false);
  }, []);

  const handleToggleAddLeadModal = React.useCallback(() => {
    setLeadToEdit(null);
    setShowLeadModal(true);
  }, []);

  const handleToggleEditLeadModal = React.useCallback((lead: Lead) => {
    setLeadToEdit(lead);
    setShowLeadModal(true);
  }, []);

  const handleCloseLeadModal = React.useCallback(() => {
    setShowLeadModal(false);
    setLeadToEdit(null);
  }, []);

  const handleAddLead = React.useCallback((leadData: NewLeadData) => {
    const leadId = uuidv4();
    const fullName = `${leadData.firstName} ${leadData.lastName}`.trim();
    const interestText = (leadData.initialInterest || []).length > 0 ? leadData.initialInterest.join(', ') : 'a property';
    
    const tasks: Task[] = [];
    if (leadData.followUp) {
        tasks.push({
            id: uuidv4(),
            leadId: leadId,
            title: `Follow-up: ${leadData.followUp.type}`,
            description: `Scheduled for ${leadData.followUp.time}. \nNotes: ${leadData.followUp.notes || 'N/A'}`,
            dueDate: leadData.followUp.date,
            priority: 'Medium',
            status: 'Pending',
            assignedTo: leadData.followUp.assignedTo,
        });
    }

    const newLead: Lead = {
      id: leadId,
      name: fullName,
      avatarInitials: `${leadData.firstName[0] || ''}${leadData.lastName[0] || ''}`.toUpperCase(),
      lastMessage: leadData.message || `Interested in: ${interestText}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      chatStatus: 'offline',
      leadStatus: leadData.leadStatus,
      read: false,
      messages: [{ id: uuidv4(), content: leadData.message || `Hi, I am interested in ${interestText}.`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), sender: 'received' }],
      email: leadData.email,
      phone: leadData.phone,
      initialInterest: leadData.initialInterest,
      preferredLocation: leadData.preferredLocation,
      budget: leadData.budget,
      clientProfile: leadData.clientProfile,
      livingPlace: leadData.livingPlace,
      siteVisits: [],
      tasks: tasks,
      channelSource: leadData.channelSource,
      leadSource: leadData.sourceName,
      propertyImages: [],
      ownerId: leadData.ownerId || currentUser?.id || users.find(u => u.role === 'Sales')?.id || users[0]?.id || '',
      leadProject: leadData.leadProject || 'Not Assigned',
      leadDate: new Date().toISOString().split('T')[0],
      bookingStatus: 'Pending',
      agreementStatus: 'Drafted',
      possessionStatus: 'Pending',
      customData: {},
    };
    onLeadsUpdate([...leads, newLead]);
  }, [leads, onLeadsUpdate, users, currentUser]);

  const handleUpdateLead = React.useCallback((updatedLeadData: Lead) => {
    const updatedLeads = leads.map(lead => lead.id === updatedLeadData.id ? updatedLeadData : lead);
    onLeadsUpdate(updatedLeads);
  }, [leads, onLeadsUpdate]);

  const handleToggleSiteVisitModal = React.useCallback((visitToEdit?: SiteVisit) => {
    setEditingVisit(visitToEdit || null);
    setShowSiteVisitModal(true);
  }, []);

  const handleSaveSiteVisit = React.useCallback((visitData: NewSiteVisitData) => {
    if (editingVisit) {
      const updatedVisit: SiteVisit = { ...editingVisit, ...visitData };
      const updatedLeads = leads.map(lead =>
        lead.id === updatedVisit.leadId ? { ...lead, siteVisits: lead.siteVisits.map(v => v.id === updatedVisit.id ? updatedVisit : v) } : lead
      );
      onLeadsUpdate(updatedLeads);
    } else if (selectedLeadId) {
      const newVisit: SiteVisit = { id: uuidv4(), leadId: selectedLeadId, ...visitData, status: 'Visit Scheduled' };
      const updatedLeads = leads.map(lead => lead.id === selectedLeadId ? { ...lead, siteVisits: [...lead.siteVisits, newVisit] } : lead);
      onLeadsUpdate(updatedLeads);
    }
    setShowSiteVisitModal(false);
  }, [leads, onLeadsUpdate, selectedLeadId, editingVisit]);

  const handleUpdateSiteVisitStatus = React.useCallback((leadId: string, visitId: string, newStatus: SiteVisitStatus) => {
    const updatedLeads = leads.map(lead => {
      if (lead.id === leadId) {
        return { ...lead, siteVisits: lead.siteVisits.map(v => v.id === visitId ? { ...v, status: newStatus } : v) };
      }
      return lead;
    });
    onLeadsUpdate(updatedLeads);
  }, [leads, onLeadsUpdate]);

  const handleAddFollowUp = React.useCallback((followUpData: NewFollowUpData) => {
    if (!selectedLeadId) return;
    const newTask: Task = { id: uuidv4(), leadId: selectedLeadId, title: `Follow-up: ${followUpData.type}`, description: followUpData.notes, dueDate: followUpData.date, priority: 'Medium', status: 'Pending', assignedTo: followUpData.assignedTo };
    const updatedLeads = leads.map(lead => lead.id === selectedLeadId ? { ...lead, tasks: [...(lead.tasks || []), newTask] } : lead);
    onLeadsUpdate(updatedLeads);
  }, [leads, onLeadsUpdate, selectedLeadId]);

  const handleToggleFollowUpModal = React.useCallback((context: ActiveMenu = 'Leads') => {
      setFollowUpContext(context);
      setShowFollowUpModal(true);
  }, []);

  const handleAddPropertyImage = React.useCallback((leadId: string, base64Image: string) => {
    const updatedLeads = leads.map(lead => lead.id === leadId ? { ...lead, propertyImages: [...lead.propertyImages, { id: uuidv4(), url: base64Image }] } : lead);
    onLeadsUpdate(updatedLeads);
  }, [leads, onLeadsUpdate]);

  const handleRemovePropertyImage = React.useCallback((leadId: string, imageId: string) => {
    const updatedLeads = leads.map(lead => lead.id === leadId ? { ...lead, propertyImages: lead.propertyImages.filter(img => img.id !== imageId) } : lead);
    onLeadsUpdate(updatedLeads);
  }, [leads, onLeadsUpdate]);

  const handleToggleBookingModal = React.useCallback((leadId: string) => { setBookingLeadId(leadId); setIsEditingBooking(false); setShowBookingModal(true); }, []);
  const handleToggleEditBookingModal = React.useCallback((leadId: string) => { setBookingLeadId(leadId); setIsEditingBooking(true); setShowBookingModal(true); }, []);
  const handleCloseBookingModal = React.useCallback(() => { setShowBookingModal(false); setBookingLeadId(null); }, []);

  // Keep the project's inventory in step with bookings so a unit or parking slot can't be sold twice.
  const syncInventory = React.useCallback((lead: Lead, next: BookingDetails, previous?: BookingDetails) => {
    const project = projects.find(p => p.name === lead.leadProject);
    if (!project) return;
    const release = (id?: string) => id && id !== next.unitId && id !== next.parkingId;
    const inventory = project.inventory.map(u => u.id === next.unitId ? { ...u, status: 'Booked' as const } : release(previous?.unitId) && u.id === previous?.unitId ? { ...u, status: 'Available' as const } : u);
    const parkingInventory = project.parkingInventory.map(s => s.id === next.parkingId ? { ...s, status: 'Booked' as const, assignedUnitId: next.unitId } : release(previous?.parkingId) && s.id === previous?.parkingId ? { ...s, status: 'Available' as const, assignedUnitId: undefined } : s);
    const changed = JSON.stringify(inventory) !== JSON.stringify(project.inventory) || JSON.stringify(parkingInventory) !== JSON.stringify(project.parkingInventory);
    if (changed) onProjectsUpdate([{ ...project, inventory, parkingInventory }]);
  }, [projects, onProjectsUpdate]);

  const handleConfirmBooking = React.useCallback((leadId: string, bookingDetails: BookingDetails) => {
    const lead = leads.find(l => l.id === leadId);
    if (lead) syncInventory(lead, bookingDetails);
    const updatedLeads = leads.map(l => l.id === leadId ? { ...l, bookingStatus: 'Booked' as const, bookingDetails } : l);
    onLeadsUpdate(updatedLeads);
    handleCloseBookingModal();
  }, [leads, onLeadsUpdate, handleCloseBookingModal, syncInventory]);
  
  const handleUpdateBooking = React.useCallback((leadId: string, updatedBookingDetails: BookingDetails, closeModal: boolean = true) => {
    const lead = leads.find(l => l.id === leadId);
    if (lead && lead.bookingDetails && (lead.bookingDetails.unitId !== updatedBookingDetails.unitId || lead.bookingDetails.parkingId !== updatedBookingDetails.parkingId)) {
      syncInventory(lead, updatedBookingDetails, lead.bookingDetails); // a different unit was chosen: free the old one
    }
    const updatedLeads = leads.map(l => l.id === leadId ? { ...l, bookingDetails: updatedBookingDetails } : l);
    onLeadsUpdate(updatedLeads);
    if (closeModal) handleCloseBookingModal();
  }, [leads, onLeadsUpdate, handleCloseBookingModal, syncInventory]);

  const handleToggleTokenEntryModal = React.useCallback((leadId: string) => { setTokenEntryLeadId(leadId); setShowTokenEntryModal(true); }, []);
  const handleConfirmToken = React.useCallback((leadId: string, tokenAmount: number) => {
    const updatedLeads = leads.map(lead => lead.id === leadId ? { ...lead, tokenAmount } : lead);
    onLeadsUpdate(updatedLeads);
    setShowTokenEntryModal(false);
  }, [leads, onLeadsUpdate]);

  const handleUpdateApplicantDocument = React.useCallback((leadId: string, applicantId: string, docType: string, newDoc: CustomerDocument) => {
    const updatedLeads = leads.map(lead => {
        if (lead.id === leadId && lead.bookingDetails) {
            const updatedBookingDetails = { ...lead.bookingDetails };
            
            if (applicantId === 'unit') {
                updatedBookingDetails.unitDocuments = {
                    ...(updatedBookingDetails.unitDocuments || {}),
                    [docType]: newDoc
                };
            } else if (updatedBookingDetails.primaryApplicant.id === applicantId) {
                updatedBookingDetails.primaryApplicant.customerDocuments[docType] = newDoc;
            } else {
                updatedBookingDetails.coApplicants = updatedBookingDetails.coApplicants.map(co => co.id === applicantId ? { ...co, customerDocuments: { ...co.customerDocuments, [docType]: newDoc } } : co);
            }
            return { ...lead, bookingDetails: updatedBookingDetails };
        }
        return lead;
    });
    onLeadsUpdate(updatedLeads);
  }, [leads, onLeadsUpdate]);

  const handleUpdateLeadCustomData = React.useCallback((leadId: string, data: Record<string, any>) => {
      const updatedLeads = leads.map(lead => lead.id === leadId ? { ...lead, customData: { ...(lead.customData || {}), ...data } } : lead);
      onLeadsUpdate(updatedLeads);
  }, [leads, onLeadsUpdate]);

  const handleSwitchTab = (tab: ContentTab, subTab?: string) => {
    setActiveContentTab(tab);
    if (tab === 'documents' && subTab) {
        setActiveDocTab(subTab);
    }
  };

  const handleOpenAtsLineupModal = (leadId: string) => { setAtsActiveLeadId(leadId); setShowAtsLineupModal(true); };
  const handleOpenRegDetailsModal = (leadId: string) => { setAtsActiveLeadId(leadId); setShowRegDetailsModal(true); };
  const handleOpenExecutionModal = (leadId: string) => { setAtsActiveLeadId(leadId); setShowExecutionModal(true); };

  const handleSaveAtsLineup = (leadId: string, data: any) => {
      handleUpdateLeadCustomData(leadId, { atsLineupDetails: data, isLineupDone: true });
  };

  const handleSaveRegDetails = (leadId: string, data: any) => {
      handleUpdateLeadCustomData(leadId, { registrationDetails: data, isRegistrationDetailsDone: true });
  };

  const handleSaveExecutionDetails = (leadId: string, data: any) => {
      handleUpdateLeadCustomData(leadId, { executionDetails: data, isExecutionDone: true });
  };

  return (
    <div className="flex h-full w-full relative">
      <div className={`w-full flex-shrink-0 md:w-[clamp(300px,27vw,400px)] md:flex ${isMainContentVisible ? 'hidden' : 'flex'}`}>
        <Sidebar 
            leads={leads} 
            users={users} 
            selectedLeadId={selectedLeadId} 
            onSelectLead={handleSelectLead} 
            onToggleNewLeadModal={handleToggleAddLeadModal} 
            onToggleSiteVisitModal={handleToggleSiteVisitModal} 
            onToggleFollowUpModal={handleToggleFollowUpModal} 
            onNavigateToAdmin={onNavigateToAdmin} 
            onLogout={onLogout} 
            onUpdateSiteVisitStatus={handleUpdateSiteVisitStatus} 
            onToggleBookingModal={handleToggleBookingModal} 
            onToggleTokenEntryModal={handleToggleTokenEntryModal}
            onUpdateLeadLifecycle={onUpdateLeadLifecycle}
            onUpdateLeadCustomData={handleUpdateLeadCustomData}
            currentUser={currentUser}
            onClearSelection={() => setSelectedLeadId(null)}
            onSwitchTab={handleSwitchTab}
            onOpenAtsLineup={handleOpenAtsLineupModal}
            onOpenRegDetails={handleOpenRegDetailsModal}
            onOpenExecutionDetails={handleOpenExecutionModal}
        />
      </div>
      <div className={`flex-1 min-w-0 md:flex ${isMainContentVisible ? 'flex' : 'hidden'}`}>
        <MainContent 
            selectedLead={selectedLead} 
            users={users} 
            projects={projects} 
            paymentPlans={paymentPlans} 
            onSendMessage={handleSendMessage} 
            onBackButtonClick={handleBackButtonClick} 
            onToggleFollowUpModal={() => handleToggleFollowUpModal('Leads')} 
            onToggleSiteVisitModal={() => handleToggleSiteVisitModal()} 
            onToggleEditLeadModal={handleToggleEditLeadModal} 
            onToggleBookingModal={handleToggleBookingModal} 
            onToggleEditBookingModal={handleToggleEditBookingModal} 
            onUpdateBooking={handleUpdateBooking} 
            onAddPropertyImage={handleAddPropertyImage} 
            onRemovePropertyImage={handleRemovePropertyImage} 
            onUpdateTaskStatus={onUpdateTaskStatus} 
            onUpdateLeadLifecycle={onUpdateLeadLifecycle} 
            onUpdateLeadOwner={onUpdateLeadOwner} 
            onUpdateApplicantDocument={handleUpdateApplicantDocument} 
            onUpdateLeadCustomData={handleUpdateLeadCustomData}
            activeContentTab={activeContentTab}
            setActiveContentTab={setActiveContentTab}
            activeDocTab={activeDocTab}
            setActiveDocTab={setActiveDocTab}
        />
      </div>

      <Toaster />
      <LeadModal isOpen={showLeadModal} onClose={handleCloseLeadModal} onAddLead={handleAddLead} onUpdateLead={handleUpdateLead} leadToEdit={leadToEdit} unitTypes={unitTypes} locationSettings={locationSettings} sources={sources} budgets={budgets} clientProfiles={clientProfiles} livingPlaces={livingPlaces} projects={projects} formConfigs={formConfigs} users={users} currentUserId={currentUser?.id} />
      <SiteVisitModal
        isOpen={showSiteVisitModal}
        onClose={() => setShowSiteVisitModal(false)}
        onAddVisit={handleSaveSiteVisit}
        visitToEdit={editingVisit}
        leadName={(editingVisit ? leads.find(l => l.id === editingVisit.leadId) : selectedLead)?.name}
        defaultProperty={selectedLead?.leadProject && selectedLead.leadProject !== 'Not Assigned' ? selectedLead.leadProject : undefined}
        projectNames={projects.map(p => p.name)}
      />
      <FollowUpModal isOpen={showFollowUpModal} onClose={() => setShowFollowUpModal(false)} onAddFollowUp={handleAddFollowUp} users={users} context={followUpContext} leadName={selectedLead?.name} defaultAssignee={currentUser?.name} />
      <BookingModal isOpen={showBookingModal} onClose={handleCloseBookingModal} onConfirmBooking={handleConfirmBooking} onUpdateBooking={handleUpdateBooking} lead={bookingLead} bookingToEdit={isEditingBooking ? bookingLead?.bookingDetails : null} project={bookingProject} paymentPlans={paymentPlans} financialSettings={financialSettings} formConfigs={formConfigs} />
      <TokenEntryModal isOpen={showTokenEntryModal} onClose={() => setShowTokenEntryModal(false)} onConfirmToken={handleConfirmToken} lead={tokenEntryLead} />
      
      {atsActiveLead && (
          <>
            <AtsLineupModal isOpen={showAtsLineupModal} onClose={() => setShowAtsLineupModal(false)} onSave={(data) => handleSaveAtsLineup(atsActiveLead.id, data)} lead={atsActiveLead} />
            <RegistrationDetailsModal isOpen={showRegDetailsModal} onClose={() => setShowRegDetailsModal(false)} onSave={(data) => handleSaveRegDetails(atsActiveLead.id, data)} lead={atsActiveLead} />
            <ExecutionDetailsModal isOpen={showExecutionModal} onClose={() => setShowExecutionModal(false)} onSave={(data) => handleSaveExecutionDetails(atsActiveLead.id, data)} lead={atsActiveLead} />
          </>
      )}
    </div>
  );
};

export default MainAppContainer;

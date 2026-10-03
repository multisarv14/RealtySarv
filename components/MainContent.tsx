
import React from 'react';
import { Lead, Message, TaskStatus, SiteVisitStatus, LifecycleStage, LeadLifecycleStatus, User, Project, PaymentPlan, CustomerDocument, BookingDetails } from '../types';
import MessageBubble from './MessageBubble';
import LeadDetail from './LeadDetail';
import BookingDetailTab from './BookingDetailTab';
import LedgerTab from './LedgerTab';
import DocumentHub from './DocumentHub';
import { v4 as uuidv4 } from 'uuid';
import { PIPELINE_STEPS, callNumber, customerCode, getPipelineStep, leadCode, leadSummary, openWhatsApp } from './leadUi';
import { toast } from './ui/Toast';

type ContentTab = 'chat' | 'history' | 'details' | 'siteVisit' | 'booking' | 'ledger' | 'documents';

interface MainContentProps {
  selectedLead: Lead | null;
  users: User[];
  projects: Project[];
  paymentPlans: PaymentPlan[];
  onSendMessage: (leadId: string, message: Message) => void;
  onBackButtonClick: () => void;
  onToggleFollowUpModal: () => void;
  onToggleSiteVisitModal?: () => void;
  onToggleEditLeadModal: (lead: Lead) => void;
  onToggleBookingModal: (leadId: string) => void;
  onToggleEditBookingModal: (leadId: string) => void;
  onUpdateBooking: (leadId: string, bookingDetails: BookingDetails, close?: boolean) => void;
  onAddPropertyImage: (leadId: string, base64Image: string) => void;
  onRemovePropertyImage: (leadId: string, imageId: string) => void;
  onUpdateTaskStatus: (leadId: string, taskId: string, newStatus: TaskStatus) => void;
  onUpdateLeadLifecycle: (leadId: string, stage: LifecycleStage, newStatus: LeadLifecycleStatus) => void;
  onUpdateLeadOwner: (leadId: string, ownerId: string) => void;
  onUpdateApplicantDocument: (leadId: string, applicantId: string, docType: string, newDoc: CustomerDocument) => void;
  onUpdateLeadCustomData: (leadId: string, data: Record<string, any>) => void;
  activeContentTab: ContentTab;
  setActiveContentTab: (tab: ContentTab) => void;
  activeDocTab: string;
  setActiveDocTab: (tab: string) => void;
}

const MainContent: React.FC<MainContentProps> = ({
  selectedLead,
  users,
  projects,
  paymentPlans,
  onSendMessage,
  onBackButtonClick,
  onToggleFollowUpModal,
  onToggleSiteVisitModal,
  onToggleEditLeadModal,
  onToggleBookingModal,
  onToggleEditBookingModal,
  onUpdateBooking,
  onAddPropertyImage,
  onRemovePropertyImage,
  onUpdateTaskStatus,
  onUpdateLeadLifecycle,
  onUpdateLeadOwner,
  onUpdateApplicantDocument,
  onUpdateLeadCustomData,
  activeContentTab,
  setActiveContentTab,
  activeDocTab,
  setActiveDocTab,
}) => {
  const [inputMessage, setInputMessage] = React.useState<string>('');
  const chatContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (activeContentTab === 'chat' && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [selectedLead?.messages, activeContentTab]);

  const handleSendMessage = React.useCallback(() => {
    if (inputMessage.trim() === '' || !selectedLead) return;
    const newMessage: Message = {
      id: uuidv4(),
      content: inputMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sender: 'sent',
    };
    onSendMessage(selectedLead.id, newMessage);
    setInputMessage('');
  }, [inputMessage, selectedLead, onSendMessage]);

  const handleKeyPress = React.useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSendMessage();
  }, [handleSendMessage]);
  
  const getSiteVisitStatusColorClass = (status: SiteVisitStatus) => {
    switch (status) {
      case 'Visit Scheduled': return 'bg-indigo-600';
      case 'Completed': return 'bg-[#00a884]';
      case 'Canceled': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  if (!selectedLead) {
    return (
      <div className="flex-1 min-w-0 main-content-bg flex flex-col justify-center items-center text-center px-6 text-[var(--text-secondary)]">
        <div className="w-16 h-16 rounded-2xl bg-[var(--primary-color)]/10 text-[var(--primary-color)] flex items-center justify-center text-2xl mb-4"><i className="fas fa-building" aria-hidden="true"></i></div>
        <p className="text-base font-semibold text-[var(--text-primary)]">Select a lead</p>
        <p className="text-sm mt-1 max-w-xs">See their requirement, notes, site visits, booking and documents in one place.</p>
      </div>
    );
  }

  const renderContent = () => {
    if (activeContentTab === 'chat') {
      return (
        <>
          <div ref={chatContainerRef} className="flex-1 p-3 sm:p-5 overflow-y-auto flex flex-col gap-2 custom-scrollbar">
            {(selectedLead.messages || []).map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>
          <div className="bg-[var(--medium-bg)] px-3 py-2.5 flex items-center gap-2 border-t border-[var(--border-color)]">
            <input
              type="text"
              aria-label="Add a note"
              className="flex-1 min-w-0 h-10 bg-[var(--input-bg)] rounded-full px-4 text-sm border border-[var(--border-color)] text-[var(--text-primary)] outline-none focus:border-[var(--primary-color)] transition-colors placeholder:text-[var(--text-secondary)]"
              placeholder="Add a note, call summary or update…"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            <button onClick={handleSendMessage} disabled={!inputMessage.trim()} aria-label="Save note" title="Save note"
              className="bg-[var(--primary-color)] w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-white transition-opacity disabled:opacity-40 hover:opacity-90">
              <i className="fas fa-paper-plane text-sm" aria-hidden="true"></i>
            </button>
          </div>
        </>
      );
    }

    if (activeContentTab === 'history' || activeContentTab === 'siteVisit') {
      const followUpTasks = (selectedLead.tasks || [])
        .filter(task => task.title.startsWith('Follow-up:'))
        .sort((a, b) => b.dueDate.localeCompare(a.dueDate));
      const visits = [...(selectedLead.siteVisits || [])].sort((a, b) => b.date.localeCompare(a.date));
      const sectionHead = (title: string, count: number, onAdd?: () => void) => (
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">{title} <span className="font-medium opacity-70">· {count}</span></h3>
          {onAdd && <button onClick={onAdd} className="text-xs font-semibold text-[var(--primary-color)] hover:underline">+ Schedule</button>}
        </div>
      );
      return (
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--dark-bg)]">
          <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-8">
            <section>
              {sectionHead('Follow-ups', followUpTasks.length, onToggleFollowUpModal)}
              {followUpTasks.length === 0 ? <p className="text-sm text-[var(--text-secondary)] py-3">No follow-ups yet.</p> : (
                <ul className="space-y-2">
                  {followUpTasks.map((task) => (
                    <li key={task.id} className="bg-[var(--medium-bg)] p-3 rounded-lg border border-[var(--border-color)]">
                      <div className="flex justify-between items-start gap-3">
                        <p className="font-semibold text-sm text-[var(--text-primary)]">{task.title.replace('Follow-up:', 'Follow-up ·')}</p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded shrink-0 ${task.status === 'Completed' ? 'bg-green-500/15 text-green-500' : 'bg-blue-500/15 text-blue-500'}`}>{task.status}</span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">{task.dueDate}</p>
                      {task.description && <p className="mt-2 text-xs text-[var(--text-secondary)] whitespace-pre-line">{task.description}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section>
              {sectionHead('Site visits', visits.length, onToggleSiteVisitModal)}
              {visits.length === 0 ? <p className="text-sm text-[var(--text-secondary)] py-3">No site visits yet.</p> : (
                <ul className="space-y-2">
                  {visits.map((visit) => (
                    <li key={visit.id} className="bg-[var(--medium-bg)] p-3 rounded-lg border border-[var(--border-color)]">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <p className="font-semibold text-sm text-[var(--text-primary)]">{visit.propertyOfInterest}</p>
                          <p className="text-xs text-[var(--text-secondary)] mt-0.5"><i className="far fa-clock mr-1" aria-hidden="true"></i>{visit.date} at {visit.time}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold text-white shrink-0 ${getSiteVisitStatusColorClass(visit.status)}`}>{visit.status}</span>
                      </div>
                      {visit.notes && <p className="mt-2 text-xs text-[var(--text-secondary)]">{visit.notes}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      );
    }

    if (activeContentTab === 'details') return <LeadDetail lead={selectedLead} users={users} onAddPropertyImage={onAddPropertyImage} onRemovePropertyImage={onRemovePropertyImage} onUpdateLeadLifecycle={onUpdateLeadLifecycle} onUpdateLeadOwner={onUpdateLeadOwner} onToggleEditLeadModal={onToggleEditLeadModal} />;
    
    if (activeContentTab === 'booking') {
        const projectForLead = (projects || []).find(p => p.name === selectedLead.leadProject);
        return <BookingDetailTab lead={selectedLead} project={projectForLead || null} paymentPlans={paymentPlans} onStartBooking={() => onToggleBookingModal(selectedLead.id)} onEditBooking={() => onToggleEditBookingModal(selectedLead.id)} onUpdateBooking={(leadId, details) => onUpdateBooking(leadId, details, false)} />;
    }

    if (activeContentTab === 'ledger') {
        const projectForLead = (projects || []).find(p => p.name === selectedLead.leadProject);
        return <LedgerTab lead={selectedLead} project={projectForLead || null} paymentPlans={paymentPlans} onUpdateBooking={onUpdateBooking} />;
    }

    if (activeContentTab === 'documents') {
        const projectForLead = (projects || []).find(p => p.name === selectedLead.leadProject);
        return (
          <DocumentHub 
            lead={selectedLead} 
            project={projectForLead || null} 
            onUpdateApplicantDocument={onUpdateApplicantDocument} 
            onUpdateLeadLifecycle={onUpdateLeadLifecycle}
            onUpdateCustomData={onUpdateLeadCustomData}
            activeTab={activeDocTab}
            setActiveTab={setActiveDocTab}
          />
        );
    }
    return null;
  };

  const step = getPipelineStep(selectedLead);
  const tabLabel = (tab: ContentTab) => tab === 'chat' ? 'Activity' : tab === 'history' || tab === 'siteVisit' ? 'Timeline' : tab === 'documents' ? 'Files' : tab.charAt(0).toUpperCase() + tab.slice(1);
  const iconBtn = 'h-9 w-9 shrink-0 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--primary-color)] hover:bg-[var(--light-bg)] transition-colors';

  return (
    <div className="flex-1 min-w-0 main-content-bg flex flex-col relative h-full">
      {/* Lead header */}
      <div className="bg-[var(--medium-bg)] pl-3 pr-2 py-2 flex justify-between items-center gap-2 border-b border-[var(--border-color)] flex-shrink-0 z-20">
        <div className="flex items-center gap-2.5 min-w-0">
          <button onClick={onBackButtonClick} aria-label="Back to leads" className="md:hidden h-9 w-9 shrink-0 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><i className="fas fa-arrow-left" aria-hidden="true"></i></button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[var(--text-primary)] font-bold text-sm leading-tight truncate">{selectedLead.name}</span>
              <span className="shrink-0 px-1.5 py-px rounded-full text-[10px] font-semibold bg-[var(--primary-color)]/15 text-[var(--primary-color)]" title="Where this lead is in the sales journey">{PIPELINE_STEPS[step]}</span>
            </div>
            <div className="text-[11.5px] text-[var(--text-secondary)] truncate" data-testid="lead-facts">
              {[selectedLead.leadProject && selectedLead.leadProject !== 'Not Assigned' ? selectedLead.leadProject : 'No project', [selectedLead.channelSource, selectedLead.leadSource].filter(Boolean).join(' › '), `Owner ${users.find(u => u.id === selectedLead.ownerId)?.name || 'unassigned'}`].filter(Boolean).join(' · ')}
            </div>
            <div className="text-[10.5px] text-[var(--text-secondary)] truncate flex items-center gap-1.5">
              {([['Lead ID', leadCode(selectedLead)], ['Customer ID', customerCode(selectedLead)]] as const).map(([label, value]) => (
                <button key={label} type="button" title={`Copy ${label}`} onClick={() => { navigator.clipboard?.writeText(value); toast.info(`${label} ${value} copied.`); }}
                  className="font-mono px-1.5 py-px rounded bg-[var(--light-bg)] hover:text-[var(--text-primary)] transition-colors"><span className="font-sans opacity-70">{label}</span> {value}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center shrink-0">
          {selectedLead.phone && <button type="button" onClick={() => callNumber(selectedLead.phone)} className={iconBtn} aria-label="Call" title="Call"><i className="fas fa-phone-alt text-sm" aria-hidden="true"></i></button>}
          {selectedLead.phone && <button type="button" onClick={() => openWhatsApp(selectedLead.phone)} className={iconBtn} aria-label="Open WhatsApp" title="Open WhatsApp"><i className="fab fa-whatsapp text-base" aria-hidden="true"></i></button>}
          <button onClick={onToggleFollowUpModal} className={iconBtn} aria-label="Schedule follow-up" title="Schedule follow-up"><i className="fas fa-bell text-sm" aria-hidden="true"></i></button>
          {onToggleSiteVisitModal && <button onClick={onToggleSiteVisitModal} className={iconBtn} aria-label="Schedule site visit" title="Schedule site visit"><i className="fas fa-map-marker-alt text-sm" aria-hidden="true"></i></button>}
          <button onClick={() => onToggleEditLeadModal(selectedLead)} className={iconBtn} aria-label="Edit lead" title="Edit lead"><i className="fas fa-pen text-sm" aria-hidden="true"></i></button>
        </div>
      </div>

      {/* Tabs */}
      <div role="tablist" className="bg-[var(--dark-bg)] border-b border-[var(--border-color)] flex-shrink-0 overflow-x-auto no-scrollbar z-10 flex">
        {(['chat', 'history', 'details', 'booking', 'ledger', 'documents'] as ContentTab[]).map(tab => {
           // Only show Ledger if booked
           if (tab === 'ledger' && selectedLead.bookingStatus !== 'Booked') return null;
           return (
            <button
                key={tab}
                role="tab"
                aria-selected={activeContentTab === tab}
                className={`px-4 py-2 cursor-pointer border-b-2 transition-colors text-xs font-semibold whitespace-nowrap
                ${activeContentTab === tab ? 'border-[var(--primary-color)] text-[var(--primary-color)]' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                onClick={() => setActiveContentTab(tab)}
            >
                {tabLabel(tab)}
            </button>
           );
        })}
      </div>

      {/* Content Scroller */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {renderContent()}
      </div>
    </div>
  );
};

export default MainContent;

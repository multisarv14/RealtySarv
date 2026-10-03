
import React from 'react';
import { Lead, LeadStatus, User, ActiveLeadTab, AgreementStatus, LifecycleStage, LeadLifecycleStatus, CustomerDocument } from '../types';
import { callNumber, getNextAction, leadSummary, urgencyClass } from './leadUi';
import { toast } from './ui/Toast';

type ActiveMenu = 'Leads' | 'Visits' | 'Booking' | 'Agreement' | 'Possession';
type ContentTab = 'chat' | 'history' | 'details' | 'siteVisit' | 'booking' | 'ledger' | 'documents';

interface ChatItemProps {
  lead: Lead;
  users: User[];
  isActive: boolean;
  onClick: (id: string) => void;
  activeMenu?: ActiveMenu;
  activeLeadTab?: ActiveLeadTab;
  onScheduleSiteVisit: (leadId: string) => void;
  onScheduleFollowUp: (leadId: string) => void;
  onConfirmBooking?: (leadId: string) => void;
  onUpdateLeadLifecycle?: (leadId: string, stage: LifecycleStage, newStatus: LeadLifecycleStatus) => void;
  onUpdateCustomData?: (leadId: string, data: Record<string, any>) => void;
  onSwitchTab?: (tab: ContentTab, subTab?: string) => void;
  onOpenAtsLineup?: (leadId: string) => void;
  onOpenRegDetails?: (leadId: string) => void;
  onOpenExecutionDetails?: (leadId: string) => void;
}

const getLeadStatusColorClass = (status: LeadStatus) => {
    switch (status) {
      case 'New': return 'bg-blue-500/90 text-white';
      case 'Contacted': return 'bg-yellow-500/90 text-black';
      case 'Qualified': return 'bg-purple-500/90 text-white';
      case 'Converted': return 'bg-[#00a884] text-white';
      case 'Unqualified': return 'bg-red-500/90 text-white';
      default: return 'bg-gray-500 text-white';
    }
};

const statusTextClass = (status: LeadStatus) => {
    switch (status) {
      case 'New': return 'text-sky-400';
      case 'Contacted': return 'text-amber-400';
      case 'Qualified': return 'text-purple-400';
      case 'Converted': return 'text-emerald-400';
      case 'Unqualified': return 'text-red-400';
      default: return 'text-[var(--text-secondary)]';
    }
};

const ChatItem: React.FC<ChatItemProps> = ({ 
    lead, 
    users, 
    isActive, 
    onClick, 
    activeMenu, 
    onScheduleSiteVisit, 
    onScheduleFollowUp, 
    onConfirmBooking,
    onUpdateLeadLifecycle,
    onUpdateCustomData,
    onSwitchTab,
    onOpenAtsLineup,
    onOpenRegDetails,
    onOpenExecutionDetails
}) => {
  const { id, avatarInitials, name, time, chatStatus, leadStatus, leadSource, ownerId, agreementStatus, customData = {} } = lead;
  const [isProcessing, setIsProcessing] = React.useState(false);
  
  const owner = React.useMemo(() => users.find(u => u.id === ownerId), [users, ownerId]);

  const verifiedKycCount = React.useMemo(() => {
    if (!lead.bookingDetails) return 0;
    // FIX: Explicitly cast docs to Record<string, CustomerDocument> to prevent 'unknown' type error on status property access (Line 62)
    const docs = (lead.bookingDetails.primaryApplicant.customerDocuments || {}) as Record<string, CustomerDocument>;
    return Object.values(docs).filter(d => d.status === 'Verified').length;
  }, [lead.bookingDetails]);

  // FIX: Explicitly cast unitDocuments to Record<string, CustomerDocument> to avoid 'unknown' type inference errors
  const unitDocs = lead.bookingDetails?.unitDocuments as Record<string, CustomerDocument> | undefined;
  const isSignedDraftVerified = unitDocs?.['Agreement Draft']?.status === 'Verified';
  const isChallanVerified = unitDocs?.['Challan Copy']?.status === 'Verified';

  const handleRedirectToFiles = (e: React.MouseEvent, subTab: 'Customer KYC' | 'Unit Documents' = 'Unit Documents') => {
    e.stopPropagation();
    onClick(id);
    onSwitchTab?.('documents', subTab);
  };

  const handleGenerateDraft = async (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsProcessing(true);
      setTimeout(() => {
          onUpdateCustomData?.(id, { agreementDraftGenerated: true });
          setIsProcessing(false);
          toast.success(`Draft marked as ready for ${name}. Open Files to view and print it.`);
      }, 1000);
  };

  const handleSendSignature = async (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsProcessing(true);
      setTimeout(() => {
          toast.success(`${name} moved to the Signature stage. Share the draft with the customer yourself; automatic Email/WhatsApp sending isn't set up yet.`);
          onUpdateLeadLifecycle?.(id, 'agreementStatus', 'Signature');
          setIsProcessing(false);
      }, 1500);
  };

  const handleAtsLineup = (e: React.MouseEvent) => {
      e.stopPropagation();
      onOpenAtsLineup?.(id);
  };

  const handleMarkRegistered = (e: React.MouseEvent) => {
      e.stopPropagation();
      onOpenRegDetails?.(id);
  };

  const handleMarkExecutionDone = (e: React.MouseEvent) => {
      e.stopPropagation();
      onOpenExecutionDetails?.(id);
  };

  const nextAction = React.useMemo(() => getNextAction(lead), [lead]);
  const showActions = activeMenu === 'Leads' || activeMenu === 'Booking' || activeMenu === 'Agreement' || activeMenu === 'Possession';
  const actionBtn = 'w-6 h-6 rounded-full flex items-center justify-center bg-[var(--primary-color)] text-white shadow hover:opacity-90 transition-opacity';
  const summary = leadSummary(lead);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-current={isActive ? 'true' : undefined}
      className={`group relative flex py-2 px-3.5 gap-2.5 cursor-pointer border-b border-[var(--border-color)] transition-colors hover:bg-[var(--light-bg)] focus-visible:outline-none focus-visible:bg-[var(--light-bg)] ${isActive ? 'bg-[var(--light-bg)] shadow-[inset_3px_0_0_var(--primary-color)]' : ''}`}
      onClick={() => onClick(id)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(id); } }}
    >
      <div className="flex-1 min-w-0">
        <div className="relative flex items-baseline justify-between gap-2 min-h-[20px]">
            <span className={`text-[13px] text-[var(--text-primary)] truncate ${lead.read === false ? 'font-bold' : 'font-semibold'}`}>{name}</span>
            <span className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)] shrink-0 transition-opacity group-hover:opacity-0 group-focus-within:opacity-0">
              {lead.read === false && <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary-color)]" title="Not opened yet"></span>}
              {time}
            </span>
            {showActions && (
              <div className="absolute right-0 top-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                {lead.phone && (
                  <button type="button" onClick={(e) => { e.stopPropagation(); callNumber(lead.phone); }} className={actionBtn} aria-label="Call" title="Call"><i className="fas fa-phone-alt text-[10px]" aria-hidden="true"></i></button>
                )}
                <button onClick={(e) => { e.stopPropagation(); onScheduleFollowUp(id); }} className={actionBtn} aria-label="Schedule follow-up" title="Schedule follow-up"><i className="fas fa-bell text-[10px]" aria-hidden="true"></i></button>
                <button onClick={(e) => { e.stopPropagation(); onScheduleSiteVisit(id); }} className={actionBtn} aria-label="Schedule site visit" title="Schedule site visit"><i className="fas fa-map-marker-alt text-[10px]" aria-hidden="true"></i></button>
              </div>
            )}
        </div>
        <div className="text-[11px] text-[var(--text-secondary)] truncate leading-tight">{summary || lead.leadProject || ' '}</div>
        <div className="flex items-center flex-wrap gap-1 mt-0.5">
            <span className={`text-[11px] font-semibold ${statusTextClass(leadStatus)}`}><span aria-hidden="true">● </span>{leadStatus}</span>
            {nextAction && <span className={`px-1.5 py-px text-[10px] rounded font-semibold border ${urgencyClass[nextAction.urgency]}`}><i className="far fa-clock mr-1" aria-hidden="true"></i>{nextAction.label}</span>}

            {activeMenu === 'Booking' && onConfirmBooking && lead.bookingStatus === 'Pending' && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onConfirmBooking(id); }}
                    className="ml-auto text-[9px] font-semibold uppercase bg-purple-600 text-white px-2 py-0.5 rounded shadow-sm hover:bg-purple-700 transition-all border border-purple-500/50"
                >
                    Confirm Booking
                </button>
            )}

            {activeMenu === 'Agreement' && (
                <div className="ml-auto flex items-center">
                    {agreementStatus === 'Drafted' && (
                        <>
                            {verifiedKycCount < 4 ? (
                                <button 
                                    onClick={(e) => handleRedirectToFiles(e, 'Customer KYC')}
                                    className="text-[9px] font-semibold uppercase bg-orange-500 text-white px-2 py-0.5 rounded shadow-sm hover:bg-orange-600 transition-all border border-orange-400/50"
                                >
                                    Complete KYC ({verifiedKycCount}/4 Verified)
                                </button>
                            ) : !customData.agreementDraftGenerated ? (
                                <button 
                                    onClick={handleGenerateDraft}
                                    disabled={isProcessing}
                                    className="text-[9px] font-semibold uppercase bg-blue-600 text-white px-2 py-0.5 rounded shadow-sm hover:bg-blue-700 transition-all border border-blue-500/50 disabled:opacity-50"
                                >
                                    {isProcessing ? 'Generating...' : 'Generate Draft'}
                                </button>
                            ) : (
                                <button 
                                    onClick={handleSendSignature}
                                    disabled={isProcessing}
                                    className="text-[9px] font-semibold uppercase bg-indigo-600 text-white px-2 py-0.5 rounded shadow-sm hover:bg-indigo-700 transition-all border border-indigo-500/50 disabled:opacity-50"
                                >
                                    {isProcessing ? 'Sending...' : 'Send for Signature'}
                                </button>
                            )}
                        </>
                    )}
                    {agreementStatus === 'Signature' && (
                        <button 
                            onClick={(e) => isSignedDraftVerified ? onUpdateLeadLifecycle?.(id, 'agreementStatus', 'ATS') : handleRedirectToFiles(e, 'Unit Documents')}
                            className="text-[9px] font-semibold uppercase bg-green-600 text-white px-2 py-0.5 rounded shadow-sm hover:bg-green-700 transition-all border border-green-500/50"
                        >
                            {isSignedDraftVerified ? 'Schedule ATS' : 'Upload Signed Draft'}
                        </button>
                    )}
                    {agreementStatus === 'ATS' && (
                        <div className="flex flex-col items-end">
                            {!isChallanVerified ? (
                                <button 
                                    onClick={(e) => handleRedirectToFiles(e, 'Unit Documents')}
                                    className="text-[9px] font-semibold uppercase bg-blue-600 text-white px-2 py-0.5 rounded shadow-sm hover:bg-blue-700 transition-all border border-blue-500/50"
                                >
                                    Upload Challan Receipt
                                </button>
                            ) : !customData.isLineupDone ? (
                                <button 
                                    onClick={handleAtsLineup}
                                    className="text-[9px] font-semibold uppercase bg-orange-600 text-white px-2 py-0.5 rounded shadow-sm hover:bg-orange-700 transition-all border border-orange-400/50"
                                >
                                    ATS Lineup
                                </button>
                            ) : !customData.isRegistrationDetailsDone ? (
                                <div className="flex flex-col items-end gap-1">
                                    <div className="text-[8px] text-gray-500 uppercase font-semibold tracking-tight">
                                        <i className="fas fa-building-columns mr-1"></i>
                                        {customData.atsLineupDetails?.office} • {customData.atsLineupDetails?.date}
                                    </div>
                                    <button 
                                        onClick={handleMarkRegistered}
                                        className="text-[9px] font-semibold uppercase bg-blue-600 text-white px-2 py-0.5 rounded shadow-sm hover:bg-blue-700 border border-blue-500/50"
                                    >
                                        Mark Registered
                                    </button>
                                </div>
                            ) : !customData.isExecutionDone ? (
                                <div className="flex flex-col items-end gap-1">
                                    <div className="text-[8px] text-blue-500 uppercase font-semibold tracking-tight">
                                        ATS Under Execution
                                    </div>
                                    <button 
                                        onClick={handleMarkExecutionDone}
                                        className="text-[9px] font-semibold uppercase bg-green-600 text-white px-2 py-0.5 rounded shadow-sm hover:bg-green-700 border border-green-500/50"
                                    >
                                        Mark Done
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    onClick={(e) => handleRedirectToFiles(e, 'Unit Documents')}
                                    className="text-[9px] font-semibold uppercase bg-blue-600 text-white px-2 py-0.5 rounded shadow-sm hover:bg-blue-700 transition-all border border-blue-500/50"
                                >
                                    Upload Registered Draft
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>

    </div>
  );
};

export default ChatItem;

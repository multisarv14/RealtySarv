
import React from 'react';
import { Lead, SiteVisit } from '../types';
import { callNumber, leadSummary } from './leadUi';

interface VisitItemProps {
  visit: SiteVisit;
  lead: Lead;
  activeTab: 'Scheduled' | 'Pending' | 'Completed';
  onMarkAsCompleted: (leadId: string, visitId: string) => void;
  onReschedule: (visit: SiteVisit) => void;
  onScheduleFollowUp: (leadId: string) => void;
  onClick: (leadId: string) => void;
  onBooking: (leadId: string) => void;
  onTokenEntry: (leadId: string) => void;
  isActive: boolean;
}

const VisitItem: React.FC<VisitItemProps> = ({ 
    visit, 
    lead, 
    activeTab, 
    onMarkAsCompleted, 
    onReschedule, 
    onScheduleFollowUp,
    onClick, 
    onBooking, 
    onTokenEntry, 
    isActive 
}) => {
  const handleCompleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkAsCompleted(visit.leadId, visit.id);
  };

  const handleRescheduleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onReschedule(visit);
  };
  
  const handleFollowUpClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onScheduleFollowUp(lead.id);
  };

  const handleBookingClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBooking(lead.id);
  };

  const handleTokenEntryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTokenEntry(lead.id);
  };

  const btn = 'px-2 py-0.5 text-[10px] rounded font-semibold text-white transition-colors';
  const quickBtn = 'w-6 h-6 rounded-full flex items-center justify-center bg-[var(--primary-color)] text-white shadow hover:opacity-90 transition-opacity';
  const overdue = activeTab === 'Pending';
  return (
    <div
      role="button"
      tabIndex={0}
      aria-current={isActive ? 'true' : undefined}
      onClick={() => onClick(visit.leadId)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(visit.leadId); } }}
      className={`group relative flex py-2 pr-3 pl-1 gap-2 cursor-pointer border-b border-[var(--border-color)] transition-colors hover:bg-[var(--light-bg)] focus-visible:outline-none focus-visible:bg-[var(--light-bg)] ${isActive ? 'bg-[var(--light-bg)] shadow-[inset_3px_0_0_var(--primary-color)]' : ''}`}
    >
      {/* Time first: a visit list is read by the clock */}
      <div className="w-14 shrink-0 text-center pt-0.5">
        <div className={`text-[13px] font-bold leading-tight ${overdue ? 'text-red-500' : 'text-[var(--text-primary)]'}`}>{visit.time || '--:--'}</div>
        <div className={`text-[9px] font-semibold uppercase tracking-wide mt-0.5 ${activeTab === 'Completed' ? 'text-green-500' : overdue ? 'text-red-500' : 'text-[var(--primary-color)]'}`}>{activeTab === 'Completed' ? 'Done' : overdue ? 'Missed' : 'Visit'}</div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="relative flex items-center justify-between gap-2 min-h-[22px]">
          <span className="font-semibold text-[13px] text-[var(--text-primary)] truncate">{lead.name}</span>
          {/* Quick actions: shown on mouse-over (and always on touch screens, which have no hover) */}
          <div className="shrink-0 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100">
            {lead.phone && <button type="button" onClick={(e) => { e.stopPropagation(); callNumber(lead.phone); }} className={quickBtn} aria-label="Call" title="Call"><i className="fas fa-phone-alt text-[10px]" aria-hidden="true"></i></button>}
            <button type="button" onClick={handleFollowUpClick} className={quickBtn} aria-label="Schedule follow-up" title="Schedule follow-up"><i className="fas fa-bell text-[10px]" aria-hidden="true"></i></button>
          </div>
        </div>
        <div className="text-[11px] text-[var(--text-secondary)] truncate leading-tight">{[visit.propertyOfInterest, (lead.initialInterest || []).join(', '), lead.budget].filter(Boolean).join(' · ') || leadSummary(lead)}</div>
        {visit.notes && <div className="text-[11px] text-[var(--text-secondary)] opacity-80 truncate leading-tight italic">“{visit.notes}”</div>}
        <div className="flex items-center justify-end gap-1 mt-1 min-h-[20px]">
          {(activeTab === 'Scheduled' || activeTab === 'Pending') && (
            <>
              <button onClick={handleCompleteClick} className={`${btn} bg-green-600 hover:bg-green-700`}>Mark done</button>
              <button onClick={handleRescheduleClick} className={`${btn} bg-gray-600 hover:bg-gray-500`}>Reschedule</button>
            </>
          )}
          {activeTab === 'Completed' && lead.bookingStatus !== 'Booked' && (
            <>
              <button onClick={handleTokenEntryClick} className={`${btn} bg-yellow-600 hover:bg-yellow-700`}>Take token</button>
              <button onClick={handleBookingClick} className={`${btn} bg-purple-600 hover:bg-purple-700`}>Book</button>
            </>
          )}
          {activeTab === 'Completed' && lead.bookingStatus === 'Booked' && (
            <span className="px-2 py-0.5 text-[10px] rounded bg-green-800 text-green-100 font-semibold border border-green-700">Booked</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisitItem;

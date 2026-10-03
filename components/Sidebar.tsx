
import React from 'react';
import { Lead, LeadStatus, SiteVisit, Task, SiteVisitStatus, User, ActiveLeadTab, AgreementStatus, PossessionStatus, LifecycleStage, LeadLifecycleStatus } from '../types';
import ChatItem from './ChatItem';
import VisitItem from './VisitItem';
import { friendlyDate, nextFollowUp, time12, todayISO, urgencyClass } from './leadUi';

// Thin sticky section header used by every list (visits by day, follow-ups by due date, others by added date or project).
const GroupHeader: React.FC<{ label: string; sub?: string; count: number; tone?: 'danger' | 'normal' }> = ({ label, sub, count, tone = 'normal' }) => (
  <div className="sticky top-0 z-10 px-3 py-1 text-[11px] font-bold bg-[var(--dark-bg)] border-b border-[var(--border-color)] flex justify-between">
    <span className={tone === 'danger' ? 'text-red-500' : 'text-[var(--text-secondary)]'}>{label}{sub && <span className="font-normal opacity-70"> · {sub}</span>}</span>
    <span className="font-medium text-[var(--text-secondary)]">{count}</span>
  </div>
);

type ActiveMenu = 'Leads' | 'Visits' | 'Booking' | 'Agreement' | 'Possession';
type ContentTab = 'chat' | 'history' | 'details' | 'siteVisit' | 'booking' | 'ledger' | 'documents';

interface SidebarProps {
  leads: Lead[];
  users: User[];
  selectedLeadId: string | null;
  onSelectLead: (leadId: string) => void;
  onToggleNewLeadModal: () => void;
  onToggleSiteVisitModal: (visitToEdit?: SiteVisit) => void;
  onToggleFollowUpModal: (context: ActiveMenu) => void;
  onNavigateToAdmin: () => void;
  /** Screens this user may open; omit for all. 'Admin' controls the settings cog. */
  allowedMenus?: string[];
  onLogout: () => void;
  onUpdateSiteVisitStatus: (leadId: string, visitId: string, newStatus: SiteVisitStatus) => void;
  onToggleBookingModal: (leadId: string) => void;
  onToggleTokenEntryModal: (leadId: string) => void;
  onUpdateLeadLifecycle: (leadId: string, stage: LifecycleStage, newStatus: LeadLifecycleStatus) => void;
  onUpdateLeadCustomData: (leadId: string, data: Record<string, any>) => void;
  onSwitchTab?: (tab: ContentTab, subTab?: string) => void;
  onOpenAtsLineup?: (leadId: string) => void;
  onOpenRegDetails?: (leadId: string) => void;
  onOpenExecutionDetails?: (leadId: string) => void;
  /** The signed-in user, shown in the footer. */
  currentUser?: User | null;
  /** Called when the user switches menu/tab so the conversation pane doesn't keep showing a lead that isn't in the list. */
  onClearSelection?: () => void;
}

type ActiveVisitTab = 'Scheduled' | 'Pending' | 'Completed';
type ActiveBookingTab = 'Token Booking' | 'Confirmed Booking';

const leadTabs: ActiveLeadTab[] = ['Follow-up', 'Active', 'Inactive'];
const visitTabs: ActiveVisitTab[] = ['Scheduled', 'Pending', 'Completed'];
const bookingTabs: ActiveBookingTab[] = ['Token Booking', 'Confirmed Booking'];
const agreementTabs: AgreementStatus[] = ['Drafted', 'Signature', 'ATS', 'Registered'];
const possessionTabs: PossessionStatus[] = ['Pending', 'Scheduled', 'Handed Over'];

const Sidebar: React.FC<SidebarProps> = ({
  leads,
  users,
  selectedLeadId,
  onSelectLead,
  onToggleNewLeadModal,
  onToggleSiteVisitModal,
  onToggleFollowUpModal,
  onNavigateToAdmin,
  allowedMenus,
  onLogout,
  onUpdateSiteVisitStatus,
  onToggleBookingModal,
  onToggleTokenEntryModal,
  onUpdateLeadLifecycle,
  onUpdateLeadCustomData,
  onSwitchTab,
  onOpenAtsLineup,
  onOpenRegDetails,
  onOpenExecutionDetails,
  currentUser,
  onClearSelection
}) => {
  const [searchTerm, setSearchTerm] = React.useState<string>('');
  const [projectFilter, setProjectFilter] = React.useState<string>('all');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [sourceFilter, setSourceFilter] = React.useState<string>('all');
  const [startDate, setStartDate] = React.useState<string>('');
  const [endDate, setEndDate] = React.useState<string>('');
  const [isFilterPopupOpen, setIsFilterPopupOpen] = React.useState(false);
  const [isAgendaPopupOpen, setIsAgendaPopupOpen] = React.useState(false);
  
  const filterPopupRef = React.useRef<HTMLDivElement>(null);
  const filterButtonRef = React.useRef<HTMLButtonElement>(null);
  const agendaPopupRef = React.useRef<HTMLDivElement>(null);
  const agendaButtonRef = React.useRef<HTMLButtonElement>(null);
  
  const [activeMenu, setActiveMenu] = React.useState<ActiveMenu>('Leads');
  const [activeLeadTab, setActiveLeadTab] = React.useState<ActiveLeadTab>('Active');
  const [activeVisitTab, setActiveVisitTab] = React.useState<ActiveVisitTab>('Scheduled');
  const [activeBookingTab, setActiveBookingTab] = React.useState<ActiveBookingTab>('Token Booking');
  const [activeAgreementTab, setActiveAgreementTab] = React.useState<AgreementStatus>('Drafted');
  const [activePossessionTab, setActivePossessionTab] = React.useState<PossessionStatus>('Pending');

  const allMenuItems: { id: ActiveMenu; label: string; icon: string }[] = [
    { id: 'Leads', label: 'Leads', icon: 'fas fa-users' },
    { id: 'Visits', label: 'Visits', icon: 'fas fa-map-marked-alt' },
    { id: 'Booking', label: 'Booking', icon: 'fas fa-file-signature' },
    { id: 'Agreement', label: 'Agreement', icon: 'fas fa-file-contract' },
    { id: 'Possession', label: 'Possession', icon: 'fas fa-key' },
  ];
  const menuItems = allowedMenus ? allMenuItems.filter(m => allowedMenus.includes(m.id)) : allMenuItems;
  React.useEffect(() => {
    if (menuItems.length && !menuItems.some(m => m.id === activeMenu)) setActiveMenu(menuItems[0].id);
  }, [allowedMenus]);

  const safeLeads = React.useMemo(() => leads || [], [leads]);

  const filterOptions = React.useMemo(() => {
    const projects = ['all', ...Array.from(new Set(safeLeads.map(lead => lead.leadProject)))];
    const statuses: Array<'all' | LeadStatus> = ['all', 'New', 'Contacted', 'Qualified', 'Unqualified', 'Converted'];
    const sources = ['all', ...Array.from(new Set(safeLeads.map(lead => lead.leadSource)))];
    return { projects, statuses, sources };
  }, [safeLeads]);
  
  const isFilterActive = projectFilter !== 'all' || (activeMenu === 'Leads' && statusFilter !== 'all') || sourceFilter !== 'all' || startDate !== '' || endDate !== '';

  const filteredLeads = React.useMemo(() => {
    const hasCompletedVisit = (lead: Lead) => (lead.siteVisits || []).some(v => v.status === 'Completed');
    const hasToken = (lead: Lead) => !!lead.tokenAmount && lead.tokenAmount > 0 && lead.bookingStatus === 'Pending';
    const isBooked = (lead: Lead) => lead.bookingStatus === 'Booked';

    const bookedLeads = safeLeads.filter(l => isBooked(l));
    const tokenLeads = safeLeads.filter(l => hasToken(l) && !isBooked(l));
    const completedVisitLeads = safeLeads.filter(l => hasCompletedVisit(l) && !hasToken(l) && !isBooked(l));
    const generalLeads = safeLeads.filter(l => !isBooked(l) && !hasToken(l) && !hasCompletedVisit(l));

    let menuFilteredLeads: Lead[];
    switch (activeMenu) {
        case 'Leads':
            if (activeLeadTab === 'Follow-up') {
                menuFilteredLeads = generalLeads.filter(lead =>
                    (lead.tasks || []).some(task => task.title.startsWith('Follow-up:') && task.status === 'Pending')
                );
            } else if (activeLeadTab === 'Active') {
                menuFilteredLeads = generalLeads.filter(lead => lead.leadStatus !== 'Unqualified');
            } else { menuFilteredLeads = generalLeads.filter(lead => lead.leadStatus === 'Unqualified'); }
            break;
        case 'Visits':
            const todayVisit = new Date(); todayVisit.setHours(0, 0, 0, 0);
            if (activeVisitTab === 'Completed') menuFilteredLeads = completedVisitLeads;
            else {
                menuFilteredLeads = generalLeads.filter(lead =>
                    (lead.siteVisits || []).some(visit => {
                        const vDate = new Date(visit.date + 'T00:00:00');
                        if (activeVisitTab === 'Scheduled') return visit.status === 'Visit Scheduled' && vDate >= todayVisit;
                        if (activeVisitTab === 'Pending') return visit.status === 'Visit Scheduled' && vDate < todayVisit;
                        return false;
                    })
                );
            }
            break;
        case 'Booking':
            menuFilteredLeads = activeBookingTab === 'Token Booking' ? tokenLeads : bookedLeads;
            break;
        case 'Agreement':
            menuFilteredLeads = bookedLeads.filter(lead => lead.agreementStatus === activeAgreementTab);
            break;
        case 'Possession':
            menuFilteredLeads = bookedLeads.filter(lead => lead.possessionStatus === activePossessionTab);
            break;
        default: menuFilteredLeads = safeLeads;
    }
    if (!menuFilteredLeads) menuFilteredLeads = [];
    return menuFilteredLeads.filter((lead) => {
        const q = searchTerm.trim().toLowerCase();
        const qDigits = q.replace(/\D/g, '');
        const searchMatch = !q
          || lead.name.toLowerCase().includes(q)
          || (lead.email || '').toLowerCase().includes(q)
          || (lead.leadProject || '').toLowerCase().includes(q)
          || (qDigits.length >= 3 && (lead.phone || '').replace(/\D/g, '').includes(qDigits));
        const projectMatch = projectFilter === 'all' || lead.leadProject === projectFilter;
        const statusMatch = activeMenu !== 'Leads' || statusFilter === 'all' || lead.leadStatus === statusFilter;
        const sourceMatch = sourceFilter === 'all' || lead.leadSource === sourceFilter;
        let dateMatch = true;
        if (startDate && lead.leadDate < startDate) dateMatch = false;
        if (endDate && lead.leadDate > endDate) dateMatch = false;
        return searchMatch && projectMatch && statusMatch && sourceMatch && dateMatch;
    });
  }, [safeLeads, searchTerm, projectFilter, statusFilter, sourceFilter, startDate, endDate, activeMenu, activeLeadTab, activeVisitTab, activeBookingTab, activeAgreementTab, activePossessionTab]);

  // Number shown on every tab, so you can see at a glance how much is in each list (same rules as the lists below).
  const tabCounts = React.useMemo(() => {
    const today = todayISO();
    const isBooked = (l: Lead) => l.bookingStatus === 'Booked';
    const isToken = (l: Lead) => !!l.tokenAmount && l.tokenAmount > 0 && l.bookingStatus === 'Pending';
    const doneVisit = (l: Lead) => (l.siteVisits || []).some(v => v.status === 'Completed');
    const general = safeLeads.filter(l => !isBooked(l) && !isToken(l) && !doneVisit(l));
    const visitsOf = (leads: Lead[], pred: (v: any) => boolean) => leads.reduce((n, l) => n + (l.siteVisits || []).filter(pred).length, 0);
    const booked = safeLeads.filter(isBooked);
    return {
      Leads: {
        'Follow-up': general.filter(l => (l.tasks || []).some(t => t.title.startsWith('Follow-up:') && t.status === 'Pending')).length,
        'Active': general.filter(l => l.leadStatus !== 'Unqualified').length,
        'Inactive': general.filter(l => l.leadStatus === 'Unqualified').length,
      },
      Visits: {
        'Scheduled': visitsOf(general, v => v.status === 'Visit Scheduled' && v.date >= today),
        'Pending': visitsOf(general, v => v.status === 'Visit Scheduled' && v.date < today),
        'Completed': visitsOf(safeLeads.filter(l => doneVisit(l) && !isToken(l) && !isBooked(l)), v => v.status === 'Completed'),
      },
      Booking: { 'Token Booking': safeLeads.filter(l => isToken(l) && !isBooked(l)).length, 'Confirmed Booking': booked.length },
      Agreement: Object.fromEntries((['Drafted', 'Signature', 'ATS', 'Registered'] as const).map(st => [st, booked.filter(l => l.agreementStatus === st).length])),
      Possession: { 'Pending': booked.filter(l => l.possessionStatus === 'Pending').length, 'Scheduled': booked.filter(l => l.possessionStatus === 'Scheduled').length, 'Handed Over': booked.filter(l => l.possessionStatus === 'Handed Over').length },
    } as Record<string, Record<string, number>>;
  }, [safeLeads]);

  const clearFilters = () => { setProjectFilter('all'); setStatusFilter('all'); setSourceFilter('all'); setStartDate(''); setEndDate(''); };

  const visitsToRender = React.useMemo(() => {
    if (activeMenu !== 'Visits') return [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return filteredLeads.flatMap(lead => 
        (lead.siteVisits || []).filter(visit => {
                const vDate = new Date(visit.date + 'T00:00:00');
                if (activeVisitTab === 'Scheduled') return visit.status === 'Visit Scheduled' && vDate >= today;
                if (activeVisitTab === 'Pending') return visit.status === 'Visit Scheduled' && vDate < today;
                if (activeVisitTab === 'Completed') return visit.status === 'Completed';
                return false;
            }).map(visit => ({ visit, lead }))
    ).sort((a, b) => (activeVisitTab === 'Completed' ? -1 : 1) * (`${a.visit.date}T${(a.visit.time || '00:00').padStart(5, '0')}`).localeCompare(`${b.visit.date}T${(b.visit.time || '00:00').padStart(5, '0')}`));
  }, [filteredLeads, activeVisitTab, activeMenu]);
  
  // In the Follow-up list the right-hand time is when the follow-up is due (not when the last message arrived).
  const followUpLabel = (l: Lead, groupKey: string): string => {
    const nf = nextFollowUp(l);
    if (!nf) return '';
    const t = time12(nf.time);
    return groupKey === 'today' || groupKey === 'tomorrow' ? t : [friendlyDate(nf.date), t].filter(Boolean).join(', ');
  };

  // Section the lead list so it reads like the Visits list.
  const leadGroups = React.useMemo(() => {
    if (activeMenu === 'Visits') return [] as { key: string; label: string; sub?: string; tone?: 'danger' | 'normal'; leads: Lead[] }[];
    const today = todayISO();
    const dayDiff = (iso: string) => Math.round((new Date(today + 'T00:00:00').getTime() - new Date(iso + 'T00:00:00').getTime()) / 86400000);
    const nextDue = (l: Lead) => nextFollowUp(l);
    type G = { key: string; label: string; sub?: string; tone?: 'danger' | 'normal'; order: number; sort: string };
    const groupOf = (l: Lead): G => {
      if (activeMenu === 'Leads' && activeLeadTab === 'Follow-up') {
        const nf = nextDue(l);
        const due = nf?.date || '9999-12-31';
        // Earliest first inside each group: by date, then by the time of day of the follow-up.
        const sort = due + 'T' + (nf?.time || '23:59').padStart(5, '0');
        if (due < today) return { key: 'overdue', label: 'Overdue', tone: 'danger', order: 0, sort };
        if (due === today) return { key: 'today', label: 'Today', sub: 'follow-ups', order: 1, sort };
        if (dayDiff(due) === -1) return { key: 'tomorrow', label: 'Tomorrow', order: 2, sort };
        return { key: 'later', label: 'Later', order: 3, sort };
      }
      if (activeMenu === 'Leads') {
        const d = dayDiff(l.leadDate || today);
        const g = d <= 0 ? ['today', 'Added today', 0] : d === 1 ? ['yesterday', 'Added yesterday', 1] : d <= 7 ? ['week', 'Earlier this week', 2] : d <= 30 ? ['month', 'Earlier this month', 3] : ['older', 'Older', 4];
        return { key: g[0] as string, label: g[1] as string, order: g[2] as number, sort: String(9999999999 - new Date(l.leadDate || today).getTime()).padStart(13, '0') };
      }
      return { key: 'p:' + l.leadProject, label: l.leadProject || 'No project', order: 0, sort: String(9999999999 - new Date(l.leadDate || today).getTime()).padStart(13, '0') };
    };
    const tagged = filteredLeads.map(l => ({ l, g: groupOf(l) }));
    tagged.sort((a, b) => a.g.order - b.g.order || (a.g.key.startsWith('p:') ? a.g.label.localeCompare(b.g.label) : 0) || a.g.sort.localeCompare(b.g.sort));
    const out: { key: string; label: string; sub?: string; tone?: 'danger' | 'normal'; leads: Lead[] }[] = [];
    for (const { l, g } of tagged) {
      const last = out[out.length - 1];
      if (last && last.key === g.key) last.leads.push(l); else out.push({ key: g.key, label: g.label, sub: g.sub, tone: g.tone, leads: [l] });
    }
    return out;
  }, [filteredLeads, activeMenu, activeLeadTab]);

  // Agenda: what needs attention today in the menu you are looking at.
  const agenda = React.useMemo(() => {
    interface Item { leadId: string; name: string; label: string; detail?: string; urgency: 'overdue' | 'today' | 'upcoming' }
    const today = todayISO();
    const followUpTime = (d?: string) => (d || '').match(/Scheduled for ([^.\n]+)\./)?.[1];
    const followUps = (pool: Lead[]): Item[] => pool.flatMap(lead => (lead.tasks || [])
      .filter(t => t.status === 'Pending' && t.title.startsWith('Follow-up:') && t.dueDate && t.dueDate <= today)
      .map(t => ({ leadId: lead.id, name: lead.name, label: t.title.replace('Follow-up:', 'Follow-up ·'), detail: [friendlyDate(t.dueDate), followUpTime(t.description)].filter(Boolean).join(' · '), urgency: (t.dueDate < today ? 'overdue' : 'today') as Item['urgency'] })));

    const isBooked = (l: Lead) => l.bookingStatus === 'Booked';
    const isToken = (l: Lead) => !!l.tokenAmount && l.tokenAmount > 0 && l.bookingStatus === 'Pending';
    const hasDoneVisit = (l: Lead) => (l.siteVisits || []).some(v => v.status === 'Completed');
    let title = '', empty = '', items: Item[] = [];

    switch (activeMenu) {
      case 'Leads': {
        title = 'Follow-ups due'; empty = 'No follow-ups due today.';
        items = followUps(safeLeads.filter(l => !isBooked(l) && !isToken(l) && !hasDoneVisit(l)));
        break;
      }
      case 'Visits': {
        title = 'Site visits'; empty = 'No site visits today or overdue.';
        items = safeLeads.flatMap(lead => (lead.siteVisits || [])
          .filter(v => v.status === 'Visit Scheduled' && v.date <= today)
          .map(v => ({ leadId: lead.id, name: lead.name, label: v.date < today ? 'Visit missed' : 'Visit today', detail: [v.date < today ? friendlyDate(v.date) : '', v.time, v.propertyOfInterest].filter(Boolean).join(' · '), urgency: (v.date < today ? 'overdue' : 'today') as Item['urgency'] })));
        break;
      }
      case 'Booking': {
        title = 'Bookings to act on'; empty = 'No bookings need action today.';
        const tokens: Item[] = safeLeads.filter(l => isToken(l)).map(l => ({ leadId: l.id, name: l.name, label: 'Confirm booking', detail: `Token ₹${(l.tokenAmount || 0).toLocaleString('en-IN')} · ${l.leadProject}`, urgency: 'today' as const }));
        items = tokens.concat(followUps(safeLeads.filter(l => isToken(l) || isBooked(l))));
        break;
      }
      case 'Agreement': {
        title = 'Agreements today'; empty = 'No agreement work due today.';
        const lineups: Item[] = safeLeads.filter(l => isBooked(l) && l.customData?.atsLineupDetails?.date && l.customData.atsLineupDetails.date <= today && !l.customData?.isRegistrationDetailsDone)
          .map(l => ({ leadId: l.id, name: l.name, label: l.customData!.atsLineupDetails.date < today ? 'ATS lineup missed' : 'ATS lineup today', detail: [l.customData!.atsLineupDetails.time, l.customData!.atsLineupDetails.office].filter(Boolean).join(' · '), urgency: (l.customData!.atsLineupDetails.date < today ? 'overdue' : 'today') as Item['urgency'] }));
        items = lineups.concat(followUps(safeLeads.filter(isBooked)));
        break;
      }
      default: {
        title = 'Possession'; empty = 'No handovers or follow-ups due.';
        const handovers: Item[] = safeLeads.filter(l => isBooked(l) && l.possessionStatus === 'Scheduled').map(l => ({ leadId: l.id, name: l.name, label: 'Handover scheduled', detail: l.leadProject, urgency: 'upcoming' as const }));
        items = handovers.concat(followUps(safeLeads.filter(isBooked)));
      }
    }
    const rank = { overdue: 0, today: 1, upcoming: 2 };
    items.sort((a, b) => rank[a.urgency] - rank[b.urgency]);
    return { title, empty, items };
  }, [safeLeads, activeMenu]);

  const agendaCount = agenda.items.length;

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterPopupRef.current && !filterPopupRef.current.contains(event.target as Node) && filterButtonRef.current && !filterButtonRef.current.contains(event.target as Node)) setIsFilterPopupOpen(false);
      if (agendaPopupRef.current && !agendaPopupRef.current.contains(event.target as Node) && agendaButtonRef.current && !agendaButtonRef.current.contains(event.target as Node)) setIsAgendaPopupOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleScheduleSiteVisit = (leadId: string) => { onSelectLead(leadId); onToggleSiteVisitModal(); };
  const handleScheduleFollowUp = (leadId: string) => { onSelectLead(leadId); onToggleFollowUpModal(activeMenu); };

  return (
    <div className="bg-[var(--medium-bg)] w-full flex flex-col h-full border-r border-[var(--border-color)] overflow-hidden">
      {/* Menu Grid */}
      <div className="border-b border-[var(--border-color)] bg-[var(--dark-bg)] grid flex-shrink-0 md:h-[56px]" style={{ gridTemplateColumns: `repeat(${Math.max(menuItems.length, 1)}, minmax(0, 1fr))` }}>
        {menuItems.map(item => (
          <button key={item.id} onClick={() => { setActiveMenu(item.id); onClearSelection?.(); }} className={`flex flex-col items-center justify-center py-1.5 transition-colors border-b-2 ${activeMenu === item.id ? 'bg-[var(--light-bg)] text-[var(--primary-color)] border-[var(--primary-color)]' : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]'}`}>
              <i className={`${item.icon} text-[13px] mb-0.5`} aria-hidden="true"></i>
              <span className="text-[10px] font-semibold tracking-tight truncate w-full text-center px-1">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Search + actions */}
      <div className="relative px-2.5 py-2 md:py-0 md:h-[52px] border-b border-[var(--border-color)] flex items-center gap-1.5 flex-shrink-0 bg-[var(--medium-bg)]">
          <div className="relative flex-1 min-w-0">
              <i className="fas fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[var(--text-secondary)] pointer-events-none" aria-hidden="true"></i>
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name, phone, project"
                aria-label="Search leads"
                className="w-full h-8 pl-8 pr-2 rounded-lg bg-[var(--dark-bg)] border border-transparent focus:border-[var(--primary-color)] outline-none text-xs text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
              />
          </div>
          <button ref={filterButtonRef} onClick={() => setIsFilterPopupOpen(!isFilterPopupOpen)} aria-label="Filters" aria-expanded={isFilterPopupOpen} title="Filters"
            className={`relative h-8 w-8 shrink-0 rounded-lg flex items-center justify-center transition-colors ${isFilterActive ? 'bg-[var(--primary-color)] text-white' : 'bg-[var(--dark-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
              <i className="fas fa-sliders-h text-xs" aria-hidden="true"></i>
          </button>
          <button ref={agendaButtonRef} onClick={() => setIsAgendaPopupOpen(!isAgendaPopupOpen)} aria-label={`${activeMenu} agenda, ${agendaCount} items`} aria-expanded={isAgendaPopupOpen} title={`${activeMenu} agenda`}
            className="relative h-8 w-8 shrink-0 rounded-lg bg-[var(--dark-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center">
              <i className="fas fa-calendar-day text-xs" aria-hidden="true"></i>
              {agendaCount > 0 && <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 text-[9px] bg-red-600 text-white rounded-full flex items-center justify-center font-bold">{agendaCount}</span>}
          </button>
          <button onClick={onToggleNewLeadModal} aria-label="New lead" title="New lead"
            className="h-8 px-3 shrink-0 rounded-lg bg-[var(--primary-color)] text-white text-xs font-semibold flex items-center gap-1.5 hover:opacity-90 transition-opacity">
              <i className="fas fa-plus text-[10px]" aria-hidden="true"></i><span>New</span>
          </button>

          {isFilterPopupOpen && (
            <div ref={filterPopupRef} className="absolute top-full left-2 right-2 mt-1 bg-[var(--medium-bg)] p-3 z-[40] rounded-lg border border-[var(--border-color)] shadow-xl animate-fadeIn space-y-2.5">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-primary)]">Filters</span>
                    <button onClick={clearFilters} className="text-[11px] font-semibold text-[var(--primary-color)] hover:underline disabled:opacity-40" disabled={!isFilterActive}>Clear all</button>
                </div>
                <label className="block text-[11px] text-[var(--text-secondary)]">Project
                    <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)} className="mt-1 w-full text-xs p-1.5 rounded border border-[var(--border-color)] bg-[var(--dark-bg)] text-[var(--text-primary)]">
                        {filterOptions.projects.map(p => <option key={p} value={p}>{p === 'all' ? 'All projects' : p}</option>)}
                    </select>
                </label>
                {activeMenu === 'Leads' && (
                    <label className="block text-[11px] text-[var(--text-secondary)]">Lead status
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="mt-1 w-full text-xs p-1.5 rounded border border-[var(--border-color)] bg-[var(--dark-bg)] text-[var(--text-primary)]">
                            {filterOptions.statuses.map(st => <option key={st} value={st}>{st === 'all' ? 'All statuses' : st}</option>)}
                        </select>
                    </label>
                )}
                <label className="block text-[11px] text-[var(--text-secondary)]">Source
                    <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} className="mt-1 w-full text-xs p-1.5 rounded border border-[var(--border-color)] bg-[var(--dark-bg)] text-[var(--text-primary)]">
                        {filterOptions.sources.map(src => <option key={src} value={src}>{src === 'all' ? 'All sources' : src}</option>)}
                    </select>
                </label>
                <div className="grid grid-cols-2 gap-2">
                    <label className="block text-[11px] text-[var(--text-secondary)]">Added from
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 w-full text-xs p-1.5 rounded border border-[var(--border-color)] bg-[var(--dark-bg)] text-[var(--text-primary)]" />
                    </label>
                    <label className="block text-[11px] text-[var(--text-secondary)]">to
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 w-full text-xs p-1.5 rounded border border-[var(--border-color)] bg-[var(--dark-bg)] text-[var(--text-primary)]" />
                    </label>
                </div>
            </div>
          )}

          {isAgendaPopupOpen && (
            <div ref={agendaPopupRef} className="absolute top-full right-2 mt-1 w-80 max-w-[calc(100%-1rem)] bg-[var(--medium-bg)] p-2 z-[40] rounded-lg border border-[var(--border-color)] shadow-xl animate-fadeIn">
                <h4 className="flex items-center justify-between px-1 py-1.5 text-xs font-bold text-[var(--text-primary)]">
                  <span>{agenda.title}</span><span className="font-medium text-[var(--text-secondary)]">{activeMenu} · {agendaCount}</span>
                </h4>
                <div className="space-y-1 max-h-72 overflow-y-auto custom-scrollbar">
                    {agenda.items.map((ev, i) => (
                        <button key={ev.leadId + i} onClick={() => { onSelectLead(ev.leadId); setIsAgendaPopupOpen(false); }} className="w-full text-left p-2 rounded bg-[var(--dark-bg)] hover:bg-[var(--light-bg)] text-[12px]">
                            <span className="flex items-center justify-between gap-2">
                              <span className="font-semibold truncate text-[var(--text-primary)]">{ev.name}</span>
                              <span className={`shrink-0 px-1.5 py-px text-[10px] rounded font-semibold border ${urgencyClass[ev.urgency]}`}>{ev.urgency === 'overdue' ? 'Overdue' : ev.urgency === 'today' ? 'Today' : 'Upcoming'}</span>
                            </span>
                            <span className="block text-[11px] text-[var(--text-secondary)] truncate">{ev.label}{ev.detail ? ` · ${ev.detail}` : ''}</span>
                        </button>
                    ))}
                    {agendaCount === 0 && <p className="text-center text-xs text-[var(--text-secondary)] py-5">{agenda.empty}</p>}
                </div>
            </div>
          )}
      </div>

      {/* Sub-tabs */}
      <div role="tablist" className="flex items-center gap-1.5 px-2.5 py-2 md:py-0 md:h-[52px] bg-[var(--dark-bg)] border-b border-[var(--border-color)] flex-shrink-0 overflow-x-auto no-scrollbar">
          {(activeMenu === 'Leads' ? leadTabs : activeMenu === 'Visits' ? visitTabs : activeMenu === 'Booking' ? bookingTabs : activeMenu === 'Agreement' ? agreementTabs : possessionTabs).map(tab => {
            const current = (activeMenu === 'Leads' ? activeLeadTab : activeMenu === 'Visits' ? activeVisitTab : activeMenu === 'Booking' ? activeBookingTab : activeMenu === 'Agreement' ? activeAgreementTab : activePossessionTab);
            const active = current === tab;
            return (
              <button key={tab} role="tab" aria-selected={active} onClick={() => {
                  onClearSelection?.();
                  if(activeMenu === 'Leads') setActiveLeadTab(tab as any);
                  else if(activeMenu === 'Visits') setActiveVisitTab(tab as any);
                  else if(activeMenu === 'Booking') setActiveBookingTab(tab as any);
                  else if(activeMenu === 'Agreement') setActiveAgreementTab(tab as any);
                  else setActivePossessionTab(tab as any);
              }} className={`flex-1 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${active ? 'bg-[var(--primary-color)] text-white shadow-sm' : 'text-[var(--text-secondary)] bg-[var(--medium-bg)] hover:text-[var(--text-primary)] hover:bg-[var(--light-bg)]'}`}>
                {tab}
                <span className={`ml-1.5 px-1.5 rounded-full text-[10px] ${active ? 'bg-white/25 text-white' : 'bg-[var(--light-bg)]'}`}>{tabCounts[activeMenu]?.[tab as string] ?? 0}</span>
              </button>
            );
          })}
      </div>

      {/* List Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
          {activeMenu !== 'Visits' ? (
              leadGroups.map(group => (
                <React.Fragment key={group.key}>
                  <GroupHeader label={group.label} sub={group.sub} count={group.leads.length} tone={group.tone} />
                  {group.leads.map(lead => (
                  <ChatItem 
                    key={lead.id} 
                    lead={lead} 
                    users={users} 
                    isActive={lead.id === selectedLeadId} 
                    onClick={onSelectLead} 
                    activeMenu={activeMenu} 
                    activeLeadTab={activeLeadTab} 
                    onScheduleSiteVisit={handleScheduleSiteVisit} 
                    onScheduleFollowUp={handleScheduleFollowUp} 
                    onConfirmBooking={onToggleBookingModal} 
                    onUpdateLeadLifecycle={onUpdateLeadLifecycle}
                    onUpdateCustomData={onUpdateLeadCustomData}
                    onSwitchTab={onSwitchTab}
                    onOpenAtsLineup={onOpenAtsLineup}
                    onOpenRegDetails={onOpenRegDetails}
                    onOpenExecutionDetails={onOpenExecutionDetails}
                    timeLabel={activeMenu === 'Leads' && activeLeadTab === 'Follow-up' ? followUpLabel(lead, group.key) : undefined}
                  />
                  ))}
                </React.Fragment>
              ))
          ) : (
              visitsToRender.map(({ visit, lead }, idx) => (
                <React.Fragment key={visit.id}>
                  {(idx === 0 || visitsToRender[idx - 1].visit.date !== visit.date) && (
                    <GroupHeader label={friendlyDate(visit.date)} sub={new Date(visit.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} count={visitsToRender.filter(v => v.visit.date === visit.date).length} tone={visit.date < todayISO() ? 'danger' : 'normal'} />
                  )}
                  <VisitItem 
                    key={visit.id} 
                    visit={visit} 
                    lead={lead} 
                    activeTab={activeVisitTab} 
                    onMarkAsCompleted={(l, v) => onUpdateSiteVisitStatus(l, v, 'Completed')} 
                    onReschedule={(v) => onToggleSiteVisitModal(v)} 
                    onScheduleFollowUp={handleScheduleFollowUp}
                    onClick={onSelectLead} 
                    onBooking={onToggleBookingModal} 
                    onTokenEntry={onToggleTokenEntryModal} 
                    isActive={visit.leadId === selectedLeadId} 
                  />
                </React.Fragment>
              ))
          )}
          {filteredLeads.length === 0 && <div className="p-10 text-center text-[var(--text-secondary)] flex flex-col items-center"><i className="fas fa-inbox text-3xl mb-3 opacity-50" aria-hidden="true"></i><p className="text-xs font-semibold uppercase tracking-widest">No matching leads</p></div>}
      </div>

      {/* Signed-in user */}
      <div className="px-2.5 py-2 flex justify-between items-center border-t border-[var(--border-color)] flex-shrink-0 bg-[var(--medium-bg)]">
          <div className="flex items-center gap-2 min-w-0">
            <div className="min-w-0">
                <div className="font-semibold text-[var(--text-primary)] text-xs truncate leading-tight">{currentUser?.name || 'Signed in'}</div>
                <div className="text-[10px] text-[var(--text-secondary)] truncate">{currentUser?.role || ''}</div>
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
              {(!allowedMenus || allowedMenus.includes('Admin')) && <button onClick={onNavigateToAdmin} aria-label="Admin settings" title="Admin settings" className="h-8 w-8 rounded flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--primary-color)] transition-colors"><i className="fas fa-cog text-xs" aria-hidden="true"></i></button>}
              <button onClick={onLogout} aria-label="Sign out" title="Sign out" className="h-8 w-8 rounded flex items-center justify-center text-[var(--text-secondary)] hover:text-red-500 transition-colors"><i className="fas fa-sign-out-alt text-xs" aria-hidden="true"></i></button>
          </div>
      </div>
    </div>
  );
};

export default Sidebar;

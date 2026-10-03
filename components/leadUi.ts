import { Lead } from '../types';

// Small helpers that turn a lead into the real-estate facts the CRM views show.

export const todayISO = (): string => new Date().toISOString().split('T')[0];

/** "Today", "Tomorrow", "Yesterday" or "5 Oct" for a YYYY-MM-DD date. */
export function friendlyDate(iso: string): string {
  const today = todayISO();
  const diff = Math.round((new Date(iso + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export type Urgency = 'overdue' | 'today' | 'upcoming';
export interface NextAction { label: string; urgency: Urgency }

/** The next thing the team has to do for this lead: a pending follow-up, or a scheduled visit. */
export function getNextAction(lead: Lead): NextAction | null {
  const today = todayISO();
  const candidates: { date: string; label: string }[] = [];
  for (const t of lead.tasks || []) {
    if (t.status === 'Pending' && t.title.startsWith('Follow-up:') && t.dueDate) candidates.push({ date: t.dueDate, label: `Follow-up ${friendlyDate(t.dueDate)}` });
  }
  for (const v of lead.siteVisits || []) {
    if (v.status === 'Visit Scheduled' && v.date) candidates.push({ date: v.date, label: `Visit ${friendlyDate(v.date)}${v.time ? ' ' + v.time : ''}` });
  }
  if (!candidates.length) return null;
  candidates.sort((a, b) => a.date.localeCompare(b.date));
  const next = candidates[0];
  return { label: next.label, urgency: next.date < today ? 'overdue' : next.date === today ? 'today' : 'upcoming' };
}

export const urgencyClass: Record<Urgency, string> = {
  overdue: 'bg-red-500/15 text-red-500 border-red-500/30',
  today: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
  upcoming: 'bg-sky-500/15 text-sky-500 border-sky-500/30',
};

/** "The Grand Towers · 2BHK, 3BHK · 75L - 1Cr" */
export function leadSummary(lead: Lead): string {
  const interest = (lead.initialInterest || []).join(', ');
  return [lead.leadProject && lead.leadProject !== 'Not Assigned' ? lead.leadProject : '', interest, lead.budget || ''].filter(Boolean).join(' · ');
}

export const PIPELINE_STEPS = ['Lead', 'Visit', 'Token', 'Booked', 'Agreement', 'Possession'] as const;

/** How far the lead is along the sales journey: index into PIPELINE_STEPS. */
export function getPipelineStep(lead: Lead): number {
  if (lead.possessionStatus === 'Handed Over') return 5;
  if (lead.bookingStatus === 'Booked') return lead.agreementStatus && lead.agreementStatus !== 'Drafted' ? 4 : 3;
  if (lead.tokenAmount && lead.tokenAmount > 0) return 2;
  if ((lead.siteVisits || []).some((v) => v.status === 'Completed')) return 1;
  return 0;
}

/** Digits only, for tel: and wa.me links. Bare 10-digit Indian numbers get the 91 country code for WhatsApp. */
export function phoneForWhatsApp(phone: string): string {
  const d = (phone || '').replace(/\D/g, '');
  return d.length === 10 ? `91${d}` : d;
}
export const phoneForTel = (phone: string): string => (phone || '').replace(/[^\d+]/g, '');

/** Start a phone call. A button + this handler (instead of a tel: link) keeps the number out of the browser's hover status bar. */
export const callNumber = (phone: string): void => { window.location.href = `tel:${phoneForTel(phone)}`; };
/** Open WhatsApp chat with the number, again without exposing it in a link. */
export const openWhatsApp = (phone: string): void => { window.open(`https://wa.me/${phoneForWhatsApp(phone)}`, '_blank', 'noopener,noreferrer'); };

/** Leads that already use this mobile number (last 10 digits) or email. Numbers are compared, never shown. */
export function findLeadMatches<T extends { id: string; phone: string; email: string }>(leads: T[], q: { phone?: string; email?: string; excludeId?: string }): T[] {
  const digits = (q.phone || '').replace(/\D/g, '').slice(-10);
  const email = (q.email || '').trim().toLowerCase();
  const byPhone = digits.length >= 10;
  const byEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!byPhone && !byEmail) return [];
  return leads.filter(l => l.id !== q.excludeId && ((byPhone && (l.phone || '').replace(/\D/g, '').slice(-10) === digits) || (byEmail && (l.email || '').trim().toLowerCase() === email)));
}

/** "11:00" or "9:30" to "11:00 AM" / "9:30 AM". */
export function time12(hhmm?: string): string {
  const m = (hhmm || '').match(/^(\d{1,2}):(\d{2})/);
  if (!m) return '';
  const h = Number(m[1]);
  return `${h % 12 || 12}:${m[2]} ${h >= 12 ? 'PM' : 'AM'}`;
}

/** The pending follow-up that is due first, by date and then time of day. */
export function nextFollowUp(lead: Lead): { date: string; time: string } | undefined {
  const due = (lead.tasks || [])
    .filter(t => t.status === 'Pending' && t.title.startsWith('Follow-up:') && t.dueDate)
    .map(t => ({ date: t.dueDate, time: (t.description || '').match(/Scheduled for (\d{1,2}:\d{2})/)?.[1] || '' }));
  return due.sort((a, b) => (a.date + 'T' + (a.time || '23:59').padStart(5, '0')).localeCompare(b.date + 'T' + (b.time || '23:59').padStart(5, '0')))[0];
}

/** Short, stable codes for people to quote: LD- for the lead, CU- for the customer (linked leads share a CU code). */
const code = (s: string) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36).toUpperCase().padStart(6, '0').slice(-6); };
export const leadCode = (lead: Lead): string => 'LD-' + code(lead.id);
export const customerCode = (lead: Lead): string => 'CU-' + code(lead.customerId || lead.id);

export interface TimelineEvent { id: string; date: string; time?: string; icon: string; tone: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'gray'; title: string; detail?: string; when: 'upcoming' | 'overdue' | 'done' }

/** Everything that has happened to a lead, and what is still due, in one list (built from the lead's own records). */
export function buildTimeline(lead: Lead, userName: (id: string) => string): TimelineEvent[] {
  const today = todayISO();
  const ev: TimelineEvent[] = [];
  const iso = (s?: string) => (s || '').slice(0, 10);
  const add = (e: Omit<TimelineEvent, 'when'> & { when?: TimelineEvent['when'] }) => { if (e.date) ev.push({ ...e, when: e.when || (e.date < today ? 'done' : 'upcoming') }); };

  add({ id: 'created', date: lead.leadDate, icon: 'fa-user-plus', tone: 'blue', title: 'Enquiry received', detail: [lead.channelSource, lead.leadSource].filter(Boolean).join(' › '), when: 'done' });

  for (const t of lead.tasks || []) {
    if (!t.title.startsWith('Follow-up:') || !t.dueDate) continue;
    const time = (t.description || '').match(/Scheduled for (\d{1,2}:\d{2})/)?.[1];
    const notes = (t.description || '').match(/Notes: (.+)/)?.[1];
    const done = t.status === 'Completed';
    add({ id: t.id, date: t.dueDate, time, icon: t.title.includes('Meeting') ? 'fa-handshake' : t.title.includes('Email') ? 'fa-envelope' : 'fa-phone-alt', tone: done ? 'green' : t.dueDate < today ? 'red' : 'amber',
      title: `${t.title.replace('Follow-up:', 'Follow-up ·')}${done ? ' done' : ''}`, detail: [t.assignedTo, notes && notes !== 'N/A' ? notes : ''].filter(Boolean).join(' · '), when: done ? 'done' : t.dueDate < today ? 'overdue' : 'upcoming' });
  }
  for (const v of lead.siteVisits || []) {
    const scheduled = v.status === 'Visit Scheduled';
    add({ id: v.id, date: v.date, time: v.time, icon: 'fa-map-marker-alt', tone: v.status === 'Completed' ? 'green' : scheduled ? (v.date < today ? 'red' : 'purple') : 'gray',
      title: `Site visit · ${v.propertyOfInterest || lead.leadProject}`, detail: [scheduled && v.date < today ? 'Missed, not updated' : v.status, v.notes].filter(Boolean).join(' · '), when: scheduled ? (v.date < today ? 'overdue' : 'upcoming') : 'done' });
  }
  const b = lead.bookingDetails;
  if (b?.tokenDetails?.transactionDate) add({ id: 'token', date: iso(b.tokenDetails.transactionDate), icon: 'fa-coins', tone: 'amber', title: `Token received ₹${(b.tokenDetails.amount || 0).toLocaleString('en-IN')}`, detail: [b.tokenDetails.mode, b.tokenDetails.bankName].filter(Boolean).join(' · '), when: 'done' });
  for (const p of b?.payments || []) add({ id: 'pay' + p.id, date: iso(p.date), icon: 'fa-rupee-sign', tone: 'green', title: `Payment ₹${(p.amount || 0).toLocaleString('en-IN')}`, detail: [p.milestoneName, p.mode].filter(Boolean).join(' · '), when: 'done' });
  for (const d of b?.demands || []) add({ id: 'dem' + d.milestoneId, date: iso(d.dueDate), icon: 'fa-file-invoice', tone: iso(d.dueDate) < today ? 'gray' : 'blue', title: 'Demand due', detail: d.milestoneDate ? `Milestone ${iso(d.milestoneDate)}` : undefined, when: iso(d.dueDate) < today ? 'done' : 'upcoming' });
  const cd = lead.customData || {};
  if (cd.atsLineupDetails?.date) add({ id: 'ats', date: cd.atsLineupDetails.date, time: cd.atsLineupDetails.time, icon: 'fa-file-contract', tone: 'purple', title: 'Agreement lineup', detail: cd.atsLineupDetails.office, when: cd.isLineupDone && cd.atsLineupDetails.date < today ? 'done' : cd.atsLineupDetails.date < today ? 'overdue' : 'upcoming' });
  if (cd.registrationDetails?.regDate) add({ id: 'reg', date: cd.registrationDetails.regDate, icon: 'fa-stamp', tone: 'green', title: 'Agreement registered', detail: cd.registrationDetails.regNumber, when: 'done' });
  if (cd.executionDetails?.executionDate) add({ id: 'exec', date: cd.executionDetails.executionDate, icon: 'fa-check-circle', tone: 'green', title: 'Agreement executed', detail: cd.executionDetails.remarks, when: 'done' });
  for (const [i, h] of ((cd.transferHistory as { at: string; from: string; to: string; reason?: string }[]) || []).entries()) add({ id: 'tr' + i, date: iso(h.at), icon: 'fa-exchange-alt', tone: 'gray', title: `Owner changed to ${userName(h.to)}`, detail: [`from ${userName(h.from)}`, h.reason].filter(Boolean).join(' · '), when: 'done' });
  for (const [i, h] of ((cd.projectShifts as { at: string; from: string; to: string }[]) || []).entries()) add({ id: 'ps' + i, date: iso(h.at), icon: 'fa-building', tone: 'gray', title: `Shifted to ${h.to}`, detail: `from ${h.from}`, when: 'done' });
  for (const [i, h] of ((cd.mergedFrom as { name: string; at: string }[]) || []).entries()) add({ id: 'mg' + i, date: iso(h.at), icon: 'fa-code-merge', tone: 'gray', title: 'Merged a duplicate', detail: h.name, when: 'done' });
  return ev;
}

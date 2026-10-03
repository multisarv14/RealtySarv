import React from 'react';
import { Lead, User } from '../../types';
import { Modal } from '../ui/Modal';
import { toast } from '../ui/Toast';

interface AdminLeadMergeProps {
  leads: Lead[];
  users: User[];
  /** Saves the combined lead and removes the entries that were folded into it. */
  onMergeLeads: (primary: Lead, removeIds: string[]) => Promise<unknown> | void;
}

interface Group { key: string; reason: string; leads: Lead[] }

const digits = (s?: string) => (s || '').replace(/\D/g, '').slice(-10);
const norm = (s?: string) => (s || '').trim().toLowerCase();

/** People entered more than once: leads that share a mobile number or an email address. */
export function findDuplicateGroups(leads: Lead[]): Group[] {
  const parent = new Map<string, string>();
  const find = (x: string): string => { while (parent.get(x) !== x) { parent.set(x, parent.get(parent.get(x)!)!); x = parent.get(x)!; } return x; };
  const union = (a: string, b: string) => { parent.set(find(a), find(b)); };
  leads.forEach(l => parent.set(l.id, l.id));
  const seen = new Map<string, string>();
  const why = new Map<string, Set<string>>();
  for (const l of leads) {
    const phone = digits(l.phone); const email = norm(l.email);
    for (const [kind, v] of [['mobile', phone.length >= 10 ? 'p:' + phone : ''], ['email', email ? 'e:' + email : '']]) {
      if (!v) continue;
      if (seen.has(v)) { union(l.id, seen.get(v)!); (why.get(find(l.id)) || why.set(find(l.id), new Set()).get(find(l.id))!).add(kind); } else seen.set(v, l.id);
    }
  }
  const groups = new Map<string, Lead[]>();
  leads.forEach(l => { const r = find(l.id); (groups.get(r) || groups.set(r, []).get(r)!).push(l); });
  const out: Group[] = [];
  groups.forEach((ls, root) => {
    if (ls.length < 2) return;
    const kinds = new Set<string>();
    ls.forEach(l => { const r = find(l.id); why.get(r)?.forEach(k => kinds.add(k)); });
    why.forEach((s, k) => { if (find(k) === root) s.forEach(x => kinds.add(x)); });
    out.push({ key: root, reason: `Same ${[...kinds].join(' and ') || 'mobile'}`, leads: ls });
  });
  return out.sort((a, b) => b.leads.length - a.leads.length);
}

/** The combined lead: the chosen one keeps its identity, the others add their conversations, follow-ups and visits. */
export function mergeLeadData(primary: Lead, others: Lead[]): Lead {
  const fill = <K extends keyof Lead>(k: K) => (primary[k] || others.map(o => o[k]).find(Boolean)) as Lead[K];
  const dates = [primary, ...others].map(l => l.leadDate).filter(Boolean).sort();
  return {
    ...primary,
    email: fill('email'), phone: fill('phone'), budget: fill('budget'), clientProfile: fill('clientProfile'), livingPlace: fill('livingPlace'),
    preferredLocation: fill('preferredLocation'), channelPartnerId: fill('channelPartnerId'),
    leadDate: dates[0] || primary.leadDate,
    initialInterest: Array.from(new Set([primary, ...others].flatMap(l => l.initialInterest || []))),
    messages: [...(primary.messages || []), ...others.flatMap(o => o.messages || [])],
    tasks: [...(primary.tasks || []), ...others.flatMap(o => (o.tasks || []).map(t => ({ ...t, leadId: primary.id })))],
    siteVisits: [...(primary.siteVisits || []), ...others.flatMap(o => (o.siteVisits || []).map(v => ({ ...v, leadId: primary.id })))],
    propertyImages: [...(primary.propertyImages || []), ...others.flatMap(o => o.propertyImages || [])],
    read: primary.read && others.every(o => o.read),
    customData: {
      ...Object.assign({}, ...others.map(o => o.customData || {})), ...(primary.customData || {}),
      mergedFrom: [...((primary.customData?.mergedFrom as any[]) || []), ...others.map(o => ({ id: o.id, name: o.name, at: new Date().toISOString() }))],
    },
  };
}

const AdminLeadMerge: React.FC<AdminLeadMergeProps> = ({ leads, users, onMergeLeads }) => {
  const groups = React.useMemo(() => findDuplicateGroups(leads || []), [leads]);
  const [open, setOpen] = React.useState<Group | null>(null);
  const [primaryId, setPrimaryId] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const owner = (l: Lead) => users.find(u => u.id === l.ownerId)?.name || 'Unassigned';
  const activity = (l: Lead) => (l.messages?.length || 0) + (l.tasks?.length || 0) + (l.siteVisits?.length || 0);
  const booked = (open?.leads || []).filter(l => !!l.bookingDetails);
  const blocked = booked.length > 1;

  const start = (g: Group) => {
    setOpen(g);
    const b = g.leads.find(l => l.bookingDetails);
    setPrimaryId((b || [...g.leads].sort((x, y) => activity(y) - activity(x))[0]).id);
  };

  const merge = async () => {
    if (!open || blocked) return;
    const primary = open.leads.find(l => l.id === primaryId)!;
    const others = open.leads.filter(l => l.id !== primaryId);
    setBusy(true);
    try {
      await onMergeLeads(mergeLeadData(primary, others), others.map(o => o.id));
      toast.success(`Merged ${others.length + 1} entries into ${primary.name}.`);
      setOpen(null);
    } catch (e: any) { toast.error(e?.message || 'Could not merge.'); }
    finally { setBusy(false); }
  };

  const primary = open?.leads.find(l => l.id === primaryId);
  const others = open?.leads.filter(l => l.id !== primaryId) || [];
  const lockedToBooked = booked.length === 1;

  return (
    <div className="p-4 bg-[var(--medium-bg)] rounded-lg shadow-md h-full flex flex-col gap-4 overflow-y-auto">
      <div>
        <h3 className="text-xl font-bold text-[var(--text-primary)]">Lead merge</h3>
        <p className="text-sm text-[var(--text-secondary)] mt-1">People who enquired more than once show up here (same mobile or email). Merging keeps one lead and brings the chats, follow-ups and visits of the others into it.</p>
      </div>

      {groups.length === 0 ? (
        <div className="text-center mt-8 text-[var(--text-secondary)]"><i className="fas fa-check-circle text-4xl opacity-40 mb-3" aria-hidden="true"></i><p>No duplicates found.</p></div>
      ) : (
        <ul className="space-y-3" aria-label="Duplicate groups">
          {groups.map(g => (
            <li key={g.key} className="border border-[var(--light-bg)] rounded-lg p-3 bg-[var(--dark-bg)]">
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary-color)]">{g.reason} · {g.leads.length} entries</span>
                <button type="button" onClick={() => start(g)} className="px-3 py-1.5 rounded-md bg-[var(--primary-color)] text-white text-sm font-medium hover:brightness-110">Review and merge</button>
              </div>
              <ul className="divide-y divide-[var(--light-bg)]">
                {g.leads.map(l => (
                  <li key={l.id} className="py-1.5 flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0"><b className="text-[var(--text-primary)]">{l.name}</b> <span className="text-[var(--text-secondary)]">· {l.leadProject} · {l.leadStatus}{l.bookingDetails ? ' · Booked' : ''}</span></span>
                    <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap">{owner(l)} · {l.leadDate}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      <Modal isOpen={!!open} onClose={() => setOpen(null)} size="lg" title="Merge leads" subtitle={open?.reason}
        onSubmit={(e) => { e.preventDefault(); merge(); }} submitLabel={`Merge ${open?.leads.length || 0} into one`} submitting={busy} submitDisabled={blocked}
        error={blocked ? 'More than one of these entries has a booking. Merge them by hand after sorting out the bookings.' : null}>
        <fieldset>
          <legend className="text-xs font-semibold text-[var(--text-secondary)] mb-2">Keep this lead{lockedToBooked ? ' (the booked one is kept)' : ''}</legend>
          <div className="space-y-2">
            {(open?.leads || []).map(l => (
              <label key={l.id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer ${primaryId === l.id ? 'border-[var(--primary-color)] bg-[color-mix(in_srgb,var(--primary-color)_12%,transparent)]' : 'border-[var(--border-color)]'} ${lockedToBooked && !l.bookingDetails ? 'opacity-60 cursor-not-allowed' : ''}`}>
                <input type="radio" name="keep" checked={primaryId === l.id} disabled={lockedToBooked && !l.bookingDetails} onChange={() => setPrimaryId(l.id)} className="mt-1 accent-[var(--primary-color)]" />
                <span className="text-sm min-w-0">
                  <b className="text-[var(--text-primary)]">{l.name}</b>
                  <span className="block text-xs text-[var(--text-secondary)]">{l.leadProject} · {l.leadStatus} · {owner(l)} · since {l.leadDate}</span>
                  <span className="block text-xs text-[var(--text-secondary)]">{l.messages?.length || 0} messages · {l.tasks?.length || 0} follow-ups · {l.siteVisits?.length || 0} visits</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        {primary && others.length > 0 && (
          <p className="text-sm text-[var(--text-secondary)]">
            <i className="fas fa-info-circle mr-1.5" aria-hidden="true"></i>
            {primary.name} will also get {others.reduce((n, o) => n + (o.messages?.length || 0), 0)} messages, {others.reduce((n, o) => n + (o.tasks?.length || 0), 0)} follow-ups and {others.reduce((n, o) => n + (o.siteVisits?.length || 0), 0)} visits, and any missing details. {others.length === 1 ? 'The other entry is' : 'The other entries are'} removed. This cannot be undone.
          </p>
        )}
      </Modal>
    </div>
  );
};

export default AdminLeadMerge;

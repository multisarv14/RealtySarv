import React from 'react';
import { Lead, User } from '../../types';
import { inputCls, Field, Button } from '../ui/Modal';
import { confirmDialog } from '../ui/Confirm';
import { toast } from '../ui/Toast';

interface AdminLeadTransferProps {
  leads: Lead[];
  users: User[];
  projects: string[];
  currentUserId?: string;
  onUpdateLeads: (updated: Lead[]) => void;
}

export interface TransferEntry { at: string; from: string; to: string; by?: string; reason?: string }

const STATUSES = ['New', 'Contacted', 'Qualified', 'Unqualified', 'Converted'];
const SHOWN = 150;

const AdminLeadTransfer: React.FC<AdminLeadTransferProps> = ({ leads, users, projects, currentUserId, onUpdateLeads }) => {
  const [from, setFrom] = React.useState('all');
  const [status, setStatus] = React.useState('all');
  const [project, setProject] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const [picked, setPicked] = React.useState<Set<string>>(new Set());
  const [to, setTo] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [movePending, setMovePending] = React.useState(true);
  const [busy, setBusy] = React.useState(false);

  const userName = (id: string) => users.find(u => u.id === id)?.name || 'Unassigned';
  const active = users.filter(u => u.isActive);

  const term = search.trim().toLowerCase();
  const filtered = React.useMemo(() => (leads || []).filter(l =>
    (from === 'all' || l.ownerId === from) && (status === 'all' || l.leadStatus === status) && (project === 'all' || l.leadProject === project) &&
    (!term || l.name.toLowerCase().includes(term))), [leads, from, status, project, term]);
  const shown = filtered.slice(0, SHOWN);
  const pickedInView = filtered.filter(l => picked.has(l.id)).length;

  const toggle = (id: string) => setPicked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allShownOn = shown.length > 0 && shown.every(l => picked.has(l.id));
  const toggleAll = () => setPicked(prev => { const n = new Set(prev); shown.forEach(l => (allShownOn ? n.delete(l.id) : n.add(l.id))); return n; });

  const history = React.useMemo(() => {
    const rows: { lead: Lead; e: TransferEntry }[] = [];
    (leads || []).forEach(l => ((l.customData?.transferHistory as TransferEntry[]) || []).forEach(e => rows.push({ lead: l, e })));
    return rows.sort((a, b) => b.e.at.localeCompare(a.e.at)).slice(0, 8);
  }, [leads]);

  const transfer = async () => {
    const chosen = (leads || []).filter(l => picked.has(l.id) && l.ownerId !== to);
    if (!to) { toast.error('Choose who receives the leads.'); return; }
    if (chosen.length === 0) { toast.error('Pick at least one lead that is not already with that person.'); return; }
    const ok = await confirmDialog({
      title: `Transfer ${chosen.length} lead${chosen.length > 1 ? 's' : ''} to ${userName(to)}?`,
      message: movePending ? 'Their open follow-ups move to the new owner too.' : 'Open follow-ups stay with the old owner.',
      confirmLabel: 'Transfer',
    });
    if (!ok) return;
    setBusy(true);
    const now = new Date().toISOString();
    const newName = userName(to);
    const chosenIds = new Set(chosen.map(l => l.id));
    const updated = (leads || []).map(l => {
      if (!chosenIds.has(l.id)) return l;
      const entry: TransferEntry = { at: now, from: l.ownerId, to, by: currentUserId, reason: reason.trim() || undefined };
      return {
        ...l, ownerId: to,
        tasks: movePending ? (l.tasks || []).map(t => (t.status === 'Pending' ? { ...t, assignedTo: newName } : t)) : l.tasks,
        customData: { ...(l.customData || {}), transferHistory: [...((l.customData?.transferHistory as TransferEntry[]) || []), entry] },
      };
    });
    try {
      await onUpdateLeads(updated);
      toast.success(`${chosen.length} lead${chosen.length > 1 ? 's' : ''} moved to ${newName}.`);
      setPicked(new Set()); setReason('');
    } catch (e: any) { toast.error(e?.message || 'Could not transfer.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="p-4 bg-[var(--medium-bg)] rounded-lg shadow-md h-full flex flex-col gap-4 overflow-y-auto">
      <div>
        <h3 className="text-xl font-bold text-[var(--text-primary)]">Lead transfer</h3>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Move leads from one salesperson to another, for example when someone goes on leave or leaves the company.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Field label="From" htmlFor="tr-from"><select id="tr-from" value={from} onChange={e => setFrom(e.target.value)} className={inputCls()}><option value="all">Everyone</option>{users.map(u => <option key={u.id} value={u.id}>{u.name}{u.isActive ? '' : ' (inactive)'}</option>)}</select></Field>
        <Field label="Status" htmlFor="tr-status"><select id="tr-status" value={status} onChange={e => setStatus(e.target.value)} className={inputCls()}><option value="all">Any status</option>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Project" htmlFor="tr-project"><select id="tr-project" value={project} onChange={e => setProject(e.target.value)} className={inputCls()}><option value="all">All projects</option>{projects.map(p => <option key={p}>{p}</option>)}</select></Field>
        <Field label="Search" htmlFor="tr-search"><input id="tr-search" type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Lead name" className={inputCls()} /></Field>
      </div>

      <div className="border border-[var(--light-bg)] rounded-lg overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-2 bg-[var(--dark-bg)] text-xs text-[var(--text-secondary)]">
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={allShownOn} onChange={toggleAll} className="h-4 w-4 accent-[var(--primary-color)]" aria-label="Select all shown" />Select all shown</label>
          <span>{filtered.length} lead{filtered.length === 1 ? '' : 's'}{filtered.length > SHOWN ? ` (showing ${SHOWN})` : ''} · <b className="text-[var(--text-primary)]">{picked.size}</b> selected{pickedInView !== picked.size ? ` (${pickedInView} in this view)` : ''}</span>
        </div>
        <ul className="divide-y divide-[var(--light-bg)] max-h-[22rem] overflow-y-auto">
          {shown.length === 0 && <li className="px-4 py-6 text-center text-sm text-[var(--text-secondary)]">No leads match.</li>}
          {shown.map(l => (
            <li key={l.id}>
              <label className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-[var(--dark-bg)]">
                <input type="checkbox" checked={picked.has(l.id)} onChange={() => toggle(l.id)} className="h-4 w-4 accent-[var(--primary-color)]" aria-label={`Select ${l.name}`} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-[var(--text-primary)] truncate">{l.name}</span>
                  <span className="block text-xs text-[var(--text-secondary)] truncate">{l.leadProject} · {l.leadStatus}</span>
                </span>
                <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap">{userName(l.ownerId)}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] gap-3 items-end">
        <Field label="Transfer to" htmlFor="tr-to" required><select id="tr-to" value={to} onChange={e => setTo(e.target.value)} className={inputCls()}><option value="">Choose a person</option>{active.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></Field>
        <Field label="Reason" htmlFor="tr-reason" hint="Optional, kept in the history."><input id="tr-reason" value={reason} onChange={e => setReason(e.target.value)} className={inputCls()} /></Field>
        <Button type="button" onClick={transfer} disabled={busy || picked.size === 0 || !to}><i className="fas fa-exchange-alt" aria-hidden="true"></i>Transfer {picked.size || ''}</Button>
      </div>
      <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer w-fit">
        <input type="checkbox" checked={movePending} onChange={e => setMovePending(e.target.checked)} className="h-4 w-4 accent-[var(--primary-color)]" />Move open follow-ups to the new owner too
      </label>

      <section aria-label="Recent transfers">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2 pb-1.5 border-b border-[var(--border-color)]">Recent transfers</h4>
        {history.length === 0 ? <p className="text-sm text-[var(--text-secondary)]">Nothing transferred yet.</p> : (
          <ul className="space-y-1.5 text-sm">
            {history.map(({ lead, e }, i) => (
              <li key={lead.id + i} className="text-[var(--text-secondary)]">
                <b className="text-[var(--text-primary)]">{lead.name}</b>: {userName(e.from)} → {userName(e.to)} · {new Date(e.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}{e.reason ? ` · ${e.reason}` : ''}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default AdminLeadTransfer;

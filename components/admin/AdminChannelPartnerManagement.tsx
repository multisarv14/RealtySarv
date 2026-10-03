import React from 'react';
import { ChannelPartner, Lead, NewChannelPartnerData } from '../../types';
import NewChannelPartnerModal from './NewChannelPartnerModal';
import { inputCls } from '../ui/Modal';
import { confirmDialog } from '../ui/Confirm';
import { toast } from '../ui/Toast';
import { SHOW_DELETE } from '../../features';

interface AdminChannelPartnerManagementProps {
  partners: ChannelPartner[];
  leads: Lead[];
  onAddPartner: (data: NewChannelPartnerData) => void;
  onUpdatePartners: (updated: ChannelPartner[]) => void;
}

type Status = ChannelPartner['status'];
const STATUS_STYLE: Record<Status, string> = {
  Active: 'bg-green-500/10 text-green-500 border-green-500/30',
  Inactive: 'bg-red-500/10 text-red-500 border-red-500/30',
  Pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
};
const COLS = 'lg:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1.3fr)_100px_120px]';

const formatInr = (n: number) => n >= 1e7 ? `₹${(n / 1e7).toFixed(2)} Cr` : n >= 1e5 ? `₹${(n / 1e5).toFixed(2)} L` : `₹${Math.round(n).toLocaleString('en-IN')}`;
const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?';

const AdminChannelPartnerManagement: React.FC<AdminChannelPartnerManagementProps> = ({ partners, leads, onAddPartner, onUpdatePartners }) => {
  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState<'All' | Status>('All');
  const [showNew, setShowNew] = React.useState(false);
  const [editing, setEditing] = React.useState<ChannelPartner | null>(null);

  const safePartners = React.useMemo(() => partners || [], [partners]);

  // Performance comes from the leads credited to each partner, so it is always current.
  const perf = React.useMemo(() => {
    const map = new Map<string, { leads: number; bookings: number; value: number }>();
    for (const l of leads || []) {
      if (!l.channelPartnerId) continue;
      const m = map.get(l.channelPartnerId) || { leads: 0, bookings: 0, value: 0 };
      m.leads += 1;
      if (l.bookingDetails) { m.bookings += 1; m.value += l.bookingDetails.priceBreakup?.totalConsideration || 0; }
      map.set(l.channelPartnerId, m);
    }
    return map;
  }, [leads]);
  const statsOf = (id: string) => perf.get(id) || { leads: 0, bookings: 0, value: 0 };

  const counts = { All: safePartners.length, Active: 0, Pending: 0, Inactive: 0 } as Record<'All' | Status, number>;
  safePartners.forEach(p => { counts[p.status] += 1; });
  const totals = safePartners.reduce((a, p) => { const s = statsOf(p.id); return { leads: a.leads + s.leads, bookings: a.bookings + s.bookings, due: a.due + (s.value * p.commissionRate) / 100 }; }, { leads: 0, bookings: 0, due: 0 });

  const term = search.trim().toLowerCase();
  const visible = safePartners.filter(p =>
    (filter === 'All' || p.status === filter) &&
    (!term || [p.firmName, p.contactPerson, p.reraNumber, p.email].some(v => (v || '').toLowerCase().includes(term))));

  const setStatus = (p: ChannelPartner, status: Status, message: string) => {
    onUpdatePartners(safePartners.map(x => x.id === p.id ? { ...x, status } : x));
    toast.success(message);
  };
  const toggle = async (p: ChannelPartner) => {
    if (p.status === 'Pending') return setStatus(p, 'Active', `${p.firmName} approved.`);
    if (p.status === 'Active') {
      const ok = await confirmDialog({ title: `Deactivate ${p.firmName}?`, message: 'They will not be offered when adding a lead. Existing leads keep their credit.', confirmLabel: 'Deactivate', danger: true });
      if (!ok) return;
      return setStatus(p, 'Inactive', `${p.firmName} deactivated.`);
    }
    setStatus(p, 'Active', `${p.firmName} activated.`);
  };
  const remove = async (p: ChannelPartner) => {
    const n = statsOf(p.id).leads;
    const ok = await confirmDialog({ title: `Remove ${p.firmName}?`, message: n ? `${n} lead${n > 1 ? 's are' : ' is'} credited to them. The leads stay, but lose the partner credit. This cannot be undone.` : 'This cannot be undone.', confirmLabel: 'Remove', danger: true });
    if (ok) onUpdatePartners(safePartners.filter(x => x.id !== p.id));
  };

  const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="bg-[var(--dark-bg)] border border-[var(--light-bg)] rounded-lg px-4 py-3">
      <p className="text-[11px] uppercase tracking-wider text-[var(--text-secondary)]">{label}</p>
      <p className="text-xl font-bold text-[var(--text-primary)]">{value}</p>
    </div>
  );
  const Pill: React.FC<{ k: 'All' | Status }> = ({ k }) => (
    <button type="button" onClick={() => setFilter(k)} aria-pressed={filter === k}
      className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${filter === k ? 'bg-[var(--primary-color)] border-[var(--primary-color)] text-white' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
      {k} <span className="opacity-80">{counts[k]}</span>
    </button>
  );
  const IconBtn: React.FC<{ label: string; icon: string; onClick: () => void; tone?: 'danger' | 'ok' | 'warn' }> = ({ label, icon, onClick, tone }) => (
    <button type="button" onClick={onClick} title={label} aria-label={label}
      className={`w-8 h-8 rounded-md flex items-center justify-center text-sm border border-[var(--border-color)] transition-colors hover:bg-[var(--light-bg)] ${tone === 'danger' ? 'text-red-400' : tone === 'ok' ? 'text-green-500' : tone === 'warn' ? 'text-yellow-500' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
      <i className={`fas ${icon}`} aria-hidden="true"></i>
    </button>
  );

  return (
    <div className="p-4 bg-[var(--medium-bg)] rounded-lg shadow-md h-full flex flex-col gap-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h3 className="text-xl font-bold text-[var(--text-primary)]">Partners</h3>
        <button onClick={() => setShowNew(true)} className="px-4 py-2 rounded-md bg-[var(--primary-color)] text-white font-medium hover:brightness-110 transition flex items-center gap-2">
          <i className="fas fa-handshake" aria-hidden="true"></i> Register partner
        </button>
      </div>

      {safePartners.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="Active partners" value={String(counts.Active)} />
          <Stat label="Leads sourced" value={totals.leads.toLocaleString('en-IN')} />
          <Stat label="Bookings" value={totals.bookings.toLocaleString('en-IN')} />
          <Stat label="Est. commission" value={formatInr(totals.due)} />
        </div>
      )}
      {counts.Pending > 0 && (
        <button type="button" onClick={() => setFilter('Pending')} className="text-left text-sm px-3 py-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 text-yellow-500">
          <i className="fas fa-user-clock mr-2" aria-hidden="true"></i>{counts.Pending} partner{counts.Pending > 1 ? 's are' : ' is'} waiting for approval. Check the RERA number, then approve.
        </button>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {(['All', 'Active', 'Pending', 'Inactive'] as const).map(k => <Pill key={k} k={k} />)}
      </div>
      <div className="relative">
        <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] text-sm" aria-hidden="true"></i>
        <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search firm, contact, email or RERA…" aria-label="Search partners" className={`${inputCls()} pl-9`} />
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {safePartners.length === 0 ? (
          <div className="text-center mt-10 text-[var(--text-secondary)]">
            <i className="fas fa-handshake text-4xl opacity-40 mb-3" aria-hidden="true"></i>
            <p>No partners yet. Register a broker to credit leads to them.</p>
          </div>
        ) : visible.length === 0 ? (
          <p className="text-center mt-8 text-[var(--text-secondary)]">No partner matches.</p>
        ) : (
          <div className="border border-[var(--light-bg)] rounded-lg overflow-hidden">
            <div className={`hidden lg:grid ${COLS} gap-4 px-4 py-2 bg-[var(--dark-bg)] text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]`}>
              <span>Partner</span><span>Performance</span><span>Commission</span><span>Status</span><span className="text-right">Actions</span>
            </div>
            <ul className="divide-y divide-[var(--light-bg)]">
              {visible.map(p => {
                const s = statsOf(p.id);
                const rate = s.leads ? Math.round((s.bookings / s.leads) * 100) : 0;
                return (
                  <li key={p.id} className={`grid grid-cols-1 ${COLS} gap-x-4 gap-y-2 items-center px-4 py-3 hover:bg-[var(--dark-bg)] transition-colors ${p.status === 'Inactive' ? 'opacity-70' : ''}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-9 h-9 rounded-full bg-[color-mix(in_srgb,var(--primary-color)_18%,transparent)] text-[var(--primary-color)] text-xs font-bold flex items-center justify-center flex-shrink-0" aria-hidden="true">{initials(p.firmName)}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{p.firmName}</p>
                        <p className="text-xs text-[var(--text-secondary)] truncate">{p.contactPerson} · RERA {p.reraNumber}</p>
                      </div>
                    </div>
                    <div className="text-sm">
                      <p className="text-[var(--text-primary)]"><b>{s.leads}</b> lead{s.leads === 1 ? '' : 's'} · <b>{s.bookings}</b> booking{s.bookings === 1 ? '' : 's'}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{s.leads ? `${rate}% converted` : 'No leads yet'}</p>
                    </div>
                    <div className="text-sm">
                      <p className="text-[var(--text-primary)] font-semibold">{p.commissionRate}%</p>
                      <p className="text-xs text-[var(--text-secondary)]">{s.value ? `${formatInr((s.value * p.commissionRate) / 100)} est. on bookings` : 'Nothing due yet'}</p>
                    </div>
                    <div><span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${STATUS_STYLE[p.status]}`}>{p.status}</span></div>
                    <div className="flex gap-1.5 lg:justify-end">
                      <IconBtn label={`Edit ${p.firmName}`} icon="fa-pen" onClick={() => setEditing(p)} />
                      <IconBtn label={p.status === 'Pending' ? `Approve ${p.firmName}` : p.status === 'Active' ? `Deactivate ${p.firmName}` : `Activate ${p.firmName}`} icon={p.status === 'Active' ? 'fa-user-slash' : 'fa-user-check'} tone={p.status === 'Active' ? 'warn' : 'ok'} onClick={() => toggle(p)} />
                      {SHOW_DELETE && <IconBtn label={`Remove ${p.firmName}`} icon="fa-trash" tone="danger" onClick={() => remove(p)} />}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      <NewChannelPartnerModal
        isOpen={showNew || !!editing}
        onClose={() => { setShowNew(false); setEditing(null); }}
        onAdd={onAddPartner}
        initial={editing}
        existing={safePartners}
        onSave={(data) => { if (editing) { onUpdatePartners(safePartners.map(x => x.id === editing.id ? { ...x, ...data } : x)); toast.success('Partner saved.'); } }}
      />
    </div>
  );
};

export default AdminChannelPartnerManagement;

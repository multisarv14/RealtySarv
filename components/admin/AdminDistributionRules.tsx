import React from 'react';
import { DistributionRule, Lead, Project, Source, User } from '../../types';
import { Modal, Field, Chips, inputCls } from '../ui/Modal';
import { eligibleAssignees, matchRule, pickAssignee, sortRules } from '../../distribution';
import { toast } from '../ui/Toast';

interface AdminDistributionRulesProps {
  rules: DistributionRule[];
  users: User[];
  projects: Project[];
  sources: Source[];
  leads: Lead[];
  onSaveRule: (rule: DistributionRule) => Promise<unknown> | void;
}

const blank = (position: number): DistributionRule => ({ id: '', name: '', enabled: true, mode: 'Round robin', projects: [], sources: [], assignees: [], position });

const AdminDistributionRules: React.FC<AdminDistributionRulesProps> = ({ rules, users, projects, sources, leads, onSaveRule }) => {
  const sorted = React.useMemo(() => sortRules(rules || []), [rules]);
  const [editing, setEditing] = React.useState<DistributionRule | null>(null);
  const [submitted, setSubmitted] = React.useState(false);
  const [tryProject, setTryProject] = React.useState('');
  const [trySource, setTrySource] = React.useState('');

  const sourceNames = React.useMemo(() => Array.from(new Set((sources || []).map(s => s.name))), [sources]);
  const projectNames = projects.map(p => p.name);
  const nameOf = (id: string) => users.find(u => u.id === id)?.name || 'Unknown';

  const open = (r: DistributionRule) => { setEditing(r); setSubmitted(false); };
  const save = async (r: DistributionRule) => { try { await onSaveRule(r); } catch (e: any) { toast.error(e?.message || 'Could not save.'); } };

  const move = async (r: DistributionRule, dir: -1 | 1) => {
    const i = sorted.findIndex(x => x.id === r.id); const j = i + dir;
    if (j < 0 || j >= sorted.length) return;
    // Write positions for the whole list so the order is explicit.
    const next = [...sorted]; [next[i], next[j]] = [next[j], next[i]];
    await Promise.all(next.map((x, k) => (x.position === k + 1 ? null : save({ ...x, position: k + 1 }))));
  };

  const errors = editing ? {
    name: editing.name.trim() ? '' : 'Give the rule a name.',
    assignees: editing.assignees.length ? '' : 'Pick at least one person.',
  } : { name: '', assignees: '' };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitted(true);
    if (!editing || errors.name || errors.assignees) return;
    await save({ ...editing, id: editing.id || `dr-${Date.now().toString(36)}`, name: editing.name.trim() });
    toast.success('Rule saved.'); setEditing(null);
  };

  const toggleIn = (list: string[], v: string) => (list.includes(v) ? list.filter(x => x !== v) : [...list, v]);

  // "Try it": what would happen to a lead like this? (does not move round-robin pointers)
  const preview = React.useMemo(() => {
    if (!tryProject && !trySource) return null;
    const rule = matchRule(rules || [], { project: tryProject, source: trySource }, users);
    if (!rule) return 'No enabled rule matches. The lead goes to the person who adds it.';
    const { user } = pickAssignee(rule, users, leads);
    return `"${rule.name}" matches. Next lead goes to ${user.name}.`;
  }, [rules, users, leads, tryProject, trySource]);

  return (
    <div className="p-4 bg-[var(--medium-bg)] rounded-lg shadow-md h-full flex flex-col gap-4 overflow-y-auto">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h3 className="text-xl font-bold text-[var(--text-primary)]">Distribution rules</h3>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Decide who gets a new lead. Rules are checked from the top; the first one that fits is used. If none fits, the lead goes to the person who adds it.</p>
        </div>
        <button onClick={() => open(blank(sorted.length + 1))} className="px-4 py-2 rounded-md bg-[var(--primary-color)] text-white font-medium hover:brightness-110 flex items-center gap-2"><i className="fas fa-plus" aria-hidden="true"></i> Add rule</button>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center mt-8 text-[var(--text-secondary)]"><i className="fas fa-share-alt text-4xl opacity-40 mb-3" aria-hidden="true"></i><p>No rules yet. New leads go to whoever adds them.</p></div>
      ) : (
        <ol className="space-y-3" aria-label="Rules in order">
          {sorted.map((r, i) => {
            const people = eligibleAssignees(r, users);
            return (
              <li key={r.id} className={`border border-[var(--light-bg)] rounded-lg p-3 bg-[var(--dark-bg)] ${r.enabled ? '' : 'opacity-70'}`}>
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-[var(--light-bg)] text-[var(--text-secondary)] text-xs font-bold flex items-center justify-center flex-shrink-0" aria-hidden="true">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[var(--text-primary)]">{r.name}</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      {r.mode === 'Round robin' ? 'Takes turns' : 'Fewest open leads first'} · {r.projects.length ? r.projects.join(', ') : 'Any project'} · {r.sources.length ? r.sources.join(', ') : 'Any source'}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">To: {people.length ? people.map(u => u.name).join(', ') : <span className="text-yellow-500">nobody active, so this rule is skipped</span>}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button type="button" role="switch" aria-checked={r.enabled} aria-label={`${r.enabled ? 'Turn off' : 'Turn on'} ${r.name}`} onClick={() => save({ ...r, enabled: !r.enabled })}
                      className={`w-10 h-6 rounded-full transition-colors relative ${r.enabled ? 'bg-[var(--primary-color)]' : 'bg-[var(--light-bg)]'}`}>
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${r.enabled ? 'left-[1.15rem]' : 'left-0.5'}`}></span>
                    </button>
                    <button type="button" aria-label={`Move ${r.name} up`} disabled={i === 0} onClick={() => move(r, -1)} className="w-8 h-8 rounded-md border border-[var(--border-color)] text-[var(--text-secondary)] disabled:opacity-30"><i className="fas fa-arrow-up text-xs" aria-hidden="true"></i></button>
                    <button type="button" aria-label={`Move ${r.name} down`} disabled={i === sorted.length - 1} onClick={() => move(r, 1)} className="w-8 h-8 rounded-md border border-[var(--border-color)] text-[var(--text-secondary)] disabled:opacity-30"><i className="fas fa-arrow-down text-xs" aria-hidden="true"></i></button>
                    <button type="button" aria-label={`Edit ${r.name}`} onClick={() => open(r)} className="w-8 h-8 rounded-md border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><i className="fas fa-pen text-xs" aria-hidden="true"></i></button>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <section aria-label="Try a rule" className="border border-[var(--light-bg)] rounded-lg p-3">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Try it</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="A lead for project" htmlFor="try-project"><select id="try-project" value={tryProject} onChange={e => setTryProject(e.target.value)} className={inputCls()}><option value="">Any</option>{projectNames.map(p => <option key={p}>{p}</option>)}</select></Field>
          <Field label="from source" htmlFor="try-source"><select id="try-source" value={trySource} onChange={e => setTrySource(e.target.value)} className={inputCls()}><option value="">Any</option>{sourceNames.map(p => <option key={p}>{p}</option>)}</select></Field>
        </div>
        {preview && <p className="mt-3 text-sm text-[var(--text-primary)]" role="status"><i className="fas fa-arrow-right mr-2 text-[var(--primary-color)]" aria-hidden="true"></i>{preview}</p>}
      </section>

      <Modal isOpen={!!editing} onClose={() => setEditing(null)} size="lg" title={editing?.id ? 'Edit rule' : 'Add rule'} onSubmit={submit} submitLabel="Save rule">
        {editing && (
          <>
            <Field label="Name" htmlFor="dr-name" required error={submitted ? errors.name : null}><input id="dr-name" value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="e.g. Portal enquiries" className={inputCls(submitted && !!errors.name)} /></Field>
            <Field label="How to choose" htmlFor="dr-mode" hint={editing.mode === 'Round robin' ? 'Each new lead goes to the next person in the list.' : 'Each new lead goes to the person with the fewest open leads.'}><Chips label="How to choose" options={['Round robin', 'Least loaded']} value={editing.mode} onChange={(v: DistributionRule['mode']) => setEditing({ ...editing, mode: v })} /></Field>
            <Field label="Projects" htmlFor="dr-projects" hint="Leave empty for any project."><Chips label="Projects" multiple options={projectNames} value={editing.projects} onChange={(v: string[]) => setEditing({ ...editing, projects: v })} /></Field>
            <Field label="Sources" htmlFor="dr-sources" hint="Leave empty for any source."><Chips label="Sources" multiple options={sourceNames} value={editing.sources} onChange={(v: string[]) => setEditing({ ...editing, sources: v })} /></Field>
            <Field label="Give leads to" htmlFor="dr-people" required error={submitted ? errors.assignees : null}>
              <ul className="space-y-1.5" id="dr-people">
                {users.filter(u => u.isActive || editing.assignees.includes(u.id)).map(u => (
                  <li key={u.id}><label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={editing.assignees.includes(u.id)} onChange={() => setEditing({ ...editing, assignees: toggleIn(editing.assignees, u.id) })} className="h-4 w-4 accent-[var(--primary-color)]" />{u.name}<span className="text-xs text-[var(--text-secondary)]">{u.role}{u.isActive ? '' : ' · inactive'}</span></label></li>
                ))}
              </ul>
            </Field>
            <label className="flex items-center gap-2 text-sm cursor-pointer w-fit"><input type="checkbox" checked={editing.enabled} onChange={e => setEditing({ ...editing, enabled: e.target.checked })} className="h-4 w-4 accent-[var(--primary-color)]" />Rule is on</label>
          </>
        )}
      </Modal>
    </div>
  );
};

export default AdminDistributionRules;

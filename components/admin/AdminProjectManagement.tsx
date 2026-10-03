
import React from 'react';
import { Project, NewProjectData, ProjectStatus, PaymentPlan } from '../../types';
import NewProjectModal from './NewProjectModal';
import ProjectInventory from './ProjectInventory';
import { inputCls } from '../ui/Modal';

interface AdminProjectManagementProps {
  projects: Project[];
  paymentPlans: PaymentPlan[];
  onUpdateProjects: (updatedProjects: Project[]) => void;
  onAddProject: (projectData: NewProjectData) => void;
  onDeleteProject: (projectId: string) => void;
}

const AdminProjectManagement: React.FC<AdminProjectManagementProps> = ({
  projects,
  paymentPlans,
  onUpdateProjects,
  onAddProject,
  onDeleteProject,
}) => {
  const [showNewProjectModal, setShowNewProjectModal] = React.useState(false);
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(null);
  const [view, setView] = React.useState<'list' | 'cards'>(() => { try { return (localStorage.getItem('adminProjectsView') as 'list' | 'cards') || 'list'; } catch { return 'list'; } });
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<ProjectStatus | 'All'>('All');
  const changeView = (v: 'list' | 'cards') => { setView(v); try { localStorage.setItem('adminProjectsView', v); } catch { /* ignore */ } };

  const selectedProject = React.useMemo(() => {
    const safeProjects = projects || [];
    return safeProjects.find(p => p.id === selectedProjectId);
  }, [projects, selectedProjectId]);
  
  const handleUpdateProject = (updatedProject: Project) => {
    const safeProjects = projects || [];
    const updatedProjects = safeProjects.map(p => p.id === updatedProject.id ? updatedProject : p);
    onUpdateProjects(updatedProjects);
  };

  const getStatusColorClass = (status: ProjectStatus) => {
    switch (status) {
      case 'Pre-launch':
        return 'bg-blue-600';
      case 'Under Construction':
        return 'bg-yellow-600';
      case 'Ready to Move':
        return 'bg-green-600';
      default:
        return 'bg-gray-600';
    }
  };

  if (selectedProject) {
    return (
      <ProjectInventory 
        project={selectedProject} 
        paymentPlans={paymentPlans || []}
        onUpdateProject={handleUpdateProject} 
        onDeleteProject={onDeleteProject}
        onBack={() => setSelectedProjectId(null)} 
      />
    );
  }

  const safeProjects = projects || [];

  const unitStats = (p: Project) => {
    const inv = p.inventory || [];
    const by = (st: string) => inv.filter(u => u.status === st).length;
    const sold = by('Sold') + by('Booked');
    return { total: inv.length, available: by('Available'), hold: by('On Hold'), sold };
  };
  const totals = safeProjects.reduce((a, p) => { const u = unitStats(p); return { units: a.units + u.total, available: a.available + u.available, sold: a.sold + u.sold }; }, { units: 0, available: 0, sold: 0 });

  const term = search.trim().toLowerCase();
  const visible = safeProjects.filter(p =>
    (statusFilter === 'All' || p.projectStatus === statusFilter) &&
    (!term || [p.name, p.location, p.companyName, p.reraNumber].some(v => (v || '').toLowerCase().includes(term))));

  const Progress: React.FC<{ p: Project }> = ({ p }) => {
    const u = unitStats(p);
    const pct = u.total ? Math.round((u.sold / u.total) * 100) : 0;
    return (
      <div className="min-w-0">
        <div className="flex justify-between text-[11px] text-[var(--text-secondary)] mb-1">
          <span><b className="text-[var(--text-primary)]">{u.sold}</b> sold/booked</span>
          <span><b className="text-[var(--text-primary)]">{u.available}</b> available</span>
        </div>
        <div className="h-1.5 rounded-full bg-[var(--light-bg)] overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${p.name} ${pct}% sold`}>
          <div className="h-full bg-[var(--primary-color)]" style={{ width: `${pct}%` }}></div>
        </div>
        <p className="text-[11px] text-[var(--text-secondary)] mt-1">{u.total} units · {pct}% sold</p>
      </div>
    );
  };

  const Chip: React.FC<{ p: Project }> = ({ p }) => (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold text-white whitespace-nowrap ${getStatusColorClass(p.projectStatus)}`}>{p.projectStatus}</span>
  );

  const Stat: React.FC<{ label: string; value: number }> = ({ label, value }) => (
    <div className="bg-[var(--dark-bg)] border border-[var(--light-bg)] rounded-lg px-4 py-3">
      <p className="text-[11px] uppercase tracking-wider text-[var(--text-secondary)]">{label}</p>
      <p className="text-xl font-bold text-[var(--text-primary)]">{value.toLocaleString('en-IN')}</p>
    </div>
  );

  return (
    <div className="p-4 bg-[var(--medium-bg)] rounded-lg shadow-md h-full flex flex-col gap-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h3 className="text-xl font-bold text-[var(--text-primary)]">Projects</h3>
        <button
          onClick={() => setShowNewProjectModal(true)}
          className="px-4 py-2 rounded-md bg-[var(--primary-color)] text-white font-medium hover:brightness-110 transition flex items-center gap-2"
        >
          <i className="fas fa-plus-circle" aria-hidden="true"></i> Register new project
        </button>
      </div>

      {safeProjects.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Projects" value={safeProjects.length} />
          <Stat label="Total units" value={totals.units} />
          <Stat label="Available" value={totals.available} />
          <Stat label="Sold / booked" value={totals.sold} />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] text-sm" aria-hidden="true"></i>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, location, RERA…" aria-label="Search projects" className={`${inputCls()} pl-9`} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as ProjectStatus | 'All')} aria-label="Filter by status" className={`${inputCls()} !w-auto`}>
          <option value="All">All statuses</option>
          <option>Pre-launch</option><option>Under Construction</option><option>Ready to Move</option>
        </select>
        <div className="flex rounded-lg border border-[var(--border-color)] overflow-hidden" role="group" aria-label="View">
          {(['list', 'cards'] as const).map(v => (
            <button key={v} type="button" onClick={() => changeView(v)} aria-pressed={view === v} title={v === 'list' ? 'List view' : 'Card view'}
              className={`h-10 w-10 text-sm ${view === v ? 'bg-[var(--primary-color)] text-white' : 'bg-[var(--dark-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
              <i className={`fas ${v === 'list' ? 'fa-list' : 'fa-th-large'}`} aria-hidden="true"></i><span className="sr-only">{v}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {safeProjects.length === 0 ? (
          <div className="text-center mt-10 text-[var(--text-secondary)]">
            <i className="fas fa-building text-4xl opacity-40 mb-3" aria-hidden="true"></i>
            <p>No projects registered yet.</p>
          </div>
        ) : visible.length === 0 ? (
          <p className="text-[var(--text-secondary)] text-center mt-8">No project matches your search.</p>
        ) : view === 'list' ? (
          <div className="border border-[var(--light-bg)] rounded-lg overflow-hidden">
            <div className="hidden lg:grid grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_140px_minmax(0,1.6fr)_80px] gap-4 px-4 py-2 bg-[var(--dark-bg)] text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              <span>Project</span><span>Location</span><span>Status</span><span>Inventory</span><span></span>
            </div>
            <ul className="divide-y divide-[var(--light-bg)]">
              {visible.map(p => (
                <li key={p.id}>
                  <div role="button" tabIndex={0} onClick={() => setSelectedProjectId(p.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedProjectId(p.id); } }}
                    aria-label={`Open ${p.name}`}
                    className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_140px_minmax(0,1.6fr)_80px] gap-x-4 gap-y-2 items-center px-4 py-3 cursor-pointer hover:bg-[var(--dark-bg)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-color)] transition-colors">
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--text-primary)] truncate">{p.name}</p>
                      <p className="text-xs text-[var(--text-secondary)] truncate">{[p.companyName, p.projectType, p.reraNumber && `RERA ${p.reraNumber}`].filter(Boolean).join(' · ')}</p>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] truncate"><i className="fas fa-map-marker-alt mr-1.5 opacity-70" aria-hidden="true"></i>{p.location}{p.totalFloors ? ` · ${p.totalFloors} floors` : ''}{(p.wings || []).length ? ` · ${(p.wings || []).length} wing${(p.wings || []).length > 1 ? 's' : ''}` : ''}</p>
                    <div><Chip p={p} /></div>
                    <Progress p={p} />
                    <span className="text-sm font-medium text-[var(--primary-color)] lg:text-right">Manage <i className="fas fa-chevron-right text-[10px]" aria-hidden="true"></i></span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {visible.map(p => (
              <div key={p.id} className="bg-[var(--dark-bg)] p-4 rounded-lg border border-[var(--light-bg)] flex flex-col gap-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <h4 className="text-lg font-bold text-[var(--text-primary)] truncate">{p.name}</h4>
                    <p className="text-sm text-[var(--text-secondary)] truncate"><i className="fas fa-map-marker-alt mr-1.5" aria-hidden="true"></i>{p.location}</p>
                  </div>
                  <Chip p={p} />
                </div>
                <Progress p={p} />
                <button onClick={() => setSelectedProjectId(p.id)} className="mt-auto w-full py-2 rounded-md bg-[var(--primary-color)] text-white font-medium hover:brightness-110 transition text-sm">Manage inventory</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <NewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        onAddProject={onAddProject}
      />
    </div>
  );
};

export default AdminProjectManagement;

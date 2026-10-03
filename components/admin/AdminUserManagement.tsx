
import React from 'react';
import { User, UserRole, NewUserData, Project } from '../../types';
import NewUserModal from './NewUserModal';
import EditUserModal from './EditUserModal';
import AssignProjectModal from './AssignProjectModal';
import { inputCls } from '../ui/Modal';
import { confirmDialog } from '../ui/Confirm';
import { toast } from '../ui/Toast';

interface AdminUserManagementProps {
  users: User[];
  onUpdateUsers: (updatedUsers: User[]) => void;
  onAddUser: (userData: NewUserData) => void;
  onUpdateUser: (updatedUser: User) => void;
  projects: Project[];
  currentUserId?: string;
}

const AdminUserManagement: React.FC<AdminUserManagementProps> = ({ users, onUpdateUsers, onAddUser, onUpdateUser, projects, currentUserId }) => {
  const [showNewUserModal, setShowNewUserModal] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<User | null>(null);
  const [showAssignProjectModal, setShowAssignProjectModal] = React.useState(false);
  const [selectedUserForProjects, setSelectedUserForProjects] = React.useState<User | null>(null);
  
  // Filter states
  const [filterRole, setFilterRole] = React.useState<UserRole | 'All'>('All');
  const [filterStatus, setFilterStatus] = React.useState<'All' | 'Active' | 'Inactive'>('All');
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredUsers = React.useMemo(() => {
    const safeUsers = users || [];
    return safeUsers.filter(user => {
      const matchesRole = filterRole === 'All' || user.role === filterRole;
      const matchesStatus = filterStatus === 'All' || (filterStatus === 'Active' ? user.isActive : !user.isActive);
      const matchesSearch = searchTerm === '' || 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesRole && matchesStatus && matchesSearch;
    });
  }, [users, filterRole, filterStatus, searchTerm]);

  const activeAdmins = (users || []).filter(u => u.role === 'Admin' && u.isActive).length;

  const toggleUserActiveStatus = async (user: User) => {
    if (user.isActive) {
      if (user.id === currentUserId) { toast.error('You cannot deactivate your own account.'); return; }
      if (user.role === 'Admin' && activeAdmins <= 1) { toast.error('The company needs at least one active Admin.'); return; }
      const ok = await confirmDialog({ title: `Deactivate ${user.name}?`, message: 'They will no longer be able to sign in. Their leads and history stay. You can activate them again later.', confirmLabel: 'Deactivate', danger: true });
      if (!ok) return;
    }
    await onUpdateUser({ ...user, isActive: !user.isActive });
    toast.success(user.isActive ? `${user.name} deactivated.` : `${user.name} activated.`);
  };

  const handleOpenAssignModal = (user: User) => {
    setSelectedUserForProjects(user);
    setShowAssignProjectModal(true);
  };
  
  const handleAssignProjects = (userId: string, projectIds: string[]) => {
    const safeUsers = users || [];
    const userToUpdate = safeUsers.find(u => u.id === userId);
    if (userToUpdate) {
        onUpdateUser({ ...userToUpdate, assignedProjectIds: projectIds });
    }
  };

  const handleSaveUser = (updatedUser: User) => {
    onUpdateUser(updatedUser);
    setEditingUser(null);
  };

  const counts = React.useMemo(() => {
    const all = users || [];
    return { all: all.length, active: all.filter(u => u.isActive).length, inactive: all.filter(u => !u.isActive).length,
      Admin: all.filter(u => u.role === 'Admin').length, Sales: all.filter(u => u.role === 'Sales').length, User: all.filter(u => u.role === 'User').length };
  }, [users]);

  const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?';
  const ROLE_STYLE: Record<string, string> = { Admin: 'bg-purple-500/15 text-purple-400', Sales: 'bg-blue-500/15 text-blue-400', User: 'bg-gray-500/20 text-[var(--text-secondary)]' };

  const ProjectChips: React.FC<{ user: User }> = ({ user }) => {
    const names = (user.assignedProjectIds || []).map(pid => (projects || []).find(p => p.id === pid)?.name).filter(Boolean) as string[];
    if (names.length === 0) return <span className="text-xs italic text-[var(--text-secondary)]">None assigned</span>;
    return (
      <div className="flex flex-wrap gap-1" title={names.join(', ')}>
        {names.slice(0, 2).map(n => <span key={n} className="bg-[var(--light-bg)] text-[var(--text-secondary)] text-xs px-2 py-0.5 rounded-full truncate max-w-[9rem]">{n}</span>)}
        {names.length > 2 && <span className="text-xs text-[var(--text-secondary)] px-1 py-0.5">+{names.length - 2}</span>}
      </div>
    );
  };

  const IconBtn: React.FC<{ label: string; icon: string; onClick: () => void; tone?: 'danger' | 'ok' }> = ({ label, icon, onClick, tone }) => (
    <button type="button" onClick={onClick} title={label} aria-label={label}
      className={`w-8 h-8 rounded-md flex items-center justify-center text-sm border border-[var(--border-color)] transition-colors hover:bg-[var(--light-bg)] ${tone === 'danger' ? 'text-red-400 hover:border-red-500/60' : tone === 'ok' ? 'text-green-500 hover:border-green-500/60' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
      <i className={`fas ${icon}`} aria-hidden="true"></i>
    </button>
  );

  const Pill: React.FC<{ label: string; n: number; on: boolean; onClick: () => void }> = ({ label, n, on, onClick }) => (
    <button type="button" onClick={onClick} aria-pressed={on}
      className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${on ? 'bg-[var(--primary-color)] border-[var(--primary-color)] text-white' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
      {label} <span className="opacity-80">{n}</span>
    </button>
  );

  return (
    <div className="p-4 bg-[var(--medium-bg)] rounded-lg shadow-md h-full flex flex-col gap-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h3 className="text-xl font-bold text-[var(--text-primary)]">People</h3>
        <button onClick={() => setShowNewUserModal(true)} className="px-4 py-2 rounded-md bg-[var(--primary-color)] text-white font-medium hover:brightness-110 transition flex items-center gap-2">
          <i className="fas fa-user-plus" aria-hidden="true"></i> Add New User
        </button>
      </div>

      {(
        <div className="flex-1 flex flex-col gap-3 min-h-0 animate-fadeIn">
          <div className="flex flex-wrap items-center gap-2">
            <Pill label="All" n={counts.all} on={filterRole === 'All' && filterStatus === 'All'} onClick={() => { setFilterRole('All'); setFilterStatus('All'); }} />
            <Pill label="Admin" n={counts.Admin} on={filterRole === 'Admin'} onClick={() => setFilterRole(filterRole === 'Admin' ? 'All' : 'Admin')} />
            <Pill label="Sales" n={counts.Sales} on={filterRole === 'Sales'} onClick={() => setFilterRole(filterRole === 'Sales' ? 'All' : 'Sales')} />
            <Pill label="User" n={counts.User} on={filterRole === 'User'} onClick={() => setFilterRole(filterRole === 'User' ? 'All' : 'User')} />
            <span className="w-px h-5 bg-[var(--border-color)] mx-1" aria-hidden="true"></span>
            <Pill label="Active" n={counts.active} on={filterStatus === 'Active'} onClick={() => setFilterStatus(filterStatus === 'Active' ? 'All' : 'Active')} />
            <Pill label="Inactive" n={counts.inactive} on={filterStatus === 'Inactive'} onClick={() => setFilterStatus(filterStatus === 'Inactive' ? 'All' : 'Inactive')} />
          </div>

          <div className="relative">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] text-sm" aria-hidden="true"></i>
            <input type="search" placeholder="Search by name, username or email…" aria-label="Search users" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`${inputCls()} pl-9`} />
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {filteredUsers.length === 0 ? (
              <p className="text-[var(--text-secondary)] text-center mt-8">No users match.</p>
            ) : (
              <div className="border border-[var(--light-bg)] rounded-lg overflow-hidden">
                <div className="hidden lg:grid grid-cols-[minmax(0,2.2fr)_110px_minmax(0,1.6fr)_100px_130px] gap-4 px-4 py-2 bg-[var(--dark-bg)] text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  <span>User</span><span>Role</span><span>Projects</span><span>Status</span><span className="text-right">Actions</span>
                </div>
                <ul className="divide-y divide-[var(--light-bg)]">
                  {filteredUsers.map((user) => (
                    <li key={user.id} className={`grid grid-cols-1 lg:grid-cols-[minmax(0,2.2fr)_110px_minmax(0,1.6fr)_100px_130px] gap-x-4 gap-y-2 items-center px-4 py-3 hover:bg-[var(--dark-bg)] transition-colors ${user.isActive ? '' : 'opacity-70'}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-9 h-9 rounded-full bg-[color-mix(in_srgb,var(--primary-color)_18%,transparent)] text-[var(--primary-color)] text-xs font-bold flex items-center justify-center flex-shrink-0" aria-hidden="true">{initials(user.name)}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{user.name}{user.id === currentUserId && <span className="ml-2 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-[var(--light-bg)] text-[var(--text-secondary)]">You</span>}</p>
                          <p className="text-xs text-[var(--text-secondary)] truncate">@{user.username} · {user.email}</p>
                        </div>
                      </div>
                      <div><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_STYLE[user.role] || ROLE_STYLE.User}`}>{user.role}</span></div>
                      <ProjectChips user={user} />
                      <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                        <span className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`} aria-hidden="true"></span>{user.isActive ? 'Active' : 'Inactive'}
                      </div>
                      <div className="flex gap-1.5 lg:justify-end">
                        <IconBtn label={`Edit ${user.name}`} icon="fa-pen" onClick={() => setEditingUser(user)} />
                        <IconBtn label={`Assign projects to ${user.name}`} icon="fa-building" onClick={() => handleOpenAssignModal(user)} />
                        <IconBtn label={user.isActive ? `Deactivate ${user.name}` : `Activate ${user.name}`} icon={user.isActive ? 'fa-user-slash' : 'fa-user-check'} tone={user.isActive ? 'danger' : 'ok'} onClick={() => toggleUserActiveStatus(user)} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      <NewUserModal isOpen={showNewUserModal} onClose={() => setShowNewUserModal(false)} onAddUser={onAddUser} users={users || []} />
      <EditUserModal isOpen={!!editingUser} onClose={() => setEditingUser(null)} user={editingUser} onSaveUser={handleSaveUser} users={users || []} currentUserId={currentUserId} />
      {selectedUserForProjects && (
        <AssignProjectModal isOpen={showAssignProjectModal} onClose={() => setShowAssignProjectModal(false)} user={selectedUserForProjects} projects={projects || []} onAssignProjects={handleAssignProjects} />
      )}
    </div>
  );
};

export default AdminUserManagement;

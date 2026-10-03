
import React from 'react';
import { Lead, Project, User, Task } from '../../types';
import StatCard from './reporting/StatCard';

interface AdminDashboardProps {
  leads: Lead[];
  projects: Project[];
  users: User[];
  onAddUser: () => void;
  onAddProject: () => void;
  onViewReports: () => void;
}

const formatInr = (n: number) => n >= 1e7 ? `₹${(n / 1e7).toFixed(2)} Cr` : n >= 1e5 ? `₹${(n / 1e5).toFixed(2)} L` : `₹${Math.round(n).toLocaleString('en-IN')}`;

const AdminDashboard: React.FC<AdminDashboardProps> = ({ leads, projects, users, onAddUser, onAddProject, onViewReports }) => {
  const stats = React.useMemo(() => {
    const safeLeads = leads || [];
    const safeProjects = projects || [];
    const safeUsers = users || [];

    const totalLeads = safeLeads.length;
    const activeProjects = safeProjects.filter(p => p.projectStatus !== 'Pre-launch').length;
    const teamSize = safeUsers.length;
    const convertedRevenue = safeLeads
        .filter(l => l.leadStatus === 'Converted' && l.bookingDetails)
        .reduce((sum, l) => sum + (l.bookingDetails?.priceBreakup.grandTotal || 0), 0);
        
    const pendingTasks = safeLeads.flatMap(l => l.tasks || []).filter(t => t.status === 'Pending').length;
    const leadsToday = safeLeads.filter(l => l.leadDate === new Date().toISOString().split('T')[0]).length;

    return { totalLeads, activeProjects, teamSize, convertedRevenue, pendingTasks, leadsToday };
  }, [leads, projects, users]);

  const recentLeads = React.useMemo(() => {
      const safeLeads = leads || [];
      return [...safeLeads].sort((a, b) => new Date(b.leadDate).getTime() - new Date(a.leadDate).getTime()).slice(0, 5);
  }, [leads]);

  return (
    <div className="h-full flex flex-col gap-6">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard</h2>
                <p className="text-[var(--text-secondary)]">Welcome back, Admin. Here's what's happening today.</p>
            </div>
            <div className="text-sm text-[var(--text-secondary)] bg-[var(--medium-bg)] px-3 py-1 rounded-full border border-[var(--light-bg)]">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon="fas fa-wallet" label="Total Revenue" value={formatInr(stats.convertedRevenue)} subtext="From converted leads" />
            <StatCard icon="fas fa-users" label="Active Leads" value={stats.totalLeads.toLocaleString()} subtext={`${stats.leadsToday} new today`} />
            <StatCard icon="fas fa-building" label="Active Projects" value={stats.activeProjects.toLocaleString()} subtext={`${projects?.length || 0} total projects`} />
            <StatCard icon="fas fa-user-friends" label="Team Size" value={stats.teamSize.toLocaleString()} subtext="Active users" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
            {/* Recent Activity */}
            <div className="lg:col-span-2 bg-[var(--medium-bg)] rounded-lg shadow-md border border-[var(--light-bg)] flex flex-col">
                <div className="p-4 border-b border-[var(--light-bg)] flex justify-between items-center">
                    <h3 className="font-bold text-[var(--text-primary)]">Recent Leads</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    {recentLeads.length === 0 ? (
                         <p className="text-center text-[var(--text-secondary)] py-8">No leads found.</p>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="text-[var(--text-secondary)] font-medium border-b border-[var(--light-bg)]">
                                <tr>
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3">Project</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentLeads.map(lead => (
                                    <tr key={lead.id} className="border-b border-[var(--light-bg)] hover:bg-[var(--dark-bg)] transition-colors">
                                        <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">{lead.name}</td>
                                        <td className="px-4 py-3 text-[var(--text-secondary)]">{lead.leadProject}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                                                lead.leadStatus === 'New' ? 'bg-blue-500/20 text-blue-300' :
                                                lead.leadStatus === 'Contacted' ? 'bg-yellow-500/20 text-yellow-300' :
                                                lead.leadStatus === 'Converted' ? 'bg-green-500/20 text-green-300' :
                                                'bg-gray-500/20 text-gray-300'
                                            }`}>
                                                {lead.leadStatus}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-[var(--text-secondary)]">{lead.leadDate}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Right Column Widgets */}
            <div className="flex flex-col gap-6">
                 {/* Today */}
                 <div className="bg-[var(--medium-bg)] rounded-lg shadow-md border border-[var(--light-bg)] p-4">
                    <h3 className="font-bold text-[var(--text-primary)] mb-4">Today</h3>
                    <div className="space-y-3 text-sm">
                         <div className="flex justify-between items-center">
                             <span className="text-[var(--text-secondary)]"><i className="fas fa-user-plus mr-2 text-[var(--primary-color)]"></i> New leads</span>
                             <span className="text-[var(--text-primary)] font-semibold">{stats.leadsToday}</span>
                         </div>
                         <div className="flex justify-between items-center">
                             <span className="text-[var(--text-secondary)]"><i className="fas fa-list-check mr-2 text-[var(--primary-color)]"></i> Open follow-ups</span>
                             <span className="text-[var(--text-primary)] font-semibold">{stats.pendingTasks}</span>
                         </div>
                    </div>
                 </div>

                 {/* Quick Actions */}
                 <div className="bg-[var(--medium-bg)] rounded-lg shadow-md border border-[var(--light-bg)] p-4 flex-1">
                    <h3 className="font-bold text-[var(--text-primary)] mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 gap-3">
                        <button onClick={onAddUser} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--dark-bg)] hover:bg-[var(--light-bg)] border border-[var(--light-bg)] transition-colors text-left group">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                <i className="fas fa-user-plus"></i>
                            </div>
                            <div>
                                <span className="block text-sm font-semibold text-[var(--text-primary)]">Add User</span>
                                <span className="block text-xs text-[var(--text-secondary)]">Invite a new team member</span>
                            </div>
                        </button>
                        <button onClick={onAddProject} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--dark-bg)] hover:bg-[var(--light-bg)] border border-[var(--light-bg)] transition-colors text-left group">
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                <i className="fas fa-project-diagram"></i>
                            </div>
                            <div>
                                <span className="block text-sm font-semibold text-[var(--text-primary)]">Add Project</span>
                                <span className="block text-xs text-[var(--text-secondary)]">Create a new property listing</span>
                            </div>
                        </button>
                         <button onClick={onViewReports} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--dark-bg)] hover:bg-[var(--light-bg)] border border-[var(--light-bg)] transition-colors text-left group">
                            <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-colors">
                                <i className="fas fa-chart-pie"></i>
                            </div>
                            <div>
                                <span className="block text-sm font-semibold text-[var(--text-primary)]">View Reports</span>
                                <span className="block text-xs text-[var(--text-secondary)]">Check sales performance</span>
                            </div>
                        </button>
                    </div>
                 </div>
            </div>
        </div>
    </div>
  );
};

export default AdminDashboard;

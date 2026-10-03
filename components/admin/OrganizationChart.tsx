
import React from 'react';
import { User } from '../../types';
import UserNode from './UserNode';

interface OrganizationChartProps {
  users: User[];
}

const CHART_CSS = `
.org-tree, .org-tree ul { list-style: none; margin: 0; padding: 0; display: flex; justify-content: center; }
.org-tree ul { padding-top: 22px; position: relative; }
.org-tree li { position: relative; padding: 22px 8px 0; display: flex; flex-direction: column; align-items: center; }
.org-tree > li { padding-top: 0; }
.org-tree li::before, .org-tree li::after { content: ''; position: absolute; top: 0; right: 50%; width: 50%; height: 22px; border-top: 2px solid var(--border-color, #3a4a55); }
.org-tree li::after { right: auto; left: 50%; border-left: 2px solid var(--border-color, #3a4a55); }
.org-tree li:only-child::before, .org-tree li:only-child::after { display: none; }
.org-tree li:only-child { padding-top: 0; }
.org-tree li:first-child::before, .org-tree li:last-child::after { border-top: 0 none; }
.org-tree li:last-child::before { border-right: 2px solid var(--border-color, #3a4a55); border-radius: 0 6px 0 0; }
.org-tree li:first-child::after { border-radius: 6px 0 0 0; }
.org-tree ul::before { content: ''; position: absolute; top: 0; left: 50%; height: 22px; border-left: 2px solid var(--border-color, #3a4a55); }
.org-node { display: flex; flex-direction: column; align-items: center; text-align: center; min-width: 9rem; padding: 12px 14px; border-radius: 12px; background: var(--dark-bg); border: 1px solid var(--light-bg); box-shadow: 0 1px 3px rgba(0,0,0,.15); }
.org-avatar { width: 40px; height: 40px; border-radius: 9999px; margin-bottom: 6px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #fff; background: var(--primary-color); }
`;

const OrganizationChart: React.FC<OrganizationChartProps> = ({ users }) => {
  const safeUsers = React.useMemo(() => users || [], [users]);

  const childrenByParentId = React.useMemo(() => {
    const map = new Map<string, User[]>();
    for (const user of safeUsers) {
      if (user.reportsTo) {
        if (!map.has(user.reportsTo)) {
          map.set(user.reportsTo, []);
        }
        map.get(user.reportsTo)!.push(user);
      }
    }
    return map;
  }, [safeUsers]);

  const rootUsers = React.useMemo(() => (safeUsers || []).filter(u => !u.reportsTo), [safeUsers]);

  if(rootUsers.length === 0 && safeUsers.length > 0) {
      return (
          <div className="text-center text-yellow-400 bg-yellow-900/50 p-6 rounded-lg border border-yellow-700">
              <i className="fas fa-exclamation-triangle text-3xl mb-3"></i>
              <h4 className="font-bold">Potential Loop Detected or No Top-Level Manager</h4>
              <p className="text-sm mt-1">No users are set as top-level managers (i.e., they don't report to anyone). Please set a top-level manager in the 'User List' tab to build the organization chart.</p>
          </div>
      )
  }

  return (
    <div className="org-chart overflow-x-auto pb-4">
      <div className="min-w-max flex flex-col items-center">
      <style>{CHART_CSS}</style>
      {rootUsers.length === safeUsers.length && safeUsers.length > 1 && (
        <p className="mb-4 text-sm text-[var(--text-secondary)]"><i className="fas fa-info-circle mr-1.5" aria-hidden="true"></i>Nobody reports to anyone yet. Open a person on the People screen and set “Reports to” to build the chart.</p>
      )}
      {rootUsers.length > 0 ? (
        <ul className="org-tree">
          {rootUsers.map(user => (
            <UserNode 
              key={user.id} 
              user={user} 
              childrenByParentId={childrenByParentId}
            />
          ))}
        </ul>
      ) : (
        <p className="text-center text-[var(--text-secondary)]">No users in the system to display.</p>
      )}
      </div>
    </div>
  );
};

export default OrganizationChart;

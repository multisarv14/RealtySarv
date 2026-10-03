import React from 'react';
import { User } from '../../types';

interface UserNodeProps {
  user: User;
  childrenByParentId: Map<string, User[]>;
}

const ROLE_STYLE: Record<string, string> = { Admin: 'bg-purple-500/15 text-purple-400', Sales: 'bg-blue-500/15 text-blue-400', User: 'bg-gray-500/20 text-[var(--text-secondary)]' };

const UserNode: React.FC<UserNodeProps> = ({ user, childrenByParentId }) => {
  const children = childrenByParentId.get(user.id) || [];
  const initials = user.name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?';

  return (
    <li>
      <div className={`org-node ${user.isActive ? '' : 'opacity-60'}`}>
        <span className="org-avatar" aria-hidden="true">{initials}</span>
        <p className="text-sm font-semibold text-[var(--text-primary)] truncate max-w-[10rem]">{user.name}</p>
        <span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${ROLE_STYLE[user.role] || ROLE_STYLE.User}`}>{user.role}</span>
        {!user.isActive && <p className="text-[10px] mt-1 text-[var(--text-secondary)]">Inactive</p>}
        {children.length > 0 && <p className="text-[10px] mt-1 text-[var(--text-secondary)]">{children.length} report{children.length > 1 ? 's' : ''}</p>}
      </div>
      {children.length > 0 && (
        <ul>
          {children.map(child => (
            <UserNode key={child.id} user={child} childrenByParentId={childrenByParentId} />
          ))}
        </ul>
      )}
    </li>
  );
};

export default UserNode;

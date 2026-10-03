import React from 'react';
import { UserRoleSetting, User } from '../../types';
import { ACCESS_ITEMS, CONFIGURABLE_ROLES, accessFor, roleSettingId } from '../../access';
import { toast } from '../ui/Toast';

interface AdminRoleAccessProps {
  settings: UserRoleSetting[];
  users: User[];
  /** Saves one role's allowed screens. */
  onSave: (role: UserRoleSetting) => Promise<unknown> | void;
  /** The company's plan has no ProjectSarv / FinanceSarv. */
  erpLocked?: boolean;
}

const GROUPS = ['LeadSarv screens', 'Other modules', 'Control'] as const;

const AdminRoleAccess: React.FC<AdminRoleAccessProps> = ({ settings, users, onSave, erpLocked }) => {
  const [busy, setBusy] = React.useState<string | null>(null);

  const toggle = async (role: string, key: string) => {
    const current = accessFor(role, settings);
    const next = new Set(current);
    next.has(key) ? next.delete(key) : next.add(key);
    // A role with no CRM screen at all could not use the app.
    if (!['Leads', 'Visits', 'Booking', 'Agreement', 'Possession'].some(k => next.has(k))) { toast.error('Keep at least one LeadSarv screen on.'); return; }
    setBusy(`${role}:${key}`);
    try {
      await onSave({ id: roleSettingId(role), name: role, menuAccess: ACCESS_ITEMS.map(i => i.key).filter(k => next.has(k)) });
    } catch (e: any) {
      toast.error(e?.message || 'Could not save.');
    } finally { setBusy(null); }
  };

  const countOf = (role: string) => users.filter(u => u.role === role && u.isActive).length;
  const cols = ['Admin', ...CONFIGURABLE_ROLES];

  return (
    <div className="p-4 bg-[var(--medium-bg)] rounded-lg shadow-md h-full flex flex-col gap-4 overflow-y-auto">
      <div>
        <h3 className="text-xl font-bold text-[var(--text-primary)]">Roles & access</h3>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Choose what each role can open. A person's role is set on the People screen. Admin always has everything.</p>
      </div>

      <div className="border border-[var(--light-bg)] rounded-lg overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-[var(--dark-bg)] text-[11px] uppercase tracking-wider text-[var(--text-secondary)]">
              <th scope="col" className="text-left font-bold px-4 py-2">Can open</th>
              {cols.map(r => (
                <th key={r} scope="col" className="px-4 py-2 text-center font-bold">
                  {r}<span className="block normal-case tracking-normal font-normal opacity-80">{countOf(r)} active</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GROUPS.map(group => (
              <React.Fragment key={group}>
                <tr><th scope="rowgroup" colSpan={cols.length + 1} className="text-left px-4 pt-4 pb-1 text-[11px] uppercase tracking-wider text-[var(--primary-color)]">{group}</th></tr>
                {ACCESS_ITEMS.filter(i => i.group === group).map(item => {
                  const planLocked = erpLocked && (item.key === 'ProjectSarv' || item.key === 'FinanceSarv');
                  return (
                    <tr key={item.key} className="border-t border-[var(--light-bg)]">
                      <th scope="row" className="text-left font-medium px-4 py-2.5 text-[var(--text-primary)]">
                        {item.label}
                        {(planLocked || item.hint) && <span className="block text-xs font-normal text-[var(--text-secondary)]">{planLocked ? 'Not in your current plan' : item.hint}</span>}
                      </th>
                      {cols.map(role => {
                        const locked = role === 'Admin' || planLocked;
                        const on = accessFor(role, settings).has(item.key);
                        return (
                          <td key={role} className="px-4 py-2.5 text-center">
                            <input type="checkbox" checked={on && !planLocked} disabled={locked || busy === `${role}:${item.key}`}
                              onChange={() => toggle(role, item.key)}
                              aria-label={`${role} can open ${item.label}`}
                              className="h-4 w-4 accent-[var(--primary-color)] disabled:opacity-50" />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-[var(--text-secondary)]">Changes apply the next time that person opens or refreshes the app.</p>
    </div>
  );
};

export default AdminRoleAccess;

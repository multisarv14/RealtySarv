import { UserRole, UserRoleSetting } from './types';

// What each role may open. Admin always has everything; the others are set in Admin > Users > Roles & access.
export interface AccessItem { key: string; label: string; group: 'LeadSarv screens' | 'Other modules' | 'Control'; hint?: string }

export const ACCESS_ITEMS: AccessItem[] = [
  { key: 'Leads', label: 'Leads', group: 'LeadSarv screens' },
  { key: 'Visits', label: 'Visits', group: 'LeadSarv screens' },
  { key: 'Booking', label: 'Booking', group: 'LeadSarv screens' },
  { key: 'Agreement', label: 'Agreement', group: 'LeadSarv screens' },
  { key: 'Possession', label: 'Possession', group: 'LeadSarv screens' },
  { key: 'ProjectSarv', label: 'ProjectSarv', group: 'Other modules', hint: 'Needs the Ultimate Stack plan' },
  { key: 'FinanceSarv', label: 'FinanceSarv', group: 'Other modules', hint: 'Needs the Ultimate Stack plan' },
  { key: 'Transfer', label: 'Transfer leads', group: 'Control', hint: 'Move a lead to another project' },
  { key: 'Admin', label: 'Admin settings', group: 'Control' },
];

export const CONFIGURABLE_ROLES: UserRole[] = ['Sales', 'User'];
export const roleSettingId = (role: string) => `role-${role}`;

const ALL = ACCESS_ITEMS.map(i => i.key);
const DEFAULT_ACCESS: Record<string, string[]> = {
  Admin: ALL,
  Sales: ALL.filter(k => k !== 'Admin' && k !== 'Transfer'),
  User: ALL.filter(k => k !== 'Admin' && k !== 'Transfer'),
};

/** The screens a role can open. Admin is never restricted. */
export function accessFor(role: string | undefined, settings: UserRoleSetting[] | undefined): Set<string> {
  if (role === 'Admin') return new Set(ALL);
  const saved = (settings || []).find(s => s.id === roleSettingId(role || ''));
  return new Set(saved ? saved.menuAccess : DEFAULT_ACCESS[role || ''] || DEFAULT_ACCESS.User);
}

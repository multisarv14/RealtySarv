import { DistributionRule, Lead, User } from './types';

const OPEN: Lead['leadStatus'][] = ['New', 'Contacted', 'Qualified'];

/** Active people a rule may hand leads to, in the order they were picked. */
export const eligibleAssignees = (rule: DistributionRule, users: User[]): User[] =>
  rule.assignees.map(id => users.find(u => u.id === id)).filter((u): u is User => !!u && u.isActive);

export const sortRules = (rules: DistributionRule[]): DistributionRule[] =>
  [...rules].sort((a, b) => (a.position ?? 1e9) - (b.position ?? 1e9) || a.name.localeCompare(b.name));

/** The first enabled rule whose project and source filters fit this lead (an empty filter means any). */
export function matchRule(rules: DistributionRule[], info: { project?: string; source?: string }, users: User[]): DistributionRule | undefined {
  return sortRules(rules).find(r =>
    r.enabled &&
    (r.projects.length === 0 || (!!info.project && r.projects.includes(info.project))) &&
    (r.sources.length === 0 || (!!info.source && r.sources.includes(info.source))) &&
    eligibleAssignees(r, users).length > 0);
}

/** Who gets the lead, and the rule as it should be saved afterwards (round robin moves its pointer on). */
export function pickAssignee(rule: DistributionRule, users: User[], leads: Lead[]): { user: User; rule: DistributionRule } {
  const people = eligibleAssignees(rule, users);
  if (rule.mode === 'Least loaded') {
    const load = (id: string) => leads.filter(l => l.ownerId === id && OPEN.includes(l.leadStatus)).length;
    const user = people.reduce((best, u) => (load(u.id) < load(best.id) ? u : best), people[0]);
    return { user, rule };
  }
  const idx = (rule.cursor ?? 0) % people.length;
  return { user: people[idx], rule: { ...rule, cursor: idx + 1 } };
}

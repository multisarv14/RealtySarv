import { TenantRequest } from './tenant';
import { accessFor } from '../../../access';

/** What the signed-in user's role may open, from the company's saved Roles & access (see access.ts). */
export async function roleAccess(req: TenantRequest): Promise<Set<string>> {
  if (req.role === 'Admin') return accessFor('Admin', []);
  const rows = await req.models!.userRoleSettings.find({ _id: `role-${req.role}` }).lean();
  return accessFor(req.role, rows.map((r: any) => ({ id: String(r._id), name: r.name, menuAccess: r.menuAccess || [] })));
}

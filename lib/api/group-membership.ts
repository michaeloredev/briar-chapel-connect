import { createAdminClient } from '@/lib/supabase/admin';
import { getUserRole, hasRole } from '@/lib/auth/roles';

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Whether `userId` is an active member of the group.
 *
 * Read through the service-role client because the routes calling this then
 * write with it too; group_members' own RLS would also allow this lookup, but
 * only for the caller's own row.
 */
export async function isGroupMember(groupId: string, userId: string): Promise<boolean> {
  // group_id is a uuid column; anything else would be a query error, not a "no".
  if (!UUID_PATTERN.test(groupId)) return false;
  const { data, error } = await createAdminClient()
    .from('group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1);
  if (error) throw new Error(error.message);
  return (data ?? []).length > 0;
}

/**
 * Whether `userId` may close or delete something `ownerId` created inside a
 * group: its creator, or a site admin moderating.
 */
export async function canManage(userId: string, ownerId: string): Promise<boolean> {
  if (userId === ownerId) return true;
  return hasRole(await getUserRole(userId), 'admin');
}

/** Open means not closed early and not past its closing time, if it has one. */
export function isOpen(row: { closed_at: string | null; closes_at?: string | null }): boolean {
  if (row.closed_at) return false;
  return !row.closes_at || new Date(row.closes_at).getTime() > Date.now();
}

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

/** Whether `userId` is the group's active owner. */
export async function isGroupOwner(groupId: string, userId: string): Promise<boolean> {
  if (!UUID_PATTERN.test(groupId)) return false;
  const { data, error } = await createAdminClient()
    .from('group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .eq('role', 'owner')
    .eq('status', 'active')
    .limit(1);
  if (error) throw new Error(error.message);
  return (data ?? []).length > 0;
}

export type GroupAccess = {
  isMember: boolean;
  isOwner: boolean;
  isSiteAdmin: boolean;
  /** May see the discussion, polls and sign-ups. */
  canRead: boolean;
  /** May approve or decline join requests. */
  canApprove: boolean;
};

/**
 * What `userId` (null when signed out) may do in a group. Mirrors the
 * database's can_read_group(), plus site admins, who moderate every group and
 * read private content through the service role.
 */
export async function groupAccess(group: { id: string; is_private: boolean }, userId: string | null): Promise<GroupAccess> {
  if (!userId) {
    return { isMember: false, isOwner: false, isSiteAdmin: false, canRead: !group.is_private, canApprove: false };
  }
  const [isMember, isOwner, isSiteAdmin] = await Promise.all([
    isGroupMember(group.id, userId),
    isGroupOwner(group.id, userId),
    getUserRole(userId).then((role) => hasRole(role, 'admin')),
  ]);
  return {
    isMember,
    isOwner,
    isSiteAdmin,
    canRead: !group.is_private || isMember || isSiteAdmin,
    canApprove: isOwner || isSiteAdmin,
  };
}

/** The group's privacy flag, or null when there is no such group. */
export async function loadGroupPrivacy(groupId: string): Promise<{ id: string; is_private: boolean } | null> {
  if (!UUID_PATTERN.test(groupId)) return null;
  const { data, error } = await createAdminClient()
    .from('groups')
    .select('id, is_private')
    .eq('id', groupId)
    .maybeSingle<{ id: string; is_private: boolean }>();
  if (error) throw new Error(error.message);
  return data ?? null;
}

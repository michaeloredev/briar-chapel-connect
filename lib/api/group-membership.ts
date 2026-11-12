import { createAdminClient } from '@/lib/supabase/admin';
import { getUserRole, hasRole } from '@/lib/auth/roles';
import type { Database } from '@/lib/supabase/types';

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
 * group: its creator, a manager of that group, or a site admin moderating.
 */
export async function canManage(userId: string, ownerId: string, groupId: string): Promise<boolean> {
  if (userId === ownerId) return true;
  const [role, siteRole] = await Promise.all([groupRole(groupId, userId), getUserRole(userId)]);
  return isManagerRole(role) || hasRole(siteRole, 'admin');
}

/** Open means not closed early and not past its closing time, if it has one. */
export function isOpen(row: { closed_at: string | null; closes_at?: string | null }): boolean {
  if (row.closed_at) return false;
  return !row.closes_at || new Date(row.closes_at).getTime() > Date.now();
}

export type GroupRole = Database['public']['Tables']['group_members']['Row']['role'];

/** `userId`'s role in the group, or null when they are not an active member. */
export async function groupRole(groupId: string, userId: string): Promise<GroupRole | null> {
  if (!UUID_PATTERN.test(groupId)) return null;
  const { data, error } = await createAdminClient()
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle<{ role: GroupRole }>();
  if (error) throw new Error(error.message);
  return data?.role ?? null;
}

/** Owners and group admins run a group; plain members take part in it. */
function isManagerRole(role: GroupRole | null): boolean {
  return role === 'owner' || role === 'admin';
}

export type GroupAccess = {
  isMember: boolean;
  isOwner: boolean;
  /** Owner or group admin. */
  isManager: boolean;
  isSiteAdmin: boolean;
  /** May see the discussion, polls and sign-ups. */
  canRead: boolean;
  /**
   * May edit the group, approve join requests, and close or delete anyone's
   * polls, sign-ups and comments in it.
   */
  canModerate: boolean;
  /** May delete the group. The owner, not group admins. */
  canDelete: boolean;
};

/**
 * What `userId` (null when signed out) may do in a group. Reading mirrors the
 * database's can_read_group(), plus site admins, who moderate every group and
 * read private content through the service role.
 */
export async function groupAccess(group: { id: string; is_private: boolean }, userId: string | null): Promise<GroupAccess> {
  if (!userId) {
    return {
      isMember: false,
      isOwner: false,
      isManager: false,
      isSiteAdmin: false,
      canRead: !group.is_private,
      canModerate: false,
      canDelete: false,
    };
  }
  const [role, siteRole] = await Promise.all([groupRole(group.id, userId), getUserRole(userId)]);
  const isSiteAdmin = hasRole(siteRole, 'admin');
  const isMember = role !== null;
  const isOwner = role === 'owner';
  const isManager = isManagerRole(role);
  return {
    isMember,
    isOwner,
    isManager,
    isSiteAdmin,
    canRead: !group.is_private || isMember || isSiteAdmin,
    canModerate: isManager || isSiteAdmin,
    canDelete: isOwner || isSiteAdmin,
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

import { createAdminClient } from '@/lib/supabase/admin';
import type { Database } from '@/lib/supabase/types';

export type AppRole = 'superadmin' | 'admin' | 'client';

const ROLE_HIERARCHY: Record<AppRole, number> = {
  superadmin: 3,
  admin: 2,
  client: 1,
};

/**
 * Fetch the application role for a given Clerk user ID.
 * Returns 'client' if no row exists (default role).
 */
export async function getUserRole(userId: string): Promise<AppRole> {
  const admin = createAdminClient();
  type Row = Database['public']['Tables']['user_roles']['Row'];
  const { data, error } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single<Pick<Row, 'role'>>();

  if (error || !data) return 'client';
  return data.role;
}

/**
 * Returns true if `userRole` meets or exceeds `requiredRole`.
 */
export function hasRole(userRole: AppRole, requiredRole: AppRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Throws an error if the user's role is below `requiredRole`.
 * Call after `requireAuthSupabase()` to add role enforcement.
 */
export async function requireRole(userId: string, requiredRole: AppRole): Promise<AppRole> {
  const role = await getUserRole(userId);
  if (!hasRole(role, requiredRole)) {
    throw new Error('Forbidden');
  }
  return role;
}

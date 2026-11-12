import { NextResponse } from 'next/server';
import { requireAuthSupabase } from '@/lib/supabase/auth';
import { requireRole } from '@/lib/auth/roles';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiError, apiBadRequest } from '@/lib/api/response';
import { loadGroupPrivacy, UUID_PATTERN } from '@/lib/api/group-membership';
import { deleteGroup } from '@/lib/api/groups';

/**
 * Approve or reject a proposed group. Superadmins only.
 * Body: { id, decision: 'approve' | 'reject' }. Approving makes the group
 * live; rejecting deletes it, the same as deleting any group.
 */
export async function POST(req: Request) {
  try {
    const body: { id?: string; decision?: string } = await req.json();
    const id = (body.id || '').trim();
    if (!UUID_PATTERN.test(id)) return apiBadRequest('Missing or invalid id');
    if (body.decision !== 'approve' && body.decision !== 'reject') {
      return apiBadRequest('decision must be approve or reject');
    }

    const { userId } = await requireAuthSupabase();
    await requireRole(userId, 'superadmin');

    const group = await loadGroupPrivacy(id);
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    if (group.status !== 'pending') return apiBadRequest('This group is not waiting for review.');

    const admin = createAdminClient();
    if (body.decision === 'approve') {
      // .eq('status', 'pending') so two superadmins deciding at once can't
      // approve a group the other just rejected.
      const { data, error } = await admin
        .from('groups')
        .update({ status: 'active' } as never)
        .eq('id', id)
        .eq('status', 'pending')
        .select('id');
      if (error) {
        console.error('[Groups][REVIEW] approve error:', error.message);
        return apiError(error, 'Failed to approve group');
      }
      if (!data || data.length === 0) return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    } else if (!(await deleteGroup(admin, id))) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return apiError(err, 'Failed to review group');
  }
}

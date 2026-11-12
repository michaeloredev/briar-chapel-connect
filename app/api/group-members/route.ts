import { NextResponse } from 'next/server';
import { requireAuthSupabase } from '@/lib/supabase/auth';
import type { Database } from '@/lib/supabase/types';
import { apiError, apiBadRequest, apiForbidden } from '@/lib/api/response';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  groupAccess,
  groupRole,
  loadGroupPrivacy,
  memberActions,
  UUID_PATTERN,
  type MemberAction,
} from '@/lib/api/group-membership';

const ACTIONS: readonly MemberAction[] = ['make_admin', 'make_member', 'make_owner', 'remove'];

export async function POST(req: Request) {
  try {
    const body: { group_id?: string } = await req.json();
    const group_id = (body.group_id || '').trim();
    if (!group_id) return apiBadRequest('Missing group_id');

    const { supabase, userId } = await requireAuthSupabase();

    // RLS refuses a private group anyway; this turns that into a message the
    // page can act on instead of a bare policy error.
    const group = await loadGroupPrivacy(group_id);
    if (!group || group.status !== 'active') return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    if (group.is_private) return apiForbidden('This group is private. Request to join instead.');

    type Insert = Database['public']['Tables']['group_members']['Insert'];
    const insert: Insert = {
      group_id,
      user_id: userId,
      role: 'member',
      status: 'active',
    };

    const { data, error } = await supabase
      .from('group_members')
      .insert(insert as any)
      .select('id')
      .single<{ id: string }>();

    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to join group' }, { status: 400 });
    }
    return NextResponse.json({ id: data?.id }, { status: 201 });
  } catch (err) {
    return apiError(err, 'Failed to join group');
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const group_id = (url.searchParams.get('group_id') || '').trim();
    if (!group_id) return apiBadRequest('Missing group_id');

    const { supabase, userId } = await requireAuthSupabase();
    // Leaving would orphan the group. Ownership moves (or a site admin
    // deletes the group) first.
    if ((await groupRole(group_id, userId)) === 'owner') {
      return apiBadRequest("The owner can't leave the group.");
    }
    const { data: deleted, error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', group_id)
      .eq('user_id', userId)
      .select('id');

    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to leave group' }, { status: 400 });
    }
    if (!deleted || deleted.length === 0) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return apiError(err, 'Failed to leave group');
  }
}

/**
 * Manage another member of a group. Body: { group_id, user_id, action } where
 * action is make_admin, make_member, make_owner (transfer ownership; the old
 * owner becomes a group admin) or remove. Who may do what is memberActions().
 */
export async function PATCH(req: Request) {
  try {
    const body: { group_id?: string; user_id?: string; action?: string } = await req.json();
    const group_id = (body.group_id || '').trim();
    const target = (body.user_id || '').trim();
    const action = body.action as MemberAction;
    if (!UUID_PATTERN.test(group_id)) return apiBadRequest('Missing or invalid group_id');
    if (!target) return apiBadRequest('Missing user_id');
    if (!ACTIONS.includes(action)) return apiBadRequest('Unknown action');

    const { userId } = await requireAuthSupabase();
    const group = await loadGroupPrivacy(group_id);
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    const [access, targetRole] = await Promise.all([groupAccess(group, userId), groupRole(group_id, target)]);
    if (!targetRole) return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    if (!memberActions(access, targetRole, target === userId).includes(action)) throw new Error('Forbidden');

    // group_members has no UPDATE policy and leaving is the only browser-side
    // delete, so these go through the service role -- authorized just above.
    const admin = createAdminClient();
    const { error } =
      action === 'make_owner'
        ? await admin.rpc('transfer_group_ownership', { p_group_id: group_id, p_new_owner: target } as never)
        : action === 'remove'
          ? await admin.from('group_members').delete().eq('group_id', group_id).eq('user_id', target)
          : await admin
              .from('group_members')
              .update({ role: action === 'make_admin' ? 'admin' : 'member' } as never)
              .eq('group_id', group_id)
              .eq('user_id', target);
    if (error) {
      console.error('[GroupMembers][PATCH] error:', error.message);
      return apiError(error, 'Failed to update member');
    }
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return apiError(err, 'Failed to update member');
  }
}

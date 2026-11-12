import { NextResponse } from 'next/server';
import type { Database } from '@/lib/supabase/types';
import { requireAuthSupabase } from '@/lib/supabase/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiError, apiBadRequest, apiForbidden } from '@/lib/api/response';
import { groupAccess, isGroupMember, loadGroupPrivacy, UUID_PATTERN } from '@/lib/api/group-membership';
import { MAX_REQUEST_MESSAGE } from '@/lib/data/group-join-requests';

type Row = Database['public']['Tables']['group_join_requests']['Row'];

/**
 * Ask to join a private group, with a short note about yourself.
 * Body: { group_id, message }. Asking again replaces the earlier note.
 */
export async function POST(req: Request) {
  try {
    const body: { group_id?: string; message?: string } = await req.json();
    const group_id = (body.group_id || '').trim();
    const message = (body.message || '').trim();
    if (!UUID_PATTERN.test(group_id)) return apiBadRequest('Missing or invalid group_id');
    if (!message) return apiBadRequest('Tell the group a little about yourself');
    if (message.length > MAX_REQUEST_MESSAGE) return apiBadRequest(`Keep it under ${MAX_REQUEST_MESSAGE} characters`);

    const { userId } = await requireAuthSupabase();
    const group = await loadGroupPrivacy(group_id);
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    if (!group.is_private) return apiBadRequest('This group is open. Join it directly.');
    if (await isGroupMember(group_id, userId)) return apiBadRequest('You are already a member.');

    // RLS grants no write on this table; authorized by the checks above.
    type Insert = Database['public']['Tables']['group_join_requests']['Insert'];
    const insert: Insert = { group_id, user_id: userId, message };
    const { data, error } = await createAdminClient()
      .from('group_join_requests')
      .upsert(insert as never, { onConflict: 'group_id,user_id' })
      .select('id')
      .single<Pick<Row, 'id'>>();
    if (error) {
      console.error('[GroupJoinRequests][POST] error:', error.message);
      return apiError(error, 'Failed to send request');
    }
    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch (err) {
    return apiError(err, 'Failed to send request');
  }
}

/**
 * Approve or decline a request. The group's owner or admins, or a site admin.
 * Body: { id, action: 'approve' | 'decline' }. Approving adds the requester as
 * a member; either way the request is removed, so a declined person can ask
 * again.
 */
export async function PATCH(req: Request) {
  try {
    const body: { id?: string; action?: string } = await req.json();
    const id = (body.id || '').trim();
    const action = body.action;
    if (!UUID_PATTERN.test(id)) return apiBadRequest('Missing or invalid id');
    if (action !== 'approve' && action !== 'decline') return apiBadRequest('action must be approve or decline');

    const { userId } = await requireAuthSupabase();
    const admin = createAdminClient();

    const { data: request, error: loadError } = await admin
      .from('group_join_requests')
      .select('*')
      .eq('id', id)
      .maybeSingle<Row>();
    if (loadError) {
      console.error('[GroupJoinRequests][PATCH] load error:', loadError.message);
      return apiError(loadError, 'Failed to update request');
    }
    if (!request) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

    const group = await loadGroupPrivacy(request.group_id);
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    if (!(await groupAccess(group, userId)).canModerate) throw new Error('Forbidden');

    if (action === 'approve') {
      type MemberInsert = Database['public']['Tables']['group_members']['Insert'];
      const member: MemberInsert = { group_id: request.group_id, user_id: request.user_id, role: 'member', status: 'active' };
      // ignoreDuplicates: someone who is already a member keeps their row and role.
      const { error: joinError } = await admin
        .from('group_members')
        .upsert(member as never, { onConflict: 'group_id,user_id', ignoreDuplicates: true });
      if (joinError) {
        console.error('[GroupJoinRequests][PATCH] add member error:', joinError.message);
        return apiError(joinError, 'Failed to approve request');
      }
    }

    const { error: deleteError } = await admin.from('group_join_requests').delete().eq('id', id);
    if (deleteError) {
      console.error('[GroupJoinRequests][PATCH] delete error:', deleteError.message);
      return apiError(deleteError, 'Failed to update request');
    }
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return apiError(err, 'Failed to update request');
  }
}

/** Withdraw your own request. Query: ?group_id= */
export async function DELETE(req: Request) {
  try {
    const group_id = (new URL(req.url).searchParams.get('group_id') || '').trim();
    if (!UUID_PATTERN.test(group_id)) return apiBadRequest('Missing or invalid group_id');

    const { userId } = await requireAuthSupabase();
    const { data, error } = await createAdminClient()
      .from('group_join_requests')
      .delete()
      .eq('group_id', group_id)
      .eq('user_id', userId)
      .select('id');
    if (error) {
      console.error('[GroupJoinRequests][DELETE] error:', error.message);
      return apiError(error, 'Failed to withdraw request');
    }
    if (!data || data.length === 0) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return apiError(err, 'Failed to withdraw request');
  }
}

import { NextResponse } from 'next/server';
import type { Database } from '@/lib/supabase/types';
import { requireAuthSupabase } from '@/lib/supabase/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiError, apiBadRequest, apiForbidden } from '@/lib/api/response';
import { isGroupMember, isOpen, UUID_PATTERN } from '@/lib/api/group-membership';

type PollRow = Database['public']['Tables']['group_polls']['Row'];

/**
 * Set the caller's votes on a poll, replacing any they had. An empty list
 * clears their vote; a single-choice poll takes at most one option.
 */
export async function PUT(req: Request) {
  try {
    const body: { poll_id?: string; option_ids?: string[] } = await req.json();
    const poll_id = (body.poll_id || '').trim();
    const option_ids = [...new Set((Array.isArray(body.option_ids) ? body.option_ids : []).map(String))];
    if (!UUID_PATTERN.test(poll_id)) return apiBadRequest('Missing poll_id');
    if (!option_ids.every((id) => UUID_PATTERN.test(id))) return apiBadRequest('Unknown option');

    const { userId } = await requireAuthSupabase();
    const admin = createAdminClient();

    const { data: poll, error } = await admin.from('group_polls').select('*').eq('id', poll_id).maybeSingle<PollRow>();
    if (error) {
      console.error('[GroupPollVotes][PUT] poll lookup error:', error.message);
      return apiError(error, 'Failed to save your vote');
    }
    if (!poll) return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    if (!(await isGroupMember(poll.group_id, userId))) return apiForbidden('Join the group to vote');
    if (!isOpen(poll)) return apiBadRequest('This poll is closed');
    if (!poll.allow_multiple && option_ids.length > 1) return apiBadRequest('Pick one option');

    if (option_ids.length > 0) {
      const { data: options, error: optionsError } = await admin
        .from('group_poll_options')
        .select('id')
        .eq('poll_id', poll_id)
        .in('id', option_ids);
      if (optionsError) {
        console.error('[GroupPollVotes][PUT] options lookup error:', optionsError.message);
        return apiError(optionsError, 'Failed to save your vote');
      }
      if ((options ?? []).length !== option_ids.length) return apiBadRequest('Unknown option');
    }

    const { error: clearError } = await admin
      .from('group_poll_votes')
      .delete()
      .eq('poll_id', poll_id)
      .eq('user_id', userId);
    if (clearError) {
      console.error('[GroupPollVotes][PUT] clear error:', clearError.message);
      return apiError(clearError, 'Failed to save your vote');
    }

    if (option_ids.length > 0) {
      type Insert = Database['public']['Tables']['group_poll_votes']['Insert'];
      const rows: Insert[] = option_ids.map((option_id) => ({ poll_id, option_id, user_id: userId }));
      const { error: insertError } = await admin.from('group_poll_votes').insert(rows as any);
      if (insertError) {
        console.error('[GroupPollVotes][PUT] insert error:', insertError.message);
        return apiError(insertError, 'Failed to save your vote');
      }
    }

    return NextResponse.json({ poll_id, option_ids }, { status: 200 });
  } catch (err) {
    return apiError(err, 'Failed to save your vote');
  }
}

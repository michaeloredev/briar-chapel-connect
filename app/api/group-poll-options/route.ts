import { NextResponse } from 'next/server';
import type { Database } from '@/lib/supabase/types';
import { requireAuthSupabase } from '@/lib/supabase/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiError, apiBadRequest, apiForbidden } from '@/lib/api/response';
import { isGroupMember, isOpen, UUID_PATTERN } from '@/lib/api/group-membership';
import { POLL_LIMITS } from '@/lib/data/group-activity';

type PollRow = Database['public']['Tables']['group_polls']['Row'];
type OptionRow = Database['public']['Tables']['group_poll_options']['Row'];

/** A member adds their own option to a poll that allows it. */
export async function POST(req: Request) {
  try {
    const body: { poll_id?: string; label?: string } = await req.json();
    const poll_id = (body.poll_id || '').trim();
    const label = (body.label || '').trim();
    if (!UUID_PATTERN.test(poll_id) || !label) return apiBadRequest('Missing required fields');
    if (label.length > POLL_LIMITS.option) return apiBadRequest('That option is too long');

    const { userId } = await requireAuthSupabase();
    const admin = createAdminClient();

    const { data: poll, error } = await admin.from('group_polls').select('*').eq('id', poll_id).maybeSingle<PollRow>();
    if (error) {
      console.error('[GroupPollOptions][POST] poll lookup error:', error.message);
      return apiError(error, 'Failed to add option');
    }
    if (!poll) return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    if (!(await isGroupMember(poll.group_id, userId))) return apiForbidden('Join the group to add an option');
    if (!poll.allow_member_options) return apiBadRequest('This poll does not take new options');
    if (!isOpen(poll)) return apiBadRequest('This poll is closed');

    const { data: existing, error: existingError } = await admin
      .from('group_poll_options')
      .select('label, position')
      .eq('poll_id', poll_id)
      .returns<Pick<OptionRow, 'label' | 'position'>[]>();
    if (existingError) {
      console.error('[GroupPollOptions][POST] options lookup error:', existingError.message);
      return apiError(existingError, 'Failed to add option');
    }
    const rows = existing ?? [];
    if (rows.length >= POLL_LIMITS.maxOptionsWithMemberAdds) return apiBadRequest('This poll has as many options as it can take');
    if (rows.some((o) => o.label.toLowerCase() === label.toLowerCase())) return apiBadRequest('That option is already there');

    type Insert = Database['public']['Tables']['group_poll_options']['Insert'];
    const insert: Insert = {
      poll_id,
      user_id: userId,
      label,
      position: Math.max(-1, ...rows.map((o) => o.position)) + 1,
    };
    const { data, error: insertError } = await admin
      .from('group_poll_options')
      .insert(insert as any)
      .select('*')
      .single<OptionRow>();
    if (insertError) {
      console.error('[GroupPollOptions][POST] insert error:', insertError.message);
      return apiError(insertError, 'Failed to add option');
    }
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return apiError(err, 'Failed to add option');
  }
}

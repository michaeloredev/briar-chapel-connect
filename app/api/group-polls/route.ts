import { NextResponse } from 'next/server';
import type { Database } from '@/lib/supabase/types';
import { requireAuthSupabase } from '@/lib/supabase/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiError, apiBadRequest, apiForbidden } from '@/lib/api/response';
import { canManage, isGroupMember, UUID_PATTERN } from '@/lib/api/group-membership';
import { POLL_LIMITS } from '@/lib/data/group-activity';

const { question: MAX_QUESTION, option: MAX_OPTION, minOptions: MIN_OPTIONS, maxOptions: MAX_OPTIONS } = POLL_LIMITS;

type PollRow = Database['public']['Tables']['group_polls']['Row'];

type PostBody = {
  group_id?: string;
  question?: string;
  options?: string[];
  allow_multiple?: boolean;
  allow_member_options?: boolean;
  closes_at?: string | null;
};

// Writes go through the service-role client: these tables deliberately have no
// RLS write policy, so membership and ownership are checked here first.
export async function POST(req: Request) {
  try {
    const body: PostBody = await req.json();
    const group_id = (body.group_id || '').trim();
    const question = (body.question || '').trim();
    const options = [
      ...new Set((Array.isArray(body.options) ? body.options : []).map((o) => String(o).trim()).filter(Boolean)),
    ];

    if (!UUID_PATTERN.test(group_id) || !question) return apiBadRequest('Missing required fields');
    if (question.length > MAX_QUESTION) return apiBadRequest('Question is too long');
    if (options.length < MIN_OPTIONS) return apiBadRequest(`Add at least ${MIN_OPTIONS} different options`);
    if (options.length > MAX_OPTIONS) return apiBadRequest(`Polls can have at most ${MAX_OPTIONS} options`);
    if (options.some((o) => o.length > MAX_OPTION)) return apiBadRequest('An option is too long');

    let closes_at: string | null = null;
    if (body.closes_at) {
      const when = new Date(body.closes_at);
      if (Number.isNaN(when.getTime())) return apiBadRequest('Invalid closing time');
      if (when.getTime() <= Date.now()) return apiBadRequest('Closing time must be in the future');
      closes_at = when.toISOString();
    }

    const { userId } = await requireAuthSupabase();
    if (!(await isGroupMember(group_id, userId))) {
      return apiForbidden('Join the group to start a poll');
    }

    const admin = createAdminClient();
    type PollInsert = Database['public']['Tables']['group_polls']['Insert'];
    const pollInsert: PollInsert = {
      group_id,
      user_id: userId,
      question,
      allow_multiple: Boolean(body.allow_multiple),
      allow_member_options: Boolean(body.allow_member_options),
      closes_at,
    };
    const { data: poll, error: pollError } = await admin
      .from('group_polls')
      .insert(pollInsert as any)
      .select('*')
      .single<PollRow>();
    if (pollError || !poll) {
      console.error('[GroupPolls][POST] insert error:', pollError?.message);
      return apiError(pollError ?? new Error('No poll returned'), 'Failed to create poll');
    }

    type OptionInsert = Database['public']['Tables']['group_poll_options']['Insert'];
    const optionRows: OptionInsert[] = options.map((label, position) => ({
      poll_id: poll.id,
      user_id: userId,
      label,
      position,
    }));
    const { error: optionsError } = await admin.from('group_poll_options').insert(optionRows as any);
    if (optionsError) {
      // No transaction across the two inserts: undo the poll so a question
      // without options never shows up.
      console.error('[GroupPolls][POST] options insert error:', optionsError.message);
      await admin.from('group_polls').delete().eq('id', poll.id);
      return apiError(optionsError, 'Failed to create poll');
    }

    return NextResponse.json(poll, { status: 201 });
  } catch (err) {
    return apiError(err, 'Failed to create poll');
  }
}

/** Close a poll early. */
export async function PATCH(req: Request) {
  try {
    const body: { id?: string; close?: boolean } = await req.json();
    const id = (body.id || '').trim();
    if (!UUID_PATTERN.test(id) || body.close !== true) return apiBadRequest('Missing id');

    const { userId } = await requireAuthSupabase();
    const admin = createAdminClient();
    const { data: poll, error } = await admin.from('group_polls').select('*').eq('id', id).maybeSingle<PollRow>();
    if (error) {
      console.error('[GroupPolls][PATCH] lookup error:', error.message);
      return apiError(error, 'Failed to close poll');
    }
    if (!poll) return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    if (!(await canManage(userId, poll.user_id))) throw new Error('Forbidden');

    const { error: updateError } = await admin
      .from('group_polls')
      .update({ closed_at: new Date().toISOString() } as never)
      .eq('id', id);
    if (updateError) {
      console.error('[GroupPolls][PATCH] update error:', updateError.message);
      return apiError(updateError, 'Failed to close poll');
    }
    return NextResponse.json({ id }, { status: 200 });
  } catch (err) {
    return apiError(err, 'Failed to close poll');
  }
}

export async function DELETE(req: Request) {
  try {
    const id = (new URL(req.url).searchParams.get('id') || '').trim();
    if (!UUID_PATTERN.test(id)) return apiBadRequest('Missing id');

    const { userId } = await requireAuthSupabase();
    const admin = createAdminClient();
    const { data: poll, error } = await admin.from('group_polls').select('*').eq('id', id).maybeSingle<PollRow>();
    if (error) {
      console.error('[GroupPolls][DELETE] lookup error:', error.message);
      return apiError(error, 'Failed to delete poll');
    }
    if (!poll) return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    if (!(await canManage(userId, poll.user_id))) throw new Error('Forbidden');

    // Options and votes cascade with it.
    const { error: deleteError } = await admin.from('group_polls').delete().eq('id', id);
    if (deleteError) {
      console.error('[GroupPolls][DELETE] error:', deleteError.message);
      return apiError(deleteError, 'Failed to delete poll');
    }
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return apiError(err, 'Failed to delete poll');
  }
}

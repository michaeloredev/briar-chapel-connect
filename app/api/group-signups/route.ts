import { NextResponse } from 'next/server';
import type { Database } from '@/lib/supabase/types';
import { requireAuthSupabase } from '@/lib/supabase/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiError, apiBadRequest, apiForbidden } from '@/lib/api/response';
import { canManage, isGroupMember, UUID_PATTERN } from '@/lib/api/group-membership';
import { SIGNUP_LIMITS } from '@/lib/data/group-activity';

type SignupRow = Database['public']['Tables']['group_signups']['Row'];

type PostBody = {
  group_id?: string;
  title?: string;
  description?: string | null;
  /** A missing or null capacity makes the slot unlimited. */
  slots?: Array<{ label?: string; capacity?: number | null }>;
};

// Writes go through the service-role client: these tables deliberately have no
// RLS write policy, so membership and ownership are checked here first.
export async function POST(req: Request) {
  try {
    const body: PostBody = await req.json();
    const group_id = (body.group_id || '').trim();
    const title = (body.title || '').trim();
    const description = (body.description || '').trim() || null;
    const slots = (Array.isArray(body.slots) ? body.slots : [])
      .map((s) => ({
        label: String(s?.label ?? '').trim(),
        capacity: s?.capacity == null ? null : Number(s.capacity),
      }))
      .filter((s) => s.label);

    if (!UUID_PATTERN.test(group_id) || !title) return apiBadRequest('Missing required fields');
    if (title.length > SIGNUP_LIMITS.title) return apiBadRequest('Title is too long');
    if (description && description.length > SIGNUP_LIMITS.description) return apiBadRequest('Description is too long');
    if (slots.length < SIGNUP_LIMITS.minSlots) return apiBadRequest('Add at least one slot');
    if (slots.length > SIGNUP_LIMITS.maxSlots) return apiBadRequest(`A sheet can have at most ${SIGNUP_LIMITS.maxSlots} slots`);
    if (slots.some((s) => s.label.length > SIGNUP_LIMITS.slotLabel)) return apiBadRequest('A slot name is too long');
    if (slots.some((s) => s.capacity !== null && (!Number.isInteger(s.capacity) || s.capacity < 1 || s.capacity > SIGNUP_LIMITS.maxCapacity))) {
      return apiBadRequest(`Spots must be between 1 and ${SIGNUP_LIMITS.maxCapacity}, or left unlimited`);
    }

    const { userId } = await requireAuthSupabase();
    if (!(await isGroupMember(group_id, userId))) {
      return apiForbidden('Join the group to start a sign-up');
    }

    const admin = createAdminClient();
    type SignupInsert = Database['public']['Tables']['group_signups']['Insert'];
    const signupInsert: SignupInsert = { group_id, user_id: userId, title, description };
    const { data: signup, error: signupError } = await admin
      .from('group_signups')
      .insert(signupInsert as any)
      .select('*')
      .single<SignupRow>();
    if (signupError || !signup) {
      console.error('[GroupSignups][POST] insert error:', signupError?.message);
      return apiError(signupError ?? new Error('No sign-up returned'), 'Failed to create sign-up');
    }

    type SlotInsert = Database['public']['Tables']['group_signup_slots']['Insert'];
    const slotRows: SlotInsert[] = slots.map((s, position) => ({
      signup_id: signup.id,
      label: s.label,
      capacity: s.capacity,
      position,
    }));
    const { error: slotsError } = await admin.from('group_signup_slots').insert(slotRows as any);
    if (slotsError) {
      // No transaction across the two inserts: undo the sheet so one without
      // slots never shows up.
      console.error('[GroupSignups][POST] slots insert error:', slotsError.message);
      await admin.from('group_signups').delete().eq('id', signup.id);
      return apiError(slotsError, 'Failed to create sign-up');
    }

    return NextResponse.json(signup, { status: 201 });
  } catch (err) {
    return apiError(err, 'Failed to create sign-up');
  }
}

/** Close a sheet so no one else can claim a spot. */
export async function PATCH(req: Request) {
  try {
    const body: { id?: string; close?: boolean } = await req.json();
    const id = (body.id || '').trim();
    if (!UUID_PATTERN.test(id) || body.close !== true) return apiBadRequest('Missing id');

    const { userId } = await requireAuthSupabase();
    const admin = createAdminClient();
    const { data: signup, error } = await admin.from('group_signups').select('*').eq('id', id).maybeSingle<SignupRow>();
    if (error) {
      console.error('[GroupSignups][PATCH] lookup error:', error.message);
      return apiError(error, 'Failed to close sign-up');
    }
    if (!signup) return NextResponse.json({ error: 'Sign-up not found' }, { status: 404 });
    if (!(await canManage(userId, signup.user_id, signup.group_id))) throw new Error('Forbidden');

    const { error: updateError } = await admin
      .from('group_signups')
      .update({ closed_at: new Date().toISOString() } as never)
      .eq('id', id);
    if (updateError) {
      console.error('[GroupSignups][PATCH] update error:', updateError.message);
      return apiError(updateError, 'Failed to close sign-up');
    }
    return NextResponse.json({ id }, { status: 200 });
  } catch (err) {
    return apiError(err, 'Failed to close sign-up');
  }
}

export async function DELETE(req: Request) {
  try {
    const id = (new URL(req.url).searchParams.get('id') || '').trim();
    if (!UUID_PATTERN.test(id)) return apiBadRequest('Missing id');

    const { userId } = await requireAuthSupabase();
    const admin = createAdminClient();
    const { data: signup, error } = await admin.from('group_signups').select('*').eq('id', id).maybeSingle<SignupRow>();
    if (error) {
      console.error('[GroupSignups][DELETE] lookup error:', error.message);
      return apiError(error, 'Failed to delete sign-up');
    }
    if (!signup) return NextResponse.json({ error: 'Sign-up not found' }, { status: 404 });
    if (!(await canManage(userId, signup.user_id, signup.group_id))) throw new Error('Forbidden');

    // Slots and claims cascade with it.
    const { error: deleteError } = await admin.from('group_signups').delete().eq('id', id);
    if (deleteError) {
      console.error('[GroupSignups][DELETE] error:', deleteError.message);
      return apiError(deleteError, 'Failed to delete sign-up');
    }
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return apiError(err, 'Failed to delete sign-up');
  }
}

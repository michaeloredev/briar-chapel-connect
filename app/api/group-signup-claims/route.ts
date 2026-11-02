import { NextResponse } from 'next/server';
import type { Database } from '@/lib/supabase/types';
import { requireAuthSupabase } from '@/lib/supabase/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiError, apiBadRequest, apiForbidden } from '@/lib/api/response';
import { isGroupMember, isOpen, UUID_PATTERN } from '@/lib/api/group-membership';
import { SIGNUP_LIMITS } from '@/lib/data/group-activity';

type SlotRow = Database['public']['Tables']['group_signup_slots']['Row'];
type SignupRow = Database['public']['Tables']['group_signups']['Row'];

/** Claim a spot in a slot. Capacity is enforced by a trigger on the table. */
export async function POST(req: Request) {
  try {
    const body: { slot_id?: string; note?: string | null } = await req.json();
    const slot_id = (body.slot_id || '').trim();
    const note = (body.note || '').trim() || null;
    if (!UUID_PATTERN.test(slot_id)) return apiBadRequest('Missing slot_id');
    if (note && note.length > SIGNUP_LIMITS.note) return apiBadRequest('Note is too long');

    const { userId } = await requireAuthSupabase();
    const admin = createAdminClient();

    const { data: slot, error: slotError } = await admin
      .from('group_signup_slots')
      .select('*')
      .eq('id', slot_id)
      .maybeSingle<SlotRow>();
    if (slotError) {
      console.error('[GroupSignupClaims][POST] slot lookup error:', slotError.message);
      return apiError(slotError, 'Failed to sign up');
    }
    if (!slot) return NextResponse.json({ error: 'Slot not found' }, { status: 404 });

    const { data: signup, error: signupError } = await admin
      .from('group_signups')
      .select('*')
      .eq('id', slot.signup_id)
      .maybeSingle<SignupRow>();
    if (signupError || !signup) {
      console.error('[GroupSignupClaims][POST] sign-up lookup error:', signupError?.message);
      return apiError(signupError ?? new Error('Sign-up missing'), 'Failed to sign up');
    }
    if (!(await isGroupMember(signup.group_id, userId))) return apiForbidden('Join the group to sign up');
    if (!isOpen(signup)) return apiBadRequest('This sign-up is closed');

    type Insert = Database['public']['Tables']['group_signup_claims']['Insert'];
    const insert: Insert = { slot_id, user_id: userId, note };
    const { data, error } = await admin.from('group_signup_claims').insert(insert as any).select('id').single<{ id: string }>();
    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: "You're already signed up for that slot" }, { status: 409 });
      }
      if (error.code === '23514') {
        return NextResponse.json({ error: 'That slot is full' }, { status: 409 });
      }
      console.error('[GroupSignupClaims][POST] insert error:', error.message);
      return apiError(error, 'Failed to sign up');
    }
    return NextResponse.json({ id: data?.id }, { status: 201 });
  } catch (err) {
    return apiError(err, 'Failed to sign up');
  }
}

/** Drop the caller's own spot. */
export async function DELETE(req: Request) {
  try {
    const slot_id = (new URL(req.url).searchParams.get('slot_id') || '').trim();
    if (!UUID_PATTERN.test(slot_id)) return apiBadRequest('Missing slot_id');

    const { userId } = await requireAuthSupabase();
    const { data: deleted, error } = await createAdminClient()
      .from('group_signup_claims')
      .delete()
      .eq('slot_id', slot_id)
      .eq('user_id', userId)
      .select('id');
    if (error) {
      console.error('[GroupSignupClaims][DELETE] error:', error.message);
      return apiError(error, 'Failed to drop out');
    }
    if (!deleted || deleted.length === 0) {
      return NextResponse.json({ error: "You're not signed up for that slot" }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return apiError(err, 'Failed to drop out');
  }
}

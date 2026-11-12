import { NextResponse } from 'next/server';
import { requireAuthSupabase } from '@/lib/supabase/auth';
import type { Database } from '@/lib/supabase/types';
import { apiError, apiBadRequest, apiForbidden } from '@/lib/api/response';
import { loadGroupPrivacy } from '@/lib/api/group-membership';

export async function POST(req: Request) {
  try {
    const body: { group_id?: string } = await req.json();
    const group_id = (body.group_id || '').trim();
    if (!group_id) return apiBadRequest('Missing group_id');

    const { supabase, userId } = await requireAuthSupabase();

    // RLS refuses a private group anyway; this turns that into a message the
    // page can act on instead of a bare policy error.
    const group = await loadGroupPrivacy(group_id);
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });
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

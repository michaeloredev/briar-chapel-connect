import { NextResponse } from 'next/server';
import { requireAuthSupabase } from '@/lib/supabase/auth';
import type { Database } from '@/lib/supabase/types';

type PostBody = {
  group_id?: string;
};

export async function POST(req: Request) {
  try {
    const body: PostBody = await req.json();
    const group_id = (body.group_id || '').trim();
    if (!group_id) {
      return NextResponse.json({ error: 'Missing group_id' }, { status: 400 });
    }
    const { supabase, userId } = await requireAuthSupabase();
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
      .single();
    if (error) {
      // Likely already a member or constraint violation
      return NextResponse.json({ error: error.message || 'Failed to join group' }, { status: 400 });
    }
    return NextResponse.json({ id: data?.id }, { status: 201 });
  } catch (err: any) {
    if (err?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to join group' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const group_id = (url.searchParams.get('group_id') || '').trim();
    if (!group_id) {
      return NextResponse.json({ error: 'Missing group_id' }, { status: 400 });
    }
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
  } catch (err: any) {
    if (err?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to leave group' }, { status: 500 });
  }
}



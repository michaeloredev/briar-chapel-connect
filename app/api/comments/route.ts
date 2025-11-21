import { NextResponse } from 'next/server';
import type { Database } from '@/lib/supabase/types';
import { requireAuthSupabase } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';

type GetQuery = {
  entity_type?: string;
  entity_id?: string;
};

type PostBody = {
  entity_type?: string;
  entity_id?: string;
  parent_id?: string | null;
  content?: string;
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const entity_type = (url.searchParams.get('entity_type') || '').trim();
  const entity_id = (url.searchParams.get('entity_id') || '').trim();
  if (!entity_type || !entity_id) {
    return NextResponse.json({ error: 'Missing entity_type or entity_id' }, { status: 400 });
  }
  const supabase = await createClient();
  type Row = Database['public']['Tables']['comments']['Row'];
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('entity_type', entity_type)
    .eq('entity_id', entity_id)
    .order('created_at', { ascending: true })
    .returns<Row[]>();
  if (error) {
    console.error('[Comments][GET] error:', error.message);
    return NextResponse.json({ error: 'Failed to load comments' }, { status: 500 });
  }
  return NextResponse.json(data ?? [], { status: 200 });
}

export async function POST(req: Request) {
  try {
    const body: PostBody = await req.json();
    const entity_type = (body.entity_type || '').trim();
    const entity_id = (body.entity_id || '').trim();
    const parent_id = (body.parent_id || '')?.trim() || null;
    const content = (body.content || '').trim();
    if (!entity_type || !entity_id || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const { supabase, userId } = await requireAuthSupabase();
    type Insert = Database['public']['Tables']['comments']['Insert'];
    const insert: Insert = {
      user_id: userId,
      entity_type,
      entity_id,
      parent_id,
      content,
    };
    const { data, error } = await supabase
      .from('comments')
      .insert(insert as any)
      .select('*')
      .single();
    if (error) {
      console.error('[Comments][POST] insert error:', error.message);
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error('[Comments][POST] unhandled error:', err?.message);
    if (err?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = (url.searchParams.get('id') || '').trim();
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    const { supabase, userId } = await requireAuthSupabase();
    const { data: deleted, error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select('id');
    if (error) {
      console.error('[Comments][DELETE] error:', error.message);
      return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
    }
    if (!deleted || deleted.length === 0) {
      return NextResponse.json({ error: 'Comment not found or not owned by user' }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (err: any) {
    console.error('[Comments][DELETE] unhandled error:', err?.message);
    if (err?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}



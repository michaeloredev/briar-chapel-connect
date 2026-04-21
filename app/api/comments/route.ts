import { NextResponse } from 'next/server';
import type { Database } from '@/lib/supabase/types';
import { requireAuthSupabase } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';
import { apiError, apiBadRequest } from '@/lib/api/response';

type PostBody = {
  entity_type?: string;
  entity_id?: string;
  parent_id?: string | null;
  content?: string;
  images?: string[];
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const entity_type = (url.searchParams.get('entity_type') || '').trim();
  const entity_id = (url.searchParams.get('entity_id') || '').trim();
  if (!entity_type || !entity_id) {
    return apiBadRequest('Missing entity_type or entity_id');
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
    return apiError(error, 'Failed to load comments');
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
    const images = Array.isArray(body.images) ? body.images.slice(0, 5) : [];

    if (!entity_type || !entity_id || !content) {
      return apiBadRequest('Missing required fields');
    }

    const { supabase, userId } = await requireAuthSupabase();
    type Insert = Database['public']['Tables']['comments']['Insert'];
    const insert: Insert = {
      user_id: userId,
      entity_type,
      entity_id,
      parent_id,
      content,
      images,
    };

    const { data, error } = await supabase
      .from('comments')
      .insert(insert as any)
      .select('*')
      .single();

    if (error) {
      console.error('[Comments][POST] insert error:', error.message);
      return apiError(error, 'Failed to create comment');
    }
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return apiError(err, 'Failed to create comment');
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = (url.searchParams.get('id') || '').trim();
    if (!id) return apiBadRequest('Missing id');

    const { supabase, userId } = await requireAuthSupabase();
    const { data: deleted, error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select('id');

    if (error) {
      console.error('[Comments][DELETE] error:', error.message);
      return apiError(error, 'Failed to delete comment');
    }
    if (!deleted || deleted.length === 0) {
      return NextResponse.json({ error: 'Comment not found or not owned by user' }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return apiError(err, 'Failed to delete comment');
  }
}

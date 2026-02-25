import { NextResponse } from 'next/server';
import type { Database } from '@/lib/supabase/types';
import { requireAuthSupabase } from '@/lib/supabase/auth';

type Payload = {
  title?: string;
  description?: string;
  type?: string;
  location?: string | null;
  image_url?: string | null;
};

export async function POST(req: Request) {
  try {
    const body: Payload = await req.json();
    const title = (body.title || '').trim();
    const description = (body.description || '').trim();
    const type = (body.type || '').trim();
    const location = (body.location || '')?.trim() || null;
    const image_url = (body.image_url || '')?.trim() || null;
    if (!title || !description || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const { supabase, userId } = await requireAuthSupabase();
    type Insert = Database['public']['Tables']['groups']['Insert'];
    const insert: Insert = {
      user_id: userId,
      title,
      description,
      type,
      location,
      status: 'active',
      image_url,
    };
    const { data, error } = await supabase
      .from('groups')
      .insert(insert as any)
      .select('*')
      .single();
    if (error) {
      console.error('[Groups][POST] insert error:', error.message);
      return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error('[Groups][POST] unhandled error:', err?.message);
    if (err?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  }
}



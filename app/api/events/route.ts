import { NextResponse } from 'next/server';
import type { Database } from '@/lib/supabase/types';
import { requireAuthSupabase } from '@/lib/supabase/auth';

type Payload = {
  title?: string;
  description?: string;
  category?: string;
  event_date?: string; // ISO
  end_date?: string | null; // ISO
  location?: string;
  address?: string | null;
  max_attendees?: number | null;
  image_url?: string | null;
};

export async function POST(req: Request) {
  try {
    const body: Payload = await req.json();
    const title = (body.title || '').trim();
    const description = (body.description || '').trim() || null;
    const category = (body.category || 'general').trim() || 'general';
    const event_date = (body.event_date || '').trim();
    const end_date = (body.end_date || '')?.trim() || null;
    const location = (body.location || 'Briar Chapel').trim() || 'Briar Chapel';
    const address = (body.address || '')?.trim() || null;
    const max_attendees =
      typeof body.max_attendees === 'number' && Number.isFinite(body.max_attendees) ? body.max_attendees : null;
    const image_url = (body.image_url || '')?.trim() || null;

    if (!title) {
      return NextResponse.json({ error: 'Missing title' }, { status: 400 });
    }
    if (!event_date) {
      return NextResponse.json({ error: 'Missing event_date' }, { status: 400 });
    }

    const { supabase, userId } = await requireAuthSupabase();
    type Insert = Database['public']['Tables']['events']['Insert'];
    const insert: Insert = {
      user_id: userId,
      title,
      description: description || '',
      category,
      event_date,
      end_date,
      location,
      address,
      max_attendees,
      status: 'upcoming',
      image_url,
    };

    const { data, error } = await supabase
      .from('events')
      .insert(insert as any)
      .select('*')
      .single();

    if (error) {
      console.error('[Events][POST] Supabase insert error:', {
        message: error.message,
        details: (error as any)?.details,
        hint: (error as any)?.hint,
        code: (error as any)?.code,
      });
      return NextResponse.json(
        { error: 'Failed to create event', ...(process.env.NODE_ENV !== 'production' ? { debug: error.message } : {}) },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error('[Events][POST] Unhandled error:', { message: err?.message, stack: err?.stack });
    if (err?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to create event', ...(process.env.NODE_ENV !== 'production' ? { debug: err?.message } : {}) },
      { status: 500 }
    );
  }
}



import { NextResponse } from 'next/server';
import type { Database } from '@/lib/supabase/types';
import { requireAuthSupabase } from '@/lib/supabase/auth';
import { apiError, apiBadRequest } from '@/lib/api/response';

type Payload = {
  title?: string;
  description?: string;
  category?: string;
  event_date?: string;
  end_date?: string | null;
  location?: string;
  address?: string | null;
  max_attendees?: number | null;
  image_url?: string | null;
  group_id?: string | null;
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
      typeof body.max_attendees === 'number' && Number.isFinite(body.max_attendees)
        ? body.max_attendees
        : null;
    const image_url = (body.image_url || '')?.trim() || null;
    const group_id = (body.group_id || '')?.trim() || null;

    if (!title) return apiBadRequest('Missing title');
    if (!event_date) return apiBadRequest('Missing event_date');

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
      group_id,
    };

    const { data, error } = await supabase
      .from('events')
      .insert(insert as any)
      .select('*')
      .single();

    if (error) {
      console.error('[Events][POST] insert error:', error.message);
      return apiError(error, 'Failed to create event');
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return apiError(err, 'Failed to create event');
  }
}

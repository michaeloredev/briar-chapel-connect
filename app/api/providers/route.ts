import { NextResponse } from 'next/server';
import type { Database } from '@/lib/supabase/types';
import { requireAuthSupabase } from '@/lib/supabase/auth';
import { requireRole } from '@/lib/auth/roles';
import { apiError, apiBadRequest } from '@/lib/api/response';

type Payload = {
  category?: string;
  service?: string;
  name?: string;
  summary?: string;
  details?: string;
  tags?: string[];
  contact_email?: string | null;
  contact_phone?: string | null;
  image_url?: string | null;
  location?: string | null;
  website?: string | null;
};

export async function POST(req: Request) {
  try {
    const body: Payload = await req.json();
    const category = (body.category || '').trim();
    const service = (body.service || '').trim();
    const name = (body.name || '').trim();
    const summary = (body.summary || '').trim();
    const details = (body.details || '').trim();
    const website = (body.website || '')?.trim() || null;
    const locationFromBody = (body.location || '')?.trim() || null;
    const contact_email = body.contact_email ?? null;
    const contact_phone = body.contact_phone ?? null;

    if (!category || !service || !name) {
      return apiBadRequest('category, service, and name are required');
    }

    const { supabase, userId } = await requireAuthSupabase();
    await requireRole(userId, 'superadmin');
    type ServiceInsert = Database['public']['Tables']['services']['Insert'];
    const insert: ServiceInsert = {
      user_id: userId,
      title: name,
      summary: summary || null,
      details: details || null,
      category: `${category}/${service}`,
      contact_email,
      contact_phone,
      location: locationFromBody || null,
      website,
      status: 'active',
      image_url: body.image_url ?? null,
    };

    const { data, error } = await supabase
      .from('services')
      .insert(insert as any)
      .select('*')
      .single();

    if (error) {
      console.error('[Providers][POST] insert error:', error.message);
      return apiError(error, 'Failed to create provider');
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return apiError(err, 'Failed to create provider');
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id')?.trim();
    if (!id) return apiBadRequest('Missing id');

    const { supabase, userId } = await requireAuthSupabase();
    await requireRole(userId, 'superadmin');
    const { data: deleted, error } = await supabase
      .from('services')
      .delete()
      .eq('id', id)
      .select('id');

    if (error) {
      console.error('[Providers][DELETE] error:', error.message);
      return apiError(error, 'Failed to delete provider');
    }
    if (!deleted || deleted.length === 0) {
      return NextResponse.json({ error: 'Provider not found or not owned by user' }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return apiError(err, 'Failed to delete provider');
  }
}

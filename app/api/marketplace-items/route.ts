import { NextResponse } from 'next/server';
import type { Database } from '@/lib/supabase/types';
import { requireAuthSupabase } from '@/lib/supabase/auth';
import { apiError, apiBadRequest } from '@/lib/api/response';

type Payload = {
  title?: string;
  description?: string;
  category?: string;
  price?: number;
  condition?: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  location?: string;
  images?: string[];
  contact?: string;
};

export async function POST(req: Request) {
  try {
    const body: Payload = await req.json();
    const title = (body.title || '').trim();
    const description = (body.description || '').trim();
    const category = (body.category || 'general').trim() || 'general';
    const price = Number(body.price || 0);
    const condition = body.condition ?? 'good';
    const location = (body.location || 'Briar Chapel').trim() || 'Briar Chapel';
    const images = Array.isArray(body.images) ? body.images.slice(0, 3) : [];
    const contact = (body.contact || '').trim() || null;

    if (!title) return apiBadRequest('Missing title');
    if (!Number.isFinite(price) || price < 0) return apiBadRequest('Invalid price');

    const { supabase, userId } = await requireAuthSupabase();
    type Insert = Database['public']['Tables']['marketplace_items']['Insert'];
    const insert: Insert = {
      user_id: userId,
      title,
      description,
      category,
      price,
      condition,
      location,
      status: 'available',
      images: images as any,
      contact,
    };

    const { data, error } = await supabase
      .from('marketplace_items')
      .insert(insert as any)
      .select('*')
      .single();

    if (error) {
      console.error('[MarketplaceItems][POST] insert error:', error.message);
      return apiError(error, 'Failed to create item');
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return apiError(err, 'Failed to create item');
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id')?.trim();
    if (!id) return apiBadRequest('Missing id');

    const { supabase, userId } = await requireAuthSupabase();
    const { data: deleted, error } = await supabase
      .from('marketplace_items')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select('id');

    if (error) {
      console.error('[MarketplaceItems][DELETE] error:', error.message);
      return apiError(error, 'Failed to delete item');
    }
    if (!deleted || deleted.length === 0) {
      return NextResponse.json({ error: 'Item not found or not owned by user' }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return apiError(err, 'Failed to delete item');
  }
}

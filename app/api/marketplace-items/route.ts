import { NextResponse } from 'next/server';
import type { Database } from '@/lib/supabase/types';
import { requireAuthSupabase } from '@/lib/supabase/auth';

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
    const images = Array.isArray(body.images) ? body.images.slice(0, 5) : [];
    const contact = (body.contact || '').trim() || null;

    // Debug: payload summary (avoid logging large arrays)
    console.log('[MarketplaceItems][POST] Incoming payload summary:', {
      hasTitle: Boolean(title),
      hasDescription: Boolean(description),
      category,
      price,
      condition,
      location,
      imagesCount: images.length,
      hasContact: Boolean(contact),
    });

    if (!title) {
      return NextResponse.json({ error: 'Missing title' }, { status: 400 });
    }
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
    }

    const { supabase, userId } = await requireAuthSupabase();
    console.log('[MarketplaceItems][POST] Authenticated userId:', userId);
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
      console.error('[MarketplaceItems][POST] Supabase insert error:', {
        message: error.message,
        details: (error as any)?.details,
        hint: (error as any)?.hint,
        code: (error as any)?.code,
        insertPreview: { ...insert, images: `(${images.length} images)` },
      });
      return NextResponse.json(
        {
          error: 'Failed to create item',
          ...(process.env.NODE_ENV !== 'production'
            ? { debug: error.message, code: (error as any)?.code }
            : {}),
        },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error('[MarketplaceItems][POST] Unhandled error:', {
      message: err?.message,
      stack: err?.stack,
    });
    if (err?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      {
        error: 'Failed to create item',
        ...(process.env.NODE_ENV !== 'production' ? { debug: err?.message } : {}),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id')?.trim();
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    const { supabase, userId } = await requireAuthSupabase();
    const { data: deleted, error } = await supabase
      .from('marketplace_items')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select('id');
    if (error) {
      console.error('Supabase delete item error:', error);
      return NextResponse.json({ error: error.message || 'Failed to delete item' }, { status: 500 });
    }
    if (!deleted || deleted.length === 0) {
      return NextResponse.json({ error: 'Item not found or not owned by user' }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (err: any) {
    console.error('Delete marketplace item error:', err);
    if (err?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}



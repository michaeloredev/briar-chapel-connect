import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import type { Database } from '@/lib/supabase/types';
import { requireAuthSupabase } from '@/lib/supabase/auth';

type Payload = {
  service_id?: string;
  rating?: number;
  comment?: string;
};

export async function POST(req: Request) {
  try {
    const body: Payload = await req.json();
    const service_id = (body.service_id || '').trim();
    const rating = Number(body.rating || 0);
    const comment = (body.comment || '').trim();

    if (!service_id) {
      return NextResponse.json({ error: 'Missing service_id' }, { status: 400 });
    }
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'rating must be between 1 and 5' }, { status: 400 });
    }
    if (comment && comment.length > 2000) {
      return NextResponse.json({ error: 'comment too long (max 2000 chars)' }, { status: 400 });
    }

    const { supabase, userId } = await requireAuthSupabase();

    // Ensure service exists and is active
    type ServiceStatusRow = { id: string; status: 'active' | 'inactive' };
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('id, status')
      .eq('id', service_id)
      .returns<ServiceStatusRow[]>()
      .single();
    if (serviceError || !service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }
    if (service.status !== 'active') {
      return NextResponse.json({ error: 'Service is not active' }, { status: 400 });
    }

    // Fetch display name from Clerk
    let author_name: string | null = null;
    // Try currentUser() first (works well in API routes)
    try {
      const user = await currentUser();
      if (user) {
        const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
        const primaryEmail =
          user.emailAddresses?.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ||
          user.emailAddresses?.[0]?.emailAddress;
        author_name = (fullName || user.username || primaryEmail || '').trim() || null;
      }
    } catch {}
    // If still missing, keep null (will render "Anonymous" on the client)

    type Insert = Database['public']['Tables']['service_reviews']['Insert'];
    const insert: Insert = {
      service_id,
      user_id: userId,
      rating,
      comment: comment || null,
      author_name,
    };

    const { data, error } = await supabase
      .from('service_reviews')
      .insert(insert as any)
      .select('*')
      .single();

    if (error) {
      console.error('Supabase insert review error:', error);
      return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error('Create review error:', err);
    if (err?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}



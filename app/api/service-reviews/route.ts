import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import type { Database } from '@/lib/supabase/types';
import { requireAuthSupabase } from '@/lib/supabase/auth';
import { apiError, apiBadRequest } from '@/lib/api/response';

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

    if (!service_id) return apiBadRequest('Missing service_id');
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return apiBadRequest('rating must be between 1 and 5');
    }
    if (comment && comment.length > 2000) {
      return apiBadRequest('comment too long (max 2000 chars)');
    }

    const { supabase, userId } = await requireAuthSupabase();

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
      return apiBadRequest('Service is not active');
    }

    let author_name: string | null = null;
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
      .upsert(insert as any, {
        onConflict: 'service_id,user_id',
        ignoreDuplicates: false,
      })
      .select('*')
      .single();

    if (error) {
      console.error('[ServiceReviews][POST] upsert error:', error.message);
      return apiError(error, 'Failed to submit review');
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    return apiError(err, 'Failed to submit review');
  }
}

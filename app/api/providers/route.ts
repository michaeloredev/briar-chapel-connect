import { NextResponse } from 'next/server';
import type { Database } from '@/lib/supabase/types';
import { requireAuthSupabase } from '@/lib/supabase/auth';
import { requireRole } from '@/lib/auth/roles';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiError, apiBadRequest } from '@/lib/api/response';
import { removeStorageObjects, storageObjectPath } from '@/lib/api/upload';

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

type PatchPayload = {
  id?: string;
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

function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return tags
    .filter((t): t is string => typeof t === 'string')
    .map((t) => t.trim())
    .filter(Boolean);
}

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

    const { userId } = await requireAuthSupabase();
    await requireRole(userId, 'superadmin');
    // RLS grants no write on this table to anon or authenticated, so the
    // insert goes through the service role -- authorized by the check above.
    const admin = createAdminClient();
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
      tags: normalizeTags(body.tags),
    };

    const { data, error } = await admin
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

export async function PATCH(req: Request) {
  try {
    const body: PatchPayload = await req.json();
    const id = (body.id || '').trim();
    if (!id) return apiBadRequest('Missing id');

    const { userId } = await requireAuthSupabase();
    await requireRole(userId, 'superadmin');

    // Only write the keys the caller actually sent. Coercing absent fields to
    // null meant a partial edit -- anything other than the full form -- blanked
    // the provider's contact details, location and website.
    type ServiceUpdate = Database['public']['Tables']['services']['Update'];
    const update: ServiceUpdate = {};

    if (body.name !== undefined) {
      const name = body.name.trim();
      if (!name) return apiBadRequest('name is required');
      update.title = name;
    }
    if (body.summary !== undefined) update.summary = body.summary.trim() || null;
    if (body.details !== undefined) update.details = body.details.trim() || null;
    if (body.contact_email !== undefined) update.contact_email = body.contact_email?.trim() || null;
    if (body.contact_phone !== undefined) update.contact_phone = body.contact_phone?.trim() || null;
    if (body.location !== undefined) update.location = body.location?.trim() || null;
    if (body.website !== undefined) update.website = body.website?.trim() || null;
    if (body.image_url !== undefined) update.image_url = body.image_url;
    if (body.tags !== undefined) update.tags = normalizeTags(body.tags);

    if (Object.keys(update).length === 0) return apiBadRequest('No fields to update');

    const admin = createAdminClient();

    // Read the logo being replaced before overwriting it, so the old object can
    // be removed once the row is updated. Skipped unless image_url is changing.
    let previousImageUrl: string | null = null;
    if (body.image_url !== undefined) {
      const { data: current, error: readError } = await admin
        .from('services')
        .select('image_url')
        .eq('id', id)
        .maybeSingle<{ image_url: string | null }>();

      if (readError) {
        if (readError.code === '22P02') return apiBadRequest('invalid id');
        console.error('[Providers][PATCH] read error:', readError.message);
        return apiError(readError, 'Failed to update provider');
      }
      if (!current) return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
      previousImageUrl = current.image_url;
    }

    const { data, error } = await admin
      .from('services')
      .update(update as never)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      // An unparseable uuid is the caller's mistake, not a server fault.
      if (error.code === '22P02') return apiBadRequest('invalid id');
      console.error('[Providers][PATCH] error:', error.message);
      return apiError(error, 'Failed to update provider');
    }
    if (!data) return NextResponse.json({ error: 'Provider not found' }, { status: 404 });

    // Best-effort, and only after the row is committed: a failed cleanup must
    // not fail the edit. Covers replacing a logo and clearing it (image_url
    // null), both of which previously left the file behind forever.
    const nextImageUrl = (data as { image_url: string | null }).image_url;
    if (previousImageUrl && previousImageUrl !== nextImageUrl) {
      const path = storageObjectPath(previousImageUrl, 'provider-logos');
      if (path) await removeStorageObjects('provider-logos', [path]);
    }

    return NextResponse.json(data);
  } catch (err) {
    return apiError(err, 'Failed to update provider');
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id')?.trim();
    if (!id) return apiBadRequest('Missing id');

    const { userId } = await requireAuthSupabase();
    await requireRole(userId, 'superadmin');
    const admin = createAdminClient();

    // Return image_url so the logo can be cleaned up. Reviews cascade through
    // the foreign key; storage has no such thing, so a deleted provider used to
    // leave its logo in the bucket permanently.
    const { data: deleted, error } = await admin
      .from('services')
      .delete()
      .eq('id', id)
      .select('id, image_url');

    if (error) {
      if (error.code === '22P02') return apiBadRequest('invalid id');
      console.error('[Providers][DELETE] error:', error.message);
      return apiError(error, 'Failed to delete provider');
    }
    if (!deleted || deleted.length === 0) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    const paths = deleted
      .map((row) => storageObjectPath(String((row as { image_url: string | null }).image_url ?? ''), 'provider-logos'))
      .filter((path): path is string => Boolean(path));
    if (paths.length > 0) await removeStorageObjects('provider-logos', paths);

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return apiError(err, 'Failed to delete provider');
  }
}

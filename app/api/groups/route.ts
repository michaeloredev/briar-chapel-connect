import { NextResponse } from 'next/server';
import type { Database } from '@/lib/supabase/types';
import { requireAuthSupabase } from '@/lib/supabase/auth';
import { requireRole } from '@/lib/auth/roles';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiError, apiBadRequest } from '@/lib/api/response';

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
      return apiBadRequest('Missing required fields');
    }

    const { userId } = await requireAuthSupabase();
    await requireRole(userId, 'admin');
    // RLS grants no write on this table to anon or authenticated, so the
    // insert goes through the service role -- authorized by the check above.
    const admin = createAdminClient();
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

    const { data, error } = await admin
      .from('groups')
      .insert(insert as any)
      .select('*')
      .single();

    if (error) {
      console.error('[Groups][POST] insert error:', error.message);
      return apiError(error, 'Failed to create group');
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return apiError(err, 'Failed to create group');
  }
}

type PatchPayload = Payload & { id?: string; status?: string };

/**
 * Edit a group. Admin and above, any group -- same reasoning as events: only
 * admins can create one, so the same people can correct it.
 *
 * Only the keys present in the request body are written, so a partial edit
 * cannot blank the fields it does not carry.
 */
export async function PATCH(req: Request) {
  try {
    const body: PatchPayload = await req.json();
    const id = (body.id || '').trim();
    if (!id) return apiBadRequest('Missing id');

    const { userId } = await requireAuthSupabase();
    await requireRole(userId, 'admin');

    type GroupUpdate = Database['public']['Tables']['groups']['Update'];
    const update: GroupUpdate = {};

    if (body.title !== undefined) {
      const title = body.title.trim();
      if (!title) return apiBadRequest('title cannot be empty');
      update.title = title;
    }
    if (body.description !== undefined) {
      const description = body.description.trim();
      if (!description) return apiBadRequest('description cannot be empty');
      update.description = description;
    }
    if (body.type !== undefined) {
      const type = body.type.trim();
      if (!type) return apiBadRequest('type cannot be empty');
      update.type = type;
    }
    if (body.location !== undefined) update.location = body.location?.trim() || null;
    if (body.image_url !== undefined) update.image_url = body.image_url;
    if (body.status !== undefined) {
      const allowed = ['active', 'inactive'] as const;
      type GroupStatus = (typeof allowed)[number];
      if (!(allowed as readonly string[]).includes(body.status)) {
        return apiBadRequest('invalid status');
      }
      update.status = body.status as GroupStatus;
    }

    if (Object.keys(update).length === 0) return apiBadRequest('No fields to update');

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('groups')
      .update(update as never)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      if (error.code === '22P02') return apiBadRequest('invalid id');
      console.error('[Groups][PATCH] error:', error.message);
      return apiError(error, 'Failed to update group');
    }
    if (!data) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    return NextResponse.json(data);
  } catch (err) {
    return apiError(err, 'Failed to update group');
  }
}

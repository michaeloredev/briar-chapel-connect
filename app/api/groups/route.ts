import { NextResponse } from 'next/server';
import type { Database } from '@/lib/supabase/types';
import { requireAuthSupabase } from '@/lib/supabase/auth';
import { requireRole } from '@/lib/auth/roles';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiError, apiBadRequest } from '@/lib/api/response';
import { deleteEntityComments } from '@/lib/api/comments';
import { publicImagePath, removeStorageObjects, storageObjectPath } from '@/lib/api/upload';
import { isGroupIcon } from '@/lib/data/group-icon-meta';

const IMAGE_BUCKET = 'group-images';

/**
 * Normalize an incoming picture: null clears it, anything else must be an
 * object in the group-images bucket (as /api/uploads/group-image returns), so
 * a group can't be pointed at an arbitrary external URL.
 */
function parseImageUrl(value: string | null | undefined): { ok: true; value: string | null } | { ok: false } {
  const trimmed = (value || '').trim();
  if (!trimmed) return { ok: true, value: null };
  return publicImagePath(trimmed, IMAGE_BUCKET) ? { ok: true, value: trimmed } : { ok: false };
}

/** null clears the chosen icon (back to the type's); anything else must be a known key. */
function parseIcon(value: string | null | undefined): { ok: true; value: string | null } | { ok: false } {
  const trimmed = (value || '').trim();
  if (!trimmed) return { ok: true, value: null };
  return isGroupIcon(trimmed) ? { ok: true, value: trimmed } : { ok: false };
}

type Payload = {
  title?: string;
  description?: string;
  type?: string;
  location?: string | null;
  image_url?: string | null;
  icon?: string | null;
};

export async function POST(req: Request) {
  try {
    const body: Payload = await req.json();
    const title = (body.title || '').trim();
    const description = (body.description || '').trim();
    const type = (body.type || '').trim();
    const location = (body.location || '')?.trim() || null;
    const image = parseImageUrl(body.image_url);
    const icon = parseIcon(body.icon);

    if (!title || !description || !type) {
      return apiBadRequest('Missing required fields');
    }
    if (!image.ok) return apiBadRequest('invalid image');
    if (!icon.ok) return apiBadRequest('invalid icon');

    const { userId } = await requireAuthSupabase();
    await requireRole(userId, 'admin');
    // RLS grants no write on this table to anon or authenticated, so the
    // insert goes through the service role -- authorized by the check above.
    // The add_group_creator_as_owner trigger makes the creator the group's
    // owner in the same transaction, so there is no membership insert here.
    const admin = createAdminClient();
    type Insert = Database['public']['Tables']['groups']['Insert'];
    const insert: Insert = {
      user_id: userId,
      title,
      description,
      type,
      location,
      status: 'active',
      image_url: image.value,
      icon: icon.value,
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
    if (body.image_url !== undefined) {
      const image = parseImageUrl(body.image_url);
      if (!image.ok) return apiBadRequest('invalid image');
      update.image_url = image.value;
    }
    if (body.icon !== undefined) {
      const icon = parseIcon(body.icon);
      if (!icon.ok) return apiBadRequest('invalid icon');
      update.icon = icon.value;
    }
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

    // Remember the current picture so a replaced or removed one can be
    // deleted from storage once the update has gone through.
    let previousImage: string | null = null;
    if (update.image_url !== undefined) {
      const { data: current } = await admin.from('groups').select('image_url').eq('id', id).maybeSingle<{ image_url: string | null }>();
      previousImage = current?.image_url ?? null;
    }

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

    if (previousImage && previousImage !== update.image_url) {
      const path = storageObjectPath(previousImage, IMAGE_BUCKET);
      if (path) await removeStorageObjects(IMAGE_BUCKET, [path]);
    }

    return NextResponse.json(data);
  } catch (err) {
    return apiError(err, 'Failed to update group');
  }
}

/**
 * Delete a group. Admin and above, any group -- the same people who can
 * create and edit one. Memberships cascade through the foreign key. The
 * group's events are kept -- that key is ON DELETE SET NULL, so they stay on
 * the calendar as standalone events. Comments have no foreign key at all, so
 * their thread is removed separately afterwards.
 */
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id')?.trim();
    if (!id) return apiBadRequest('Missing id');

    const { userId } = await requireAuthSupabase();
    await requireRole(userId, 'admin');
    const admin = createAdminClient();

    // Return image_url so the picture can be removed from storage too.
    const { data: deleted, error } = await admin
      .from('groups')
      .delete()
      .eq('id', id)
      .select('id, image_url');

    if (error) {
      if (error.code === '22P02') return apiBadRequest('invalid id');
      console.error('[Groups][DELETE] error:', error.message);
      return apiError(error, 'Failed to delete group');
    }
    if (!deleted || deleted.length === 0) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    await deleteEntityComments(admin, 'group', id);
    const imagePaths = deleted
      .map((row) => storageObjectPath(String((row as { image_url: string | null }).image_url ?? ''), IMAGE_BUCKET))
      .filter((path): path is string => Boolean(path));
    await removeStorageObjects(IMAGE_BUCKET, imagePaths);

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return apiError(err, 'Failed to delete group');
  }
}

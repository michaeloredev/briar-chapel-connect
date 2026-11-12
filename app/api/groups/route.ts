import { NextResponse } from 'next/server';
import type { Database } from '@/lib/supabase/types';
import { requireAuthSupabase } from '@/lib/supabase/auth';
import { getUserRole, hasRole } from '@/lib/auth/roles';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiError, apiBadRequest } from '@/lib/api/response';
import { publicImagePath, removeStorageObjects, storageObjectPath } from '@/lib/api/upload';
import { deleteGroup, GROUP_IMAGE_BUCKET } from '@/lib/api/groups';
import { sendAdminEmail } from '@/lib/email/admin';
import { authorNames } from '@/lib/api/user-names';
import { isGroupIcon } from '@/lib/data/group-icon-meta';
import { groupAccess, loadGroupPrivacy } from '@/lib/api/group-membership';

const IMAGE_BUCKET = GROUP_IMAGE_BUCKET;

/** How many proposals one person can have waiting at once. */
const MAX_PENDING_PROPOSALS = 3;

/**
 * Tell the admin inbox a group is waiting. Best effort: the proposal is
 * already saved and shows on the groups page for superadmins either way.
 */
async function notifyProposal(group: { id: string; title: string; description: string; type: string; is_private: boolean }, userId: string, origin: string) {
  try {
    const name = (await authorNames([userId])).get(userId) ?? 'A neighbor';
    await sendAdminEmail({
      subject: `New group proposal: ${group.title}`,
      text: [
        `${name} proposed a new group.`,
        '',
        `Title:    ${group.title}`,
        `Type:     ${group.type}`,
        `Privacy:  ${group.is_private ? 'Private' : 'Public'}`,
        `Account:  ${userId}`,
        '',
        group.description,
        '',
        `Review it: ${origin}/groups/${group.id}`,
      ].join('\n'),
    });
  } catch (err) {
    console.error('[Groups][POST] proposal email failed:', err instanceof Error ? err.message : err);
  }
}

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
  /** Members-only content; joining takes an approved request. */
  is_private?: boolean;
};

/**
 * Create a group. Any signed-in user may: a site admin's group goes live at
 * once, anyone else's waits as 'pending' until a superadmin approves it at
 * /api/groups/review. Either way the creator becomes its owner.
 */
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
    if (body.is_private !== undefined && typeof body.is_private !== 'boolean') {
      return apiBadRequest('is_private must be true or false');
    }

    const { userId } = await requireAuthSupabase();
    // Same rule as editing: the picture must be the caller's own upload, or a
    // later picture change would delete another group's file.
    const imagePath = image.value ? storageObjectPath(image.value, IMAGE_BUCKET) : null;
    if (imagePath && !imagePath.startsWith(`${userId}/`)) return apiBadRequest('invalid image');

    const isSiteAdmin = hasRole(await getUserRole(userId), 'admin');
    // RLS grants no write on this table to anon or authenticated, so the
    // insert goes through the service role -- authorized by the checks here.
    // The add_group_creator_as_owner trigger makes the creator the group's
    // owner in the same transaction, so there is no membership insert here.
    const admin = createAdminClient();
    if (!isSiteAdmin) {
      const { count, error: countError } = await admin
        .from('groups')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'pending');
      if (countError) return apiError(countError, 'Failed to create group');
      if ((count ?? 0) >= MAX_PENDING_PROPOSALS) {
        return apiBadRequest(`You already have ${MAX_PENDING_PROPOSALS} groups waiting for approval.`);
      }
    }
    type Insert = Database['public']['Tables']['groups']['Insert'];
    const insert: Insert = {
      user_id: userId,
      title,
      description,
      type,
      location,
      status: isSiteAdmin ? 'active' : 'pending',
      image_url: image.value,
      icon: icon.value,
      is_private: body.is_private ?? false,
    };

    const { data, error } = await admin
      .from('groups')
      .insert(insert as any)
      .select('*')
      .single<Database['public']['Tables']['groups']['Row']>();

    if (error) {
      console.error('[Groups][POST] insert error:', error.message);
      return apiError(error, 'Failed to create group');
    }

    if (data.status === 'pending') await notifyProposal(data, userId, new URL(req.url).origin);
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return apiError(err, 'Failed to create group');
  }
}

type PatchPayload = Payload & { id?: string; status?: string };

/**
 * Edit a group: its owner or group admins, or any site admin.
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
    const group = await loadGroupPrivacy(id);
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    const access = await groupAccess(group, userId);
    if (!access.canModerate) throw new Error('Forbidden');

    type GroupUpdate = Database['public']['Tables']['groups']['Update'];
    const update: GroupUpdate = {};
    let newImage: string | null = null;

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
      newImage = image.value;
    }
    if (body.icon !== undefined) {
      const icon = parseIcon(body.icon);
      if (!icon.ok) return apiBadRequest('invalid icon');
      update.icon = icon.value;
    }
    if (body.is_private !== undefined) {
      if (typeof body.is_private !== 'boolean') return apiBadRequest('is_private must be true or false');
      // Existing members stay when a group goes private. Pending requests stay
      // when it goes public, and can still be approved or declined.
      update.is_private = body.is_private;
    }
    if (body.status !== undefined) {
      // Status is site moderation, not the owner's to change, and a proposal
      // leaves 'pending' only through /api/groups/review.
      if (!access.isSiteAdmin || group.status === 'pending') throw new Error('Forbidden');
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
      // A new picture must be one the caller uploaded. Otherwise a group owner
      // could point their group at another group's picture, then change it
      // again and have the cleanup below delete that other group's file.
      const newPath = newImage && newImage !== previousImage ? storageObjectPath(newImage, IMAGE_BUCKET) : null;
      if (newPath && !newPath.startsWith(`${userId}/`)) return apiBadRequest('invalid image');
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
 * Delete a group: its owner, or any site admin. Group admins can edit but not
 * delete. An owner deleting a pending proposal withdraws it. What goes with
 * the group is described at deleteGroup().
 */
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id')?.trim();
    if (!id) return apiBadRequest('Missing id');

    const { userId } = await requireAuthSupabase();
    const group = await loadGroupPrivacy(id);
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    if (!(await groupAccess(group, userId)).canDelete) throw new Error('Forbidden');
    if (!(await deleteGroup(createAdminClient(), id))) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return apiError(err, 'Failed to delete group');
  }
}

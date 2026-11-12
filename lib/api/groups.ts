import type { createAdminClient } from '@/lib/supabase/admin';
import { deleteEntityComments } from '@/lib/api/comments';
import { removeStorageObjects, storageObjectPath } from '@/lib/api/upload';

export const GROUP_IMAGE_BUCKET = 'group-images';

/**
 * Delete a group and what hangs off it. Memberships, join requests, polls and
 * sign-ups cascade through their foreign keys. Events are kept -- that key is
 * ON DELETE SET NULL, so they stay on the calendar as standalone events.
 * Comments have no foreign key, so the thread is removed here, and so is the
 * picture in storage.
 *
 * Authorization is the caller's job. Returns false when there was no such group.
 */
export async function deleteGroup(admin: ReturnType<typeof createAdminClient>, id: string): Promise<boolean> {
  const { data: deleted, error } = await admin.from('groups').delete().eq('id', id).select('id, image_url');
  if (error) throw error;
  if (!deleted || deleted.length === 0) return false;

  await deleteEntityComments(admin, 'group', id);
  const imagePaths = deleted
    .map((row) => storageObjectPath(String((row as { image_url: string | null }).image_url ?? ''), GROUP_IMAGE_BUCKET))
    .filter((path): path is string => Boolean(path));
  await removeStorageObjects(GROUP_IMAGE_BUCKET, imagePaths);
  return true;
}

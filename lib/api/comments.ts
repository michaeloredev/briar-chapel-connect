import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { removeStorageObjects, storageObjectPath } from '@/lib/api/upload';

/**
 * Remove the discussion attached to an entity that is being deleted.
 *
 * `comments` is polymorphic over (entity_type, entity_id), so there is no
 * foreign key to cascade through -- without this, deleting the parent leaves
 * its thread and every image in it behind. Failures are logged rather than
 * thrown: the parent is already gone by the time this runs, and a leftover
 * comment is not worth turning a successful delete into an error.
 *
 * Takes the service-role client, since the thread holds other users' rows.
 */
export async function deleteEntityComments(
  admin: SupabaseClient<Database>,
  entityType: string,
  entityId: string,
): Promise<void> {
  type CommentRow = Database['public']['Tables']['comments']['Row'];
  const { data: comments, error: fetchError } = await admin
    .from('comments')
    .select('images')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .returns<Pick<CommentRow, 'images'>[]>();

  if (fetchError) {
    console.error(`[Comments][${entityType}] fetch error:`, fetchError.message);
    return;
  }

  const { error: deleteError } = await admin
    .from('comments')
    .delete()
    .eq('entity_type', entityType)
    .eq('entity_id', entityId);

  if (deleteError) {
    console.error(`[Comments][${entityType}] delete error:`, deleteError.message);
    return;
  }

  const imagePaths = (comments ?? []).flatMap((comment) =>
    (comment.images ?? [])
      .map((ref) => storageObjectPath(String(ref), 'comment-images'))
      .filter((path): path is string => Boolean(path)),
  );
  await removeStorageObjects('comment-images', imagePaths);
}

import { requireAuthSupabase } from '@/lib/supabase/auth';
import { requireRole } from '@/lib/auth/roles';
import { apiError } from '@/lib/api/response';
import { handleFileDelete, handleFileUpload } from '@/lib/api/upload';
import { groupAccess, loadGroupPrivacy } from '@/lib/api/group-membership';

/**
 * Upload a group picture. With `?group_id=`, for editing that group: its owner
 * or group admins, or a site admin. Without it, for a group not created yet:
 * site admins only, since only they can create groups. The bucket has no
 * storage write policies, so this route is its only way in.
 */
export async function POST(req: Request) {
  try {
    const { userId } = await requireAuthSupabase();
    const groupId = (new URL(req.url).searchParams.get('group_id') || '').trim();
    if (groupId) {
      const group = await loadGroupPrivacy(groupId);
      if (!group || !(await groupAccess(group, userId)).canModerate) throw new Error('Forbidden');
    } else {
      await requireRole(userId, 'admin');
    }
  } catch (err) {
    return apiError(err, 'Failed to upload file');
  }
  return handleFileUpload(req, 'group-images');
}

/** Lets the group form clean up a picture it uploaded when the save then fails. */
export async function DELETE(req: Request) {
  return handleFileDelete(req, 'group-images');
}

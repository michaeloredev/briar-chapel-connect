import { requireAuthSupabase } from '@/lib/supabase/auth';
import { requireRole } from '@/lib/auth/roles';
import { apiError } from '@/lib/api/response';
import { handleFileDelete, handleFileUpload } from '@/lib/api/upload';

// Only admins edit groups, so only admins upload group pictures. The bucket
// has no storage write policies, so this route is its only way in.
export async function POST(req: Request) {
  try {
    const { userId } = await requireAuthSupabase();
    await requireRole(userId, 'admin');
  } catch (err) {
    return apiError(err, 'Failed to upload file');
  }
  return handleFileUpload(req, 'group-images');
}

/** Lets the group form clean up a picture it uploaded when the save then fails. */
export async function DELETE(req: Request) {
  return handleFileDelete(req, 'group-images');
}

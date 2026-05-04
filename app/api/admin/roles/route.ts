import { NextResponse } from 'next/server';
import { requireAuthSupabase } from '@/lib/supabase/auth';
import { requireRole, type AppRole } from '@/lib/auth/roles';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiError, apiBadRequest } from '@/lib/api/response';

const VALID_ROLES: AppRole[] = ['superadmin', 'admin', 'client'];

/**
 * GET /api/admin/roles — list all user roles (SuperAdmin only)
 */
export async function GET() {
  try {
    const { userId } = await requireAuthSupabase();
    await requireRole(userId, 'superadmin');

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('user_roles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return apiError(error, 'Failed to load roles');
    return NextResponse.json(data ?? []);
  } catch (err) {
    return apiError(err, 'Failed to load roles');
  }
}

type UpsertBody = {
  target_user_id?: string;
  role?: string;
};

/**
 * POST /api/admin/roles — assign or update a user's role (SuperAdmin only)
 *
 * Body: { target_user_id: string, role: 'superadmin' | 'admin' | 'client' }
 */
export async function POST(req: Request) {
  try {
    const { userId } = await requireAuthSupabase();
    await requireRole(userId, 'superadmin');

    const body: UpsertBody = await req.json();
    const targetUserId = (body.target_user_id || '').trim();
    const role = (body.role || '').trim() as AppRole;

    if (!targetUserId) return apiBadRequest('Missing target_user_id');
    if (!VALID_ROLES.includes(role)) {
      return apiBadRequest(`role must be one of: ${VALID_ROLES.join(', ')}`);
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('user_roles')
      .upsert({ user_id: targetUserId, role }, { onConflict: 'user_id' })
      .select('*')
      .single();

    if (error) return apiError(error, 'Failed to assign role');
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    return apiError(err, 'Failed to assign role');
  }
}

/**
 * DELETE /api/admin/roles?user_id=xxx — remove a user's role record (resets to client)
 */
export async function DELETE(req: Request) {
  try {
    const { userId } = await requireAuthSupabase();
    await requireRole(userId, 'superadmin');

    const url = new URL(req.url);
    const targetUserId = (url.searchParams.get('user_id') || '').trim();
    if (!targetUserId) return apiBadRequest('Missing user_id');

    if (targetUserId === userId) {
      return apiBadRequest('Cannot remove your own role');
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from('user_roles')
      .delete()
      .eq('user_id', targetUserId);

    if (error) return apiError(error, 'Failed to remove role');
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return apiError(err, 'Failed to remove role');
  }
}

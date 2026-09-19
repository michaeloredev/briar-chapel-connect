import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { requireAuthSupabase } from '@/lib/supabase/auth';
import { requireRole, type AppRole } from '@/lib/auth/roles';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiError, apiBadRequest } from '@/lib/api/response';

export type MemberRow = {
  id: string;
  email: string;
  name: string;
  imageUrl: string | null;
  role: AppRole;
  createdAt: string;
};

/**
 * GET /api/admin/members — list all Clerk users merged with their DB roles
 */
export async function GET() {
  try {
    const { userId } = await requireAuthSupabase();
    await requireRole(userId, 'superadmin');

    const client = await clerkClient();
    const allUsers: MemberRow[] = [];
    let offset = 0;
    const limit = 100;

    // Paginate through all Clerk users
    while (true) {
      const { data: users } = await client.users.getUserList({ limit, offset });
      if (!users || users.length === 0) break;
      for (const u of users) {
        const email =
          u.emailAddresses?.find((e) => e.id === u.primaryEmailAddressId)?.emailAddress ??
          u.emailAddresses?.[0]?.emailAddress ??
          '';
        const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || u.username || email;
        allUsers.push({
          id: u.id,
          email,
          name,
          imageUrl: u.imageUrl ?? null,
          role: 'client',
          createdAt: new Date(u.createdAt).toISOString(),
        });
      }
      if (users.length < limit) break;
      offset += limit;
    }

    // Merge roles from DB
    const admin = createAdminClient();
    const { data: roles } = await admin.from('user_roles').select('user_id, role');
    const roleMap = new Map((roles ?? []).map((r: { user_id: string; role: AppRole }) => [r.user_id, r.role]));
    for (const member of allUsers) {
      member.role = roleMap.get(member.id) ?? 'client';
    }

    return NextResponse.json(allUsers);
  } catch (err) {
    return apiError(err, 'Failed to load members');
  }
}

/**
 * PATCH /api/admin/members — update a member's role
 * Body: { user_id: string, role: 'superadmin' | 'admin' | 'client' }
 */
export async function PATCH(req: Request) {
  try {
    const { userId } = await requireAuthSupabase();
    await requireRole(userId, 'superadmin');

    const body = await req.json();
    const targetId = (body.user_id || '').trim();
    const role = (body.role || '').trim() as AppRole;

    if (!targetId) return apiBadRequest('Missing user_id');
    const validRoles: AppRole[] = ['superadmin', 'admin', 'client'];
    if (!validRoles.includes(role)) {
      return apiBadRequest(`role must be one of: ${validRoles.join(', ')}`);
    }
    // Demoting yourself removes the only role that can hand it back, which
    // locks every admin surface for good if you are the last superadmin.
    // Another superadmin has to do it, as with DELETE below.
    if (targetId === userId) {
      return apiBadRequest('Cannot change your own role');
    }

    const admin = createAdminClient();

    const { error } =
      role === 'client'
        ? // 'client' is the default — just remove the row
          await admin.from('user_roles').delete().eq('user_id', targetId)
        : await admin
            .from('user_roles')
            .upsert({ user_id: targetId, role } as never, { onConflict: 'user_id' });

    if (error) {
      console.error('[AdminMembers][PATCH] role write error:', error.message);
      return apiError(error, 'Failed to update role');
    }

    return NextResponse.json({ user_id: targetId, role });
  } catch (err) {
    return apiError(err, 'Failed to update role');
  }
}

/**
 * DELETE /api/admin/members?user_id=xxx — delete a user from Clerk and clean up DB role
 */
export async function DELETE(req: Request) {
  try {
    const { userId } = await requireAuthSupabase();
    await requireRole(userId, 'superadmin');

    const url = new URL(req.url);
    const targetId = (url.searchParams.get('user_id') || '').trim();
    if (!targetId) return apiBadRequest('Missing user_id');
    if (targetId === userId) return apiBadRequest('Cannot delete yourself');

    // Delete from Clerk first. Dropping the role row up front meant a failed
    // Clerk delete left the account alive with its privileges silently gone.
    const client = await clerkClient();
    await client.users.deleteUser(targetId);

    // The account is gone, so a leftover role row grants nothing. Log a failed
    // cleanup rather than reporting the delete itself as failed.
    const admin = createAdminClient();
    const { error } = await admin.from('user_roles').delete().eq('user_id', targetId);
    if (error) {
      console.error('[AdminMembers][DELETE] role cleanup error:', error.message);
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return apiError(err, 'Failed to delete member');
  }
}

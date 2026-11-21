import Link from 'next/link';
import { clerkClient } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { SITE_TIME_ZONE } from '@/lib/utils/date';
import MembersTabs from '@/components/members/MembersTabs';
import type { Database } from '@/lib/supabase/types';

// The /members layout already restricts this to superadmins, which is what
// makes the service-role reads below safe: they see every group, including
// pending proposals and private groups.

// Always render per request: it reads live data, and a build-time prerender
// attempt would otherwise trip the Clerk lookup's error handler.
export const dynamic = 'force-dynamic';

type GroupRow = Database['public']['Tables']['groups']['Row'];
type MemberRow = Pick<Database['public']['Tables']['group_members']['Row'], 'group_id' | 'user_id' | 'role'>;
type GroupStatus = GroupRow['status'];

type Person = { name: string; email: string };

const STATUS_STYLES: Record<GroupStatus, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  inactive: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
};

/**
 * Name and email for each user, keyed by Clerk ID. Superadmin-only, so unlike
 * authorNames() it includes the email address. A Clerk failure leaves the
 * table showing raw IDs rather than failing the page.
 */
async function lookupPeople(userIds: string[]): Promise<Map<string, Person>> {
  const people = new Map<string, Person>();
  const unique = [...new Set(userIds)];
  if (unique.length === 0) return people;

  try {
    const client = await clerkClient();
    // getUserList caps both the id filter and the page at 100.
    for (let i = 0; i < unique.length; i += 100) {
      const batch = unique.slice(i, i + 100);
      const { data: users } = await client.users.getUserList({ userId: batch, limit: batch.length });
      for (const u of users) {
        const email =
          u.emailAddresses?.find((e) => e.id === u.primaryEmailAddressId)?.emailAddress ??
          u.emailAddresses?.[0]?.emailAddress ??
          '';
        const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || u.username || email;
        people.set(u.id, { name, email });
      }
    }
  } catch (err) {
    console.error('[MembersGroups] Clerk lookup error:', err instanceof Error ? err.message : err);
  }
  return people;
}

export default async function MembersGroupsPage() {
  const admin = createAdminClient();
  const [groupsRes, membersRes] = await Promise.all([
    admin.from('groups').select('*').order('title').returns<GroupRow[]>(),
    admin.from('group_members').select('group_id, user_id, role').eq('status', 'active').returns<MemberRow[]>(),
  ]);

  const loadError = groupsRes.error || membersRes.error;
  if (loadError) console.error('[MembersGroups][GET] load error:', loadError.message);

  const groups = groupsRes.data ?? [];
  const memberCounts = new Map<string, number>();
  const ownerOf = new Map<string, string>();
  for (const m of membersRes.data ?? []) {
    memberCounts.set(m.group_id, (memberCounts.get(m.group_id) ?? 0) + 1);
    if (m.role === 'owner') ownerOf.set(m.group_id, m.user_id);
  }

  const people = await lookupPeople([...ownerOf.values()]);
  const counts = {
    total: groups.length,
    pending: groups.filter((g) => g.status === 'pending').length,
    noOwner: groups.filter((g) => !ownerOf.has(g.id)).length,
  };

  return (
    <div className="flex-1 bg-linear-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Groups</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Every group and who owns it, including private groups and pending proposals.
          </p>
        </div>

        <MembersTabs />

        {loadError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-300">
            Some group data failed to load. The list below may be incomplete.
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Group</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Owner</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300 text-right">Members</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Visibility</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Status</th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Created</th>
              </tr>
            </thead>
            <tbody>
              {groups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    No groups yet.
                  </td>
                </tr>
              ) : (
                groups.map((g) => {
                  const ownerId = ownerOf.get(g.id);
                  const owner = ownerId ? people.get(ownerId) : undefined;
                  return (
                    <tr
                      key={g.id}
                      className="border-b border-slate-100 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/groups/${g.id}`}
                          className="font-medium text-slate-900 hover:text-blue-700 dark:text-white dark:hover:text-blue-300"
                        >
                          {g.title}
                        </Link>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{g.type}</div>
                      </td>
                      <td className="px-4 py-3">
                        {!ownerId ? (
                          <span className="text-amber-700 dark:text-amber-300">No owner</span>
                        ) : owner ? (
                          <>
                            <div className="text-slate-900 dark:text-white truncate max-w-[220px]">{owner.name}</div>
                            {owner.email && (
                              <a
                                href={`mailto:${owner.email}`}
                                className="text-xs text-slate-500 hover:text-blue-700 dark:text-slate-400 dark:hover:text-blue-300 truncate max-w-[220px] block"
                              >
                                {owner.email}
                              </a>
                            )}
                          </>
                        ) : (
                          <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{ownerId}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
                        {memberCounts.get(g.id) ?? 0}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {g.is_private ? 'Private' : 'Public'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[g.status]}`}
                        >
                          {g.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(g.created_at).toLocaleDateString('en-US', { timeZone: SITE_TIME_ZONE })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          {counts.total} groups · {counts.pending} pending
          {counts.noOwner > 0 && ` · ${counts.noOwner} without an owner`}
        </div>
      </div>
    </div>
  );
}

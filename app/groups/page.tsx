import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';
import { GROUP_TYPES } from '@/lib/data/group-types';
import AddGroupButton from '@/components/ui/AddGroupButton';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import GroupCard from '@/components/groups/GroupCard';
import { auth } from '@clerk/nextjs/server';

export const metadata: Metadata = {
  title: 'Groups & Clubs • Briar Chapel Connect',
  description: 'Join groups and clubs in Briar Chapel',
};

type SearchParams = Promise<{ type?: string; mine?: string }>;

export default async function GroupsPage({ searchParams }: { searchParams: SearchParams }) {
  const { type = '', mine = '' } = await searchParams;
  const mineSelected = mine === '1' || mine.toLowerCase() === 'true';
  const { userId, getToken } = await auth();
  const sessionToken = await getToken();
  const supabase = await createClient(sessionToken || undefined);
  type Row = Database['public']['Tables']['groups']['Row'];
  let groups: Row[] = [];
  let error: any = null;

  let memberIds = new Set<string>();
  if (userId) {
    // Load all memberships for current user to render join/leave state
    type MemRow = Database['public']['Tables']['group_members']['Row'];
    const { data: membershipsAll, error: memErrAll } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId)
      .returns<Pick<MemRow, 'group_id'>[]>();
    if (!memErrAll) {
      memberIds = new Set((membershipsAll ?? []).map((m) => m.group_id));
    }
  }

  if (mineSelected && userId) {
    // Load memberships then resolve groups
    type MemRow = Database['public']['Tables']['group_members']['Row'];
    const { data: memberships, error: memErr } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId)
      .returns<Pick<MemRow, 'group_id'>[]>();
    if (memErr) {
      error = memErr;
    } else {
      const ids = (memberships ?? []).map((m) => m.group_id);
      if (ids.length > 0) {
        let q2 = supabase.from('groups').select('*').eq('status', 'active').in('id', ids).order('created_at', { ascending: false });
        if (type) q2 = q2.eq('type', type);
        const { data: g2, error: gErr } = await q2.returns<Row[]>();
        if (gErr) error = gErr; else groups = g2 ?? [];
      } else {
        groups = [];
      }
    }
  } else {
    let query = supabase.from('groups').select('*').eq('status', 'active').order('created_at', { ascending: false });
    if (type) query = query.eq('type', type);
    const { data, error: err } = await query.returns<Row[]>();
    if (err) error = err; else groups = data ?? [];
  }
  if (error) console.error('Failed to load groups:', error.message);

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Groups & Clubs</h1>
          <div className="flex items-center gap-2">
            <Link
              href="/groups"
              className={['px-8 py-1.5 rounded-md text-sm border', mineSelected ? 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300' : 'bg-blue-600 text-white border-blue-600'].join(' ')}
            >
              All Groups
            </Link>
          </div>
        </div>
        <div className="mt-3 justify-between flex">
          <SignedIn>
            <AddGroupButton />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-white text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                Create Group
              </button>
            </SignInButton>
          </SignedOut>

          <div className="flex items-center justify-end ">
            <Link
              href="/groups?mine=1"
              className={['px-8 py-1.5 rounded-md text-sm border', mineSelected ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300'].join(' ')}
            >
              My Groups
            </Link>
          </div>

        </div>



        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GROUP_TYPES.map((t) => (
            <GroupCard
              key={t.value}
              id={t.value}
              href={`/groups?type=${encodeURIComponent(t.value)}`}
              title={t.label}
              description={`Browse ${t.label} groups`}
              typeLabel={t.label}
              icon={t.icon}
              iconColorClass={t.colorClasses.icon}
              iconBgClass={t.colorClasses.bg}
              showJoinButton={false}
            />
          ))}
        </div>

        <div className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {mineSelected ? 'My Groups' : (type ? GROUP_TYPES.find((t) => t.value === type)?.label ?? 'All Groups' : 'All Groups')}
            </h2>
            {mineSelected && !userId ? (
              <SignInButton mode="modal">
                <button className="text-sm text-blue-600 hover:underline dark:text-blue-400">Sign in to view</button>
              </SignInButton>
            ) : null}
          </div>
          {!groups?.length ? (
            <div className="mt-3 rounded-xl border border-slate-200 dark:border-slate-700 p-6 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              No groups yet.
            </div>
          ) : (
            <div className="mt-3 grid gap-4">
              {groups.map((g) => (
                <GroupCard
                  key={g.id}
                  id={g.id}
                  title={g.title}
                  description={g.description}
                  location={g.location}
                  typeLabel={GROUP_TYPES.find((t) => t.value === g.type)?.label ?? g.type}
                  imageUrl={g.image_url ?? undefined}
                  isMember={memberIds.has(g.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

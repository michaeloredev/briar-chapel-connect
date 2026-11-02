import type { Metadata } from 'next';
import Link from 'next/link';
import { SearchX, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';
import { GROUP_TYPES } from '@/lib/data/group-types';
import GroupFormDialog from '@/components/groups/GroupFormDialog';
import { SignedIn, SignInButton } from '@clerk/nextjs';
import RoleGate from '@/components/auth/RoleGate';
import GroupCard from '@/components/groups/GroupCard';
import { PageHeader } from '@/components/common/PageHeader';
import { auth } from '@clerk/nextjs/server';

export const metadata: Metadata = {
  title: 'Groups & Clubs • Briar Chapel Connect',
  description: 'Join groups and clubs in Briar Chapel',
};

type SearchParams = Promise<{ type?: string; mine?: string }>;

/** /groups with the given filters; the two filters combine. */
function groupsHref(type: string, mine: boolean): string {
  const sp = new URLSearchParams();
  if (type) sp.set('type', type);
  if (mine) sp.set('mine', '1');
  const qs = sp.toString();
  return qs ? `/groups?${qs}` : '/groups';
}

export default async function GroupsPage({ searchParams }: { searchParams: SearchParams }) {
  const { type: rawType = '', mine = '' } = await searchParams;
  const type = GROUP_TYPES.some((t) => t.value === rawType) ? rawType : '';
  const mineSelected = mine === '1' || mine.toLowerCase() === 'true';
  const { userId, getToken } = await auth();
  const sessionToken = await getToken();
  const supabase = await createClient(sessionToken || undefined);
  type Row = Database['public']['Tables']['groups']['Row'];

  // Every membership of the current user: drives both the Join/Leave state on
  // each card and the "My groups" filter.
  let memberIds = new Set<string>();
  if (userId) {
    type MemRow = Database['public']['Tables']['group_members']['Row'];
    const { data: memberships, error: memErr } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId)
      .returns<Pick<MemRow, 'group_id'>[]>();
    if (memErr) console.error('Failed to load memberships:', memErr.message);
    memberIds = new Set((memberships ?? []).map((m) => m.group_id));
  }

  let groups: Row[] = [];
  const needsSignIn = mineSelected && !userId;
  if (!needsSignIn && !(mineSelected && memberIds.size === 0)) {
    let query = supabase.from('groups').select('*').eq('status', 'active').order('created_at', { ascending: false });
    if (type) query = query.eq('type', type);
    if (mineSelected) query = query.in('id', [...memberIds]);
    const { data, error } = await query.returns<Row[]>();
    if (error) console.error('Failed to load groups:', error.message);
    groups = data ?? [];
  }

  const typeLabel = GROUP_TYPES.find((t) => t.value === type)?.label;
  const heading = [mineSelected ? 'My' : 'All', typeLabel ?? '', 'groups'].filter(Boolean).join(' ');

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <PageHeader
          title="Groups & Clubs"
          description="Find your people — golf, tennis, dog walkers, book clubs and more."
          actions={
            <SignedIn>
              <RoleGate minimum="admin">
                <GroupFormDialog />
              </RoleGate>
            </SignedIn>
          }
        />

        {/* Filters */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between dark:border-slate-700 dark:bg-slate-800">
          <nav aria-label="Group type" className="flex flex-wrap gap-2">
            <Link
              href={groupsHref('', mineSelected)}
              aria-current={!type ? 'page' : undefined}
              className={[
                'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                !type
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600',
              ].join(' ')}
            >
              <Users className="h-4 w-4" aria-hidden />
              All types
            </Link>
            {GROUP_TYPES.map((t) => {
              const active = t.value === type;
              const Icon = t.icon;
              return (
                <Link
                  key={t.value}
                  href={groupsHref(t.value, mineSelected)}
                  aria-current={active ? 'page' : undefined}
                  className={[
                    'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                    active
                      ? `${t.colorClasses.bg} ${t.colorClasses.icon} ring-2 ring-current`
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600',
                  ].join(' ')}
                >
                  <Icon className={['h-4 w-4', active ? '' : t.colorClasses.icon].join(' ')} aria-hidden />
                  {t.label}
                </Link>
              );
            })}
          </nav>

          <div role="group" aria-label="Whose groups" className="inline-flex shrink-0 self-start rounded-full bg-slate-100 p-1 dark:bg-slate-900/60">
            {[
              { label: 'All groups', mine: false },
              { label: 'My groups', mine: true },
            ].map((opt) => {
              const active = opt.mine === mineSelected;
              return (
                <Link
                  key={opt.label}
                  href={groupsHref(type, opt.mine)}
                  aria-current={active ? 'page' : undefined}
                  className={[
                    'rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
                    active
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white',
                  ].join(' ')}
                >
                  {opt.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Results */}
        <div className="mt-8 flex items-baseline justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{heading}</h2>
          {!needsSignIn ? (
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {groups.length === 1 ? '1 group' : `${groups.length} groups`}
            </span>
          ) : null}
        </div>

        {needsSignIn ? (
          <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-800">
            <Users className="h-10 w-10 text-slate-400" aria-hidden />
            <p className="text-slate-600 dark:text-slate-300">Sign in to see the groups you&apos;ve joined.</p>
            <SignInButton mode="modal">
              <button className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                Sign in
              </button>
            </SignInButton>
          </div>
        ) : groups.length === 0 ? (
          <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-800">
            <SearchX className="h-10 w-10 text-slate-400" aria-hidden />
            <p className="text-slate-600 dark:text-slate-300">
              {mineSelected ? "You haven't joined any groups here yet." : 'No groups here yet.'}
            </p>
            {type || mineSelected ? (
              <Link href="/groups" className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                Browse all groups
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((g) => (
              <GroupCard
                key={g.id}
                id={g.id}
                title={g.title}
                description={g.description}
                location={g.location}
                type={g.type}
                imageUrl={g.image_url}
                icon={g.icon}
                isMember={memberIds.has(g.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

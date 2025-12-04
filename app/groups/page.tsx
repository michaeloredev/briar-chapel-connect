import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';
import { GROUP_TYPES } from '@/lib/data/group-types';
import AddGroupButton from '@/components/ui/AddGroupButton';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import GroupCard from '@/components/groups/GroupCard';

export const metadata: Metadata = {
  title: 'Groups & Clubs • Briar Chapel Connect',
  description: 'Join groups and clubs in Briar Chapel',
};

type SearchParams = Promise<{ type?: string }>;

export default async function GroupsPage({ searchParams }: { searchParams: SearchParams }) {
  const { type = '' } = await searchParams;
  const supabase = await createClient();
  type Row = Database['public']['Tables']['groups']['Row'];
  let query = supabase.from('groups').select('*').eq('status', 'active').order('created_at', { ascending: false });
  if (type) query = query.eq('type', type);
  const { data: groups, error } = await query.returns<Row[]>();
  if (error) console.error('Failed to load groups:', error.message);

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Groups & Clubs</h1>
          <div className="flex items-center gap-2">
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
          </div>
        </div>
        <p className="mt-2 text-slate-600 dark:text-slate-300">Connect with neighbors who share your interests.</p>

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
            />
          ))}
        </div>

        <div className="mt-10">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {type ? GROUP_TYPES.find((t) => t.value === type)?.label ?? 'All Groups' : 'All Groups'}
          </h2>
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
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

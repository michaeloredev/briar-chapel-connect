import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import { BarChart3, ClipboardList, Lock, MapPin, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Database } from '@/lib/supabase/types';
import { groupAccess, isOpen, UUID_PATTERN } from '@/lib/api/group-membership';
import { authorNames } from '@/lib/api/user-names';
import { GROUP_TYPES } from '@/lib/data/group-types';
import { groupIconMeta } from '@/lib/data/group-icon-meta';
import EventFormDialog from '@/components/events/EventFormDialog';
import GroupFormDialog from '@/components/groups/GroupFormDialog';
import JoinGroupButton from '@/components/groups/JoinGroupButton';
import JoinRequestList, { type JoinRequestView } from '@/components/groups/JoinRequestList';
import RequestToJoinButton from '@/components/groups/RequestToJoinButton';
import GroupTabs, { GROUP_TABS, type GroupTab } from '@/components/groups/GroupTabs';
import PollCard from '@/components/groups/PollCard';
import PollFormDialog from '@/components/groups/PollFormDialog';
import SignupCard from '@/components/groups/SignupCard';
import SignupFormDialog from '@/components/groups/SignupFormDialog';
import type { PollView, SignupView } from '@/components/groups/types';
import AdminDeleteButton from '@/components/common/AdminDeleteButton';
import RoleGate from '@/components/auth/RoleGate';
import SetBreadcrumbTitle from '@/components/common/SetBreadcrumbTitle';
import CommentThread from '@/components/forum/CommentThread';

export const metadata: Metadata = {
  title: 'Group • Briar Chapel Connect',
};

type Tables = Database['public']['Tables'];
type Supabase = Awaited<ReturnType<typeof createClient>>;

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

const UNNAMED = 'Community member';

/** Every poll in the group, newest first, with options, votes and voter names. */
async function loadPolls(supabase: Supabase, groupId: string, userId: string | null, isAdmin: boolean): Promise<PollView[]> {
  const { data: polls, error } = await supabase
    .from('group_polls')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
    .returns<Tables['group_polls']['Row'][]>();
  if (error) {
    console.error('[GroupPage] polls error:', error.message);
    return [];
  }
  if (!polls?.length) return [];

  const pollIds = polls.map((p) => p.id);
  const [{ data: options }, { data: votes }] = await Promise.all([
    supabase.from('group_poll_options').select('*').in('poll_id', pollIds).order('position').returns<Tables['group_poll_options']['Row'][]>(),
    supabase.from('group_poll_votes').select('*').in('poll_id', pollIds).order('created_at').returns<Tables['group_poll_votes']['Row'][]>(),
  ]);
  const names = await authorNames([...polls.map((p) => p.user_id), ...(votes ?? []).map((v) => v.user_id)]);

  return polls.map((p) => {
    const pollVotes = (votes ?? []).filter((v) => v.poll_id === p.id);
    return {
      id: p.id,
      question: p.question,
      allowMultiple: p.allow_multiple,
      allowMemberOptions: p.allow_member_options,
      closesAt: p.closes_at,
      open: isOpen(p),
      creatorName: names.get(p.user_id) ?? UNNAMED,
      canManage: Boolean(userId) && (userId === p.user_id || isAdmin),
      voterCount: new Set(pollVotes.map((v) => v.user_id)).size,
      options: (options ?? [])
        .filter((o) => o.poll_id === p.id)
        .map((o) => {
          const optionVotes = pollVotes.filter((v) => v.option_id === o.id);
          return {
            id: o.id,
            label: o.label,
            voters: optionVotes.map((v) => names.get(v.user_id) ?? UNNAMED),
            votedByMe: Boolean(userId) && optionVotes.some((v) => v.user_id === userId),
          };
        }),
    };
  });
}

/** The signed-in user's pending request to join, as its note, or null. */
async function loadMyRequest(admin: Supabase, groupId: string, userId: string): Promise<string | null> {
  const { data, error } = await admin
    .from('group_join_requests')
    .select('message')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .maybeSingle<Pick<Tables['group_join_requests']['Row'], 'message'>>();
  if (error) console.error('[GroupPage] my request error:', error.message);
  return data?.message ?? null;
}

/** Pending requests to join, oldest first, for the owner and site admins. */
async function loadJoinRequests(admin: Supabase, groupId: string): Promise<JoinRequestView[]> {
  const { data, error } = await admin
    .from('group_join_requests')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at')
    .returns<Tables['group_join_requests']['Row'][]>();
  if (error) {
    console.error('[GroupPage] join requests error:', error.message);
    return [];
  }
  const names = await authorNames((data ?? []).map((r) => r.user_id));
  return (data ?? []).map((r) => ({
    id: r.id,
    name: names.get(r.user_id) ?? UNNAMED,
    message: r.message,
    createdAt: r.created_at,
  }));
}

/** Every sign-up sheet in the group, newest first, with slots and who claimed them. */
async function loadSignups(supabase: Supabase, groupId: string, userId: string | null, isAdmin: boolean): Promise<SignupView[]> {
  const { data: signups, error } = await supabase
    .from('group_signups')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
    .returns<Tables['group_signups']['Row'][]>();
  if (error) {
    console.error('[GroupPage] signups error:', error.message);
    return [];
  }
  if (!signups?.length) return [];

  const { data: slots } = await supabase
    .from('group_signup_slots')
    .select('*')
    .in('signup_id', signups.map((s) => s.id))
    .order('position')
    .returns<Tables['group_signup_slots']['Row'][]>();
  const slotIds = (slots ?? []).map((s) => s.id);
  const { data: claims } = slotIds.length
    ? await supabase
        .from('group_signup_claims')
        .select('*')
        .in('slot_id', slotIds)
        .order('created_at')
        .returns<Tables['group_signup_claims']['Row'][]>()
    : { data: [] as Tables['group_signup_claims']['Row'][] };
  const names = await authorNames([...signups.map((s) => s.user_id), ...(claims ?? []).map((c) => c.user_id)]);

  return signups.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    open: isOpen(s),
    creatorName: names.get(s.user_id) ?? UNNAMED,
    canManage: Boolean(userId) && (userId === s.user_id || isAdmin),
    slots: (slots ?? [])
      .filter((slot) => slot.signup_id === s.id)
      .map((slot) => ({
        id: slot.id,
        label: slot.label,
        capacity: slot.capacity,
        claims: (claims ?? [])
          .filter((c) => c.slot_id === slot.id)
          .map((c) => ({ name: names.get(c.user_id) ?? UNNAMED, note: c.note, mine: c.user_id === userId })),
      })),
  }));
}

export default async function GroupDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { tab: rawTab } = await searchParams;
  if (!id || !UUID_PATTERN.test(id)) return notFound();
  const tab: GroupTab = GROUP_TABS.some((t) => t.value === rawTab) ? (rawTab as GroupTab) : 'discussion';

  const supabase = await createClient();
  const { data: group, error } = await supabase.from('groups').select('*').eq('id', id).single<Tables['groups']['Row']>();
  if (error || !group) return notFound();

  const { userId } = await auth();
  const { isMember, isSiteAdmin: isAdmin, canRead, canApprove } = await groupAccess(group, userId);

  // Memberships are only readable to their owner under RLS, so the head count
  // comes through the service role. Only the number leaves the server.
  const admin = createAdminClient();
  // A private group's content is authorized by groupAccess() above and read
  // through the service role; the anon client would be filtered out by
  // can_read_group(). Nothing is loaded for someone who can't read it.
  const reader = group.is_private ? admin : supabase;
  const [{ count: memberCount }, commentCount, polls, signups, myRequest, joinRequests] = await Promise.all([
    admin.from('group_members').select('id', { count: 'exact', head: true }).eq('group_id', id).eq('status', 'active'),
    canRead
      ? reader.from('comments').select('id', { count: 'exact', head: true }).eq('entity_type', 'group').eq('entity_id', id).then((r) => r.count ?? 0)
      : Promise.resolve(0),
    canRead ? loadPolls(reader, id, userId, isAdmin) : Promise.resolve([] as PollView[]),
    canRead ? loadSignups(reader, id, userId, isAdmin) : Promise.resolve([] as SignupView[]),
    userId && !isMember && group.is_private ? loadMyRequest(admin, id, userId) : Promise.resolve(null),
    canApprove ? loadJoinRequests(admin, id) : Promise.resolve([] as JoinRequestView[]),
  ]);

  const meta = GROUP_TYPES.find((t) => t.value === group.type);
  const avatar = groupIconMeta(group);
  const Icon = avatar.icon;
  const members = memberCount ?? 0;

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <SetBreadcrumbTitle value={group.title} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {group.image_url ? (
              <img
                src={group.image_url}
                alt=""
                className="h-20 w-20 shrink-0 rounded-2xl border border-slate-200 bg-slate-100 object-cover dark:border-slate-700 dark:bg-slate-900"
                width={80}
                height={80}
              />
            ) : (
              <span className={['flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl', avatar.bg].join(' ')}>
                <Icon className={['h-10 w-10', avatar.color].join(' ')} aria-hidden />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={[
                    'rounded-full px-2.5 py-0.5 text-xs font-medium',
                    meta ? `${meta.colorClasses.bg} ${meta.colorClasses.icon}` : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
                  ].join(' ')}
                >
                  {meta?.label ?? group.type}
                </span>
                {group.is_private ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                    <Lock className="h-3 w-3" aria-hidden />
                    Private
                  </span>
                ) : null}
                {isMember ? (
                  <span className="rounded-full border border-blue-400 px-2.5 py-0.5 text-xs font-medium text-blue-500 dark:text-blue-400">
                    Member
                  </span>
                ) : null}
              </div>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{group.title}</h1>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600 dark:text-slate-300">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-slate-400" aria-hidden />
                  {group.location || 'Briar Chapel'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-slate-400" aria-hidden />
                  {members === 1 ? '1 member' : `${members} members`}
                </span>
              </div>
              {group.description ? (
                <p className="mt-4 whitespace-pre-wrap text-slate-700 dark:text-slate-300">{group.description}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
              {/* Non-members join from the prompt below the header. */}
              {isMember ? <JoinGroupButton groupId={group.id} isMember /> : null}
              {/* Hides the controls only -- /api/groups enforces admin. */}
              <RoleGate minimum="admin">
                <div className="flex flex-wrap items-center gap-2">
                  <GroupFormDialog
                    group={{
                      id: group.id,
                      title: group.title,
                      description: group.description,
                      type: group.type,
                      location: group.location,
                      image_url: group.image_url,
                      icon: group.icon,
                      is_private: group.is_private,
                    }}
                  />
                  <EventFormDialog
                    buttonLabel="Schedule Event"
                    dialogTitle="Schedule Meetup"
                    defaultLocation={group.location ?? 'Briar Chapel'}
                    fixedCategory="group"
                    groupId={group.id}
                  />
                  <AdminDeleteButton
                    endpoint="/api/groups"
                    id={group.id}
                    redirectTo="/groups"
                    noun="group"
                    name={group.title}
                    consequence="Its memberships, polls and sign-ups will be removed; its events stay on the calendar without a group."
                  />
                </div>
              </RoleGate>
            </div>
          </div>
        </section>

        {canApprove && joinRequests.length > 0 ? <JoinRequestList requests={joinRequests} /> : null}

        {/* Private group: ask to join */}
        {!isMember && group.is_private ? (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-blue-50 px-6 py-4 dark:bg-slate-800">
            <p className="text-slate-700 dark:text-slate-200">
              <SignedOut>This is a private group. Sign in to ask to join.</SignedOut>
              <SignedIn>
                {myRequest !== null
                  ? "Your request has been sent. You'll be able to take part once it's approved."
                  : 'This is a private group. Ask to join to see the discussion, polls and sign-ups.'}
              </SignedIn>
            </p>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  Sign in
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <RequestToJoinButton groupId={group.id} groupTitle={group.title} pendingMessage={myRequest} />
            </SignedIn>
          </div>
        ) : null}

        {/* Join prompt for anyone who can read but not take part */}
        {!isMember && !group.is_private ? (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-blue-50 px-6 py-4 dark:bg-slate-800">
            <p className="text-slate-700 dark:text-slate-200">
              <SignedOut>Sign in and join this group to comment, vote and sign up.</SignedOut>
              <SignedIn>Join this group to comment, vote and sign up.</SignedIn>
            </p>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  Sign in
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <JoinGroupButton groupId={group.id} isMember={false} />
            </SignedIn>
          </div>
        ) : null}

        {/* Sections */}
        {!canRead ? (
          <div className="mt-8">
            <EmptyState icon={Lock} text="Only members can see this group's discussion, polls and sign-ups." />
          </div>
        ) : (
        <div className="mt-8">
          <GroupTabs
            groupId={group.id}
            active={tab}
            counts={{ discussion: commentCount ?? 0, polls: polls.length, signups: signups.length }}
          />

          <div className="mt-6">
            {tab === 'discussion' ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <CommentThread
                  entityType="group"
                  entityId={group.id}
                  canPost={isMember}
                  readOnlyNotice={<p className="text-sm text-slate-600 dark:text-slate-300">Join the group to join the conversation.</p>}
                />
              </div>
            ) : null}

            {tab === 'polls' ? (
              <div className="flex flex-col gap-5">
                {isMember ? (
                  <div className="flex justify-end">
                    <PollFormDialog groupId={group.id} />
                  </div>
                ) : null}
                {polls.length === 0 ? (
                  <EmptyState icon={BarChart3} text={isMember ? 'No polls yet. Start one to get the group deciding.' : 'No polls yet.'} />
                ) : (
                  polls.map((p) => <PollCard key={p.id} poll={p} canParticipate={isMember} />)
                )}
              </div>
            ) : null}

            {tab === 'signups' ? (
              <div className="flex flex-col gap-5">
                {isMember ? (
                  <div className="flex justify-end">
                    <SignupFormDialog groupId={group.id} />
                  </div>
                ) : null}
                {signups.length === 0 ? (
                  <EmptyState icon={ClipboardList} text={isMember ? 'No sign-ups yet. Create one for a potluck, a work day or anything with spots to fill.' : 'No sign-ups yet.'} />
                ) : (
                  signups.map((s) => <SignupCard key={s.id} signup={s} canParticipate={isMember} />)
                )}
              </div>
            ) : null}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: typeof Users; text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-800">
      <Icon className="h-10 w-10 text-slate-400" aria-hidden />
      <p className="max-w-md text-slate-600 dark:text-slate-300">{text}</p>
    </div>
  );
}

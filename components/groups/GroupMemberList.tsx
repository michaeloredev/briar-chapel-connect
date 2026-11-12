'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Crown, ShieldCheck } from 'lucide-react';
import type { GroupRole, MemberAction } from '@/lib/api/group-membership';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { groupRequest } from './request';

export type MemberView = {
  /** Present only when the viewer has an action on this member. */
  userId: string | null;
  name: string;
  role: GroupRole;
  joinedAt: string;
  isSelf: boolean;
  /** Exactly what /api/group-members will accept from this viewer. */
  actions: MemberAction[];
};

const ROLE_BADGE: Record<GroupRole, { label: string; className: string; icon: typeof Crown | null }> = {
  owner: {
    label: 'Owner',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
    icon: Crown,
  },
  admin: {
    label: 'Admin',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
    icon: ShieldCheck,
  },
  member: { label: 'Member', className: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200', icon: null },
};

const ACTION_LABEL: Record<Exclude<MemberAction, 'remove' | 'make_owner'>, string> = {
  make_admin: 'Make admin',
  make_member: 'Remove admin',
};

type Pending = { member: MemberView; action: 'remove' | 'make_owner' };

/** A group's members, with role and removal controls for the people allowed them. */
export default function GroupMemberList({ groupId, members }: { groupId: string; members: MemberView[] }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [confirming, setConfirming] = React.useState<Pending | null>(null);

  async function run(member: MemberView, action: MemberAction) {
    await groupRequest(
      '/api/group-members',
      { method: 'PATCH', body: JSON.stringify({ group_id: groupId, user_id: member.userId, action }) },
      'Could not update this member.',
    );
    router.refresh();
  }

  async function quick(member: MemberView, action: MemberAction) {
    setBusy(`${member.userId}:${action}`);
    setError(null);
    try {
      await run(member, action);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      {error ? <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      <ul className="divide-y divide-slate-200 dark:divide-slate-700">
        {members.map((m) => {
          const badge = ROLE_BADGE[m.role];
          const BadgeIcon = badge.icon;
          return (
            <li key={`${m.name}-${m.joinedAt}`} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="font-medium text-slate-900 dark:text-white">
                  {m.name}
                  {m.isSelf ? <span className="text-slate-500 dark:text-slate-400"> (you)</span> : null}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Joined {new Date(m.joinedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={['inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', badge.className].join(' ')}>
                  {BadgeIcon ? <BadgeIcon className="h-3 w-3" aria-hidden /> : null}
                  {badge.label}
                </span>
                {m.actions.map((action) =>
                  action === 'remove' || action === 'make_owner' ? (
                    <button
                      key={action}
                      type="button"
                      onClick={() => setConfirming({ member: m, action })}
                      disabled={busy !== null}
                      className={[
                        'rounded-full border px-3 py-1 text-xs font-semibold focus:outline-none focus:ring-2 disabled:opacity-60',
                        action === 'remove'
                          ? 'border-slate-300 text-slate-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700 focus:ring-red-500 dark:border-slate-600 dark:text-slate-200 dark:hover:border-red-800 dark:hover:bg-red-900/30 dark:hover:text-red-300'
                          : 'border-slate-300 text-slate-700 hover:bg-slate-100 focus:ring-blue-500 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700',
                      ].join(' ')}
                    >
                      {action === 'remove' ? 'Remove' : 'Make owner'}
                    </button>
                  ) : (
                    <button
                      key={action}
                      type="button"
                      onClick={() => quick(m, action)}
                      disabled={busy !== null}
                      className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      {busy === `${m.userId}:${action}` ? 'Saving…' : ACTION_LABEL[action]}
                    </button>
                  ),
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={confirming !== null}
        title={
          confirming?.action === 'make_owner'
            ? `Make ${confirming.member.name} the owner?`
            : `Remove ${confirming?.member.name ?? ''} from the group?`
        }
        description={
          confirming?.action === 'make_owner'
            ? 'They will run the group, including deleting it. The current owner becomes a group admin and can no longer change roles.'
            : 'They lose access to anything members-only. They can join again, or ask to again if the group is private.'
        }
        confirmLabel={confirming?.action === 'make_owner' ? 'Transfer ownership' : 'Remove'}
        pendingLabel={confirming?.action === 'make_owner' ? 'Transferring…' : 'Removing…'}
        onConfirm={async () => {
          if (confirming) await run(confirming.member, confirming.action);
        }}
        onClose={() => setConfirming(null)}
      />
    </div>
  );
}

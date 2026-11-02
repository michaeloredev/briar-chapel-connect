'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Check, Lock, Plus, Trash2 } from 'lucide-react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { POLL_LIMITS } from '@/lib/data/group-activity';
import { formatDateRange } from '@/lib/utils/date';
import { groupRequest } from './request';
import type { PollView } from './types';

export default function PollCard({ poll, canParticipate }: { poll: PollView; canParticipate: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [newOption, setNewOption] = React.useState('');
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);

  const canVote = canParticipate && poll.open;
  const myVotes = poll.options.filter((o) => o.votedByMe).map((o) => o.id);
  const maxVotes = Math.max(1, ...poll.options.map((o) => o.voters.length));

  async function run(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await action();
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  // Single choice: picking an option moves your vote there (picking it again
  // clears it). Multiple choice: each click toggles that option.
  function toggle(optionId: string) {
    const mine = myVotes.includes(optionId);
    const next = poll.allowMultiple
      ? mine
        ? myVotes.filter((id) => id !== optionId)
        : [...myVotes, optionId]
      : mine
        ? []
        : [optionId];
    run(() =>
      groupRequest(
        '/api/group-poll-votes',
        { method: 'PUT', body: JSON.stringify({ poll_id: poll.id, option_ids: next }) },
        'Failed to save your vote',
      ),
    );
  }

  function addOption(e: React.FormEvent) {
    e.preventDefault();
    const label = newOption.trim();
    if (!label) return;
    run(async () => {
      await groupRequest(
        '/api/group-poll-options',
        { method: 'POST', body: JSON.stringify({ poll_id: poll.id, label }) },
        'Failed to add option',
      );
      setNewOption('');
    });
  }

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{poll.question}</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            By {poll.creatorName} · {poll.allowMultiple ? 'Pick any' : 'Pick one'} ·{' '}
            {poll.voterCount === 1 ? '1 voter' : `${poll.voterCount} voters`}
          </p>
        </div>
        {poll.open ? (
          poll.closesAt ? (
            <span className="rounded-full border border-slate-300 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:border-slate-600 dark:text-slate-300">
              Closes {formatDateRange(poll.closesAt, null)}
            </span>
          ) : null
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
            <Lock className="h-3 w-3" aria-hidden />
            Closed
          </span>
        )}
      </div>

      <ul className="mt-4 space-y-2">
        {poll.options.map((o) => {
          const pct = poll.voterCount ? Math.round((o.voters.length / poll.voterCount) * 100) : 0;
          return (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => toggle(o.id)}
                disabled={!canVote || busy}
                aria-pressed={o.votedByMe}
                className={[
                  'relative w-full overflow-hidden rounded-xl border px-4 py-3 text-left transition-colors disabled:cursor-default',
                  o.votedByMe
                    ? 'border-blue-500 dark:border-blue-400'
                    : 'border-slate-200 dark:border-slate-700',
                  canVote ? 'hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500' : '',
                ].join(' ')}
              >
                {/* Result bar, scaled to the leading option so close races stay readable. */}
                <span
                  aria-hidden
                  className={[
                    'absolute inset-y-0 left-0',
                    o.votedByMe ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-slate-100 dark:bg-slate-700/60',
                  ].join(' ')}
                  style={{ width: `${(o.voters.length / maxVotes) * 100}%` }}
                />
                <span className="relative flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2 font-medium text-slate-900 dark:text-white">
                    <span
                      className={[
                        'flex h-5 w-5 shrink-0 items-center justify-center border',
                        poll.allowMultiple ? 'rounded' : 'rounded-full',
                        o.votedByMe
                          ? 'border-blue-600 bg-blue-600 text-white dark:border-blue-400 dark:bg-blue-500'
                          : 'border-slate-300 dark:border-slate-500',
                      ].join(' ')}
                      aria-hidden
                    >
                      {o.votedByMe ? <Check className="h-3.5 w-3.5" /> : null}
                    </span>
                    <span className="truncate">{o.label}</span>
                  </span>
                  <span className="shrink-0 text-sm text-slate-600 dark:text-slate-300">
                    {o.voters.length} · {pct}%
                  </span>
                </span>
                {o.voters.length > 0 ? (
                  <span className="relative mt-1 block truncate pl-7 text-xs text-slate-500 dark:text-slate-400">
                    {o.voters.join(', ')}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>

      {canVote && poll.allowMemberOptions ? (
        <form onSubmit={addOption} className="mt-3 flex gap-2">
          <label htmlFor={`add-option-${poll.id}`} className="sr-only">
            Add an option
          </label>
          <input
            id={`add-option-${poll.id}`}
            value={newOption}
            onChange={(e) => setNewOption(e.target.value)}
            maxLength={POLL_LIMITS.option}
            placeholder="Add an option…"
            className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          <button
            type="submit"
            disabled={busy || !newOption.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add
          </button>
        </form>
      ) : null}

      {error ? <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      {poll.canManage ? (
        <div className="mt-4 flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
          {poll.open ? (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                run(() =>
                  groupRequest(
                    '/api/group-polls',
                    { method: 'PATCH', body: JSON.stringify({ id: poll.id, close: true }) },
                    'Failed to close poll',
                  ),
                )
              }
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <Lock className="h-4 w-4" aria-hidden />
              Close poll
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-red-400 dark:hover:bg-red-900/30"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Delete
          </button>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete this poll?"
        description={<p>The poll and all of its votes will be permanently deleted.</p>}
        confirmLabel="Delete poll"
        onConfirm={async () => {
          await groupRequest(`/api/group-polls?id=${encodeURIComponent(poll.id)}`, { method: 'DELETE' }, 'Failed to delete poll');
          router.refresh();
        }}
        onClose={() => setConfirmingDelete(false)}
      />
    </article>
  );
}

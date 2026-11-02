'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Trash2 } from 'lucide-react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { SIGNUP_LIMITS } from '@/lib/data/group-activity';
import { groupRequest } from './request';
import type { SignupView } from './types';

export default function SignupCard({ signup, canParticipate }: { signup: SignupView; canParticipate: boolean }) {
  const router = useRouter();
  const [busySlot, setBusySlot] = React.useState<string | null>(null);
  const [claimingSlot, setClaimingSlot] = React.useState<string | null>(null);
  const [note, setNote] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [closing, setClosing] = React.useState(false);
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);

  const canClaim = canParticipate && signup.open;

  async function run(slotId: string | null, action: () => Promise<void>) {
    setBusySlot(slotId);
    setError(null);
    try {
      await action();
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong');
    } finally {
      setBusySlot(null);
    }
  }

  function claim(slotId: string) {
    run(slotId, async () => {
      await groupRequest(
        '/api/group-signup-claims',
        { method: 'POST', body: JSON.stringify({ slot_id: slotId, note: note.trim() || null }) },
        'Failed to sign up',
      );
      setClaimingSlot(null);
      setNote('');
    });
  }

  function drop(slotId: string) {
    run(slotId, () =>
      groupRequest(`/api/group-signup-claims?slot_id=${encodeURIComponent(slotId)}`, { method: 'DELETE' }, 'Failed to drop out'),
    );
  }

  // "x of y spots filled" only means something when every slot has a limit;
  // with any unlimited slot, count people instead.
  const allLimited = signup.slots.every((s) => s.capacity !== null);
  const totalSpots = signup.slots.reduce((n, s) => n + (s.capacity ?? 0), 0);
  const filledSpots = signup.slots.reduce((n, s) => n + Math.min(s.claims.length, s.capacity ?? Infinity), 0);
  const signedUp = signup.slots.reduce((n, s) => n + s.claims.length, 0);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{signup.title}</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            By {signup.creatorName} ·{' '}
            {allLimited ? `${filledSpots} of ${totalSpots} spots filled` : signedUp === 1 ? '1 sign-up' : `${signedUp} sign-ups`}
          </p>
        </div>
        {!signup.open ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
            <Lock className="h-3 w-3" aria-hidden />
            Closed
          </span>
        ) : null}
      </div>
      {signup.description ? (
        <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{signup.description}</p>
      ) : null}

      <ul className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200 dark:divide-slate-700 dark:border-slate-700">
        {signup.slots.map((slot) => {
          const mine = slot.claims.some((c) => c.mine);
          const full = slot.capacity !== null && slot.claims.length >= slot.capacity;
          const busy = busySlot === slot.id;
          return (
            <li key={slot.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium text-slate-900 dark:text-white">{slot.label}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    {slot.capacity === null
                      ? `${slot.claims.length} signed up · no limit`
                      : `${slot.claims.length} of ${slot.capacity} ${slot.capacity === 1 ? 'spot' : 'spots'}`}
                  </div>
                </div>
                {mine ? (
                  <button
                    type="button"
                    onClick={() => drop(slot.id)}
                    disabled={busy}
                    className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-semibold text-slate-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:border-red-800 dark:hover:bg-red-900/30 dark:hover:text-red-300"
                  >
                    {busy ? 'Dropping…' : 'Drop out'}
                  </button>
                ) : full ? (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                    Full
                  </span>
                ) : canClaim && claimingSlot !== slot.id ? (
                  <button
                    type="button"
                    onClick={() => {
                      setClaimingSlot(slot.id);
                      setNote('');
                    }}
                    className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Sign up
                  </button>
                ) : null}
              </div>

              {claimingSlot === slot.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    claim(slot.id);
                  }}
                  className="mt-3 flex flex-wrap gap-2"
                >
                  <label htmlFor={`claim-note-${slot.id}`} className="sr-only">
                    Note (optional)
                  </label>
                  <input
                    id={`claim-note-${slot.id}`}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={SIGNUP_LIMITS.note}
                    placeholder="Add a note (optional), e.g. “bringing brownies”"
                    className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                  >
                    {busy ? 'Saving…' : 'Confirm'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setClaimingSlot(null)}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                  >
                    Cancel
                  </button>
                </form>
              ) : null}

              {slot.claims.length > 0 ? (
                <ul className="mt-2 space-y-1">
                  {slot.claims.map((c, i) => (
                    <li key={i} className="text-sm text-slate-700 dark:text-slate-300">
                      <span className={c.mine ? 'font-semibold' : undefined}>{c.mine ? `${c.name} (you)` : c.name}</span>
                      {c.note ? <span className="text-slate-500 dark:text-slate-400"> — {c.note}</span> : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>

      {error ? <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      {signup.canManage ? (
        <div className="mt-4 flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
          {signup.open ? (
            <button
              type="button"
              disabled={closing}
              onClick={async () => {
                setClosing(true);
                await run(null, () =>
                  groupRequest(
                    '/api/group-signups',
                    { method: 'PATCH', body: JSON.stringify({ id: signup.id, close: true }) },
                    'Failed to close sign-up',
                  ),
                );
                setClosing(false);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <Lock className="h-4 w-4" aria-hidden />
              Close sign-ups
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
        title="Delete this sign-up?"
        description={<p>The sheet, its slots and everyone signed up for them will be permanently deleted.</p>}
        confirmLabel="Delete sign-up"
        onConfirm={async () => {
          await groupRequest(`/api/group-signups?id=${encodeURIComponent(signup.id)}`, { method: 'DELETE' }, 'Failed to delete sign-up');
          router.refresh();
        }}
        onClose={() => setConfirmingDelete(false)}
      />
    </article>
  );
}

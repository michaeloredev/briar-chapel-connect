'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Check, UserPlus, X } from 'lucide-react';
import { groupRequest } from './request';

export type JoinRequestView = {
  id: string;
  name: string;
  message: string;
  createdAt: string;
};

/** Pending requests to join a private group, for its owner and site admins. */
export default function JoinRequestList({ requests }: { requests: JoinRequestView[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function decide(id: string, action: 'approve' | 'decline') {
    setBusyId(id);
    setError(null);
    try {
      await groupRequest(
        '/api/group-join-requests',
        { method: 'PATCH', body: JSON.stringify({ id, action }) },
        action === 'approve' ? 'Could not approve the request.' : 'Could not decline the request.',
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section
      aria-labelledby="join-requests-heading"
      className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/60 dark:bg-amber-950/30"
    >
      <h2 id="join-requests-heading" className="inline-flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
        <UserPlus className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden />
        Join requests ({requests.length})
      </h2>
      {error ? <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      <ul className="mt-4 flex flex-col gap-3">
        {requests.map((r) => (
          <li key={r.id} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-semibold text-slate-900 dark:text-white">{r.name}</p>
              <time dateTime={r.createdAt} className="text-xs text-slate-500 dark:text-slate-400">
                {new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </time>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{r.message}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => decide(r.id, 'approve')}
                disabled={busyId !== null}
                className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
              >
                <Check className="h-4 w-4" aria-hidden />
                {busyId === r.id ? 'Saving…' : 'Approve'}
              </button>
              <button
                type="button"
                onClick={() => decide(r.id, 'decline')}
                disabled={busyId !== null}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-4 py-1.5 text-sm font-semibold text-slate-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:border-red-800 dark:hover:bg-red-900/30 dark:hover:text-red-300"
              >
                <X className="h-4 w-4" aria-hidden />
                Decline
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Check, X } from 'lucide-react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { groupRequest } from './request';

/**
 * Approve or reject a proposed group, for superadmins. Rejecting deletes the
 * group, so it asks first; `redirectTo` is where to go after a rejection when
 * the current page is the group itself.
 */
export default function GroupReviewButtons({ groupId, title, redirectTo }: { groupId: string; title: string; redirectTo?: string }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmingReject, setConfirmingReject] = React.useState(false);

  async function decide(decision: 'approve' | 'reject') {
    await groupRequest(
      '/api/groups/review',
      { method: 'POST', body: JSON.stringify({ id: groupId, decision }) },
      decision === 'approve' ? 'Could not approve the group.' : 'Could not reject the group.',
    );
    if (decision === 'reject' && redirectTo) router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              await decide('approve');
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Something went wrong.');
            } finally {
              setBusy(false);
            }
          }}
          className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
        >
          <Check className="h-4 w-4" aria-hidden />
          {busy ? 'Approving…' : 'Approve'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => setConfirmingReject(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-4 py-1.5 text-sm font-semibold text-slate-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:border-red-800 dark:hover:bg-red-900/30 dark:hover:text-red-300"
        >
          <X className="h-4 w-4" aria-hidden />
          Reject
        </button>
      </div>
      {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : null}

      <ConfirmDialog
        open={confirmingReject}
        title={`Reject "${title}"?`}
        description="The proposal is deleted, along with its picture. The person who proposed it can propose again."
        confirmLabel="Reject"
        pendingLabel="Rejecting…"
        onConfirm={() => decide('reject')}
        onClose={() => setConfirmingReject(false)}
      />
    </div>
  );
}

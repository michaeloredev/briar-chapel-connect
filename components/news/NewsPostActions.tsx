'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Pin, PinOff, Trash2 } from 'lucide-react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { errorMessage, responseError } from '@/lib/utils/errors';

type Props = {
  id: string;
  pinned: boolean;
  canDelete: boolean;
  canPin: boolean;
};

/**
 * Pin and delete controls on a news post. Shown only to people allowed to use
 * them; /api/news-posts enforces the same rules.
 */
export default function NewsPostActions({ id, pinned, canDelete, canPin }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [confirming, setConfirming] = React.useState(false);
  const [pinning, setPinning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function togglePin() {
    setPinning(true);
    setError(null);
    try {
      const res = await fetch('/api/news-posts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, pinned: !pinned }),
      });
      if (!res.ok) throw new Error(await responseError(res, 'Failed to update post'));
      router.refresh();
    } catch (err) {
      setError(errorMessage(err, 'Failed to update post'));
    } finally {
      setPinning(false);
    }
  }

  async function onDelete() {
    const res = await fetch(`/api/news-posts?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(await responseError(res, 'Failed to delete post'));
    // The post's own page no longer exists; the feed just needs refreshing.
    if (pathname === `/news/${id}`) router.push('/news');
    router.refresh();
  }

  const button =
    'inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium focus:outline-none focus:ring-2 disabled:opacity-60';

  return (
    <div className="flex items-center gap-1">
      {error ? <span className="text-xs text-red-600 dark:text-red-400">{error}</span> : null}
      {canPin ? (
        <button
          type="button"
          onClick={togglePin}
          disabled={pinning}
          className={`${button} text-slate-600 hover:bg-slate-100 focus:ring-blue-500 dark:text-slate-300 dark:hover:bg-slate-700`}
        >
          {pinned ? <PinOff className="h-3.5 w-3.5" aria-hidden /> : <Pin className="h-3.5 w-3.5" aria-hidden />}
          {pinned ? 'Unpin' : 'Pin'}
        </button>
      ) : null}
      {canDelete ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className={`${button} text-red-700 hover:bg-red-50 focus:ring-red-500 dark:text-red-300 dark:hover:bg-red-900/20`}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          Delete
        </button>
      ) : null}
      <ConfirmDialog
        open={confirming}
        title="Delete this post?"
        description={<p>The post, its replies and its photos will be permanently deleted.</p>}
        confirmLabel="Delete post"
        onConfirm={onDelete}
        onClose={() => setConfirming(false)}
      />
    </div>
  );
}

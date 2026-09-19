'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

export default function DeleteMarketplaceItemButton({ id }: { id: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  return (
    <div className="mt-4">
      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      <button
        type="button"
        onClick={async () => {
          if (deleting) return;
          const ok = window.confirm('Delete this listing? This action cannot be undone.');
          if (!ok) return;
          try {
            setDeleting(true);
            setError(null);
            const res = await fetch(`/api/marketplace-items?id=${encodeURIComponent(id)}`, {
              method: 'DELETE',
            });
            if (!res.ok) {
              const msg = await res.text();
              throw new Error(msg || 'Failed to delete item');
            }
            router.push('/marketplace');
            router.refresh();
          } catch (e: any) {
            setError(e?.message ?? 'Failed to delete item');
          } finally {
            setDeleting(false);
          }
        }}
        disabled={deleting}
        className="inline-flex items-center gap-2 rounded-md border border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900/40 dark:text-red-300 dark:hover:bg-red-900/20 px-3 py-2 text-sm font-medium disabled:opacity-60"
        aria-label="Delete listing"
        title="Delete listing"
      >
        <Trash2 className="w-4 h-4" aria-hidden />
        {deleting ? 'Deleting…' : 'Delete listing'}
      </button>
    </div>
  );
}



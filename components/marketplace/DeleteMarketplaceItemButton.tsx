'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export default function DeleteMarketplaceItemButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = React.useState(false);

  const onDelete = async () => {
    const res = await fetch(`/api/marketplace-items?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error || 'Failed to delete listing');
    }
    router.push('/marketplace');
    router.refresh();
  };

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-2 rounded-md border border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900/40 dark:text-red-300 dark:hover:bg-red-900/20 px-3 py-2 text-sm font-medium"
      >
        <Trash2 className="w-4 h-4" aria-hidden />
        Delete listing
      </button>
      <ConfirmDialog
        open={confirming}
        title="Delete this listing?"
        description={
          <p>
            <span className="font-medium text-slate-900 dark:text-white">{title}</span> will be
            permanently deleted, along with its photos and comments.
          </p>
        }
        confirmLabel="Delete listing"
        onConfirm={onDelete}
        onClose={() => setConfirming(false)}
      />
    </div>
  );
}

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export interface AdminDeleteButtonProps {
  /** Collection route that accepts `DELETE ?id=`, e.g. `/api/events`. */
  endpoint: string;
  id: string;
  /** Where to go once the record is gone -- its detail page no longer exists. */
  redirectTo: string;
  /** Singular noun for the dialog and labels, e.g. "event". */
  noun: string;
  /** Name of the record, shown in the dialog so the admin sees what they hit. */
  name: string;
  /** Extra sentence for the dialog about what else goes with it. */
  consequence?: string;
}

/**
 * Delete control for admin-managed records. Render it inside a
 * `<RoleGate minimum="admin">` -- that only hides the button, so the route
 * behind `endpoint` must enforce the role itself.
 */
export default function AdminDeleteButton({
  endpoint,
  id,
  redirectTo,
  noun,
  name,
  consequence,
}: AdminDeleteButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = React.useState(false);

  const onDelete = async () => {
    const res = await fetch(`${endpoint}?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error || `Failed to delete ${noun}`);
    }
    router.push(redirectTo);
    router.refresh();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-900/60 px-2.5 py-1.5 text-xs font-medium text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500"
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden />
        Delete
      </button>
      <ConfirmDialog
        open={confirming}
        title={`Delete this ${noun}?`}
        description={
          <>
            <p>
              <span className="font-medium text-slate-900 dark:text-white">{name}</span> will be
              permanently deleted.
            </p>
            {consequence ? <p className="mt-2">{consequence}</p> : null}
          </>
        }
        confirmLabel={`Delete ${noun}`}
        onConfirm={onDelete}
        onClose={() => setConfirming(false)}
      />
    </>
  );
}

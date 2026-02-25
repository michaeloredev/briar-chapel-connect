'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

export default function JoinGroupButton({ groupId, isMember = false, className = '' }: { groupId: string; isMember?: boolean; className?: string }) {
  const router = useRouter();
  const [joining, setJoining] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  return (
    <div className={className}>
      {error ? <p className="text-xs text-red-600 dark:text-red-400 mb-1">{error}</p> : null}
      <button
        type="button"
        onClick={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (joining) return;
          try {
            setJoining(true);
            setError(null);
            const res = isMember
              ? await fetch(`/api/group-members?group_id=${encodeURIComponent(groupId)}`, { method: 'DELETE' })
              : await fetch('/api/group-members', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ group_id: groupId }),
                });
            if (!res.ok) {
              const msg = await res.text();
              throw new Error(msg || (isMember ? 'Failed to leave group' : 'Failed to join group'));
            }
            router.refresh();
          } catch (err: any) {
            const msg = err?.message || '';
            if (msg.toLowerCase().includes('unauthorized')) {
              setError('Please sign in to join.');
            } else {
              setError(isMember ? 'Could not leave group.' : 'Could not join group.');
            }
          } finally {
            setJoining(false);
          }
        }}
        className={[
          'inline-flex items-center rounded-md px-3 py-1.5 text-white text-sm font-medium focus:outline-none focus:ring-2',
          isMember
            ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
            : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        ].join(' ')}
        disabled={joining}
      >
        {joining ? (isMember ? 'Leaving…' : 'Joining…') : isMember ? 'Leave Group' : 'Join Group'}
      </button>
    </div>
  );
}



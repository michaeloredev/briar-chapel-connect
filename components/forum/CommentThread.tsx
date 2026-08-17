'use client';

import * as React from 'react';
import { SignedIn, SignedOut, SignInButton, useAuth } from '@clerk/nextjs';
import { useRole } from '@/components/auth/RoleProvider';
import CommentComposer from './CommentComposer';
import CommentItem, { Comment } from './CommentItem';

type Props = {
  entityType: string;
  entityId: string;
  className?: string;
};

export default function CommentThread({ entityType, entityId, className = '' }: Props) {
  const { userId } = useAuth();
  const { hasRole } = useRole();
  const [comments, setComments] = React.useState<Comment[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/comments?entity_type=${encodeURIComponent(entityType)}&entity_id=${encodeURIComponent(entityId)}`);
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Failed to load comments');
      }
      const data = (await res.json()) as Comment[];
      setComments(data);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
  }, [entityType, entityId]);

  async function post(content: string, parent_id?: string) {
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entity_type: entityType,
        entity_id: entityId,
        parent_id,
        content,
      }),
    });
    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || 'Failed to post comment');
    }
    await load();
  }

  async function postWithImages(content: string, images: string[], parent_id?: string) {
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entity_type: entityType,
        entity_id: entityId,
        parent_id,
        content,
        images,
      }),
    });
    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || 'Failed to post comment');
    }
    await load();
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/comments?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || 'Failed to delete comment');
    }
    await load();
  }

  function canDelete(c: Comment) {
    if (!userId) return false;
    return c.user_id === userId || hasRole('admin');
  }

  function buildTree(list: Comment[]): { roots: Comment[]; childrenByParent: Map<string, Comment[]> } {
    const byId = new Map(list.map((c) => [c.id, c]));
    const childrenByParent = new Map<string, Comment[]>();
    const roots: Comment[] = [];

    // Only two levels are rendered, so a reply stored deeper than that is grouped
    // under its top-level ancestor instead of being left out of the thread.
    function findRootId(comment: Comment): string {
      const seen = new Set<string>([comment.id]);
      let current = comment;
      while (current.parent_id) {
        const parent = byId.get(current.parent_id);
        if (!parent || seen.has(parent.id)) break;
        seen.add(parent.id);
        current = parent;
      }
      return current.id;
    }

    for (const c of list) {
      if (!c.parent_id) {
        roots.push(c);
        continue;
      }
      const rootId = findRootId(c);
      const root = rootId === c.id ? null : byId.get(rootId);
      if (!root || root.parent_id) {
        // No reachable top-level ancestor: show the reply on its own rather than drop it.
        roots.push(c);
        continue;
      }
      const arr = childrenByParent.get(rootId) || [];
      arr.push(c);
      childrenByParent.set(rootId, arr);
    }
    return { roots, childrenByParent };
  }

  const tree = comments ? buildTree(comments) : null;

  return (
    <div className={className}>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Comments</h2>
      {loading ? <p className="mt-2 text-sm text-slate-500">Loading…</p> : null}
      {error ? <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      <div className="mt-3">
        <SignedIn>
          <CommentComposer onSubmit={(text, images) => postWithImages(text, images)} />
        </SignedIn>
        <SignedOut>
          <SignInButton mode="modal">
            <button className="text-sm text-blue-600 hover:underline dark:text-blue-400">
              Sign in to comment
            </button>
          </SignInButton>
        </SignedOut>
      </div>
      <div className="mt-4">
        {!comments || comments.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">No comments yet.</p>
        ) : (
          <ul className="space-y-3">
            {tree!.roots.map((c) => (
              <CommentItem
                key={c.id}
                comment={c}
                replies={tree!.childrenByParent.get(c.id) || []}
                onReply={(pid, text, images) => postWithImages(text, images, pid)}
                onDelete={(id) => handleDelete(id)}
                canDelete={canDelete}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}



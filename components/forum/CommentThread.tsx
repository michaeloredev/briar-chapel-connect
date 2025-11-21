'use client';

import * as React from 'react';
import CommentComposer from './CommentComposer';
import CommentItem, { Comment } from './CommentItem';

type Props = {
  entityType: string;
  entityId: string;
  className?: string;
};

export default function CommentThread({ entityType, entityId, className = '' }: Props) {
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

  async function handleDelete(id: string) {
    const res = await fetch(`/api/comments?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || 'Failed to delete comment');
    }
    await load();
  }

  function canDelete(_c: Comment) {
    // Let the server enforce ownership via RLS; optionally show/hide if we had current user
    return true;
  }

  function buildTree(list: Comment[]): { roots: Comment[]; childrenByParent: Map<string, Comment[]> } {
    const childrenByParent = new Map<string, Comment[]>();
    const roots: Comment[] = [];
    for (const c of list) {
      if (c.parent_id) {
        const arr = childrenByParent.get(c.parent_id) || [];
        arr.push(c);
        childrenByParent.set(c.parent_id, arr);
      } else {
        roots.push(c);
      }
    }
    return { roots, childrenByParent };
  }

  const tree = comments ? buildTree(comments) : null;

  return (
    <div className={className}>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Discussion</h2>
      {loading ? <p className="mt-2 text-sm text-slate-500">Loading…</p> : null}
      {error ? <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      <div className="mt-3">
        <CommentComposer onSubmit={(text) => post(text)} />
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
                onReply={(pid, text) => post(text, pid)}
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



'use client';

import * as React from 'react';
import { SignedIn } from '@clerk/nextjs';
import CommentComposer from './CommentComposer';

export type Comment = {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  parent_id: string | null;
  content: string;
  images?: string[];
};

type Props = {
  comment: Comment;
  replies: Comment[];
  /** Top-level comment that replies attach to. Omitted for top-level comments. */
  rootId?: string;
  onReply: (parentId: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  canDelete: (c: Comment) => boolean;
};

export default function CommentItem({ comment, replies, rootId, onReply, onDelete, canDelete }: Props) {
  const [showReply, setShowReply] = React.useState(false);
  const created = new Date(comment.created_at).toLocaleString();
  // Threads are capped at two levels: replies to a reply attach to its top-level comment.
  const replyTargetId = rootId ?? comment.id;

  return (
    <li className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
      <div className="text-sm text-slate-900 dark:text-slate-100 whitespace-pre-wrap">{comment.content}</div>
      {Array.isArray(comment.images) && comment.images.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {comment.images.map((src, i) => (
            <a key={src + i} href={src} target="_blank" rel="noopener noreferrer" className="block">
              {/* using img for simplicity to avoid layout shift constraints */}
              <img
                src={src}
                alt=""
                className="w-24 h-24 object-cover rounded-md border border-slate-200 dark:border-slate-700"
                width={96}
                height={96}
                loading="lazy"
              />
            </a>
          ))}
        </div>
      ) : null}
      <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
        <span>{created}</span>
        <SignedIn>
          <button
            type="button"
            onClick={() => setShowReply((v) => !v)}
            className="hover:underline"
          >
            {showReply ? 'Cancel' : 'Reply'}
          </button>
          {canDelete(comment) ? (
            <button
              type="button"
              onClick={() => onDelete(comment.id)}
              className="hover:underline text-red-600 dark:text-red-400"
            >
              Delete
            </button>
          ) : null}
        </SignedIn>
      </div>
      {showReply ? (
        <div className="mt-3">
          <SignedIn>
            <CommentComposer
              placeholder="Write a reply…"
              onSubmit={async (text) => {
                await onReply(replyTargetId, text);
                setShowReply(false);
              }}
            />
          </SignedIn>
        </div>
      ) : null}
      {replies.length > 0 ? (
        <ul className="mt-3 space-y-3 pl-4 border-l border-slate-200 dark:border-slate-700">
          {replies.map((r) => (
            <CommentItem
              key={r.id}
              comment={r}
              replies={[]}
              rootId={replyTargetId}
              onReply={onReply}
              onDelete={onDelete}
              canDelete={canDelete}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}



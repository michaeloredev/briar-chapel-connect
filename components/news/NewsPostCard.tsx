import Link from 'next/link';
import { MessageCircle, Pin } from 'lucide-react';
import type { NewsPost } from '@/lib/api/news';
import { newsCategory } from '@/lib/data/news-categories';
import { formatPostTime } from '@/lib/utils/date';
import NewsPostActions from './NewsPostActions';
import PhotoGallery from '@/components/ui/PhotoGallery';

export type NewsPostCardProps = {
  post: NewsPost;
  /** The viewer may delete it: its author, or an admin. */
  canDelete: boolean;
  /** The viewer may pin it: an admin. */
  canPin: boolean;
  /** On the feed the card links to the post's own page; on that page it does not. */
  linkToPost?: boolean;
};

export default function NewsPostCard({ post, canDelete, canPin, linkToPost = true }: NewsPostCardProps) {
  const category = newsCategory(post.category);
  const replies =
    post.comment_count === 0 ? 'Reply' : `${post.comment_count} ${post.comment_count === 1 ? 'reply' : 'replies'}`;

  return (
    <article
      className={`rounded-2xl border bg-surface p-5 shadow-sm dark:bg-slate-800 ${
        post.pinned_at ? 'border-blue-300 dark:border-blue-700' : 'border-slate-200 dark:border-slate-700'
      }`}
    >
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-semibold text-slate-900 dark:text-white">{post.author_name || 'Community member'}</span>
        <span className="text-sm text-slate-500 dark:text-slate-400">{formatPostTime(post.created_at)}</span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${category.chip}`}>{category.label}</span>
        {post.pinned_at ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <Pin className="h-3.5 w-3.5" aria-hidden />
            Pinned
          </span>
        ) : null}
        {canDelete || canPin ? (
          <div className="ml-auto">
            <NewsPostActions id={post.id} pinned={Boolean(post.pinned_at)} canDelete={canDelete} canPin={canPin} />
          </div>
        ) : null}
      </header>

      <p className="mt-3 whitespace-pre-wrap text-slate-800 dark:text-slate-200">{post.content}</p>

      <PhotoGallery
        images={post.images}
        className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4"
        thumbClassName="aspect-square w-full rounded-lg"
        thumbSize={400}
        label="Post photo"
      />

      {linkToPost ? (
        <Link
          href={`/news/${post.id}`}
          className="mt-4 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 -mx-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-slate-700"
        >
          <MessageCircle className="h-4 w-4" aria-hidden />
          {replies}
        </Link>
      ) : null}
    </article>
  );
}

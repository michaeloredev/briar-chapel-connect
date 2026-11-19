import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import CommentThread from '@/components/forum/CommentThread';
import NewsPostCard from '@/components/news/NewsPostCard';
import SetBreadcrumbTitle from '@/components/common/SetBreadcrumbTitle';
import { loadNewsPost, newsReader } from '@/lib/api/news';
import { getUserRole, hasRole } from '@/lib/auth/roles';
import { newsCategory } from '@/lib/data/news-categories';

export const metadata: Metadata = {
  title: 'News • Briar Chapel Connect',
};

type PageProps = { params: Promise<{ id: string }> };

export default async function NewsPostPage({ params }: PageProps) {
  const { userId } = await auth();
  const supabase = await newsReader();
  if (!userId || !supabase) redirect('/sign-in');

  const { id } = await params;
  const [post, role] = await Promise.all([loadNewsPost(supabase, id), getUserRole(userId)]);
  if (!post) notFound();
  const isAdmin = hasRole(role, 'admin');

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <SetBreadcrumbTitle value={`${newsCategory(post.category).label} post`} />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <NewsPostCard post={post} canDelete={post.user_id === userId || isAdmin} canPin={isAdmin} linkToPost={false} />
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <CommentThread entityType="news_post" entityId={post.id} />
        </div>
      </div>
    </div>
  );
}

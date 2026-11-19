import type { Database } from '@/lib/supabase/types';

export type NewsCategory = Database['public']['Tables']['news_posts']['Row']['category'];

/** Mirrors the news_posts_category_check constraint. */
export const NEWS_CATEGORIES: { value: NewsCategory; label: string; chip: string }[] = [
  {
    value: 'news',
    label: 'News',
    chip: 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300',
  },
  {
    value: 'lost_found',
    label: 'Lost & Found',
    chip: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300',
  },
  {
    value: 'safety',
    label: 'Safety',
    chip: 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300',
  },
  {
    value: 'recommendations',
    label: 'Recommendations',
    chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
  },
  {
    value: 'chatter',
    label: 'Chatter',
    chip: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  },
];

export function isNewsCategory(value: string): value is NewsCategory {
  return NEWS_CATEGORIES.some((c) => c.value === value);
}

export function newsCategory(value: string) {
  return NEWS_CATEGORIES.find((c) => c.value === value) ?? NEWS_CATEGORIES[NEWS_CATEGORIES.length - 1];
}

/** The longest post the database accepts (news_posts_content_check). */
export const MAX_NEWS_POST_LENGTH = 5000;

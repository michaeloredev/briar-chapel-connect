'use client';

import { useRouter } from 'next/navigation';
import { MARKETPLACE_CATEGORIES, marketplaceListHref } from '@/lib/data/marketplace-categories';

type Props = {
  q?: string;
  category?: string;
  condition?: string;
  min?: string;
  max?: string;
};

export default function MarketplaceCategoryFilter({
  q = '',
  category = '',
  condition = '',
  min = '',
  max = '',
}: Props) {
  const router = useRouter();

  return (
    <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
      <span className="shrink-0 font-medium text-slate-700 dark:text-slate-200">Category</span>
      <select
        value={category}
        onChange={(e) => {
          router.push(
            marketplaceListHref({
              q,
              category: e.target.value,
              condition,
              min,
              max,
            }),
          );
        }}
        className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Filter by category"
      >
        <option value="">All types</option>
        {MARKETPLACE_CATEGORIES.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
